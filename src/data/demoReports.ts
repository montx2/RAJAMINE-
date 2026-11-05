/*
  Relatórios estruturados sintéticos (visita técnica, atividade externa e semanal).
  Conteúdo realista, porém fictício — sem material real da empresa.
*/
import type { ActivityEntry, Report } from './types';
import { demoOperations } from './demoOperations';

const D = 86400000;
function dayStr(offsetDays: number): string {
  const d = new Date(Date.now() + offsetDays * D);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function iso(offsetMs: number): string {
  return new Date(Date.now() + offsetMs).toISOString();
}

function opToActivity(opId: string, clienteId: string, colaboradorId: string): ActivityEntry {
  const op = demoOperations.find((o) => o.id === opId)!;
  const lower = op.atividade.toLowerCase();
  const tipo: ActivityEntry['tipo'] = lower.startsWith('instalação') ? 'instalacao'
    : lower.startsWith('desmobilização') ? 'desmobilizacao'
    : lower.startsWith('conferência') ? 'conferencia'
    : lower.startsWith('coleta') ? 'coleta_telemetria'
    : 'manutencao';
  const componentes: string[] = [];
  if (op.telemetria) componentes.push('Telemetria');
  if (op.pulsus) componentes.push('Tablet Pulsus');
  if (op.cameraFadiga) componentes.push('Câmera de fadiga');
  if (op.galileo) componentes.push('Galileo');
  return {
    id: `act_${op.id}`, data: op.data, clienteId, colaboradorId,
    equipamentoCodigo: op.equipamento, tipo, componentes,
    telemetria: op.telemetria, pulsus: op.pulsus, cameraFadiga: op.cameraFadiga, galileo: op.galileo,
    observacao: op.observacao, situacaoTelemetria: op.situacaoTelemetria, fotos: op.fotos,
    descricao: op.atividade,
  };
}

function base(partial: Partial<Report> & Pick<Report, 'id' | 'codigo' | 'colaboradorId' | 'clienteId' | 'dataViagem' | 'descricaoOriginal' | 'tipo'>): Report {
  const criadoEm = iso(-2 * D);
  return {
    token: `demo-${partial.id}-${Math.random().toString(36).slice(2, 10)}`,
    caminhaoId: '',
    origem: 'Base SAFIP — Belo Horizonte/MG',
    destino: '',
    descricaoAtual: partial.descricaoOriginal,
    versoesTexto: [{ id: `tv_${partial.id}`, texto: partial.descricaoOriginal, tipo: 'original', autor: 'Colaborador', criadaEm: criadoEm }],
    status: 'em_revisao',
    criadoEm,
    prazoEm: iso(2 * D),
    enviadoRevisaoEm: iso(-D),
    fotos: [], deteccoes: [], notasRevisao: [], documentos: [],
    historico: [{ id: `ev_${partial.id}`, em: criadoEm, ator: 'Sistema', acao: 'Relatório criado', detalhe: 'Registro sintético para demonstração' }],
    equipamentosIds: [],
    enviadoCliente: false,
    origemDados: 'sintetico',
    ...partial,
  };
}

const visitaOriginal =
  'Foi realizado instalação do equipamento SA-101, telemetria numero 0187, tablette pulsus 2741 e camera de fadiga 864993060408250. ' +
  'Tambem foi realizado a desmobilização do equipamento SA-102, telemetria numero 0995, tablette pulsus 2309 e camera de fadiga 869247060146492. ' +
  'Os testes de comunicação foram concluidos com sucesso.';

const visitaActivities: ActivityEntry[] = [
  opToActivity('op_01', 'c_serra', 'u_andre'),
  opToActivity('op_02', 'c_serra', 'u_andre'),
];

const externaOriginal =
  'Realizei manutenção da telemetria VA-201, numero 2183, e conferencia do tablet VA-205. ' +
  'A comunicação com a central foi validada e o checklist entregue ao supervisor da frota.';

const externaActivities: ActivityEntry[] = [
  opToActivity('op_03', 'c_aco', 'u_carlos'),
  opToActivity('op_04', 'c_aco', 'u_carlos'),
];

const weeklyActivities: ActivityEntry[] = [
  opToActivity('op_01', 'c_serra', 'u_carlos'),
  opToActivity('op_03', 'c_aco', 'u_joao'),
  opToActivity('op_05', 'c_rita', 'u_felipe'),
  opToActivity('op_07', 'c_horizonte', 'u_andre'),
  opToActivity('op_09', 'c_serra', 'u_carlos'),
  opToActivity('op_12', 'c_horizonte', 'u_andre'),
];

const weeklyOriginal =
  'O presente relatório documenta as atividades de instalação, manutenção, conferência e coleta de telemetria realizadas pela equipe de campo ' +
  'no período de ' + dayStr(-6) + ' a ' + dayStr(-1) + ', de forma presencial em empresas clientes, com o intuito de organizar e aprimorar os processos.';

export const demoWeeklyPeriod = { inicio: dayStr(-6), fim: dayStr(-1) };

export const demoStructuredReports: Report[] = [
  base({
    id: 'r_201', codigo: 'REL-2026-0201', colaboradorId: 'u_andre', clienteId: 'c_serra',
    dataViagem: dayStr(-1), tipo: 'visita_tecnica',
    destino: 'Mina Serra Azul — Itabira/MG',
    setor: 'Frota / Telemetria', cidadeBairro: 'Itabira/MG',
    objetivo: 'Instalação e desmobilização de equipamentos de telemetria e câmera de fadiga.',
    descricaoOriginal: visitaOriginal,
    atividades: visitaActivities,
    avaliacaoTecnica: 'As atividades foram concluídas conforme o planejamento. Os equipamentos instalados apresentaram comunicação estável com a central e os dispositivos desmobilizados foram recolhidos para estoque.',
    sensacaoCliente: 'O supervisor da frota acompanhou os testes e validou o funcionamento dos equipamentos.',
    pontosPositivos: 'Comunicação estável, checklist entregue e área de trabalho organizada.',
    melhorias: 'Padronizar a identificação dos chicotes para facilitar manutenções futuras.',
  }),
  base({
    id: 'r_203', codigo: 'REL-2026-0203', colaboradorId: 'u_carlos', clienteId: 'c_aco',
    dataViagem: dayStr(-2), tipo: 'atividade_externa',
    destino: 'Planta Vale do Aço — Ipatinga/MG',
    setor: 'Manutenção', cidadeBairro: 'Ipatinga/MG',
    objetivo: 'Manutenção de telemetria e conferência de tablet.',
    descricaoOriginal: externaOriginal,
    atividades: externaActivities,
    avaliacaoTecnica: 'Manutenção preventiva concluída. A telemetria foi atualizada e o tablet conferido, sem necessidade de substituição de componentes.',
  }),
  base({
    id: 'r_204', codigo: 'REL-2026-0204', colaboradorId: 'u_helena', clienteId: 'c_serra',
    dataViagem: dayStr(-1), tipo: 'semanal_viagens',
    periodoInicio: demoWeeklyPeriod.inicio, periodoFim: demoWeeklyPeriod.fim,
    objetivo: 'Consolidado semanal das atividades de campo.',
    descricaoOriginal: weeklyOriginal,
    atividades: weeklyActivities,
    avaliacaoTecnica: 'Consolidado gerado a partir dos relatórios individuais aprovados no período.',
  }),
];
