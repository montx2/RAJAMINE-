/*
  Operações de campo sintéticas e realistas para demonstração.
  Nenhum dado real de cliente, colaborador ou planilha da empresa é utilizado.
  IDs de dispositivos seguem o formato operacional (telemetria/Pulsus com 4 dígitos,
  IMEI de câmera/Galileo com 15 dígitos) e preservam zeros à esquerda.
*/
import type { Equipment, OperationRow } from './types';

const D = 86400000;
function dayStr(offsetDays: number): string {
  const d = new Date(Date.now() + offsetDays * D);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const demoOperations: OperationRow[] = [
  { id: 'op_01', data: dayStr(-1), empresa: 'Serra Azul', tecnico: 'Carlos Menezes', equipamento: 'SA-101', telemetria: '0187', pulsus: '2741', cameraFadiga: '864993060408250', atividade: 'Instalação de telemetria e câmera', observacao: 'Comunicação validada com a central', situacaoTelemetria: 'ok', fotos: 'enviadas', origemDados: 'sintetico' },
  { id: 'op_02', data: dayStr(-1), empresa: 'Serra Azul', tecnico: 'Carlos Menezes', equipamento: 'SA-102', telemetria: '0995', pulsus: '2309', cameraFadiga: '869247060146492', atividade: 'Desmobilização de câmera externa', observacao: 'Equipamento recolhido para estoque', situacaoTelemetria: 'ok', fotos: 'enviadas', origemDados: 'sintetico' },
  { id: 'op_03', data: dayStr(-2), empresa: 'Vale do Aço', tecnico: 'João Pedro Rocha', equipamento: 'VA-201', telemetria: '2183', pulsus: '2881', cameraFadiga: '864993060552605', atividade: 'Manutenção de telemetria', observacao: 'Telemetria antiga: 0995', situacaoTelemetria: 'ok', fotos: 'enviadas', origemDados: 'sintetico' },
  { id: 'op_04', data: dayStr(-2), empresa: 'Vale do Aço', tecnico: 'João Pedro Rocha', equipamento: 'VA-205', pulsus: '2291', atividade: 'Conferência de tablet', observacao: 'Tablet antigo: 2296', situacaoTelemetria: 'ok', fotos: 'enviadas', origemDados: 'sintetico' },
  { id: 'op_05', data: dayStr(-3), empresa: 'Santa Rita', tecnico: 'Felipe Araújo', equipamento: 'SR-305', telemetria: '5011', pulsus: '2743', cameraFadiga: '864993060730372', atividade: 'Manutenção de câmera de fadiga', observacao: 'Lente limpa e ângulo ajustado', situacaoTelemetria: 'ok', fotos: 'enviadas', origemDados: 'sintetico' },
  { id: 'op_06', data: dayStr(-3), empresa: 'Santa Rita', tecnico: 'Felipe Araújo', equipamento: 'SR-310', telemetria: '0035', pulsus: '2647', atividade: 'Manutenção ponto rede CAN', observacao: 'Chicote reapertado', situacaoTelemetria: 'pendente', fotos: 'pendentes', origemDados: 'sintetico' },
  { id: 'op_07', data: dayStr(-4), empresa: 'Horizonte', tecnico: 'André Luiz Santos', equipamento: 'HZ-410', telemetria: '7113', pulsus: '2890', cameraFadiga: '869247060286900', galileo: '867782071392430', atividade: 'Instalação de Galileo com rotograma', observacao: 'ID Galileo: 867782071392430', situacaoTelemetria: 'ok', fotos: 'enviadas', origemDados: 'sintetico' },
  { id: 'op_08', data: dayStr(-4), empresa: 'Horizonte', tecnico: 'André Luiz Santos', equipamento: 'HZ-412', cameraFadiga: '864993061411048', atividade: 'Instalação de câmera de fadiga', observacao: 'Teste de gravação concluído', situacaoTelemetria: 'ok', fotos: 'enviadas', origemDados: 'sintetico' },
  { id: 'op_09', data: dayStr(-5), empresa: 'Serra Azul', tecnico: 'Carlos Menezes', equipamento: 'SA-103', telemetria: '1439', pulsus: '2304', atividade: 'Coleta de telemetria', observacao: 'Dados exportados para análise', situacaoTelemetria: 'ok', fotos: 'enviadas', origemDados: 'sintetico' },
  { id: 'op_10', data: dayStr(-5), empresa: 'Vale do Aço', tecnico: 'João Pedro Rocha', equipamento: 'VA-202', telemetria: '7233', pulsus: '3061', cameraFadiga: '869247060145619', atividade: 'Manutenção de tablet', observacao: 'Atualização de firmware aplicada', situacaoTelemetria: 'ok', fotos: 'enviadas', origemDados: 'sintetico' },
  { id: 'op_11', data: dayStr(-6), empresa: 'Santa Rita', tecnico: 'Felipe Araújo', equipamento: 'SR-301', pulsus: '2299', cameraFadiga: '869247060285167', atividade: 'Conferência de câmera externa', observacao: 'Sem anomalias', situacaoTelemetria: 'ok', fotos: 'enviadas', origemDados: 'sintetico' },
  { id: 'op_12', data: dayStr(-6), empresa: 'Horizonte', tecnico: 'André Luiz Santos', equipamento: 'HZ-401', telemetria: '2824', pulsus: '2745', cameraFadiga: '864993060428969', atividade: 'Manutenção preventiva', observacao: 'Checklist entregue ao supervisor', situacaoTelemetria: 'ok', fotos: 'enviadas', origemDados: 'sintetico' },
];

const clientByEmpresa: Record<string, string> = {
  'Serra Azul': 'c_serra',
  'Vale do Aço': 'c_aco',
  'Santa Rita': 'c_rita',
  'Horizonte': 'c_horizonte',
};

/** Equipamentos de cliente derivados das operações sintéticas (para OCR/cadastro). */
export const demoClientEquipment: Equipment[] = Array.from(
  new Map(demoOperations.map((op) => [op.equipamento, op])).values(),
).map((op) => ({
  id: `eq_${op.equipamento.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
  codigo: op.equipamento,
  tipo: 'Equipamento de cliente',
  serial: '—',
  status: op.atividade.toLowerCase().startsWith('desmobilização') ? 'desmobilizado' : 'instalado',
  truckId: null,
  clienteId: clientByEmpresa[op.empresa] ?? null,
  telemetria: op.telemetria,
  pulsus: op.pulsus,
  cameraFadiga: op.cameraFadiga,
  galileo: op.galileo,
  origemDados: 'sintetico',
}));
