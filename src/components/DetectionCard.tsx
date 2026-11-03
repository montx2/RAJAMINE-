import { useMemo, useState } from 'react';
import { ScanLine, Check, PencilLine, X, AlertTriangle, Link2, FlaskConical, Cpu } from 'lucide-react';
import type { Detection, EquipmentType, Report } from '../data/types';
import { useStore } from '../store/useStore';
import { matchCandidates } from '../services/ocr';
import { Badge, Button, ConfidenceBar, Input, Select, toast } from './ui';
import { fmtDateTime } from '../lib/format';
import { cn } from '../lib/cn';

const TIPOS: EquipmentType[] = ['Equipamento de cliente', 'Telemetria veicular', 'Tablet Pulsus', 'Câmera de fadiga', 'Galileo / rotograma', 'Rastreador GPS', 'Sensor de fadiga', 'Câmera embarcada', 'Sensor de carga'];
const CODE_RE = /^(EQ-\d{3,6}|[A-Z]{2,4}-[A-Z0-9]{2,6})$/i;
const CAND_LABEL: Record<string, string> = { codigo: 'código', serial: 'nº de série', imei: 'IMEI / ID', telemetria: 'telemetria', pulsus: 'Pulsus', numero: 'número' };

export default function DetectionCard({ report, detection, actorName, canValidate }: {
  report: Report; detection: Detection; actorName: string; canValidate: boolean;
}) {
  const equipment = useStore((s) => s.equipment);
  const trucks = useStore((s) => s.trucks);
  const resolveDetection = useStore((s) => s.resolveDetection);
  const [selected, setSelected] = useState(0);
  const [correcting, setCorrecting] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [manualType, setManualType] = useState<EquipmentType>('Equipamento de cliente');

  const matches = useMemo(
    () => matchCandidates(detection.candidatos, equipment, report.caminhaoId),
    [detection.candidatos, equipment, report.caminhaoId],
  );
  const truck = trucks.find((t) => t.id === report.caminhaoId);
  const resolved = detection.status !== 'aguardando';
  const confirmedEq = equipment.find((e) => e.id === detection.equipmentId);

  const confirm = (idx: number) => {
    const m = matches[idx];
    if (!m) return;
    // Equipamento encontrado no cadastro tem prioridade; número isolado vira EQ-XXXX
    const codigo = m.equipment?.codigo
      ?? (m.candidate.tipo === 'codigo' ? m.candidate.normalizado : m.candidate.normalizado);
    const res = resolveDetection(report.id, detection.id, 'confirmar', {
      codigo,
      equipmentId: m.equipment?.id,
      tipo: manualType,
      serial: m.candidate.tipo === 'serial' ? m.candidate.normalizado : undefined,
    }, actorName);
    if (res.ok) toast(`Identificação confirmada${truck ? ` e associada ao caminhão ${truck.frota}` : ' e vinculada ao relatório'}.`);
    else toast(res.erro ?? 'Não foi possível confirmar.', 'error');
  };

  const submitCorrection = () => {
    const code = manualCode.toUpperCase().trim();
    const normalized = CODE_RE.test(code) ? code : (/^\d{3,6}$/.test(code) ? `EQ-${code}` : code);
    if (!CODE_RE.test(normalized)) {
      toast('Informe um código válido, ex.: CP-101, TYE-9A00 ou EQ-2041.', 'error');
      return;
    }
    const res = resolveDetection(report.id, detection.id, 'corrigir', { codigo: normalized, tipo: manualType }, actorName);
    if (res.ok) { toast(`Identificação corrigida para ${normalized} e vinculada ao relatório.`); setCorrecting(false); }
    else toast(res.erro ?? 'Erro ao corrigir.', 'error');
  };

  const reject = () => {
    resolveDetection(report.id, detection.id, 'rejeitar', {}, actorName);
    toast('Leitura rejeitada. Nenhum equipamento foi associado.', 'info');
  };

  return (
    <div className={cn('rounded-xl border p-4 space-y-3', resolved ? 'border-border bg-muted/30' : 'border-amber-300/70 bg-warning-soft/30')}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-[13px] font-bold text-primary">
          <ScanLine size={15} className="text-accent" aria-hidden /> Leitura de identificação
        </span>
        {detection.motor === 'demo' ? (
          <Badge tone="violet"><FlaskConical size={11} aria-hidden /> Resultado simulado (demo)</Badge>
        ) : (
          <Badge tone="blue"><Cpu size={11} aria-hidden /> OCR real · Tesseract local</Badge>
        )}
        {detection.status === 'aguardando' && <Badge tone="amber" dot>Conferência humana necessária</Badge>}
        {detection.status === 'confirmado' && <Badge tone="green" dot>Confirmado</Badge>}
        {detection.status === 'corrigido' && <Badge tone="green" dot>Corrigido e confirmado</Badge>}
        {detection.status === 'rejeitado' && <Badge tone="red" dot>Rejeitado</Badge>}
      </div>

      <ConfidenceBar value={detection.confianca} />

      {detection.confianca < 65 && !resolved && (
        <p className="flex items-start gap-2 text-[12.5px] text-warning">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" aria-hidden />
          Confiança baixa: sujeira, reflexo ou ângulo podem ter afetado a leitura. Confira a etiqueta na foto antes de confirmar.
        </p>
      )}

      {/* Candidatos */}
      {!resolved && detection.candidatos.length > 0 && (
        <div className="space-y-2">
          {matches.map((m, i) => (
            <label key={i} className={cn('flex items-start gap-3 rounded-lg border bg-surface px-3 py-2.5 cursor-pointer transition-colors', selected === i ? 'border-accent ring-1 ring-accent/30' : 'border-border hover:border-slate-300')}>
              <input
                type="radio" name={`cand-${detection.id}`} checked={selected === i}
                onChange={() => setSelected(i)} className="mt-1 accent-sky-700"
                aria-label={`Candidato ${m.candidate.normalizado}`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="mono font-bold text-[14px] text-primary">{m.candidate.normalizado}</span>
                  <Badge tone={m.candidate.tipo === 'codigo' ? 'blue' : m.candidate.tipo === 'serial' || m.candidate.tipo === 'imei' ? 'teal' : 'slate'}>
                    {CAND_LABEL[m.candidate.tipo] ?? 'número'}
                  </Badge>
                  <span className="text-[12px] text-subtle tabular-nums">{m.candidate.confianca}%</span>
                  {m.candidate.valor !== m.candidate.normalizado && (
                    <span className="text-[11.5px] text-subtle">lido: “{m.candidate.valor}” (caracteres corrigidos)</span>
                  )}
                </div>
                <div className="mt-1 text-[12.5px]">
                  {m.equipment ? (
                    <span className={cn('flex items-center gap-1.5', m.conflitoCaminhao ? 'text-warning font-semibold' : 'text-success')}>
                      <Link2 size={13} aria-hidden />
                      {m.conflitoCaminhao
                        ? `Cadastrado em outro caminhão (${trucks.find((t) => t.id === m.equipment!.truckId)?.frota ?? '—'}) — confirmar moverá para ${truck?.frota}`
                        : `Encontrado no cadastro: ${m.equipment.tipo} · ${m.equipment.codigo}`}
                    </span>
                  ) : (
                    <span className="text-subtle">Não cadastrado — confirmar irá cadastrar e vincular ao relatório{truck ? ` (${truck.frota})` : ''}.</span>
                  )}
                </div>
              </div>
            </label>
          ))}
        </div>
      )}

      {detection.textoBruto && (
        <details className="text-[12px] text-subtle">
          <summary className="cursor-pointer font-semibold hover:text-secondary">Texto bruto reconhecido</summary>
          <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-primary text-slate-200 px-3 py-2 text-[11.5px] font-mono">{detection.textoBruto}</pre>
        </details>
      )}

      {/* Resultado resolvido */}
      {resolved && detection.status !== 'rejeitado' && (
        <div className="rounded-lg bg-surface border border-border px-3 py-2.5 text-[13px]">
          <span className="font-bold text-primary mono">{detection.codigoConfirmado}</span>
          {confirmedEq && <span className="text-subtle"> · {confirmedEq.tipo} · série {confirmedEq.serial}</span>}
          <div className="text-[12px] text-subtle mt-1">
            Validado por {detection.confirmadoPor} em {fmtDateTime(detection.confirmadoEm)}{truck ? ` · associado a ${truck.frota} (${truck.placa})` : ' · vinculado ao relatório'}
          </div>
        </div>
      )}
      {resolved && detection.status === 'rejeitado' && (
        <p className="text-[12.5px] text-subtle">Rejeitado por {detection.confirmadoPor} em {fmtDateTime(detection.confirmadoEm)}.</p>
      )}

      {/* Ações */}
      {canValidate && !resolved && (
        <div className="space-y-3 pt-1">
          {!correcting ? (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="success" icon={<Check size={14} />} onClick={() => confirm(selected)} disabled={detection.candidatos.length === 0}>
                Confirmar selecionado
              </Button>
              <Button size="sm" variant="outline" icon={<PencilLine size={14} />} onClick={() => { setCorrecting(true); setManualCode(detection.candidatos[0]?.normalizado ?? ''); }}>
                Corrigir número
              </Button>
              <Button size="sm" variant="ghost" icon={<X size={14} />} onClick={reject}>Rejeitar leitura</Button>
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-surface p-3 space-y-3">
              <p className="text-[12.5px] text-subtle">Digite o código correto conforme a etiqueta física. A correção fica registrada no histórico com seu nome.</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <Input value={manualCode} onChange={(e) => setManualCode(e.target.value)} placeholder="CP-101 / EQ-0000" aria-label="Código correto" />
                <Select value={manualType} onChange={(e) => setManualType(e.target.value as EquipmentType)} aria-label="Tipo de equipamento">
                  {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
                </Select>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="success" onClick={submitCorrection}>Salvar correção e associar</Button>
                <Button size="sm" variant="ghost" onClick={() => setCorrecting(false)}>Cancelar</Button>
              </div>
            </div>
          )}
          {detection.candidatos.length === 0 && !correcting && (
            <p className="text-[12.5px] text-warning">Nenhum candidato extraído. Use “Corrigir número” para informar manualmente ou rejeite a leitura.</p>
          )}
        </div>
      )}
    </div>
  );
}
