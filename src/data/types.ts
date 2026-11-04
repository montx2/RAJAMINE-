/* Modelo de domínio do Rajamine FieldOps.
   A partir das referências reais fornecidas pela empresa (set/2026), o modelo
   diferencia EQUIPAMENTO DO CLIENTE (ex.: CP-101, TYE-9A00) dos DISPOSITIVOS
   embarcados (telemetria, tablet Pulsus, câmera de fadiga, Galileo).
   No protótipo, persistido em localStorage (metadados) + IndexedDB (fotos).
   Em produção, mapeia para PostgreSQL + storage de objetos (docs/03). */

export type Role = 'admin' | 'revisora' | 'colaborador' | 'motorista';

export interface User {
  id: string;
  nome: string;
  email: string;
  role: Role;
  cargo: string;
  ativo: boolean;
  origemDados?: DataOrigin;
  /** Caminhões vinculados ao motorista (protótipo). Em produção: tabela de vínculo/escala. */
  truckIds?: string[];
}

export type DataOrigin = 'sintetico' | 'referencia_empresa';

export interface Client {
  id: string;
  nome: string;
  cnpj: string;
  cidade: string;
  uf: string;
  contato: string;
  email: string;
  origemDados?: DataOrigin;
}

export interface Truck {
  id: string;
  placa: string;
  frota: string;
  marca: string;
  modelo: string;
  ano: number;
  clienteId: string;
}

export type EquipmentType =
  | 'Equipamento de cliente'
  | 'Telemetria veicular'
  | 'Tablet Pulsus'
  | 'Câmera de fadiga'
  | 'Galileo / rotograma'
  | 'Rastreador GPS'
  | 'Sensor de fadiga'
  | 'Câmera embarcada'
  | 'Sensor de carga';

export type EquipmentStatus = 'instalado' | 'estoque' | 'manutencao' | 'desmobilizado';

/** Identificadores reais usados nas planilhas e relatórios da Rajamine. */
export interface DeviceIds {
  telemetria?: string;      // ex.: 0987 (preservar zeros à esquerda)
  pulsus?: string;          // tablet, ex.: 2758
  cameraFadiga?: string;    // IMEI, ex.: 864993060408250
  galileo?: string;         // ID Galileo, ex.: 867782071392430
}

export interface Equipment extends DeviceIds {
  id: string;
  codigo: string;           // ex.: CP-101, TYE-9A00 ou EQ-2041 (demo)
  tipo: EquipmentType;
  serial: string;
  status: EquipmentStatus;
  truckId: string | null;
  clienteId?: string | null;
  instaladoEm?: string;
  origemDados?: DataOrigin;
}

export type ReportStatus =
  | 'pendente' | 'rascunho' | 'em_revisao' | 'correcao' | 'aprovado' | 'arquivado';

export type ReportKind = 'viagem' | 'visita_tecnica' | 'atividade_externa' | 'semanal_viagens';

export const REPORT_KIND_LABEL: Record<ReportKind, string> = {
  viagem: 'Relatório de viagem',
  visita_tecnica: 'Relatório de visita técnica',
  atividade_externa: 'Relatório de atividade externa',
  semanal_viagens: 'Relatório semanal — viagens',
};

export type ActivityKind =
  | 'instalacao' | 'desmobilizacao' | 'manutencao' | 'conferencia'
  | 'coleta_telemetria' | 'reuniao' | 'treinamento' | 'outro';

export const ACTIVITY_KIND_LABEL: Record<ActivityKind, string> = {
  instalacao: 'Instalação',
  desmobilizacao: 'Desmobilização',
  manutencao: 'Manutenção',
  conferencia: 'Conferência',
  coleta_telemetria: 'Coleta de telemetria',
  reuniao: 'Reunião',
  treinamento: 'Treinamento',
  outro: 'Outro',
};

export type TelemetrySituation = 'ok' | 'pendente' | 'antiga' | 'nao_informada';
export type PhotosSituation = 'enviadas' | 'pendentes' | 'nao_informado';

/** Linha de atividade por equipamento — espelha a planilha real da empresa. */
export interface ActivityEntry extends DeviceIds {
  id: string;
  data: string;                       // yyyy-mm-dd
  clienteId?: string;                 // no consolidado semanal, cada linha pode ter um cliente
  colaboradorId?: string;
  equipamentoCodigo: string;          // CP-101, TYE-9A00, RUU-1G56…
  tipo: ActivityKind;
  componentes?: string[];             // ['Telemetria', 'Câmera de fadiga', 'Tablet']
  observacao?: string;                // "Telemetria antiga: 0995", "ID Galileo: …"
  situacaoTelemetria?: TelemetrySituation;
  fotos?: PhotosSituation;
  descricao?: string;                 // relato livre da atividade
}

/** Linha transcrita da planilha "Instalações/Manutenções/Retiradas — Equipamentos". */
export interface OperationRow extends DeviceIds {
  id: string;
  data: string;
  empresa: string;
  tecnico: string;
  equipamento: string;
  atividade: string;
  observacao: string;
  situacaoTelemetria: TelemetrySituation;
  fotos: PhotosSituation;
  origemDados: DataOrigin;
}

export interface Photo {
  id: string;
  nome: string;
  origem: 'demo' | 'upload';
  src?: string;
  storageKey?: string;
  mime: string;
  legenda: string;
  categoria: 'equipamento' | 'atividade';
  criadaEm: string;
}

export interface OcrCandidate {
  valor: string;
  normalizado: string;
  confianca: number;
  tipo: 'codigo' | 'serial' | 'numero' | 'imei' | 'telemetria' | 'pulsus';
}

export type DetectionStatus = 'aguardando' | 'confirmado' | 'corrigido' | 'rejeitado';

export interface Detection {
  id: string;
  photoId: string;
  motor: 'tesseract-local' | 'demo';
  status: DetectionStatus;
  candidatos: OcrCandidate[];
  textoBruto?: string;
  confianca: number;
  codigoConfirmado?: string;
  equipmentId?: string;
  confirmadoPor?: string;
  confirmadoEm?: string;
  criadoEm: string;
}

export interface TextVersion {
  id: string;
  texto: string;
  tipo: 'original' | 'ia' | 'manual';
  autor: string;
  criadaEm: string;
  nota?: string;
}

export interface ReviewNote {
  id: string;
  autor: string;
  texto: string;
  criadaEm: string;
  tipo: 'observacao' | 'correcao' | 'aprovacao';
}

export interface AuditEvent {
  id: string;
  em: string;
  ator: string;
  acao: string;
  detalhe?: string;
}

export interface GeneratedDoc {
  id: string;
  tipo: 'cliente' | 'interno';
  versao: number;
  geradoEm: string;
  geradoPor: string;
  enviadoEm?: string;
  enviadoPor?: string;
}

export interface Report {
  id: string;
  codigo: string;
  token: string;
  colaboradorId: string;
  clienteId: string;
  caminhaoId: string;                 // '' quando a operação não é centrada em caminhão
  dataViagem: string;
  origem: string;
  destino: string;
  kmInicio?: number;
  kmFim?: number;
  descricaoOriginal: string;
  descricaoAtual: string;
  versoesTexto: TextVersion[];
  status: ReportStatus;
  criadoEm: string;
  prazoEm: string;
  enviadoRevisaoEm?: string;
  aprovadoEm?: string;
  aprovadoPor?: string;
  fotos: Photo[];
  deteccoes: Detection[];
  notasRevisao: ReviewNote[];
  historico: AuditEvent[];
  documentos: GeneratedDoc[];
  equipamentosIds: string[];
  enviadoCliente: boolean;

  // Campos alinhados aos documentos reais da Rajamine
  tipo?: ReportKind;
  setor?: string;
  cidadeBairro?: string;
  periodoInicio?: string;
  periodoFim?: string;
  objetivo?: string;
  avaliacaoTecnica?: string;
  sensacaoCliente?: string;
  pontosPositivos?: string;
  melhorias?: string;
  atividades?: ActivityEntry[];
  origemDados?: DataOrigin;
  fonteReferencia?: string;
}

export interface Notification {
  id: string;
  tipo: 'prazo' | 'revisao' | 'aprovacao' | 'correcao' | 'documento' | 'sistema' | 'motorista';
  titulo: string;
  mensagem: string;
  criadaEm: string;
  lida: boolean;
  reportId?: string;
  /** Quando presente, notificação é privada deste usuário (ex.: motorista). */
  userId?: string;
  occurrenceId?: string;
  checklistId?: string;
  para: Role | 'todos';
}

/* ────────────────────────────────────────────────────────────────────────────
   Portal do Motorista (PWA) — coleta rápida, checklists e ocorrências.
   Regras: motorista NÃO aprova relatório nem libera PDF; apenas reporta.
   Notificações/envios são simulados. Sem GPS contínuo/biometria/score.
   ──────────────────────────────────────────────────────────────────────────── */

export type DriverChecklistItemStatus = 'nao_verificado' | 'ok' | 'atencao' | 'falha';

export interface DriverChecklistItem {
  id: string;
  key: string;
  label: string;
  categoria: 'veiculo' | 'equipamento';
  equipmentId?: string;
  status: DriverChecklistItemStatus;
  observacao?: string;
}

export type DriverChecklistStatus = 'rascunho' | 'enviado' | 'em_analise' | 'concluido';

export interface DriverChecklist {
  id: string;
  motoristaId: string;
  caminhaoId: string;
  clienteId: string;
  data: string;                      // yyyy-mm-dd
  turno: 'dia' | 'noite';
  items: DriverChecklistItem[];
  status: DriverChecklistStatus;
  origem: 'automatico' | 'manual';
  criadoEm: string;
  atualizadoEm: string;
  enviadoEm?: string;
  concluidoEm?: string;
  ocorrenciasIds: string[];
  historico: AuditEvent[];
  syncedAt?: string;
}

export type DriverOccurrenceCategory =
  | 'camera_obstruida' | 'tablet_nao_liga' | 'telemetria_sem_sinal'
  | 'suporte_solto' | 'avaria_veiculo' | 'outro';

export type DriverOccurrenceSeverity = 'baixa' | 'media' | 'alta' | 'critica';
export type DriverOccurrenceStatus = 'aberta' | 'em_analise' | 'resolvida' | 'rejeitada';

export interface DriverOccurrence {
  id: string;
  codigo: string;                    // OCO-2026-0001
  motoristaId: string;
  caminhaoId: string;
  clienteId: string;
  equipmentId?: string;
  checklistId?: string;
  categoria: DriverOccurrenceCategory;
  severidade: DriverOccurrenceSeverity;
  descricao: string;
  fotos: Photo[];
  status: DriverOccurrenceStatus;
  origem: 'checklist' | 'manual';
  criadoEm: string;
  atualizadoEm: string;
  resolvidaEm?: string;
  resolvidaPor?: string;
  resposta?: string;
  historico: AuditEvent[];
  syncedAt?: string;
}

export interface DriverTraining {
  id: string;
  motoristaId: string;
  treinamentoId: string;
  titulo: string;
  nomeConfirmado: string;
  ciencia: boolean;
  confirmadoEm: string;
  historico: AuditEvent[];
  syncedAt?: string;
}

export interface DriverSyncItem {
  id: string;
  tipo: 'checklist' | 'ocorrencia' | 'treinamento';
  refId: string;
  detalhe: string;
  criadoEm: string;
  status: 'pendente' | 'sincronizado';
  sincronizadoEm?: string;
}

export interface Session { userId: string; role: Role; }

export const STATUS_LABEL: Record<ReportStatus, string> = {
  pendente: 'Aguardando preenchimento',
  rascunho: 'Rascunho',
  em_revisao: 'Em revisão',
  correcao: 'Correção solicitada',
  aprovado: 'Aprovado',
  arquivado: 'Arquivado',
};

export const ROLE_LABEL: Record<Role, string> = {
  admin: 'Administrador',
  revisora: 'Revisão',
  colaborador: 'Colaborador',
  motorista: 'Motorista',
};

export const DRIVER_CHECKLIST_STATUS_LABEL: Record<DriverChecklistStatus, string> = {
  rascunho: 'Rascunho',
  enviado: 'Enviado',
  em_analise: 'Em análise',
  concluido: 'Concluído',
};

export const DRIVER_OCCURRENCE_STATUS_LABEL: Record<DriverOccurrenceStatus, string> = {
  aberta: 'Aberta',
  em_analise: 'Em análise',
  resolvida: 'Resolvida',
  rejeitada: 'Rejeitada',
};
