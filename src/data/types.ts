/* Modelo de domínio do Rajamine FieldOps.
   No protótipo, persistido em localStorage (metadados) + IndexedDB (fotos enviadas).
   Em produção, mapeia para PostgreSQL + storage de objetos (ver docs/03-arquitetura.md). */

export type Role = 'admin' | 'revisora' | 'colaborador';

export interface User {
  id: string;
  nome: string;
  email: string;
  role: Role;
  cargo: string;
  ativo: boolean;
}

export interface Client {
  id: string;
  nome: string;
  cnpj: string;
  cidade: string;
  uf: string;
  contato: string;
  email: string;
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
  | 'Telemetria veicular'
  | 'Rastreador GPS'
  | 'Sensor de fadiga'
  | 'Câmera embarcada'
  | 'Sensor de carga';

export type EquipmentStatus = 'instalado' | 'estoque' | 'manutencao';

export interface Equipment {
  id: string;
  codigo: string; // ex.: EQ-2041
  tipo: EquipmentType;
  serial: string;
  status: EquipmentStatus;
  truckId: string | null;
  instaladoEm?: string;
}

export type ReportStatus =
  | 'pendente'      // link enviado, aguardando preenchimento
  | 'rascunho'      // colaborador começou a preencher
  | 'em_revisao'    // enviado para a responsável
  | 'correcao'      // revisão devolveu com pedidos de correção
  | 'aprovado'      // aprovação humana registrada
  | 'arquivado';    // documentos gerados e arquivados

export interface Photo {
  id: string;
  nome: string;
  origem: 'demo' | 'upload';
  src?: string;        // caminho público (fotos demonstrativas)
  storageKey?: string; // chave no IndexedDB (uploads)
  mime: string;
  legenda: string;
  categoria: 'equipamento' | 'atividade';
  criadaEm: string;
}

export interface OcrCandidate {
  valor: string;       // como lido, ex.: "EQ-2O41"
  normalizado: string; // ex.: "EQ-2041"
  confianca: number;   // 0–100
  tipo: 'codigo' | 'serial' | 'numero';
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
  enviadoEm?: string;  // envio SIMULADO ao cliente
  enviadoPor?: string;
}

export interface Report {
  id: string;
  codigo: string; // REL-2026-0142
  token: string;  // link individual de preenchimento
  colaboradorId: string;
  clienteId: string;
  caminhaoId: string;
  dataViagem: string; // yyyy-mm-dd
  origem: string;
  destino: string;
  kmInicio?: number;
  kmFim?: number;
  descricaoOriginal: string; // nunca sobrescrito após o envio
  descricaoAtual: string;    // versão vigente (padronizada/editada)
  versoesTexto: TextVersion[];
  status: ReportStatus;
  criadoEm: string;
  prazoEm: string; // criadoEm + 48 h
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
}

export interface Notification {
  id: string;
  tipo: 'prazo' | 'revisao' | 'aprovacao' | 'correcao' | 'documento' | 'sistema';
  titulo: string;
  mensagem: string;
  criadaEm: string;
  lida: boolean;
  reportId?: string;
  para: Role | 'todos';
}

export interface Session {
  userId: string;
  role: Role;
}

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
};
