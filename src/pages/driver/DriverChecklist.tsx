import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Check, AlertTriangle, X, ClipboardCheck, Send, Info, Save, ArrowLeft } from 'lucide-react';
import { useStore, useCurrentUser } from '../../store/useStore';
import { Badge, Banner, Button, ProgressBar, Textarea, toast, Modal } from '../../components/ui';
import { checklistProgress, todayISO, currentShift } from '../../lib/driver';
import { fmtDate } from '../../lib/format';
import { DRIVER_CHECKLIST_STATUS_LABEL, type DriverChecklistItemStatus } from '../../data/types';
import { cn } from '../../lib/cn';

const STATUS_OPTIONS: Array<{ value: DriverChecklistItemStatus; label: string; icon: typeof Check; tone: string }> = [
  { value: 'ok', label: 'OK', icon: Check, tone: 'data-[on=true]:bg-success data-[on=true]:text-primary-foreground data-[on=true]:border-success' },
  { value: 'atencao', label: 'Atenção', icon: AlertTriangle, tone: 'data-[on=true]:bg-warning data-[on=true]:text-primary-foreground data-[on=true]:border-warning' },
  { value: 'falha', label: 'Falha', icon: X, tone: 'data-[on=true]:bg-destructive data-[on=true]:text-primary-foreground data-[on=true]:border-destructive' },
];

export default function DriverChecklist() {
  const { caminhaoId } = useParams();
  const navigate = useNavigate();
  const user = useCurrentUser()!;
  const trucks = useStore((s) => s.trucks);
  const clients = useStore((s) => s.clients);
  const equipment = useStore((s) => s.equipment);
  const checklists = useStore((s) => s.driverChecklists);
  const ensure = useStore((s) => s.ensureDriverChecklist);
  const updateItem = useStore((s) => s.updateDriverChecklistItem);
  const markAllOk = useStore((s) => s.markAllChecklistOk);
  const submit = useStore((s) => s.submitDriverChecklist);
  const sync = useStore((s) => s.syncDriverQueue);

  const myTrucks = trucks.filter((t) => user.truckIds?.includes(t.id));
  const truckId = caminhaoId && myTrucks.some((t) => t.id === caminhaoId) ? caminhaoId : myTrucks[0]?.id;
  const truck = trucks.find((t) => t.id === truckId);
  const client = clients.find((c) => c.id === truck?.clienteId);

  const [checklistId, setChecklistId] = useState<string | null>(null);
  const [confirmAllOk, setConfirmAllOk] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ocorrenciasIds: string[] } | null>(null);

  useEffect(() => {
    if (!truckId) return;
    const id = ensure(user.id, truckId, { data: todayISO(), turno: currentShift() });
    setChecklistId(id);
    setResult(null);
  }, [truckId, user.id, ensure]);

  const checklist = checklists.find((c) => c.id === checklistId);
  const editable = checklist?.status === 'rascunho';
  const progress = checklist ? checklistProgress(checklist.items) : 0;
  const eqs = useMemo(() => equipment.filter((e) => e.truckId === truckId && e.status === 'instalado'), [equipment, truckId]);

  if (!truckId || !truck) {
    return <div className="card p-6 text-[13px] text-subtle">Nenhum caminhão vinculado. Solicite vínculo à coordenação.</div>;
  }

  const doSubmit = () => {
    if (!checklist) return;
    setSubmitting(true);
    const res = submit(checklist.id, user.nome);
    setSubmitting(false);
    if (!res.ok) { toast(res.erros.join(' '), 'error'); return; }
    if (navigator.onLine) sync();
    setResult({ ocorrenciasIds: res.ocorrenciasIds });
    toast(res.ocorrenciasIds.length
      ? `Checklist enviado. ${res.ocorrenciasIds.length} ocorrência(s) aberta(s) automaticamente.`
      : 'Checklist enviado e concluído.');
  };

  return (
    <div className="space-y-4">
      <Link to="/motorista" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-subtle hover:text-accent">
        <ArrowLeft size={15} aria-hidden /> Voltar
      </Link>

      <div className="card p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="eyebrow mb-1">Checklist automático · {fmtDate(todayISO() + 'T12:00:00')} · turno {currentShift()}</div>
            <h1 data-tour="driver-checklist-title" className="text-[20px] font-semibold text-primary mono">{truck.frota} <span className="text-subtle text-[14px]">({truck.placa})</span></h1>
            <p className="text-[12.5px] text-subtle">{client?.nome} · {truck.marca} {truck.modelo}</p>
          </div>
          {checklist && <Badge tone={checklist.status === 'concluido' ? 'green' : checklist.status === 'em_analise' ? 'amber' : 'slate'}>{DRIVER_CHECKLIST_STATUS_LABEL[checklist.status]}</Badge>}
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {eqs.map((e) => <Badge key={e.id} tone="blue">{e.codigo} · {e.tipo}</Badge>)}
        </div>
        {checklist && (
          <div className="mt-4">
            <div className="flex justify-between text-[12px] text-subtle mb-1"><span>{checklist.items.filter((i) => i.status !== 'nao_verificado').length}/{checklist.items.length} itens verificados</span><span>{progress}%</span></div>
            <ProgressBar value={progress} tone={progress === 100 ? 'green' : 'accent'} />
          </div>
        )}
      </div>

      <Banner tone="info" icon={<Info size={16} />}>
        Itens gerados automaticamente a partir dos equipamentos instalados. <strong>Falha</strong> abre ocorrência e avisa a coordenação (simulação).
        <strong> Atenção</strong> fica registrada para análise. A aprovação é sempre feita pela revisão.
      </Banner>

      {editable && (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" icon={<Check size={15} />} onClick={() => setConfirmAllOk(true)}>Marcar tudo OK</Button>
          <span className="inline-flex items-center gap-1.5 text-[11.5px] text-subtle px-2"><Save size={13} aria-hidden /> Rascunho salvo automaticamente neste aparelho</span>
        </div>
      )}

      {result && (
        <Banner tone={result.ocorrenciasIds.length ? 'warn' : 'success'} icon={<ClipboardCheck size={16} />}>
          {result.ocorrenciasIds.length
            ? <>Checklist enviado para análise. Ocorrências abertas automaticamente: <strong>{result.ocorrenciasIds.length}</strong>. <Link className="link" to="/motorista/ocorrencias">Ver ocorrências</Link>.</>
            : <>Checklist concluído automaticamente (todos os itens OK). <Link className="link" to="/motorista">Voltar ao início</Link>.</>}
        </Banner>
      )}

      {checklist && (
        <div className="space-y-3">
          {(['veiculo', 'equipamento'] as const).map((cat) => {
            const items = checklist.items.filter((i) => i.categoria === cat);
            if (!items.length) return null;
            return (
              <section key={cat} aria-labelledby={`ck-${cat}`}>
                <h2 id={`ck-${cat}`} className="text-[11px] font-bold uppercase tracking-wider text-subtle mb-2">
                  {cat === 'veiculo' ? 'Veículo' : 'Equipamentos embarcados'}
                </h2>
                <div className="space-y-2">
                  {items.map((i) => {
                    const eq = equipment.find((e) => e.id === i.equipmentId);
                    return (
                      <div key={i.id} className={cn('card p-4', i.status === 'falha' && 'border-destructive/30', i.status === 'atencao' && 'border-warning/30')}>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div>
                            <div className="text-[13.5px] font-bold text-primary">{i.label}</div>
                            {eq && <div className="text-[11.5px] text-subtle mono">{eq.codigo}{eq.serial !== '—' ? ` · SN ${eq.serial}` : ''}</div>}
                          </div>
                          <div className="flex gap-1.5" role="group" aria-label={`Status de ${i.label}`}>
                            {STATUS_OPTIONS.map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                disabled={!editable}
                                data-on={i.status === opt.value}
                                onClick={() => updateItem(checklist.id, i.id, { status: opt.value }, user.nome)}
                                aria-pressed={i.status === opt.value}
                                className={cn(
                                  'press inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-border px-3 text-[12px] font-bold text-secondary transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60',
                                  opt.tone,
                                )}
                              >
                                <opt.icon size={14} aria-hidden /> {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        {editable && i.status !== 'ok' && i.status !== 'nao_verificado' && (
                          <Textarea
                            className="mt-3 min-h-[72px]"
                            placeholder={i.status === 'falha' ? 'Descreva a falha (opcional — uma descrição padrão será usada na ocorrência automática)' : 'Observação (opcional)'}
                            value={i.observacao ?? ''}
                            onChange={(e) => updateItem(checklist.id, i.id, { observacao: e.target.value }, user.nome)}
                            aria-label={`Observação de ${i.label}`}
                          />
                        )}
                        {!editable && i.observacao && <p className="mt-2 text-[12.5px] text-subtle">{i.observacao}</p>}
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Só flutua quando pode ser acionado: enquanto o checklist está incompleto,
          fica no fluxo normal e não cobre os itens que o motorista precisa marcar. */}
      {editable && checklist && (
        <div className={cn('rounded-xl bg-background', progress === 100 && 'sticky bottom-20 z-10')}>
          <Button variant="primary" size="lg" className="w-full shadow-lift" icon={<Send size={17} />} loading={submitting} onClick={doSubmit} disabled={progress < 100}>
            Enviar checklist {progress < 100 ? `(${progress}% verificado)` : ''}
          </Button>
        </div>
      )}
      {!editable && checklist && (
        <Button variant="outline" className="w-full" onClick={() => navigate('/motorista/historico')}>Ver histórico</Button>
      )}

      <Modal open={confirmAllOk} onClose={() => setConfirmAllOk(false)} title="Marcar todos os itens como OK?"
        footer={<>
          <Button variant="ghost" onClick={() => setConfirmAllOk(false)}>Cancelar</Button>
          <Button variant="success" icon={<Check size={15} />} onClick={() => { if (checklist) markAllOk(checklist.id, user.nome); setConfirmAllOk(false); toast('Itens marcados como OK. Revise antes de enviar.', 'info'); }}>Confirmar</Button>
        </>}>
        <p className="text-[13.5px] text-secondary">
          Esta ação marca todos os itens como OK de uma vez. Use apenas se você realmente verificou tudo.
          Ela <strong>não envia</strong> o checklist nem aprova relatório — o envio continua sendo uma ação sua.
        </p>
      </Modal>
    </div>
  );
}
