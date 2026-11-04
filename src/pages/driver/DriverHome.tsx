import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Truck, ClipboardCheck, AlertTriangle, GraduationCap, ArrowRight, CheckCircle2, Clock, Info } from 'lucide-react';
import { useStore, useCurrentUser } from '../../store/useStore';
import { Badge, Banner, Button, ProgressBar } from '../../components/ui';
import { checklistProgress, todayISO, currentShift, DRIVER_TRAININGS } from '../../lib/driver';
import { DRIVER_CHECKLIST_STATUS_LABEL, DRIVER_OCCURRENCE_STATUS_LABEL } from '../../data/types';
import { fmtDate } from '../../lib/format';

export default function DriverHome() {
  const user = useCurrentUser()!;
  const trucks = useStore((s) => s.trucks);
  const clients = useStore((s) => s.clients);
  const equipment = useStore((s) => s.equipment);
  const checklists = useStore((s) => s.driverChecklists);
  const occurrences = useStore((s) => s.driverOccurrences);
  const trainings = useStore((s) => s.driverTrainings);
  const ensure = useStore((s) => s.ensureDriverChecklist);

  const myTrucks = useMemo(() => trucks.filter((t) => user.truckIds?.includes(t.id)), [trucks, user.truckIds]);
  const myOccurrences = useMemo(() => occurrences.filter((o) => o.motoristaId === user.id), [occurrences, user.id]);
  const openOccurrences = myOccurrences.filter((o) => o.status === 'aberta' || o.status === 'em_analise');
  const pendingTrainings = DRIVER_TRAININGS.filter((t) => !trainings.some((x) => x.motoristaId === user.id && x.treinamentoId === t.id));

  // Automação: ao abrir o portal, garante o checklist do dia/turno para cada caminhão vinculado.
  useEffect(() => {
    for (const t of myTrucks) ensure(user.id, t.id, { data: todayISO(), turno: currentShift() });
  }, [myTrucks, user.id, ensure]);

  return (
    <div className="space-y-5">
      <Banner tone="info" icon={<Info size={16} />}>
        <strong>Como funciona:</strong> o checklist do dia é montado a partir dos equipamentos do seu caminhão.
        Um item marcado como falha abre uma ocorrência e avisa a coordenação (simulação). Aprovar relatórios e liberar documentos cabe à coordenação.
      </Banner>

      <section aria-labelledby="meus-caminhoes">
        <h2 id="meus-caminhoes" className="section-title mb-3 flex items-center gap-2"><Truck size={16} aria-hidden /> Meus caminhões</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {myTrucks.map((t) => {
            const client = clients.find((c) => c.id === t.clienteId);
            const eqs = equipment.filter((e) => e.truckId === t.id && e.status === 'instalado');
            const ck = checklists.find((c) => c.motoristaId === user.id && c.caminhaoId === t.id && c.data === todayISO() && c.turno === currentShift());
            const progress = ck ? checklistProgress(ck.items) : 0;
            return (
              <div key={t.id} className="card p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[16px] font-semibold text-primary mono">{t.frota}</div>
                    <div className="text-[12px] text-subtle mono">{t.placa} · {t.marca} {t.modelo}</div>
                    <div className="text-[12px] text-subtle">{client?.nome}</div>
                  </div>
                  {ck && <Badge tone={ck.status === 'concluido' ? 'green' : ck.status === 'em_analise' ? 'amber' : 'slate'}>{DRIVER_CHECKLIST_STATUS_LABEL[ck.status]}</Badge>}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {eqs.length === 0 && <Badge tone="slate">Sem equipamentos instalados</Badge>}
                  {eqs.map((e) => <Badge key={e.id} tone="blue">{e.codigo}</Badge>)}
                </div>
                {ck && ck.status === 'rascunho' && (
                  <div>
                    <div className="flex justify-between text-[11.5px] text-subtle mb-1"><span>Checklist de hoje</span><span>{progress}%</span></div>
                    <ProgressBar value={progress} />
                  </div>
                )}
                <Link to={`/motorista/checklist/${t.id}`} className="block">
                  <Button variant={ck?.status === 'rascunho' ? 'primary' : 'outline'} className="w-full" icon={<ClipboardCheck size={16} />}>
                    {ck?.status === 'rascunho' ? 'Continuar checklist' : ck ? 'Ver checklist do dia' : 'Iniciar checklist'}
                  </Button>
                </Link>
              </div>
            );
          })}
          {myTrucks.length === 0 && <div className="card p-6 text-[13px] text-subtle">Nenhum caminhão vinculado a este motorista.</div>}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2" aria-label="Ações rápidas">
        <Link to="/motorista/ocorrencias/nova" className="card press p-4 flex items-center gap-3 hover:border-accent/30">
          <span className="w-10 h-10 rounded-xl bg-destructive-soft text-destructive flex items-center justify-center"><AlertTriangle size={18} aria-hidden /></span>
          <div className="flex-1">
            <div className="text-[13.5px] font-bold text-primary">Abrir ocorrência</div>
            <div className="text-[12px] text-subtle">Câmera, tablet, telemetria, suporte ou avaria</div>
          </div>
          <ArrowRight size={16} className="text-subtle" aria-hidden />
        </Link>
        <Link to="/motorista/treinamento" className="card press p-4 flex items-center gap-3 hover:border-accent/30">
          <span className="w-10 h-10 rounded-xl bg-accent-soft text-accent flex items-center justify-center"><GraduationCap size={18} aria-hidden /></span>
          <div className="flex-1">
            <div className="text-[13.5px] font-bold text-primary">Treinamentos</div>
            <div className="text-[12px] text-subtle">{pendingTrainings.length ? `${pendingTrainings.length} ciência(s) pendente(s)` : 'Ciências em dia'}</div>
          </div>
          <ArrowRight size={16} className="text-subtle" aria-hidden />
        </Link>
      </section>

      <section aria-labelledby="ocorrencias-abertas">
        <h2 id="ocorrencias-abertas" className="section-title mb-3 flex items-center gap-2"><Clock size={16} aria-hidden /> Ocorrências em aberto</h2>
        {openOccurrences.length === 0 ? (
          <div className="card p-5 flex items-center gap-3 text-[13px] text-subtle">
            <CheckCircle2 size={18} className="text-success" aria-hidden /> Nenhuma ocorrência aberta. Bom turno!
          </div>
        ) : (
          <div className="space-y-2">
            {openOccurrences.map((o) => {
              const t = trucks.find((x) => x.id === o.caminhaoId);
              return (
                <Link key={o.id} to="/motorista/ocorrencias" className="card press p-4 flex items-center gap-3 hover:border-accent/30">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="mono text-[13px] font-bold text-primary">{o.codigo}</span>
                      <Badge tone={o.status === 'aberta' ? 'red' : 'amber'}>{DRIVER_OCCURRENCE_STATUS_LABEL[o.status]}</Badge>
                      <Badge tone={o.severidade === 'critica' ? 'red' : o.severidade === 'alta' ? 'amber' : 'slate'}>{o.severidade}</Badge>
                    </div>
                    <div className="text-[12.5px] text-subtle truncate mt-0.5">{t?.frota} · {fmtDate(o.criadoEm)} · {o.descricao}</div>
                  </div>
                  <ArrowRight size={16} className="text-subtle shrink-0" aria-hidden />
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
