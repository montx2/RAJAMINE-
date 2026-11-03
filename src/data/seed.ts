/*
  BASE DEMONSTRATIVA MISTA:
  · Registros sintéticos (datas relativas) para exercitar o fluxo completo.
  · Referências reais fornecidas pela Rajamine (set/2026), marcadas com
    origemDados: 'referencia_empresa' — ver src/data/referencias.ts.
  Nenhum dado real é tratado como aprovação/envio já realizado.
*/
import type {
  User, Client, Truck, Equipment, Report, Notification, Photo, Detection, AuditEvent, TextVersion,
} from './types';
import { realClients, realUsers, realEquipment, realReports } from './referencias';

const now = Date.now();
const H = 3600000;
const D = 24 * H;

function iso(offsetMs: number): string {
  return new Date(now + offsetMs).toISOString();
}
function dayStr(offsetDays: number): string {
  const d = new Date(now + offsetDays * D);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const seedUsers: User[] = [
  { id: 'u_helena', nome: 'Helena Duarte', email: 'helena.duarte@rajamine.demo', role: 'admin', cargo: 'Coordenadora de Operações', ativo: true },
  { id: 'u_marta', nome: 'Marta Fonseca', email: 'marta.fonseca@rajamine.demo', role: 'revisora', cargo: 'Analista de Relatórios', ativo: true },
  { id: 'u_carlos', nome: 'Carlos Menezes', email: 'carlos.menezes@rajamine.demo', role: 'colaborador', cargo: 'Técnico de Instalação', ativo: true },
  { id: 'u_joao', nome: 'João Pedro Rocha', email: 'joao.rocha@rajamine.demo', role: 'colaborador', cargo: 'Técnico de Instalação', ativo: true },
  { id: 'u_andre', nome: 'André Luiz Santos', email: 'andre.santos@rajamine.demo', role: 'colaborador', cargo: 'Técnico Sênior', ativo: true },
  { id: 'u_felipe', nome: 'Felipe Araújo', email: 'felipe.araujo@rajamine.demo', role: 'colaborador', cargo: 'Técnico de Eletrônica', ativo: true },
  ...realUsers,
];

export const seedClients: Client[] = [
  { id: 'c_serra', nome: 'Mineração Serra Azul S.A.', cnpj: '12.345.678/0001-90', cidade: 'Itabira', uf: 'MG', contato: 'Rogério Lima', email: 'operacoes@serraazul.demo' },
  { id: 'c_aco', nome: 'Vale do Aço Mineração Ltda.', cnpj: '23.456.789/0001-01', cidade: 'Ipatinga', uf: 'MG', contato: 'Paula Ribeiro', email: 'frota@valedoaco.demo' },
  { id: 'c_rita', nome: 'Pedreira Santa Rita Ltda.', cnpj: '34.567.890/0001-12', cidade: 'Sete Lagoas', uf: 'MG', contato: 'Marcos Vinícius', email: 'manutencao@santarita.demo' },
  { id: 'c_horizonte', nome: 'Mineração Horizonte S.A.', cnpj: '45.678.901/0001-23', cidade: 'Nova Lima', uf: 'MG', contato: 'Sônia Prado', email: 'tecnica@horizonte.demo' },
  ...realClients,
];

export const seedTrucks: Truck[] = [
  { id: 't101', placa: 'RTA-4G52', frota: 'C-101', marca: 'Volvo', modelo: 'FMX 6x4', ano: 2022, clienteId: 'c_serra' },
  { id: 't102', placa: 'QNB-7H18', frota: 'C-102', marca: 'Scania', modelo: 'R450 A6x4', ano: 2023, clienteId: 'c_serra' },
  { id: 't103', placa: 'PLX-2D94', frota: 'C-103', marca: 'Mercedes-Benz', modelo: 'Actros 2651', ano: 2021, clienteId: 'c_aco' },
  { id: 't104', placa: 'SVU-8C31', frota: 'C-104', marca: 'Volvo', modelo: 'FH 540 6x4', ano: 2023, clienteId: 'c_aco' },
  { id: 't105', placa: 'RKE-5F77', frota: 'C-105', marca: 'DAF', modelo: 'XF 480 FT', ano: 2022, clienteId: 'c_rita' },
  { id: 't106', placa: 'TLM-9A05', frota: 'C-106', marca: 'MAN', modelo: 'TGX 29.480', ano: 2020, clienteId: 'c_horizonte' },
];

export const seedEquipment: Equipment[] = [
  { id: 'e2041', codigo: 'EQ-2041', tipo: 'Telemetria veicular', serial: '88231', status: 'instalado', truckId: 't101', instaladoEm: iso(-9 * D) },
  { id: 'e1087', codigo: 'EQ-1087', tipo: 'Rastreador GPS', serial: '45102', status: 'instalado', truckId: 't103', instaladoEm: iso(-5 * D) },
  { id: 'e3315', codigo: 'EQ-3315', tipo: 'Sensor de fadiga', serial: '71590', status: 'instalado', truckId: 't102', instaladoEm: iso(-30 * D) },
  { id: 'e4520', codigo: 'EQ-4520', tipo: 'Câmera embarcada', serial: '60415', status: 'instalado', truckId: 't104', instaladoEm: iso(-45 * D) },
  { id: 'e2988', codigo: 'EQ-2988', tipo: 'Sensor de carga', serial: '33078', status: 'estoque', truckId: null },
  { id: 'e5102', codigo: 'EQ-5102', tipo: 'Telemetria veicular', serial: '90233', status: 'instalado', truckId: 't105', instaladoEm: iso(-21 * D) },
  { id: 'e6034', codigo: 'EQ-6034', tipo: 'Rastreador GPS', serial: '12874', status: 'manutencao', truckId: null },
  { id: 'e7761', codigo: 'EQ-7761', tipo: 'Câmera embarcada', serial: '55681', status: 'estoque', truckId: null },
  { id: 'e8123', codigo: 'EQ-8123', tipo: 'Sensor de fadiga', serial: '40921', status: 'instalado', truckId: 't106', instaladoEm: iso(-16 * D) },
  ...realEquipment,
];

let evSeq = 0;
function ev(offsetMs: number, ator: string, acao: string, detalhe?: string): AuditEvent {
  return { id: `ev_${++evSeq}`, em: iso(offsetMs), ator, acao, detalhe };
}
function tv(offsetMs: number, texto: string, tipo: TextVersion['tipo'], autor: string, nota?: string): TextVersion {
  return { id: `tv_${++evSeq}`, texto, tipo, autor, criadaEm: iso(offsetMs), nota };
}

const fotoEq2041 = (id: string, offset: number): Photo => ({
  id, nome: 'foto-eq2041.jpg', origem: 'demo', src: '/demo/foto-eq2041.jpg', mime: 'image/jpeg',
  legenda: 'Telemetria instalada no painel — etiqueta EQ-2041', categoria: 'equipamento', criadaEm: iso(offset),
});
const fotoEq1087 = (id: string, offset: number): Photo => ({
  id, nome: 'foto-eq1087.jpg', origem: 'demo', src: '/demo/foto-eq1087.jpg', mime: 'image/jpeg',
  legenda: 'Rastreador fixado no chassi — etiqueta EQ-1087', categoria: 'equipamento', criadaEm: iso(offset),
});
const fotoEq3315 = (id: string, offset: number): Photo => ({
  id, nome: 'foto-eq3315.jpg', origem: 'demo', src: '/demo/foto-eq3315.jpg', mime: 'image/jpeg',
  legenda: 'Sensor de fadiga junto ao retrovisor — etiqueta com sujeira', categoria: 'equipamento', criadaEm: iso(offset),
});
const fotoAtividade = (id: string, offset: number): Photo => ({
  id, nome: 'foto-atividade.jpg', origem: 'demo', src: '/demo/foto-atividade.jpg', mime: 'image/jpeg',
  legenda: 'Registro da instalação em campo', categoria: 'atividade', criadaEm: iso(offset),
});

interface MkArgs {
  n: number;
  colaboradorId: string;
  clienteId: string;
  caminhaoId: string;
  tripDaysAgo: number;
  status: Report['status'];
  criadoAgoMs: number;
  origem: string;
  destino: string;
  kmInicio?: number;
  kmFim?: number;
  original: string;
  atual?: string;
  fotos?: Photo[];
  deteccoes?: Detection[];
  historico?: AuditEvent[];
  versoes?: TextVersion[];
  notas?: Report['notasRevisao'];
  aprovadoAgoMs?: number;
  docs?: Report['documentos'];
  equipamentosIds?: string[];
  enviadoCliente?: boolean;
}

function mk(a: MkArgs): Report {
  const codigo = `REL-2026-${String(a.n).padStart(4, '0')}`;
  const criadoEm = iso(-a.criadoAgoMs);
  return {
    id: `r_${a.n}`,
    codigo,
    token: `demo-token-${a.n}-${Math.random().toString(36).slice(2, 10)}`,
    colaboradorId: a.colaboradorId,
    clienteId: a.clienteId,
    caminhaoId: a.caminhaoId,
    dataViagem: dayStr(-a.tripDaysAgo),
    origem: a.origem,
    destino: a.destino,
    kmInicio: a.kmInicio,
    kmFim: a.kmFim,
    descricaoOriginal: a.original,
    descricaoAtual: a.atual ?? a.original,
    versoesTexto: a.versoes ?? (a.original ? [tv(-a.criadoAgoMs + H, a.original, 'original', 'Colaborador')] : []),
    status: a.status,
    criadoEm,
    prazoEm: iso(-a.criadoAgoMs + 48 * H),
    enviadoRevisaoEm: ['em_revisao', 'correcao', 'aprovado', 'arquivado'].includes(a.status) ? iso(-a.criadoAgoMs + 20 * H) : undefined,
    aprovadoEm: a.aprovadoAgoMs != null ? iso(-a.aprovadoAgoMs) : undefined,
    aprovadoPor: a.aprovadoAgoMs != null ? 'Marta Fonseca' : undefined,
    fotos: a.fotos ?? [],
    deteccoes: a.deteccoes ?? [],
    notasRevisao: a.notas ?? [],
    historico: a.historico ?? [ev(-a.criadoAgoMs, 'Helena Duarte', 'Relatório criado', 'Link individual enviado ao colaborador (simulação)')],
    documentos: a.docs ?? [],
    equipamentosIds: a.equipamentosIds ?? [],
    enviadoCliente: a.enviadoCliente ?? false,
  };
}

const txt145 = 'Cheguei na mina Serra Azul as 8h e me apresentei na portaria. Depois eu instalei o sensor de fadiga no caminhão C-102, fixei o suporte perto do retrovisor e conectei o chicote. Testei o funcionamento e o equipamento respondeu ok. Tirei foto da etiqueta mas tava suja, o numero é EQ-3315. Finalizei as 11h30 e entreguei o checklist pro motorista.';
const txt144 = 'Eu fui até a planta do Vale do Aço pra verificar a câmera embarcada do C-104. Fiz a limpeza da lente, ajustei o angulo e validei a gravação. O equipamento EQ-4520 ficou funcionando normalmente. Não precisei trocar nada. Saí de lá as 15h.';
const txt143 = 'Realizei a instalação da telemetria EQ-2041 no caminhão C-101 em Itabira. Configurei o modem, validei a comunicação com a central e registrei o numero de serie 88231. Tudo certo com o sinal GPS.';
const txt143ia = 'O técnico realizou a instalação da telemetria EQ-2041 no caminhão C-101 em Itabira. Configurou o modem, validou a comunicação com a central e registrou o número de série 88231. Tudo em conformidade com o sinal GPS.';
const txt142 = 'Instalei o sensor no C-106. Deu tudo certo.';
const txt141 = 'Cheguei em Ipatinga as 7h, instalei o rastreador EQ-1087 no chassi do C-103 e fiz o teste de comunicação. O sinal ficou bom, validei a posição no mapa. Entreguei o termo pro supervisor as 10h.';
const txt141ia = 'O técnico chegou em Ipatinga às 7h, instalou o rastreador EQ-1087 no chassi do C-103 e fez o teste de comunicação. O sinal ficou bom, validou a posição no mapa. Entregou o termo para o supervisor às 10h.';
const txt140 = 'Realizei a manutenção preventiva da telemetria EQ-5102 no C-105. Verifiquei o chicote, atualizei o firmware e testei a comunicação. O equipamento ficou operando normalmente.';
const txtGeneric = 'Realizei a instalação e os testes do equipamento no caminhão indicado, conforme a ordem de serviço. A comunicação com a central foi validada e o checklist foi entregue ao responsável da frota.';
const txtGenericIA = 'O técnico realizou a instalação e os testes do equipamento no caminhão indicado, conforme a ordem de serviço. A comunicação com a central foi validada e o checklist foi entregue ao responsável da frota.';

function docsPadrao(geradoAgoMs: number, enviadoAgoMs?: number): Report['documentos'] {
  return [
    { id: `doc_${++evSeq}`, tipo: 'cliente', versao: 1, geradoEm: iso(-geradoAgoMs), geradoPor: 'Marta Fonseca', enviadoEm: enviadoAgoMs != null ? iso(-enviadoAgoMs) : undefined, enviadoPor: enviadoAgoMs != null ? 'Helena Duarte' : undefined },
    { id: `doc_${++evSeq}`, tipo: 'interno', versao: 1, geradoEm: iso(-geradoAgoMs), geradoPor: 'Marta Fonseca' },
  ];
}

export const seedReports: Report[] = [
  mk({
    n: 148, colaboradorId: 'u_carlos', clienteId: 'c_serra', caminhaoId: 't101', tripDaysAgo: 0, status: 'pendente',
    criadoAgoMs: 30 * H, origem: 'Base Rajamine — Belo Horizonte/MG', destino: 'Mina Serra Azul — Itabira/MG',
    original: '',
    historico: [ev(-30 * H, 'Helena Duarte', 'Relatório criado', 'Link individual enviado a Carlos Menezes (simulação)'), ev(-6 * H, 'Sistema', 'Lembrete de prazo', 'Notificação automática de prazo próximo (simulação)')],
  }),
  mk({
    n: 147, colaboradorId: 'u_joao', clienteId: 'c_aco', caminhaoId: 't103', tripDaysAgo: 2, status: 'pendente',
    criadoAgoMs: 52 * H, origem: 'Base Rajamine — Belo Horizonte/MG', destino: 'Planta Vale do Aço — Ipatinga/MG',
    original: '',
    historico: [ev(-52 * H, 'Helena Duarte', 'Relatório criado', 'Link individual enviado a João Pedro Rocha (simulação)'), ev(-4 * H, 'Sistema', 'Prazo expirado', 'Relatório marcado como atrasado')],
  }),
  mk({
    n: 146, colaboradorId: 'u_felipe', clienteId: 'c_rita', caminhaoId: 't105', tripDaysAgo: 0, status: 'pendente',
    criadoAgoMs: 6 * H, origem: 'Base Rajamine — Belo Horizonte/MG', destino: 'Pedreira Santa Rita — Sete Lagoas/MG',
    original: '',
  }),
  mk({
    n: 145, colaboradorId: 'u_carlos', clienteId: 'c_serra', caminhaoId: 't102', tripDaysAgo: 1, status: 'em_revisao',
    criadoAgoMs: 26 * H, origem: 'Base Rajamine — Belo Horizonte/MG', destino: 'Mina Serra Azul — Itabira/MG',
    kmInicio: 84310, kmFim: 84682, original: txt145,
    fotos: [fotoEq3315('ph_145a', -7 * H), fotoAtividade('ph_145b', -7 * H)],
    deteccoes: [{
      id: 'det_145', photoId: 'ph_145a', motor: 'demo', status: 'aguardando',
      candidatos: [
        { valor: 'EQ-3315', normalizado: 'EQ-3315', confianca: 61, tipo: 'codigo' },
        { valor: 'EQ-331S', normalizado: 'EQ-3315', confianca: 42, tipo: 'codigo' },
      ],
      textoBruto: 'EQ-3315 (leituras parciais; etiqueta com sujeira e reflexo)',
      confianca: 61, criadoEm: iso(-6 * H),
    }],
    historico: [
      ev(-26 * H, 'Helena Duarte', 'Relatório criado', 'Link individual enviado a Carlos Menezes (simulação)'),
      ev(-8 * H, 'Carlos Menezes', 'Preenchimento iniciado'),
      ev(-7 * H, 'Carlos Menezes', 'Fotos adicionadas', '2 fotografias anexadas'),
      ev(-6 * H, 'Sistema', 'OCR demonstrativo executado', 'Resultado simulado — aguardando conferência humana'),
      ev(-5 * H, 'Carlos Menezes', 'Enviado para revisão'),
    ],
  }),
  mk({
    n: 144, colaboradorId: 'u_andre', clienteId: 'c_aco', caminhaoId: 't104', tripDaysAgo: 2, status: 'em_revisao',
    criadoAgoMs: 2 * D + 4 * H, origem: 'Base Rajamine — Belo Horizonte/MG', destino: 'Planta Vale do Aço — Ipatinga/MG',
    kmInicio: 51220, kmFim: 51590, original: txt144,
    fotos: [fotoAtividade('ph_144a', -2 * D)],
    historico: [
      ev(-2 * D - 4 * H, 'Helena Duarte', 'Relatório criado', 'Link individual enviado a André Luiz Santos (simulação)'),
      ev(-2 * D, 'André Luiz Santos', 'Enviado para revisão'),
    ],
  }),
  mk({
    n: 143, colaboradorId: 'u_joao', clienteId: 'c_serra', caminhaoId: 't101', tripDaysAgo: 2, status: 'em_revisao',
    criadoAgoMs: 2 * D + 8 * H, origem: 'Base Rajamine — Belo Horizonte/MG', destino: 'Mina Serra Azul — Itabira/MG',
    kmInicio: 62100, kmFim: 62471, original: txt143, atual: txt143ia,
    versoes: [tv(-2 * D - 6 * H, txt143, 'original', 'João Pedro Rocha'), tv(-2 * D - 5 * H, txt143ia, 'ia', 'João Pedro Rocha', 'Sugestão do motor de padronização aceita pelo colaborador')],
    fotos: [fotoEq2041('ph_143a', -2 * D - 2 * H)],
    deteccoes: [{
      id: 'det_143', photoId: 'ph_143a', motor: 'demo', status: 'confirmado',
      candidatos: [
        { valor: 'EQ-2041', normalizado: 'EQ-2041', confianca: 94, tipo: 'codigo' },
        { valor: 'SN 88231', normalizado: '88231', confianca: 91, tipo: 'serial' },
      ],
      textoBruto: 'EQ-2041\nSN 88231',
      confianca: 94, codigoConfirmado: 'EQ-2041', equipmentId: 'e2041',
      confirmadoPor: 'João Pedro Rocha', confirmadoEm: iso(-2 * D - H), criadoEm: iso(-2 * D - 2 * H),
    }],
    equipamentosIds: ['e2041'],
    historico: [
      ev(-2 * D - 8 * H, 'Helena Duarte', 'Relatório criado', 'Link individual enviado a João Pedro Rocha (simulação)'),
      ev(-2 * D - 5 * H, 'João Pedro Rocha', 'Padronização de texto aceita', 'Sugestão do motor local aplicada; original preservado'),
      ev(-2 * D - H, 'João Pedro Rocha', 'Equipamento confirmado', 'EQ-2041 associado ao caminhão C-101'),
      ev(-2 * D, 'João Pedro Rocha', 'Enviado para revisão'),
    ],
  }),
  mk({
    n: 142, colaboradorId: 'u_felipe', clienteId: 'c_horizonte', caminhaoId: 't106', tripDaysAgo: 3, status: 'correcao',
    criadoAgoMs: 3 * D + 6 * H, origem: 'Base Rajamine — Belo Horizonte/MG', destino: 'Mina Horizonte — Nova Lima/MG',
    original: txt142,
    notas: [{ id: 'nt_142', autor: 'Marta Fonseca', texto: 'Descrição muito resumida. Informar o código do equipamento instalado, o horário de chegada/saída e detalhar os testes realizados. Anexar foto da etiqueta do equipamento.', criadaEm: iso(-2 * D), tipo: 'correcao' }],
    historico: [
      ev(-3 * D - 6 * H, 'Helena Duarte', 'Relatório criado', 'Link individual enviado a Felipe Araújo (simulação)'),
      ev(-3 * D, 'Felipe Araújo', 'Enviado para revisão'),
      ev(-2 * D, 'Marta Fonseca', 'Correção solicitada', 'Dados incompletos: equipamento, horários e testes'),
    ],
  }),
  mk({
    n: 141, colaboradorId: 'u_andre', clienteId: 'c_aco', caminhaoId: 't103', tripDaysAgo: 5, status: 'aprovado',
    criadoAgoMs: 5 * D + 4 * H, origem: 'Base Rajamine — Belo Horizonte/MG', destino: 'Planta Vale do Aço — Ipatinga/MG',
    kmInicio: 112480, kmFim: 112855, original: txt141, atual: txt141ia,
    versoes: [tv(-5 * D - 2 * H, txt141, 'original', 'André Luiz Santos'), tv(-5 * D - H, txt141ia, 'ia', 'André Luiz Santos', 'Sugestão aceita; original preservado')],
    fotos: [fotoEq1087('ph_141a', -5 * D), fotoAtividade('ph_141b', -5 * D)],
    deteccoes: [{
      id: 'det_141', photoId: 'ph_141a', motor: 'demo', status: 'confirmado',
      candidatos: [{ valor: 'EQ-1087', normalizado: 'EQ-1087', confianca: 89, tipo: 'codigo' }],
      textoBruto: 'EQ-1087', confianca: 89, codigoConfirmado: 'EQ-1087', equipmentId: 'e1087',
      confirmadoPor: 'André Luiz Santos', confirmadoEm: iso(-5 * D + H), criadoEm: iso(-5 * D),
    }],
    equipamentosIds: ['e1087'],
    aprovadoAgoMs: 2 * D,
    notas: [{ id: 'nt_141', autor: 'Marta Fonseca', texto: 'Informações completas, fotos nítidas e equipamento confirmado. Aprovado para geração dos documentos.', criadaEm: iso(-2 * D), tipo: 'aprovacao' }],
    historico: [
      ev(-5 * D - 4 * H, 'Helena Duarte', 'Relatório criado', 'Link individual enviado a André Luiz Santos (simulação)'),
      ev(-5 * D + H, 'André Luiz Santos', 'Equipamento confirmado', 'EQ-1087 associado ao caminhão C-103'),
      ev(-5 * D + 2 * H, 'André Luiz Santos', 'Enviado para revisão'),
      ev(-2 * D, 'Marta Fonseca', 'Relatório aprovado', 'Revisão humana concluída'),
    ],
  }),
  mk({
    n: 140, colaboradorId: 'u_carlos', clienteId: 'c_rita', caminhaoId: 't105', tripDaysAgo: 6, status: 'aprovado',
    criadoAgoMs: 6 * D + 5 * H, origem: 'Base Rajamine — Belo Horizonte/MG', destino: 'Pedreira Santa Rita — Sete Lagoas/MG',
    kmInicio: 78040, kmFim: 78215, original: txt140, atual: txt140,
    equipamentosIds: ['e5102'],
    aprovadoAgoMs: 3 * D,
    historico: [
      ev(-6 * D - 5 * H, 'Helena Duarte', 'Relatório criado'),
      ev(-6 * D, 'Carlos Menezes', 'Enviado para revisão'),
      ev(-3 * D, 'Marta Fonseca', 'Relatório aprovado', 'Revisão humana concluída'),
    ],
  }),
  mk({
    n: 139, colaboradorId: 'u_joao', clienteId: 'c_serra', caminhaoId: 't101', tripDaysAgo: 9, status: 'arquivado',
    criadoAgoMs: 9 * D + 6 * H, origem: 'Base Rajamine — Belo Horizonte/MG', destino: 'Mina Serra Azul — Itabira/MG',
    kmInicio: 61730, kmFim: 62100, original: txtGeneric, atual: txtGenericIA,
    versoes: [tv(-9 * D - 4 * H, txtGeneric, 'original', 'João Pedro Rocha'), tv(-9 * D - 3 * H, txtGenericIA, 'ia', 'Marta Fonseca', 'Padronização aplicada na revisão')],
    fotos: [fotoEq2041('ph_139a', -9 * D)],
    equipamentosIds: ['e2041'],
    aprovadoAgoMs: 8 * D, docs: docsPadrao(8 * D - 2 * H, 7 * D), enviadoCliente: true,
    historico: [
      ev(-9 * D - 6 * H, 'Helena Duarte', 'Relatório criado'),
      ev(-9 * D, 'João Pedro Rocha', 'Enviado para revisão'),
      ev(-8 * D, 'Marta Fonseca', 'Relatório aprovado'),
      ev(-8 * D + 2 * H, 'Sistema', 'Documentos gerados', 'PDF cliente + PDF interno arquivados'),
      ev(-7 * D, 'Helena Duarte', 'Enviado ao cliente', 'Envio simulado — nenhuma mensagem real disparada'),
    ],
  }),
  mk({
    n: 138, colaboradorId: 'u_andre', clienteId: 'c_aco', caminhaoId: 't104', tripDaysAgo: 12, status: 'arquivado',
    criadoAgoMs: 12 * D + 4 * H, origem: 'Base Rajamine — Belo Horizonte/MG', destino: 'Planta Vale do Aço — Ipatinga/MG',
    kmInicio: 50840, kmFim: 51210, original: txtGeneric, atual: txtGenericIA,
    fotos: [fotoAtividade('ph_138a', -12 * D)],
    equipamentosIds: ['e4520'],
    aprovadoAgoMs: 11 * D, docs: docsPadrao(11 * D - 3 * H),
    historico: [
      ev(-12 * D - 4 * H, 'Helena Duarte', 'Relatório criado'),
      ev(-12 * D, 'André Luiz Santos', 'Enviado para revisão'),
      ev(-11 * D, 'Marta Fonseca', 'Relatório aprovado'),
      ev(-11 * D + 3 * H, 'Sistema', 'Documentos gerados', 'PDF cliente + PDF interno arquivados'),
    ],
  }),
  mk({
    n: 137, colaboradorId: 'u_felipe', clienteId: 'c_horizonte', caminhaoId: 't106', tripDaysAgo: 16, status: 'arquivado',
    criadoAgoMs: 16 * D + 5 * H, origem: 'Base Rajamine — Belo Horizonte/MG', destino: 'Mina Horizonte — Nova Lima/MG',
    kmInicio: 143220, kmFim: 143402, original: txtGeneric, atual: txtGenericIA,
    fotos: [fotoAtividade('ph_137a', -16 * D)],
    equipamentosIds: ['e8123'],
    aprovadoAgoMs: 15 * D, docs: docsPadrao(15 * D - 2 * H, 14 * D), enviadoCliente: true,
    historico: [
      ev(-16 * D - 5 * H, 'Helena Duarte', 'Relatório criado'),
      ev(-16 * D, 'Felipe Araújo', 'Enviado para revisão'),
      ev(-15 * D, 'Marta Fonseca', 'Relatório aprovado'),
      ev(-15 * D + 2 * H, 'Sistema', 'Documentos gerados'),
      ev(-14 * D, 'Helena Duarte', 'Enviado ao cliente', 'Envio simulado'),
    ],
  }),
  mk({
    n: 136, colaboradorId: 'u_carlos', clienteId: 'c_rita', caminhaoId: 't105', tripDaysAgo: 21, status: 'arquivado',
    criadoAgoMs: 21 * D + 6 * H, origem: 'Base Rajamine — Belo Horizonte/MG', destino: 'Pedreira Santa Rita — Sete Lagoas/MG',
    kmInicio: 77640, kmFim: 77816, original: txtGeneric, atual: txtGenericIA,
    fotos: [fotoAtividade('ph_136a', -21 * D)],
    equipamentosIds: ['e5102'],
    aprovadoAgoMs: 20 * D, docs: docsPadrao(20 * D - 4 * H, 19 * D), enviadoCliente: true,
    historico: [
      ev(-21 * D - 6 * H, 'Helena Duarte', 'Relatório criado'),
      ev(-21 * D, 'Carlos Menezes', 'Enviado para revisão'),
      ev(-20 * D, 'Marta Fonseca', 'Relatório aprovado'),
      ev(-20 * D + 4 * H, 'Sistema', 'Documentos gerados'),
      ev(-19 * D, 'Helena Duarte', 'Enviado ao cliente', 'Envio simulado'),
    ],
  }),
  mk({
    n: 135, colaboradorId: 'u_joao', clienteId: 'c_aco', caminhaoId: 't103', tripDaysAgo: 27, status: 'arquivado',
    criadoAgoMs: 27 * D + 5 * H, origem: 'Base Rajamine — Belo Horizonte/MG', destino: 'Planta Vale do Aço — Ipatinga/MG',
    kmInicio: 111900, kmFim: 112275, original: txtGeneric, atual: txtGenericIA,
    fotos: [fotoEq1087('ph_135a', -27 * D)],
    equipamentosIds: ['e1087'],
    aprovadoAgoMs: 26 * D, docs: docsPadrao(26 * D - 2 * H, 25 * D), enviadoCliente: true,
    historico: [
      ev(-27 * D - 5 * H, 'Helena Duarte', 'Relatório criado'),
      ev(-27 * D, 'João Pedro Rocha', 'Enviado para revisão'),
      ev(-26 * D, 'Marta Fonseca', 'Relatório aprovado'),
      ev(-26 * D + 2 * H, 'Sistema', 'Documentos gerados'),
      ev(-25 * D, 'Helena Duarte', 'Enviado ao cliente', 'Envio simulado'),
    ],
  }),
  mk({
    n: 134, colaboradorId: 'u_andre', clienteId: 'c_serra', caminhaoId: 't102', tripDaysAgo: 33, status: 'arquivado',
    criadoAgoMs: 33 * D + 4 * H, origem: 'Base Rajamine — Belo Horizonte/MG', destino: 'Mina Serra Azul — Itabira/MG',
    kmInicio: 83900, kmFim: 84270, original: txtGeneric, atual: txtGenericIA,
    equipamentosIds: ['e3315'],
    aprovadoAgoMs: 32 * D, docs: docsPadrao(32 * D - 3 * H, 31 * D), enviadoCliente: true,
  }),
  mk({
    n: 133, colaboradorId: 'u_carlos', clienteId: 'c_horizonte', caminhaoId: 't106', tripDaysAgo: 38, status: 'arquivado',
    criadoAgoMs: 38 * D + 6 * H, origem: 'Base Rajamine — Belo Horizonte/MG', destino: 'Mina Horizonte — Nova Lima/MG',
    kmInicio: 142700, kmFim: 142884, original: txtGeneric, atual: txtGenericIA,
    aprovadoAgoMs: 37 * D, docs: docsPadrao(37 * D - 2 * H, 36 * D), enviadoCliente: true,
  }),
  mk({
    n: 132, colaboradorId: 'u_felipe', clienteId: 'c_rita', caminhaoId: 't105', tripDaysAgo: 44, status: 'arquivado',
    criadoAgoMs: 44 * D + 5 * H, origem: 'Base Rajamine — Belo Horizonte/MG', destino: 'Pedreira Santa Rita — Sete Lagoas/MG',
    kmInicio: 77100, kmFim: 77276, original: txtGeneric, atual: txtGenericIA,
    equipamentosIds: ['e5102'],
    aprovadoAgoMs: 43 * D, docs: docsPadrao(43 * D - 4 * H, 42 * D), enviadoCliente: true,
  }),
  mk({
    n: 131, colaboradorId: 'u_joao', clienteId: 'c_serra', caminhaoId: 't101', tripDaysAgo: 51, status: 'arquivado',
    criadoAgoMs: 51 * D + 4 * H, origem: 'Base Rajamine — Belo Horizonte/MG', destino: 'Mina Serra Azul — Itabira/MG',
    kmInicio: 61200, kmFim: 61570, original: txtGeneric, atual: txtGenericIA,
    aprovadoAgoMs: 50 * D, docs: docsPadrao(50 * D - 2 * H, 49 * D), enviadoCliente: true,
  }),
  ...realReports,
];

export const seedNotifications: Notification[] = [
  { id: 'n1', tipo: 'prazo', titulo: 'Prazo expirado — REL-2026-0147', mensagem: 'João Pedro Rocha ainda não preencheu o relatório da viagem a Ipatinga. Prazo vencido há 4 h.', criadaEm: iso(-4 * H), lida: false, reportId: 'r_147', para: 'admin' },
  { id: 'n2', tipo: 'prazo', titulo: 'Prazo próximo — REL-2026-0148', mensagem: 'O relatório de Carlos Menezes vence em menos de 24 h.', criadaEm: iso(-6 * H), lida: false, reportId: 'r_148', para: 'admin' },
  { id: 'n3', tipo: 'revisao', titulo: 'Novo relatório para revisão', mensagem: 'REL-2026-0145 (Carlos Menezes) foi enviado para revisão com 2 fotos e 1 leitura OCR aguardando conferência.', criadaEm: iso(-5 * H), lida: false, reportId: 'r_145', para: 'revisora' },
  { id: 'n4', tipo: 'revisao', titulo: 'Novo relatório para revisão', mensagem: 'REL-2026-0143 (João Pedro Rocha) aguarda revisão. Equipamento EQ-2041 já confirmado.', criadaEm: iso(-2 * D), lida: false, reportId: 'r_143', para: 'revisora' },
  { id: 'n5', tipo: 'correcao', titulo: 'Correção solicitada — REL-2026-0142', mensagem: 'Marta Fonseca solicitou complementação de dados a Felipe Araújo.', criadaEm: iso(-2 * D), lida: true, reportId: 'r_142', para: 'colaborador' },
  { id: 'n6', tipo: 'documento', titulo: 'Documentos gerados — REL-2026-0139', mensagem: 'PDF do cliente e PDF interno disponíveis no arquivo. Envio ao cliente registrado (simulação).', criadaEm: iso(-7 * D), lida: true, reportId: 'r_139', para: 'todos' },
];
