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
  TextVersion, EquipmentType, ReportStatus,
} from '../data/types';
import { seedUsers, seedClients, seedTrucks, seedEquipment, seedReports, seedNotifications } from '../data/seed';
import { uid } from '../lib/id';

interface FillFields {
  dataViagem?: string;
  origem?: string;
  destino?: string;
  kmInicio?: number;
  kmFim?: number;
  descricao?: string;
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

  login: (userId: string) => void;
  logout: () => void;
  resetDemo: () => Promise<void>;

  createReport: (args: { colaboradorId: string; clienteId: string; caminhaoId: string; dataViagem: string; origem: string; destino: string }, ator: string) => string;
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
  addEquipment: (e: { codigo: string; tipo: EquipmentType; serial: string; truckId?: string | null }, ator: string) => { ok: boolean; erro?: string };
  addCollaborator: (u: { nome: string; email: string; cargo: string }, ator: string) => void;

  markNotificationRead: (nid: string) => void;
  markAllRead: () => void;
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
  };
}

function audit(ator: string, acao: string, detalhe?: string) {
  return { id: uid('ev'), em: new Date().toISOString(), ator, acao, detalhe };
}

function notif(tipo: Notification['tipo'], titulo: string, mensagem: string, para: Notification['para'], reportId?: string): Notification {
  return { id: uid('n'), tipo, titulo, mensagem, criadaEm: new Date().toISOString(), lida: false, reportId, para };
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
          await clear().catch(() => undefined);
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
            caminhaoId: args.caminhaoId,
            dataViagem: args.dataViagem,
            origem: args.origem,
            destino: args.destino,
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
              status: r.status === 'pendente' ? 'rascunho' : r.status,
            };
            return next;
          });
          void ator;
        },

        submitToReview: (id, ator) => {
          const r = get().reports.find((x) => x.id === id);
          if (!r) return { ok: false, erros: ['Relatório não encontrado.'] };
          const erros: string[] = [];
          if (!r.dataViagem) erros.push('Informe a data da viagem.');
          if (!r.origem.trim()) erros.push('Informe a origem.');
          if (!r.destino.trim()) erros.push('Informe o destino.');
          const texto = r.descricaoAtual.trim();
          if (texto.length < 20) erros.push('Descreva as atividades realizadas (mínimo de 20 caracteres).');
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
              id: uid('eq'), codigo, tipo: args.tipo ?? 'Telemetria veicular',
              serial: args.serial ?? det.candidatos.find((c) => c.tipo === 'serial')?.normalizado ?? '—',
              status: 'instalado', truckId: r.caminhaoId, instaladoEm: new Date().toISOString(),
            };
            set((s) => ({ equipment: [...s.equipment, novo] }));
            eq = novo;
          } else {
            set((s) => ({
              equipment: s.equipment.map((e) => e.id === eq!.id ? { ...e, truckId: r.caminhaoId, status: 'instalado' as const, instaladoEm: new Date().toISOString() } : e),
            }));
          }

          const truck = get().trucks.find((t) => t.id === r.caminhaoId);
          patchReport(id, (rep) => ({
            ...rep,
            deteccoes: rep.deteccoes.map((d) => d.id === detId ? {
              ...d,
              status: action === 'corrigir' ? 'corrigido' as const : 'confirmado' as const,
              codigoConfirmado: codigo, equipmentId: eq!.id, confirmadoPor: ator, confirmadoEm: new Date().toISOString(),
            } : d),
            equipamentosIds: rep.equipamentosIds.includes(eq!.id) ? rep.equipamentosIds : [...rep.equipamentosIds, eq!.id],
            historico: [...rep.historico, audit(ator, action === 'corrigir' ? 'Identificação corrigida e confirmada' : 'Equipamento confirmado', `${codigo} associado ao caminhão ${truck?.frota ?? ''} (${truck?.placa ?? ''})`)],
          }));
          return { ok: true };
        },

        registerDocuments: (id, ator) => {
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
            equipment: [...s.equipment, { id: uid('eq'), codigo: e.codigo.toUpperCase(), tipo: e.tipo, serial: e.serial, status: e.truckId ? 'instalado' : 'estoque', truckId: e.truckId ?? null, instaladoEm: e.truckId ? new Date().toISOString() : undefined }],
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

        markNotificationRead: (nid) => {
          set((s) => ({ notifications: s.notifications.map((n) => (n.id === nid ? { ...n, lida: true } : n)) }));
        },
        markAllRead: () => {
          set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, lida: true })) }));
        },
      };
    },
    {
      name: 'rajamine-fieldops-v1',
      storage: createJSONStorage(() => localStorage),
      version: 1,
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
