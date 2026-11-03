/*
  REFERÊNCIAS REAIS FORNECIDAS PELA RAJAMINE (set/2026).
  Transcrição estruturada de: planilha de instalações/manutenções/retiradas,
  relatório de atividade externa, relatório de visita técnica e relatório semanal.
  · Não inventamos campos ausentes (CNPJ, e-mail, cidade quando não informada).
  · Não anexamos as imagens originais ao repositório (privacidade).
  · Registros marcados como origemDados: 'referencia_empresa'.
  · Aprovações/envios NÃO são presumidos: relatórios de referência entram como
    "em revisão" para demonstrar o fluxo humano real.
*/
import type {
  ActivityEntry, Client, Equipment, OperationRow, Report, User,
} from './types';

export const REFERENCE_NOTE =
  'Referência real fornecida pela empresa (set/2026). Campos ausentes no material original não foram inventados.';

export const realClients: Client[] = [
  { id: 'c_mfs', nome: 'MFS', cnpj: '', cidade: '', uf: '', contato: '', email: '', origemDados: 'referencia_empresa' },
  { id: 'c_cedro', nome: 'Cedro Mariana', cnpj: '', cidade: 'Mariana', uf: 'MG', contato: '', email: '', origemDados: 'referencia_empresa' },
  { id: 'c_amda', nome: 'AMDA', cnpj: '', cidade: '', uf: '', contato: '', email: '', origemDados: 'referencia_empresa' },
  { id: 'c_fdx', nome: 'FDX', cnpj: '', cidade: '', uf: '', contato: '', email: '', origemDados: 'referencia_empresa' },
];

export const realUsers: User[] = [
  { id: 'u_glauber', nome: 'Glauber Vitor Santos Oliveira', email: 'demo+glauber@rajamine.local', role: 'colaborador', cargo: 'Técnico / Consultor de campo', ativo: true, origemDados: 'referencia_empresa' },
  { id: 'u_kelber', nome: 'Kelber', email: 'demo+kelber@rajamine.local', role: 'colaborador', cargo: 'Técnico de campo', ativo: true, origemDados: 'referencia_empresa' },
  { id: 'u_alexandre', nome: 'Alexandre', email: 'demo+alexandre@rajamine.local', role: 'colaborador', cargo: 'Técnico de campo', ativo: true, origemDados: 'referencia_empresa' },
];

/** Planilha real: Instalações/Manutenções/Retiradas — Equipamentos (MFS, 22/09/2026). */
export const realOperations: OperationRow[] = [
  { id: 'op_01', data: '2026-09-22', empresa: 'MFS', tecnico: 'Kelber', equipamento: 'MOBI', atividade: 'Manutenção rotograma', observacao: 'ID Galileo: 867782071392430', galileo: '867782071392430', situacaoTelemetria: 'nao_informada', fotos: 'enviadas', origemDados: 'referencia_empresa' },
  { id: 'op_02', data: '2026-09-22', empresa: 'MFS', tecnico: 'Kelber', equipamento: 'TYE-9A00', telemetria: '9020', pulsus: '2747', cameraFadiga: '864993060369890', atividade: 'Manutenção telemetria', observacao: '', situacaoTelemetria: 'nao_informada', fotos: 'enviadas', origemDados: 'referencia_empresa' },
  { id: 'op_03', data: '2026-09-22', empresa: 'MFS', tecnico: 'Kelber', equipamento: 'RUN-6E69', telemetria: '1439', pulsus: '2309', cameraFadiga: '869247060146492', atividade: 'Desmobilização câmeras externas', observacao: '', situacaoTelemetria: 'nao_informada', fotos: 'enviadas', origemDados: 'referencia_empresa' },
  { id: 'op_04', data: '2026-09-22', empresa: 'MFS', tecnico: 'Kelber', equipamento: 'HILLUX', cameraFadiga: '864993061411048', atividade: 'Instalação câmera de fadiga e galileo com rotograma', observacao: 'ID Galileo: 867782071389329', galileo: '867782071389329', situacaoTelemetria: 'nao_informada', fotos: 'enviadas', origemDados: 'referencia_empresa' },
  { id: 'op_05', data: '2026-09-22', empresa: 'MFS', tecnico: 'Alexandre', equipamento: 'RNT-9C00', pulsus: '2291', cameraFadiga: '869247060280848', atividade: 'Manutenção câmeras externas', observacao: '', situacaoTelemetria: 'nao_informada', fotos: 'enviadas', origemDados: 'referencia_empresa' },
  { id: 'op_06', data: '2026-09-22', empresa: 'MFS', tecnico: 'Kelber', equipamento: 'RMY-9D00', telemetria: '2183', pulsus: '2304', cameraFadiga: '869247060284869', atividade: 'Manutenção telemetria', observacao: 'Telemetria antiga: 0995', situacaoTelemetria: 'nao_informada', fotos: 'enviadas', origemDados: 'referencia_empresa' },
  { id: 'op_07', data: '2026-09-22', empresa: 'MFS', tecnico: 'Alexandre', equipamento: 'TKX-9F00', telemetria: '2005', pulsus: '2292', atividade: 'Manutenção ponto rede can', observacao: '', situacaoTelemetria: 'nao_informada', fotos: 'enviadas', origemDados: 'referencia_empresa' },
  { id: 'op_08', data: '2026-09-22', empresa: 'MFS', tecnico: 'Kelber', equipamento: 'TEM-9G00', telemetria: '1545', pulsus: '2881', cameraFadiga: '864993060552605', atividade: 'Manutenção câmera de fadiga', observacao: 'ID Câmera: 864993060552605', situacaoTelemetria: 'nao_informada', fotos: 'enviadas', origemDados: 'referencia_empresa' },
  { id: 'op_09', data: '2026-09-22', empresa: 'MFS', tecnico: 'Kelber', equipamento: 'RMK-6A78', telemetria: '7113', pulsus: '2890', cameraFadiga: '869247060286900', atividade: 'Manutenção telemetria', observacao: '', situacaoTelemetria: 'nao_informada', fotos: 'enviadas', origemDados: 'referencia_empresa' },
  { id: 'op_10', data: '2026-09-22', empresa: 'MFS', tecnico: 'Kelber', equipamento: 'RNT-9B00', telemetria: '7233', pulsus: '3061', cameraFadiga: '869247060145619', atividade: 'Manutenção tablet', observacao: 'Tablet antigo: 2296', situacaoTelemetria: 'nao_informada', fotos: 'enviadas', origemDados: 'referencia_empresa' },
  { id: 'op_11', data: '2026-09-22', empresa: 'MFS', tecnico: 'Alexandre', equipamento: 'RNB-8I52', pulsus: '2301', atividade: 'Conferência tablet', observacao: '', situacaoTelemetria: 'nao_informada', fotos: 'enviadas', origemDados: 'referencia_empresa' },
  { id: 'op_12', data: '2026-09-22', empresa: 'MFS', tecnico: 'Kelber', equipamento: 'TEK-9A00', telemetria: '0035', pulsus: '2743', cameraFadiga: '864993060730372', atividade: 'Manutenção telemetria', observacao: 'Telemetria antiga: 1438', situacaoTelemetria: 'nao_informada', fotos: 'enviadas', origemDados: 'referencia_empresa' },
  { id: 'op_13', data: '2026-09-22', empresa: 'MFS', tecnico: 'Kelber', equipamento: 'AFC-9G00', telemetria: '5011', pulsus: '2299', cameraFadiga: '869247060285167', atividade: 'Manutenção câmera de fadiga', observacao: 'ID Câmera: 86924706054233', situacaoTelemetria: 'nao_informada', fotos: 'enviadas', origemDados: 'referencia_empresa' },
  { id: 'op_14', data: '2026-09-22', empresa: 'MFS', tecnico: 'Kelber', equipamento: 'UAB-9J00', telemetria: '2824', pulsus: '2647', cameraFadiga: '869247060139265', atividade: 'Manutenção câmera de fadiga', observacao: 'ID Câmera: 869247060141113', situacaoTelemetria: 'nao_informada', fotos: 'enviadas', origemDados: 'referencia_empresa' },
  { id: 'op_15', data: '2026-09-22', empresa: 'MFS', tecnico: 'Alexandre', equipamento: 'TEK-9G00', pulsus: '2745', cameraFadiga: '864993060428969', atividade: 'Manutenção câmera de fadiga', observacao: '', situacaoTelemetria: 'nao_informada', fotos: 'enviadas', origemDados: 'referencia_empresa' },
];

function opToActivity(op: OperationRow, clienteId: string, colaboradorId: string): ActivityEntry {
  const lower = op.atividade.toLowerCase();
  const tipo: ActivityEntry['tipo'] = lower.startsWith('instalação') ? 'instalacao'
    : lower.startsWith('desmobilização') ? 'desmobilizacao'
    : lower.startsWith('conferência') ? 'conferencia'
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

/** Equipamentos/hosts reais extraídos das referências (com IDs de dispositivos). */
export const realEquipment: Equipment[] = [
  { id: 'eq_cp101', codigo: 'CP-101', tipo: 'Equipamento de cliente', serial: '—', status: 'instalado', truckId: null, clienteId: 'c_cedro', telemetria: '0987', pulsus: '2758', cameraFadiga: '864993060408250', origemDados: 'referencia_empresa' },
  { id: 'eq_cp5015', codigo: 'CP-5015', tipo: 'Equipamento de cliente', serial: '—', status: 'desmobilizado', truckId: null, clienteId: 'c_cedro', telemetria: '0987', pulsus: '2758', cameraFadiga: '864993060408250', origemDados: 'referencia_empresa' },
  { id: 'eq_esc49', codigo: 'ESC-49', tipo: 'Equipamento de cliente', serial: '—', status: 'desmobilizado', truckId: null, clienteId: 'c_cedro', cameraFadiga: '869247060284111', origemDados: 'referencia_empresa' },
  { id: 'eq_ruu1g56', codigo: 'RUU-1G56', tipo: 'Equipamento de cliente', serial: '—', status: 'instalado', truckId: null, clienteId: 'c_amda', origemDados: 'referencia_empresa' },
  ...realOperations.map((op): Equipment => ({
    id: `eq_${op.equipamento.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
    codigo: op.equipamento, tipo: 'Equipamento de cliente', serial: '—',
    status: 'instalado', truckId: null, clienteId: 'c_mfs',
    telemetria: op.telemetria, pulsus: op.pulsus, cameraFadiga: op.cameraFadiga, galileo: op.galileo,
    origemDados: 'referencia_empresa',
  })),
];

const cedroActivities: ActivityEntry[] = [
  { id: 'act_cedro_1', data: '2026-09-22', clienteId: 'c_cedro', colaboradorId: 'u_glauber', equipamentoCodigo: 'CP-101', tipo: 'instalacao', componentes: ['Telemetria', 'Câmera de fadiga', 'Tablet'], telemetria: '0987', pulsus: '2758', cameraFadiga: '864993060408250', descricao: 'Instalação: Telemetria, câmera de fadiga e tablet', fotos: 'nao_informado' },
  { id: 'act_cedro_2', data: '2026-09-22', clienteId: 'c_cedro', colaboradorId: 'u_glauber', equipamentoCodigo: 'CP-5015', tipo: 'desmobilizacao', componentes: ['Câmera de fadiga', 'Telemetria', 'Tablet'], telemetria: '0987', pulsus: '2758', cameraFadiga: '864993060408250', descricao: 'Desmobilização: Câmera de fadiga, telemetria e tablet', fotos: 'nao_informado' },
  { id: 'act_cedro_3', data: '2026-09-22', clienteId: 'c_cedro', colaboradorId: 'u_glauber', equipamentoCodigo: 'ESC-49', tipo: 'desmobilizacao', componentes: ['Câmera de fadiga'], cameraFadiga: '869247060284111', descricao: 'Desmobilização: Câmera de fadiga JC450', fotos: 'nao_informado' },
];

const mfsActivities: ActivityEntry[] = realOperations.map((op) => opToActivity(op, 'c_mfs', op.tecnico === 'Alexandre' ? 'u_alexandre' : 'u_kelber'));

const weeklyActivities: ActivityEntry[] = [
  {
    id: 'act_week_amda', data: '2026-09-17', clienteId: 'c_amda', colaboradorId: 'u_glauber',
    equipamentoCodigo: 'RUU-1G56', tipo: 'manutencao', componentes: ['Câmera de fadiga'],
    descricao: 'Durante a visita técnica foi realizada a verificação da câmera de fadiga instalada no equipamento, a qual apresentava divergências na geração de alguns alertas. Após a realização das configurações e ajustes necessários, o equipamento foi novamente testado, constatando-se que a câmera passou a gerar os alertas de forma correta e adequada.',
    fotos: 'nao_informado',
  },
  {
    id: 'act_week_fdx', data: '2026-09-18', clienteId: 'c_fdx', colaboradorId: 'u_glauber',
    equipamentoCodigo: '—', tipo: 'coleta_telemetria',
    descricao: 'O técnico Glauber compareceu ao local exclusivamente para realizar a coleta das telemetrias de números 1323, 7109, 7117, 0893, 3228 e 3177. Permanece pendente a devolução de 2 telemetrias, correspondentes aos números 0692 e 6004.',
    fotos: 'nao_informado',
  },
];

const cedroOriginal =
  'Foi realizado instalação do equipamento CP-101, telemetria numero 0987, tablette pulsus 2758 e camera de fadiga 864993060408250. ' +
  'Foi realizado a desmobilização do equipamento CP-5015, telemetria numero 0987, tablette pulsus 2758 e camera de fadiga 864993060408250. ' +
  'Foi desmobilizado camera de fadiga JC450 do equipamento ESC-49, camera imei: 869247060284111.';

const cedroAvaliacao =
  'As atividades executadas durante a visita foram concluídas com sucesso, atendendo integralmente aos objetivos estabelecidos no planejamento. ' +
  'Todos os processos foram realizados de acordo com as especificações, garantindo o bom funcionamento dos equipamentos. ' +
  'Permanecemos à disposição para esclarecimentos ou para atender a quaisquer necessidades adicionais.';

const mfsOriginal = realOperations
  .map((op) => `${op.equipamento}: ${op.atividade}${op.telemetria ? `, telemetria ${op.telemetria}` : ''}${op.pulsus ? `, Pulsus ${op.pulsus}` : ''}${op.cameraFadiga ? `, câmera ${op.cameraFadiga}` : ''}${op.observacao ? ` (${op.observacao})` : ''}.`)
  .join('\n');

const weeklyOriginal =
  'O presente relatório tem como finalidade documentar as atividades de instalações, manutenções, reuniões e treinamentos realizados pela Equipe RajMine, ' +
  'no período de 21/09 à 25/09/2026, de forma presencial em empresas clientes, com o intuito de organizar e aprimorar nossos processos.';

function baseRefReport(partial: Partial<Report> & Pick<Report, 'id' | 'codigo' | 'colaboradorId' | 'clienteId' | 'dataViagem' | 'descricaoOriginal' | 'atividades'>): Report {
  const criadoEm = `${partial.dataViagem}T18:00:00.000Z`;
  return {
    token: `ref-${partial.id}`,
    caminhaoId: '',
    origem: '',
    destino: '',
    descricaoAtual: partial.descricaoOriginal,
    versoesTexto: [{ id: `tv_${partial.id}`, texto: partial.descricaoOriginal, tipo: 'original', autor: 'Referência da empresa', criadaEm: criadoEm, nota: 'Transcrição do material fornecido' }],
    status: 'em_revisao',
    criadoEm,
    prazoEm: new Date(new Date(criadoEm).getTime() + 48 * 3600000).toISOString(),
    enviadoRevisaoEm: criadoEm,
    fotos: [], deteccoes: [], notasRevisao: [], documentos: [],
    historico: [{ id: `ev_${partial.id}`, em: criadoEm, ator: 'Sistema', acao: 'Referência importada', detalhe: 'Transcrição estruturada do material real fornecido pela Rajamine. Aprovação humana ainda não registrada.' }],
    equipamentosIds: [],
    enviadoCliente: false,
    origemDados: 'referencia_empresa',
    fonteReferencia: 'Material fornecido pela Rajamine (set/2026)',
    ...partial,
  } as Report;
}

export const realReports: Report[] = [
  baseRefReport({
    id: 'r_201', codigo: 'REL-2026-0201', colaboradorId: 'u_glauber', clienteId: 'c_cedro',
    dataViagem: '2026-09-22', tipo: 'visita_tecnica', setor: 'Manutenção', cidadeBairro: 'Mariana - MG',
    periodoInicio: '2026-09-22', periodoFim: '2026-09-22',
    objetivo: 'Instalação de 1 telemetria, 1 tablet e 1 câmera de fadiga, desmobilização de 2 câmeras de fadiga, 1 telemetria e 1 tablet',
    descricaoOriginal: cedroOriginal, atividades: cedroActivities,
    avaliacaoTecnica: cedroAvaliacao, sensacaoCliente: '', pontosPositivos: '', melhorias: '',
    equipamentosIds: ['eq_cp101', 'eq_cp5015', 'eq_esc49'],
  }),
  baseRefReport({
    id: 'r_203', codigo: 'REL-2026-0203', colaboradorId: 'u_kelber', clienteId: 'c_mfs',
    dataViagem: '2026-09-22', tipo: 'atividade_externa', setor: 'Manutenção',
    periodoInicio: '2026-09-22', periodoFim: '2026-09-22',
    objetivo: 'Instalações, manutenções e retiradas de equipamentos — MFS',
    descricaoOriginal: mfsOriginal, atividades: mfsActivities,
    fonteReferencia: 'Planilha Instalações/Manutenções/Retiradas — Equipamentos (MFS, 22/09/2026)',
  }),
  baseRefReport({
    id: 'r_204', codigo: 'REL-2026-0204', colaboradorId: 'u_glauber', clienteId: '',
    dataViagem: '2026-09-25', tipo: 'semanal_viagens',
    periodoInicio: '2026-09-21', periodoFim: '2026-09-25',
    objetivo: 'Documentar atividades de instalações, manutenções, reuniões e treinamentos realizados pela Equipe Rajamine no período',
    descricaoOriginal: weeklyOriginal, atividades: weeklyActivities,
    fonteReferencia: 'Relatório Semanal — Viagens (21/09 a 25/09/2026)',
  }),
];

export const weeklyReference = {
  reportId: 'r_204',
  periodoInicio: '2026-09-21',
  periodoFim: '2026-09-25',
  emissao: '2026-09-25',
};
