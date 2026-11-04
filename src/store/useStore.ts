/*
  Store central (Zustand + persistência em localStorage).
  Camada demonstrativa: em produção, estas ações viram chamadas de API com
  autenticação real, autorização no servidor e trilha de auditoria imutável.
  Regras de negócio garantidas aqui:
  · Aprovação humana obrigatória antes do documento do cliente.
  · Texto e fotos originais nunca sobrescritos silenciosamente.
  · OCR só associa equipamento após confirmação humana.
*/
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { clear } from 'idb-keyval';
import type {
  User, Client, Truck, Equipment, Report, Notification, Session, Photo, Detection,
  TextVersion, EquipmentType, ReportStatus, ActivityEntry, ReportKind, DeviceIds,
  DriverChecklist, DriverChecklistItem, DriverOccurrence, DriverOccurrenceCategory,
  DriverOccurrenceSeverity, DriverOccurrenceStatus, DriverTraining, DriverSyncItem,
} from '../data/types';
import {
  seedUsers, seedClients, seedTrucks, seedEquipment, seedReports, seedNotifications,
  seedDriverChecklists, seedDriverOccurrences, seedDriverTrainings, seedDriverSyncQueue,
} from '../data/seed';
import { uid } from '../lib/id';
import { buildChecklistItems, itemToOccurrenceCategory, suggestSeverity, occurrenceTemplate, todayISO, currentShift } from '../lib/driver';

interface FillFields {
  dataViagem?: string;
  origem?: string;
  destino?: string;
  kmInicio?: number;
  kmFim?: number;
  descricao?: string;
  tipo?: ReportKind;
  setor?: string;
  cidadeBairro?: string;
  objetivo?: string;
  periodoInicio?: string;
  periodoFim?: string;
  avaliacaoTecnica?: string;
  sensacaoCliente?: string;
  pontosPositivos?: string;
  melhorias?: string;
  atividades?: ActivityEntry[];
}

export interface CreateReportArgs {
  colaboradorId: string;
  clienteId: string;
  caminhaoId?: string;
  dataViagem: string;
  origem?: string;
  destino?: string;
  tipo?: ReportKind;
  objetivo?: string;
  setor?: string;
  cidadeBairro?: string;
  periodoInicio?: string;
  periodoFim?: string;
}

interface State {
  users: User[];
  clients: Client[];
  trucks: Truck[];
  equipment: Equipment[];
  reports: Report[];
  notifications: Notification[];
  session: Session | null;
  seededAt: string;

  driverChecklists: DriverChecklist[];
  driverOccurrences: DriverOccurrence[];
  driverTrainings: DriverTraining[];
  driverSyncQueue: DriverSyncItem[];

  login: (userId: string) => void;
  logout: () => void;
  resetDemo: () => Promise<void>;

  createReport: (args: CreateReportArgs, ator: string) => string;
  saveFillDraft: (id: string, fields: FillFields, ator: string) => void;
  submitToReview: (id: string, ator: string) => { ok: boolean; erros: string[] };
  requestCorrection: (id: string, texto: string, ator: string) => void;
  approveReport: (id: string, ator: string, nota?: string) => { ok: boolean; erro?: string };
  addTextVersion: (id: string, texto: string, tipo: TextVersion['tipo'], autor: string, nota?: string) => void;

  addPhoto: (id: string, photo: Photo, ator: string) => void;
  removePhoto: (id: string, photoId: string, ator: string) => { ok: boolean; erro?: string };
  addDetection: (id: string, det: Detection, ator: string) => void;
  resolveDetection: (id: string, detId: string, action: 'confirmar' | 'corrigir' | 'rejeitar', args: { codigo?: string; equipmentId?: string; tipo?: EquipmentType; serial?: string }, ator: string) => { ok: boolean; erro?: string };

  registerDocuments: (id: string, ator: string) => void;
  markClientSent: (id: string, ator: string) => void;
  sendReminder: (id: string, ator: string) => void;

  addClient: (c: Omit<Client, 'id'>, ator: string) => void;
  addTruck: (t: Omit<Truck, 'id'>, ator: string) => { ok: boolean; erro?: string };
  addEquipment: (e: DeviceIds & { codigo: string; tipo: EquipmentType; serial: string; truckId?: string | null; clienteId?: string | null }, ator: string) => { ok: boolean; erro?: string };
  addCollaborator: (u: { nome: string; email: string; cargo: string }, ator: string) => void;

  markNotificationRead: (nid: string) => void;
  markAllRead: () => void;

  /* Portal do Motorista — automações seguras (sem aprovação de relatório / sem envio real) */
  ensureDriverChecklist: (motoristaId: string, caminhaoId: string, opts?: { data?: string; turno?: 'dia' | 'noite' }) => string;
  updateDriverChecklistItem: (checklistId: string, itemId: string, patch: Partial<Pick<DriverChecklistItem, 'status' | 'observacao'>>, ator: string) => void;
  markAllChecklistOk: (checklistId: string, ator: string) => void;
  submitDriverChecklist: (checklistId: string, ator: string) => { ok: boolean; erros: string[]; ocorrenciasIds: string[] };
  createDriverOccurrence: (args: {
    motoristaId: string; caminhaoId: string; equipmentId?: string; checklistId?: string;
    categoria: DriverOccurrenceCategory; severidade: DriverOccurrenceSeverity; descricao: string; fotos?: Photo[];
  }, ator: string) => { ok: boolean; id?: string; erro?: string };
  setDriverOccurrenceStatus: (id: string, status: DriverOccurrenceStatus, ator: string, resposta?: string) => { ok: boolean; erro?: string };
  confirmDriverTraining: (motoristaId: string, treinamentoId: string, titulo: string, nomeConfirmado: string, ator: string) => { ok: boolean; erro?: string };
  syncDriverQueue: () => number;
}

function buildSeed() {
  return {
    users: seedUsers,
    clients: seedClients,
    trucks: seedTrucks,
    equipment: seedEquipment,
    reports: seedReports,
    notifications: seedNotifications,
    session: null as Session | null,
    seededAt: new Date().toISOString(),
    driverChecklists: seedDriverChecklists,
    driverOccurrences: seedDriverOccurrences,
    driverTrainings: seedDriverTrainings,
    driverSyncQueue: seedDriverSyncQueue,
  };
}

function audit(ator: string, acao: string, detalhe?: string) {
  return { id: uid('ev'), em: new Date().toISOString(), ator, acao, detalhe };
}

function notif(
  tipo: Notification['tipo'], titulo: string, mensagem: string, para: Notification['para'],
  reportId?: string, extra?: { userId?: string; occurrenceId?: string; checklistId?: string },
): Notification {
  return { id: uid('n'), tipo, titulo, mensagem, criadaEm: new Date().toISOString(), lida: false, reportId, para, ...extra };
}

export const useStore = create<State>()(
  persist(
    (set, get) => {
      const patchReport = (id: string, fn: (r: Report) => Report) => {
        set((s) => ({ reports: s.reports.map((r) => (r.id === id ? fn(r) : r)) }));
      };

      return {
        ...buildSeed(),

        login: (userId) => {
          const u = get().users.find((x) => x.id === userId);
          if (u) set({ session: { userId: u.id, role: u.role } });
        },
        logout: () => set({ session: null }),

        resetDemo: async () => {
          try { await clear(); } catch { /* IndexedDB indisponível (testes/SSR) */ }
          set({ ...buildSeed() });
        },

        createReport: (args, ator) => {
          const id = uid('r');
          const maxN = get().reports.reduce((m, r) => Math.max(m, parseInt(r.codigo.split('-')[2] ?? '0', 10)), 0);
          const codigo = `REL-2026-${String(maxN + 1).padStart(4, '0')}`;
          const colaborador = get().users.find((u) => u.id === args.colaboradorId);
          const report: Report = {
            id, codigo, token: uid('tk') + uid(),
            colaboradorId: args.colaboradorId,
            clienteId: args.clienteId,
            caminhaoId: args.caminhaoId ?? '',
            dataViagem: args.dataViagem,
            origem: args.origem ?? '',
            destino: args.destino ?? '',
            tipo: args.tipo ?? 'visita_tecnica',
            objetivo: args.objetivo ?? '',
            setor: args.setor ?? '',
            cidadeBairro: args.cidadeBairro ?? '',
            periodoInicio: args.periodoInicio ?? args.dataViagem,
            periodoFim: args.periodoFim ?? args.dataViagem,
            atividades: [],
            origemDados: 'sintetico',
            descricaoOriginal: '',
            descricaoAtual: '',
            versoesTexto: [],
            status: 'pendente',
            criadoEm: new Date().toISOString(),
            prazoEm: new Date(Date.now() + 48 * 3600000).toISOString(),
            fotos: [], deteccoes: [], notasRevisao: [], documentos: [],
            historico: [audit(ator, 'Relatório criado', `Link individual enviado a ${colaborador?.nome ?? 'colaborador'} (simulação) — prazo de 48 h`)],
            equipamentosIds: [],
            enviadoCliente: false,
          };
          set((s) => ({
            reports: [report, ...s.reports],
            notifications: [notif('sistema', 'Novo relatório criado', `${codigo} aguardando preenchimento por ${colaborador?.nome}. Link individual gerado (envio simulado).`, 'todos', id), ...s.notifications],
          }));
          return id;
        },

        saveFillDraft: (id, fields, ator) => {
          patchReport(id, (r) => {
            const next: Report = {
              ...r,
              dataViagem: fields.dataViagem ?? r.dataViagem,
              origem: fields.origem ?? r.origem,
              destino: fields.destino ?? r.destino,
              kmInicio: fields.kmInicio ?? r.kmInicio,
              kmFim: fields.kmFim ?? r.kmFim,
              descricaoAtual: fields.descricao ?? r.descricaoAtual,
              tipo: fields.tipo ?? r.tipo,
              setor: fields.setor ?? r.setor,
              cidadeBairro: fields.cidadeBairro ?? r.cidadeBairro,
              objetivo: fields.objetivo ?? r.objetivo,
              periodoInicio: fields.periodoInicio ?? r.periodoInicio,
              periodoFim: fields.periodoFim ?? r.periodoFim,
              avaliacaoTecnica: fields.avaliacaoTecnica ?? r.avaliacaoTecnica,
              sensacaoCliente: fields.sensacaoCliente ?? r.sensacaoCliente,
              pontosPositivos: fields.pontosPositivos ?? r.pontosPositivos,
              melhorias: fields.melhorias ?? r.melhorias,
              atividades: fields.atividades ?? r.atividades,
              status: r.status === 'pendente' ? 'rascunho' : r.status,
            };
            return next;
          });
          void ator;
        },

        submitToReview: (id, ator) => {
          const r = get().reports.find((x) => x.id === id);
          if (!r) return { ok: false, erros: ['Relatório não encontrado.'] };
          if (!['pendente', 'rascunho', 'correcao'].includes(r.status)) return { ok: false, erros: ['Este relatório já foi enviado para revisão.'] };
          const erros: string[] = [];
          if (r.periodoInicio && r.periodoFim && r.periodoFim < r.periodoInicio) erros.push('O fim do período deve ser igual ou posterior ao início.');
          if ([r.kmInicio, r.kmFim].some((km) => km != null && (!Number.isFinite(km) || km < 0))) erros.push('Informe uma quilometragem válida e não negativa.');
          if (!r.dataViagem) erros.push('Informe a data da viagem / período.');
          const isViagem = (r.tipo ?? 'viagem') === 'viagem';
          if (isViagem && !r.origem.trim()) erros.push('Informe a origem.');
          if (isViagem && !r.destino.trim()) erros.push('Informe o destino.');
          if (!isViagem && !r.objetivo?.trim() && !(r.atividades?.length)) erros.push('Informe o objetivo da visita ou registre ao menos uma atividade por equipamento.');
          const texto = r.descricaoAtual.trim();
          if (texto.length < 20 && !(r.atividades?.length)) erros.push('Descreva as atividades realizadas ou registre atividades estruturadas por equipamento.');
          if (r.kmInicio != null && r.kmFim != null && r.kmFim <= r.kmInicio) erros.push('KM final deve ser maior que o KM inicial.');
          if (erros.length) return { ok: false, erros };

          patchReport(id, (rep) => {
            const firstSubmit = !rep.descricaoOriginal;
            return {
              ...rep,
              descricaoOriginal: firstSubmit ? texto : rep.descricaoOriginal,
              versoesTexto: firstSubmit
                ? [...rep.versoesTexto, { id: uid('tv'), texto, tipo: 'original' as const, autor: ator, criadaEm: new Date().toISOString() }]
                : rep.versoesTexto,
              status: 'em_revisao' as ReportStatus,
              enviadoRevisaoEm: new Date().toISOString(),
              historico: [...rep.historico, audit(ator, 'Enviado para revisão', `${rep.fotos.length} foto(s), ${rep.deteccoes.length} leitura(s) OCR`)],
            };
          });
          set((s) => ({
            notifications: [notif('revisao', 'Novo relatório para revisão', `${r.codigo} (${ator}) foi enviado para revisão.`, 'revisora', id), ...s.notifications],
          }));
          return { ok: true, erros: [] };
        },

        requestCorrection: (id, texto, ator) => {
          patchReport(id, (r) => ({
            ...r,
            status: 'correcao',
            notasRevisao: [...r.notasRevisao, { id: uid('nt'), autor: ator, texto, criadaEm: new Date().toISOString(), tipo: 'correcao' }],
            historico: [...r.historico, audit(ator, 'Correção solicitada', texto)],
          }));
          const r = get().reports.find((x) => x.id === id);
          set((s) => ({
            notifications: [notif('correcao', `Correção solicitada — ${r?.codigo}`, `${ator} solicitou ajustes: ${texto}`, 'colaborador', id), ...s.notifications],
          }));
        },

        approveReport: (id, ator, nota) => {
          const r = get().reports.find((x) => x.id === id);
          if (!r) return { ok: false, erro: 'Relatório não encontrado.' };
          if (r.status !== 'em_revisao') return { ok: false, erro: 'Somente relatórios em revisão podem ser aprovados.' };
          const pendentes = r.deteccoes.filter((d) => d.status === 'aguardando');
          if (pendentes.length > 0) {
            return { ok: false, erro: `Existem ${pendentes.length} leitura(s) de OCR aguardando conferência humana. Confirme ou rejeite antes de aprovar.` };
          }
          patchReport(id, (rep) => ({
            ...rep,
            status: 'aprovado',
            aprovadoEm: new Date().toISOString(),
            aprovadoPor: ator,
            notasRevisao: nota ? [...rep.notasRevisao, { id: uid('nt'), autor: ator, texto: nota, criadaEm: new Date().toISOString(), tipo: 'aprovacao' }] : rep.notasRevisao,
            historico: [...rep.historico, audit(ator, 'Relatório aprovado', 'Revisão humana concluída — documento do cliente liberado')],
          }));
          set((s) => ({
            notifications: [notif('aprovacao', `Relatório aprovado — ${r.codigo}`, `${ator} aprovou o relatório. Documentos prontos para geração.`, 'todos', id), ...s.notifications],
          }));
          return { ok: true };
        },

        addTextVersion: (id, texto, tipo, autor, nota) => {
          patchReport(id, (r) => ({
            ...r,
            descricaoAtual: texto,
            versoesTexto: [...r.versoesTexto, { id: uid('tv'), texto, tipo, autor, criadaEm: new Date().toISOString(), nota }],
            historico: [...r.historico, audit(autor, tipo === 'ia' ? 'Padronização de texto aplicada' : 'Texto editado manualmente', 'Versão anterior preservada no histórico')],
          }));
        },

        addPhoto: (id, photo, ator) => {
          patchReport(id, (r) => ({
            ...r,
            fotos: [...r.fotos, photo],
            historico: [...r.historico, audit(ator, 'Foto adicionada', photo.legenda || photo.nome)],
          }));
        },

        removePhoto: (id, photoId, ator) => {
          const r = get().reports.find((x) => x.id === id);
          if (!r) return { ok: false, erro: 'Relatório não encontrado.' };
          if (!['pendente', 'rascunho', 'correcao'].includes(r.status)) {
            return { ok: false, erro: 'Fotos não podem ser removidas após o envio para revisão (preservação de originais).' };
          }
          patchReport(id, (rep) => ({
            ...rep,
            fotos: rep.fotos.filter((p) => p.id !== photoId),
            deteccoes: rep.deteccoes.filter((d) => d.photoId !== photoId),
            historico: [...rep.historico, audit(ator, 'Foto removida antes do envio', photoId)],
          }));
          return { ok: true };
        },

        addDetection: (id, det, ator) => {
          patchReport(id, (r) => ({
            ...r,
            deteccoes: [...r.deteccoes.filter((d) => d.photoId !== det.photoId), det],
            historico: [...r.historico, audit(ator === 'Sistema' ? 'Sistema' : ator, det.motor === 'demo' ? 'OCR demonstrativo executado' : 'OCR executado (Tesseract local)', `Confiança ${det.confianca}% — aguardando conferência humana`)],
          }));
        },

        resolveDetection: (id, detId, action, args, ator) => {
          const r = get().reports.find((x) => x.id === id);
          const det = r?.deteccoes.find((d) => d.id === detId);
          if (!r || !det) return { ok: false, erro: 'Leitura não encontrada.' };

          if (action === 'rejeitar') {
            patchReport(id, (rep) => ({
              ...rep,
              deteccoes: rep.deteccoes.map((d) => d.id === detId ? { ...d, status: 'rejeitado' as const, confirmadoPor: ator, confirmadoEm: new Date().toISOString() } : d),
              historico: [...rep.historico, audit(ator, 'Leitura OCR rejeitada', 'Nenhum equipamento associado a partir desta leitura')],
            }));
            return { ok: true };
          }

          const codigo = (args.codigo ?? det.candidatos[0]?.normalizado ?? '').toUpperCase().trim();
          if (!codigo) return { ok: false, erro: 'Informe o código do equipamento.' };

          let eq = args.equipmentId
            ? get().equipment.find((e) => e.id === args.equipmentId) ?? null
            : get().equipment.find((e) => e.codigo.toUpperCase() === codigo) ?? null;

          if (!eq) {
            // Cadastra o equipamento confirmado (registro explícito, com autor)
            const novo: Equipment = {
              id: uid('eq'), codigo,
              tipo: args.tipo ?? (/^[A-Z]{2,4}-[A-Z0-9]{2,6}$/i.test(codigo) ? 'Equipamento de cliente' : 'Telemetria veicular'),
              serial: args.serial ?? det.candidatos.find((c) => c.tipo === 'serial')?.normalizado ?? '—',
              status: 'instalado', truckId: r.caminhaoId || null, clienteId: r.clienteId || null,
              instaladoEm: new Date().toISOString(), origemDados: 'sintetico',
            };
            set((s) => ({ equipment: [...s.equipment, novo] }));
            eq = novo;
          } else {
            set((s) => ({
              equipment: s.equipment.map((e) => e.id === eq!.id ? { ...e, truckId: r.caminhaoId || e.truckId, clienteId: r.clienteId || e.clienteId, status: 'instalado' as const, instaladoEm: new Date().toISOString() } : e),
            }));
          }

          const truck = get().trucks.find((t) => t.id === r.caminhaoId);
          const client = get().clients.find((c) => c.id === r.clienteId);
          const destino = truck ? `caminhão ${truck.frota} (${truck.placa})` : client ? `cliente ${client.nome}` : 'relatório';
          patchReport(id, (rep) => ({
            ...rep,
            deteccoes: rep.deteccoes.map((d) => d.id === detId ? {
              ...d,
              status: action === 'corrigir' ? 'corrigido' as const : 'confirmado' as const,
              codigoConfirmado: codigo, equipmentId: eq!.id, confirmadoPor: ator, confirmadoEm: new Date().toISOString(),
            } : d),
            equipamentosIds: rep.equipamentosIds.includes(eq!.id) ? rep.equipamentosIds : [...rep.equipamentosIds, eq!.id],
            historico: [...rep.historico, audit(ator, action === 'corrigir' ? 'Identificação corrigida e confirmada' : 'Equipamento confirmado', `${codigo} associado ao ${destino}`)],
          }));
          return { ok: true };
        },

        registerDocuments: (id, ator) => {
          const report = get().reports.find((r) => r.id === id);
          if (!report || !['aprovado', 'arquivado'].includes(report.status) || report.deteccoes.some((d) => d.status === 'aguardando')) return;
          patchReport(id, (r) => {
            const versao = r.documentos.length ? Math.max(...r.documentos.map((d) => d.versao)) + 1 : 1;
            const agora = new Date().toISOString();
            return {
              ...r,
              status: 'arquivado',
              documentos: [
                ...r.documentos,
                { id: uid('doc'), tipo: 'cliente' as const, versao, geradoEm: agora, geradoPor: ator },
                { id: uid('doc'), tipo: 'interno' as const, versao, geradoEm: agora, geradoPor: ator },
              ],
              historico: [...r.historico, audit(ator, 'Documentos gerados', `PDF cliente (sem fotos) + PDF interno (completo) — versão ${versao}`)],
            };
          });
          const r = get().reports.find((x) => x.id === id);
          set((s) => ({
            notifications: [notif('documento', `Documentos gerados — ${r?.codigo}`, 'Os dois PDFs foram gerados e arquivados. O documento do cliente está liberado para envio.', 'todos', id), ...s.notifications],
          }));
        },

        markClientSent: (id, ator) => {
          const report = get().reports.find((r) => r.id === id);
          if (!report || !['aprovado', 'arquivado'].includes(report.status) || !report.documentos.some((d) => d.tipo === 'cliente')) return;
          patchReport(id, (r) => ({
            ...r,
            enviadoCliente: true,
            documentos: r.documentos.map((d) => d.tipo === 'cliente' && !d.enviadoEm ? { ...d, enviadoEm: new Date().toISOString(), enviadoPor: ator } : d),
            historico: [...r.historico, audit(ator, 'Enviado ao cliente', 'Envio SIMULADO — nenhuma mensagem real foi disparada')],
          }));
          const r = get().reports.find((x) => x.id === id);
          set((s) => ({
            notifications: [notif('documento', `Envio registrado — ${r?.codigo}`, 'Documento do cliente marcado como enviado (simulação).', 'todos', id), ...s.notifications],
          }));
        },

        sendReminder: (id, ator) => {
          const r = get().reports.find((x) => x.id === id);
          const colab = get().users.find((u) => u.id === r?.colaboradorId);
          patchReport(id, (rep) => ({
            ...rep,
            historico: [...rep.historico, audit(ator, 'Lembrete enviado', `Lembrete de preenchimento a ${colab?.nome ?? 'colaborador'} (simulação)`)],
          }));
          set((s) => ({
            notifications: [notif('prazo', `Lembrete enviado — ${r?.codigo}`, `Lembrete de preenchimento enviado a ${colab?.nome} (simulação — nenhuma mensagem real disparada).`, 'todos', id), ...s.notifications],
          }));
        },

        addClient: (c, ator) => {
          set((s) => ({
            clients: [...s.clients, { ...c, id: uid('c') }],
            notifications: [notif('sistema', 'Cliente cadastrado', `${c.nome} adicionado por ${ator}.`, 'admin'), ...s.notifications],
          }));
        },

        addTruck: (t, ator) => {
          if (get().trucks.some((x) => x.placa.toUpperCase() === t.placa.toUpperCase())) {
            return { ok: false, erro: 'Já existe um caminhão com esta placa.' };
          }
          set((s) => ({
            trucks: [...s.trucks, { ...t, id: uid('t') }],
            notifications: [notif('sistema', 'Caminhão cadastrado', `${t.frota} · ${t.placa} adicionado por ${ator}.`, 'admin'), ...s.notifications],
          }));
          return { ok: true };
        },

        addEquipment: (e, ator) => {
          if (get().equipment.some((x) => x.codigo.toUpperCase() === e.codigo.toUpperCase())) {
            return { ok: false, erro: 'Já existe um equipamento com este código.' };
          }
          set((s) => ({
            equipment: [...s.equipment, {
              id: uid('eq'), codigo: e.codigo.toUpperCase(), tipo: e.tipo, serial: e.serial,
              status: e.truckId ? 'instalado' : 'estoque', truckId: e.truckId ?? null,
              clienteId: e.clienteId ?? null, instaladoEm: e.truckId ? new Date().toISOString() : undefined,
              telemetria: e.telemetria, pulsus: e.pulsus, cameraFadiga: e.cameraFadiga, galileo: e.galileo,
              origemDados: 'sintetico',
            }],
            notifications: [notif('sistema', 'Equipamento cadastrado', `${e.codigo} adicionado por ${ator}.`, 'admin'), ...s.notifications],
          }));
          return { ok: true };
        },

        addCollaborator: (u, ator) => {
          set((s) => ({
            users: [...s.users, { ...u, id: uid('u'), role: 'colaborador', ativo: true }],
            notifications: [notif('sistema', 'Colaborador cadastrado', `${u.nome} adicionado por ${ator}.`, 'admin'), ...s.notifications],
          }));
        },

        /* ── Portal do Motorista ──
           Automações: gerar checklist, salvar rascunho, abrir ocorrência em falha,
           rotear notificação interna e sincronizar fila. Tudo simulado/local.
           NÃO aprova relatório, NÃO gera PDF de cliente, NÃO envia mensagem real. */

        ensureDriverChecklist: (motoristaId, caminhaoId, opts) => {
          const data = opts?.data ?? todayISO();
          const turno = opts?.turno ?? currentShift();
          const existing = get().driverChecklists.find((c) => c.motoristaId === motoristaId && c.caminhaoId === caminhaoId && c.data === data && c.turno === turno);
          if (existing) return existing.id;
          const truck = get().trucks.find((t) => t.id === caminhaoId);
          const id = uid('dck');
          const agora = new Date().toISOString();
          const checklist: DriverChecklist = {
            id, motoristaId, caminhaoId, clienteId: truck?.clienteId ?? '',
            data, turno,
            items: buildChecklistItems(truck, get().equipment),
            status: 'rascunho', origem: 'automatico',
            criadoEm: agora, atualizadoEm: agora, ocorrenciasIds: [],
            historico: [audit('Sistema', 'Checklist gerado automaticamente', `Itens padrão do veículo + equipamentos instalados${truck ? ` no ${truck.frota}` : ''}`)],
          };
          set((s) => ({ driverChecklists: [checklist, ...s.driverChecklists] }));
          return id;
        },

        updateDriverChecklistItem: (checklistId, itemId, patch, ator) => {
          set((s) => ({
            driverChecklists: s.driverChecklists.map((c) => {
              if (c.id !== checklistId || c.status !== 'rascunho') return c;
              return {
                ...c,
                atualizadoEm: new Date().toISOString(),
                items: c.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)),
              };
            }),
          }));
          void ator;
        },

        markAllChecklistOk: (checklistId, ator) => {
          set((s) => ({
            driverChecklists: s.driverChecklists.map((c) => {
              if (c.id !== checklistId || c.status !== 'rascunho') return c;
              return {
                ...c,
                atualizadoEm: new Date().toISOString(),
                items: c.items.map((i) => ({ ...i, status: 'ok' as const, observacao: '' })),
                historico: [...c.historico, audit(ator, 'Itens marcados como OK em lote', 'Ação explícita do motorista — não é aprovação de relatório')],
              };
            }),
          }));
        },

        submitDriverChecklist: (checklistId, ator) => {
          const c = get().driverChecklists.find((x) => x.id === checklistId);
          if (!c) return { ok: false, erros: ['Checklist não encontrado.'], ocorrenciasIds: [] };
          if (c.status !== 'rascunho') return { ok: false, erros: ['Este checklist já foi enviado.'], ocorrenciasIds: [] };
          const erros: string[] = [];
          const naoVerificados = c.items.filter((i) => i.status === 'nao_verificado');
          if (naoVerificados.length) erros.push(`Verifique todos os itens (${naoVerificados.length} pendente(s)).`);
          if (erros.length) return { ok: false, erros, ocorrenciasIds: [] };

          const truck = get().trucks.find((t) => t.id === c.caminhaoId);
          const agora = new Date().toISOString();
          const ocorrenciasIds: string[] = [];
          const novasOcorrencias: DriverOccurrence[] = [];
          const maxOco = get().driverOccurrences.reduce((m, o) => Math.max(m, parseInt(o.codigo.split('-')[2] ?? '0', 10)), 0);
          let seq = maxOco;

          // Automação segura: item com falha abre ocorrência automaticamente.
          for (const i of c.items.filter((x) => x.status === 'falha')) {
            seq += 1;
            const categoria = itemToOccurrenceCategory(i.key);
            const occ: DriverOccurrence = {
              id: uid('oco'), codigo: `OCO-2026-${String(seq).padStart(4, '0')}`,
              motoristaId: c.motoristaId, caminhaoId: c.caminhaoId, clienteId: c.clienteId,
              equipmentId: i.equipmentId, checklistId: c.id,
              categoria, severidade: suggestSeverity(categoria, 'falha'),
              descricao: i.observacao?.trim() || occurrenceTemplate(categoria, truck),
              fotos: [], status: 'aberta', origem: 'checklist',
              criadoEm: agora, atualizadoEm: agora,
              historico: [
                audit(ator, 'Ocorrência aberta automaticamente', `Item "${i.label}" marcado como falha no checklist`),
                audit('Sistema', 'Notificação interna roteada', 'Coordenação/revisão notificadas (simulação)'),
              ],
            };
            novasOcorrencias.push(occ);
            ocorrenciasIds.push(occ.id);
          }

          const status = ocorrenciasIds.length ? 'em_analise' as const : 'concluido' as const;
          set((s) => ({
            driverChecklists: s.driverChecklists.map((x) => x.id === checklistId ? {
              ...x,
              status,
              enviadoEm: agora,
              concluidoEm: ocorrenciasIds.length ? undefined : agora,
              ocorrenciasIds,
              atualizadoEm: agora,
              historico: [...x.historico, audit(ator, 'Checklist enviado', ocorrenciasIds.length ? `${ocorrenciasIds.length} ocorrência(s) aberta(s) automaticamente` : 'Todos os itens OK — concluído automaticamente')],
            } : x),
            driverOccurrences: [...novasOcorrencias, ...s.driverOccurrences],
            driverSyncQueue: [
              { id: uid('sync'), tipo: 'checklist' as const, refId: checklistId, detalhe: `Checklist ${c.data} ${c.turno}`, criadoEm: agora, status: 'pendente' as const },
              ...novasOcorrencias.map((o) => ({ id: uid('sync'), tipo: 'ocorrencia' as const, refId: o.id, detalhe: o.codigo, criadoEm: agora, status: 'pendente' as const })),
              ...s.driverSyncQueue,
            ],
            notifications: [
              ...(ocorrenciasIds.length ? [
                notif('motorista', `Checklist com falha — ${truck?.frota ?? 'caminhão'}`, `${ator} enviou checklist com ${ocorrenciasIds.length} falha(s). Ocorrências abertas automaticamente.`, 'admin', undefined, { checklistId, occurrenceId: ocorrenciasIds[0] }),
                notif('motorista', `Checklist com falha — ${truck?.frota ?? 'caminhão'}`, `${ator} enviou checklist com ${ocorrenciasIds.length} falha(s). Ocorrências abertas automaticamente.`, 'revisora', undefined, { checklistId, occurrenceId: ocorrenciasIds[0] }),
              ] : []),
              ...s.notifications,
            ],
          }));
          return { ok: true, erros: [], ocorrenciasIds };
        },

        createDriverOccurrence: (args, ator) => {
          const session = get().session;
          if (session?.role === 'motorista' && session.userId !== args.motoristaId) {
            return { ok: false, erro: 'Motorista só pode registrar ocorrências em seu próprio nome.' };
          }
          const motorista = get().users.find((u) => u.id === args.motoristaId);
          if (motorista?.truckIds?.length && !motorista.truckIds.includes(args.caminhaoId)) {
            return { ok: false, erro: 'Caminhão não vinculado a este motorista.' };
          }
          if (args.descricao.trim().length < 10) return { ok: false, erro: 'Descreva a ocorrência com pelo menos 10 caracteres.' };
          const truck = get().trucks.find((t) => t.id === args.caminhaoId);
          const agora = new Date().toISOString();
          const maxOco = get().driverOccurrences.reduce((m, o) => Math.max(m, parseInt(o.codigo.split('-')[2] ?? '0', 10)), 0);
          const id = uid('oco');
          const codigo = `OCO-2026-${String(maxOco + 1).padStart(4, '0')}`;
          const occ: DriverOccurrence = {
            id, codigo,
            motoristaId: args.motoristaId, caminhaoId: args.caminhaoId, clienteId: truck?.clienteId ?? '',
            equipmentId: args.equipmentId, checklistId: args.checklistId,
            categoria: args.categoria, severidade: args.severidade,
            descricao: args.descricao.trim(), fotos: args.fotos ?? [],
            status: 'aberta', origem: args.checklistId ? 'checklist' : 'manual',
            criadoEm: agora, atualizadoEm: agora,
            historico: [
              audit(ator, 'Ocorrência aberta', `${args.categoria} — severidade ${args.severidade}`),
              audit('Sistema', 'Notificação interna roteada', 'Coordenação/revisão notificadas (simulação)'),
            ],
          };
          set((s) => ({
            driverOccurrences: [occ, ...s.driverOccurrences],
            driverSyncQueue: [{ id: uid('sync'), tipo: 'ocorrencia', refId: id, detalhe: codigo, criadoEm: agora, status: 'pendente' }, ...s.driverSyncQueue],
            notifications: [
              notif('motorista', `Ocorrência de motorista — ${codigo}`, `${ator} reportou ocorrência no ${truck?.frota ?? 'caminhão'}. Aguardando triagem.`, 'admin', undefined, { occurrenceId: id }),
              notif('motorista', `Ocorrência de motorista — ${codigo}`, `${ator} reportou ocorrência no ${truck?.frota ?? 'caminhão'}. Aguardando triagem.`, 'revisora', undefined, { occurrenceId: id }),
              ...s.notifications,
            ],
          }));
          return { ok: true, id };
        },

        setDriverOccurrenceStatus: (id, status, ator, resposta) => {
          const session = get().session;
          if (!session || (session.role !== 'admin' && session.role !== 'revisora')) {
            return { ok: false, erro: 'Apenas coordenação/revisão pode alterar o status de ocorrências.' };
          }
          const occ = get().driverOccurrences.find((o) => o.id === id);
          if (!occ) return { ok: false, erro: 'Ocorrência não encontrada.' };
          const agora = new Date().toISOString();
          const done = status === 'resolvida' || status === 'rejeitada';
          set((s) => ({
            driverOccurrences: s.driverOccurrences.map((o) => o.id === id ? {
              ...o, status,
              atualizadoEm: agora,
              resolvidaEm: done ? agora : o.resolvidaEm,
              resolvidaPor: done ? ator : o.resolvidaPor,
              resposta: resposta ?? o.resposta,
              historico: [...o.historico, audit(ator, `Ocorrência ${status === 'em_analise' ? 'em análise' : status}`, resposta || undefined)],
            } : o),
            notifications: [
              notif('motorista', `Ocorrência ${occ.codigo} atualizada`, `Status: ${status}.${resposta ? ` Resposta: ${resposta}` : ''}`, 'motorista', undefined, { userId: occ.motoristaId, occurrenceId: id }),
              ...s.notifications,
            ],
          }));
          return { ok: true };
        },

        confirmDriverTraining: (motoristaId, treinamentoId, titulo, nomeConfirmado, ator) => {
          const user = get().users.find((u) => u.id === motoristaId);
          if (!user) return { ok: false, erro: 'Motorista não encontrado.' };
          if (nomeConfirmado.trim().toLowerCase() !== user.nome.trim().toLowerCase()) {
            return { ok: false, erro: 'Digite seu nome completo exatamente como cadastrado para confirmar ciência.' };
          }
          const existing = get().driverTrainings.find((t) => t.motoristaId === motoristaId && t.treinamentoId === treinamentoId);
          if (existing) return { ok: false, erro: 'Ciência deste treinamento já registrada.' };
          const agora = new Date().toISOString();
          const id = uid('dtr');
          set((s) => ({
            driverTrainings: [{
              id, motoristaId, treinamentoId, titulo, nomeConfirmado: nomeConfirmado.trim(), ciencia: true, confirmadoEm: agora,
              historico: [audit(ator, 'Ciência de treinamento registrada', 'Confirmação digitada — sem biometria')],
              syncedAt: undefined,
            }, ...s.driverTrainings],
            driverSyncQueue: [{ id: uid('sync'), tipo: 'treinamento', refId: id, detalhe: titulo, criadoEm: agora, status: 'pendente' }, ...s.driverSyncQueue],
          }));
          return { ok: true };
        },

        syncDriverQueue: () => {
          const pending = get().driverSyncQueue.filter((q) => q.status === 'pendente');
          if (!pending.length) return 0;
          const agora = new Date().toISOString();
          const refIds = new Set(pending.map((p) => p.refId));
          set((s) => ({
            driverSyncQueue: s.driverSyncQueue.map((q) => q.status === 'pendente' ? { ...q, status: 'sincronizado', sincronizadoEm: agora } : q),
            driverChecklists: s.driverChecklists.map((c) => refIds.has(c.id) ? { ...c, syncedAt: agora } : c),
            driverOccurrences: s.driverOccurrences.map((o) => refIds.has(o.id) ? { ...o, syncedAt: agora } : o),
            driverTrainings: s.driverTrainings.map((t) => refIds.has(t.id) ? { ...t, syncedAt: agora } : t),
          }));
          return pending.length;
        },

        markNotificationRead: (nid) => {
          set((s) => ({ notifications: s.notifications.map((n) => (n.id === nid ? { ...n, lida: true } : n)) }));
        },
        markAllRead: () => {
          set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, lida: true })) }));
        },
      };
    },
    {
      name: 'safip-fieldops-v2',
      storage: createJSONStorage(() => localStorage),
      version: 4,
      migrate: (persisted, version) => {
        const s = (persisted ?? {}) as Partial<State>;
        if (version < 4) {
          // Base 100% sintética: remove quaisquer dados de referência persistidos.
          return { ...buildSeed(), session: null } as State;
        }
        return s as State;
      },
    },
  ),
);

/* Seletores auxiliares */
export function useCurrentUser(): User | null {
  return useStore((s) => (s.session ? s.users.find((u) => u.id === s.session!.userId) ?? null : null));
}

export function reportProgress(r: Report): number {
  const steps: ReportStatus[] = ['pendente', 'rascunho', 'em_revisao', 'aprovado', 'arquivado'];
  if (r.status === 'correcao') return 40;
  const idx = steps.indexOf(r.status);
  return Math.round(((idx + 1) / steps.length) * 100);
}
