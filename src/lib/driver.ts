/**
 * Portal do Motorista — regras determinísticas e automações seguras.
 *
 * Automações permitidas (protótipo):
 *  · gerar checklist a partir do caminhão + equipamentos instalados;
 *  · preencher data/turno/caminhão/cliente automaticamente;
 *  · salvar rascunho localmente;
 *  · abrir ocorrência automática quando um item falha;
 *  · rotear notificação interna para coordenação/revisão (simulada);
 *  · sincronizar fila offline quando houver conexão (simulado).
 *
 * Automações PROIBIDAS pelas regras do projeto:
 *  · aprovar relatório ou liberar PDF do cliente;
 *  · enviar mensagem real a cliente/motorista;
 *  · rastrear GPS, biometria ou score de fadiga;
 *  · sobrescrever original sem trilha.
 */
import type {
  DriverChecklistItem, DriverOccurrenceCategory, DriverOccurrenceSeverity,
  Equipment, Truck,
} from '../data/types';

export const DRIVER_ITEM_LABEL: Record<string, string> = {
  pneus: 'Pneus / rodas',
  luzes: 'Luzes / sinalização',
  freios: 'Freios',
  espelhos: 'Espelhos / visibilidade',
  fixacao: 'Fixação de suportes / chicotes',
  telemetria: 'Telemetria veicular',
  tablet: 'Tablet Pulsus',
  camera: 'Câmera de fadiga / embarcada',
  galileo: 'Galileo / rotograma',
  rastreador: 'Rastreador GPS',
  sensor_carga: 'Sensor de carga',
};

export const OCCURRENCE_CATEGORY_LABEL: Record<DriverOccurrenceCategory, string> = {
  camera_obstruida: 'Câmera obstruída / suja',
  tablet_nao_liga: 'Tablet não liga / travando',
  telemetria_sem_sinal: 'Telemetria sem sinal',
  suporte_solto: 'Suporte / chicote solto',
  avaria_veiculo: 'Avaria no veículo',
  outro: 'Outro',
};

export const OCCURRENCE_SEVERITY_LABEL: Record<DriverOccurrenceSeverity, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  critica: 'Crítica',
};

export const DRIVER_TRAININGS = [
  { id: 'trein_camera', titulo: 'Uso da câmera de fadiga', descricao: 'Não obstruir a lente, comunicar falhas e não realizar ajustes por conta própria.' },
  { id: 'trein_tablet', titulo: 'Uso do tablet Pulsus', descricao: 'Conferir carregamento, não instalar aplicativos e reportar travamentos.' },
  { id: 'trein_telemetria', titulo: 'Telemetria e comunicação', descricao: 'Entender que o equipamento registra operação do veículo, não dados pessoais do motorista.' },
  { id: 'trein_seguranca', titulo: 'Checklist e segurança', descricao: 'Preencher checklist antes do turno e abrir ocorrência quando houver falha.' },
] as const;

function item(key: string, categoria: DriverChecklistItem['categoria'], equipmentId?: string): DriverChecklistItem {
  return {
    id: `item_${key}${equipmentId ? `_${equipmentId}` : ''}`,
    key,
    label: DRIVER_ITEM_LABEL[key] ?? key,
    categoria,
    equipmentId,
    status: 'nao_verificado',
    observacao: '',
  };
}

/** Gera checklist automaticamente: itens padrão do veículo + dispositivos instalados no caminhão. */
export function buildChecklistItems(truck: Truck | undefined, equipment: Equipment[]): DriverChecklistItem[] {
  const base = [
    item('pneus', 'veiculo'),
    item('luzes', 'veiculo'),
    item('freios', 'veiculo'),
    item('espelhos', 'veiculo'),
    item('fixacao', 'veiculo'),
  ];
  if (!truck) return base;
  const installed = equipment.filter((e) => e.truckId === truck.id && e.status === 'instalado');
  const seen = new Set<string>();
  for (const e of installed) {
    let key: string | null = null;
    if (e.tipo === 'Telemetria veicular') key = 'telemetria';
    else if (e.tipo === 'Tablet Pulsus') key = 'tablet';
    else if (e.tipo === 'Câmera de fadiga' || e.tipo === 'Sensor de fadiga' || e.tipo === 'Câmera embarcada') key = 'camera';
    else if (e.tipo === 'Galileo / rotograma') key = 'galileo';
    else if (e.tipo === 'Rastreador GPS') key = 'rastreador';
    else if (e.tipo === 'Sensor de carga') key = 'sensor_carga';
    if (key && !seen.has(key)) {
      seen.add(key);
      base.push(item(key, 'equipamento', e.id));
    }
  }
  return base;
}

export function itemToOccurrenceCategory(key: string): DriverOccurrenceCategory {
  switch (key) {
    case 'camera': return 'camera_obstruida';
    case 'tablet': return 'tablet_nao_liga';
    case 'telemetria':
    case 'rastreador':
    case 'galileo': return 'telemetria_sem_sinal';
    case 'fixacao': return 'suporte_solto';
    case 'pneus':
    case 'luzes':
    case 'freios':
    case 'espelhos': return 'avaria_veiculo';
    default: return 'outro';
  }
}

export function suggestSeverity(category: DriverOccurrenceCategory, status: 'atencao' | 'falha'): DriverOccurrenceSeverity {
  if (status === 'falha') {
    if (category === 'avaria_veiculo') return 'critica';
    if (category === 'camera_obstruida' || category === 'telemetria_sem_sinal') return 'alta';
    return 'alta';
  }
  return category === 'avaria_veiculo' ? 'alta' : 'media';
}

export function occurrenceTemplate(category: DriverOccurrenceCategory, truck?: Truck): string {
  const frota = truck ? `${truck.frota} (${truck.placa})` : 'caminhão';
  switch (category) {
    case 'camera_obstruida': return `Câmera de fadiga/embarcada do ${frota} está obstruída, suja ou sem imagem. Não foi realizado ajuste técnico pelo motorista.`;
    case 'tablet_nao_liga': return `Tablet Pulsus do ${frota} não liga, trava ou não carrega. Equipamento permanece no veículo aguardando suporte.`;
    case 'telemetria_sem_sinal': return `Telemetria/rastreador do ${frota} sem sinal ou sem comunicação aparente. Motorista não realizou intervenção técnica.`;
    case 'suporte_solto': return `Suporte, chicote ou fixação de equipamento no ${frota} está solto/danificado. Risco de queda ou mau contato.`;
    case 'avaria_veiculo': return `Avaria no ${frota} identificada no checklist (pneus, luzes, freios ou visibilidade). Veículo deve ser avaliado pela manutenção.`;
    default: return `Ocorrência reportada pelo motorista no ${frota}.`;
  }
}

export function checklistProgress(items: DriverChecklistItem[]): number {
  if (!items.length) return 0;
  const answered = items.filter((i) => i.status !== 'nao_verificado').length;
  return Math.round((answered / items.length) * 100);
}

export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function currentShift(): 'dia' | 'noite' {
  const h = new Date().getHours();
  return h >= 6 && h < 18 ? 'dia' : 'noite';
}
