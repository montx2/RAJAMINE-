/* Regras de consistência operacional.
   Nunca corrigimos silenciosamente: apenas sinalizamos para conferência humana. */
import type { ActivityEntry, OperationRow, Report } from '../data/types';
import { ACTIVITY_KIND_LABEL } from '../data/types';

export interface ConsistencyAlert {
  nivel: 'info' | 'atencao' | 'erro';
  mensagem: string;
}

const digits = (v?: string) => (v ?? '').replace(/\D/g, '');

/** IMEI de câmera deve ter 15 dígitos; telemetria/Pulsus preservam zeros à esquerda. */
export function validateDeviceIds(a: Pick<ActivityEntry, 'telemetria' | 'pulsus' | 'cameraFadiga' | 'galileo'>): ConsistencyAlert[] {
  const alerts: ConsistencyAlert[] = [];
  if (a.cameraFadiga && digits(a.cameraFadiga).length !== 15) {
    alerts.push({ nivel: 'atencao', mensagem: `ID de câmera "${a.cameraFadiga}" não tem 15 dígitos (IMEI). Conferir transcrição.` });
  }
  if (a.galileo && digits(a.galileo).length !== 15) {
    alerts.push({ nivel: 'atencao', mensagem: `ID Galileo "${a.galileo}" não tem 15 dígitos. Conferir transcrição.` });
  }
  if (a.telemetria && !/^\d{4}$/.test(a.telemetria)) {
    alerts.push({ nivel: 'info', mensagem: `Telemetria "${a.telemetria}" fora do padrão de 4 dígitos — confirmar.` });
  }
  if (a.pulsus && !/^\d{4}$/.test(a.pulsus)) {
    alerts.push({ nivel: 'info', mensagem: `Pulsus "${a.pulsus}" fora do padrão de 4 dígitos — confirmar.` });
  }
  return alerts;
}

/** Mesmos IDs em instalação e desmobilização no mesmo dia podem ser transferência legítima. */
export function validateActivities(activities: ActivityEntry[], periodo?: { inicio?: string; fim?: string }): ConsistencyAlert[] {
  const alerts: ConsistencyAlert[] = [];
  for (const a of activities) {
    alerts.push(...validateDeviceIds(a));
    if (!a.equipamentoCodigo.trim() || a.equipamentoCodigo === '—') {
      if (a.tipo !== 'coleta_telemetria' && a.tipo !== 'reuniao' && a.tipo !== 'treinamento') {
        alerts.push({ nivel: 'atencao', mensagem: 'Atividade sem código de equipamento informado.' });
      }
    }
    if (periodo?.inicio && a.data < periodo.inicio) {
      alerts.push({ nivel: 'atencao', mensagem: `Atividade de ${a.equipamentoCodigo || 'cliente'} em ${a.data} está ANTES do período informado (${periodo.inicio}). Conferir datas.` });
    }
    if (periodo?.fim && a.data > periodo.fim) {
      alerts.push({ nivel: 'atencao', mensagem: `Atividade de ${a.equipamentoCodigo || 'cliente'} em ${a.data} está DEPOIS do período informado (${periodo.fim}). Conferir datas.` });
    }
  }

  // Transferência provável: mesmo dispositivo instalado e desmobilizado no mesmo dia
  const byDay = new Map<string, ActivityEntry[]>();
  for (const a of activities) {
    const key = a.data;
    byDay.set(key, [...(byDay.get(key) ?? []), a]);
  }
  for (const [day, list] of byDay) {
    const installs = list.filter((a) => a.tipo === 'instalacao');
    const removals = list.filter((a) => a.tipo === 'desmobilizacao');
    for (const inst of installs) {
      for (const rem of removals) {
        const shared: string[] = [];
        if (inst.telemetria && inst.telemetria === rem.telemetria) shared.push(`telemetria ${inst.telemetria}`);
        if (inst.pulsus && inst.pulsus === rem.pulsus) shared.push(`Pulsus ${inst.pulsus}`);
        if (inst.cameraFadiga && inst.cameraFadiga === rem.cameraFadiga) shared.push(`câmera ${inst.cameraFadiga}`);
        if (shared.length) {
          alerts.push({
            nivel: 'info',
            mensagem: `${day}: ${shared.join(', ')} aparece(m) em instalação (${inst.equipamentoCodigo}) e desmobilização (${rem.equipamentoCodigo}). Pode ser transferência legítima — confirmar com o técnico.`,
          });
        }
      }
    }
  }
  return alerts;
}

export function operationAlerts(rows: OperationRow[]): ConsistencyAlert[] {
  const acts: ActivityEntry[] = rows.map((op) => ({
    id: op.id, data: op.data, equipamentoCodigo: op.equipamento,
    tipo: op.atividade.toLowerCase().startsWith('instalação') ? 'instalacao' : op.atividade.toLowerCase().startsWith('desmobilização') ? 'desmobilizacao' : 'manutencao',
    telemetria: op.telemetria, pulsus: op.pulsus, cameraFadiga: op.cameraFadiga, galileo: op.galileo,
    observacao: op.observacao,
  }));
  const alerts = validateActivities(acts);
  for (const op of rows) {
    if (/antiga|antigo/i.test(op.observacao)) {
      alerts.push({ nivel: 'info', mensagem: `${op.equipamento}: substituição registrada — "${op.observacao}". Manter histórico do dispositivo anterior.` });
    }
  }
  return alerts;
}

/** Texto determinístico a partir de campos estruturados (não inventa fatos). */
export function activitiesToText(activities: ActivityEntry[]): string {
  return activities.map((a) => {
    const parts = [`${ACTIVITY_KIND_LABEL[a.tipo]} no equipamento ${a.equipamentoCodigo}`];
    if (a.componentes?.length) parts.push(`(${a.componentes.join(', ')})`);
    if (a.telemetria) parts.push(`telemetria ${a.telemetria}`);
    if (a.pulsus) parts.push(`tablet Pulsus ${a.pulsus}`);
    if (a.cameraFadiga) parts.push(`câmera de fadiga ${a.cameraFadiga}`);
    if (a.galileo) parts.push(`Galileo ${a.galileo}`);
    if (a.observacao) parts.push(`— ${a.observacao}`);
    return `${parts.join(', ')}.`;
  }).join('\n');
}

export function reportPeriod(r: Report): { inicio?: string; fim?: string } {
  return { inicio: r.periodoInicio ?? r.dataViagem, fim: r.periodoFim ?? r.dataViagem };
}

export function toCsv(rows: OperationRow[]): string {
  const header = ['Data', 'Empresa', 'Técnico', 'Equipamento', 'Telemetria', 'Pulsus', 'Câmera de fadiga', 'Atividade', 'Observação', 'Situação Telemetria', 'Fotos'];
  const esc = (v: string) => {
    const raw = v ?? '';
    const safe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  const lines = rows.map((r) => [r.data, r.empresa, r.tecnico, r.equipamento, r.telemetria ?? '', r.pulsus ?? '', r.cameraFadiga ?? '', r.atividade, r.observacao, r.situacaoTelemetria, r.fotos].map(esc).join(';'));
  return [header.map(esc).join(';'), ...lines].join('\n');
}
