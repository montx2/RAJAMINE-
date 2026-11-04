import { useMemo, useState } from 'react';
import { ClipboardCheck, AlertTriangle, GraduationCap, CheckCircle2 } from 'lucide-react';
import { useStore, useCurrentUser } from '../../store/useStore';
import { Badge, EmptyState, Tabs } from '../../components/ui';
import { checklistProgress, OCCURRENCE_CATEGORY_LABEL } from '../../lib/driver';
import { DRIVER_CHECKLIST_STATUS_LABEL, DRIVER_OCCURRENCE_STATUS_LABEL } from '../../data/types';
import { fmtDate, fmtDateTime } from '../../lib/format';

export default function DriverHistory() {
  const user = useCurrentUser()!;
  const checklists = useStore((s) => s.driverChecklists);
  const occurrences = useStore((s) => s.driverOccurrences);
  const trainings = useStore((s) => s.driverTrainings);
  const trucks = useStore((s) => s.trucks);
  const [tab, setTab] = useState('checklists');

  const myChecklists = useMemo(() => checklists.filter((c) => c.motoristaId === user.id).sort((a, b) => b.criadoEm.localeCompare(a.criadoEm)), [checklists, user.id]);
  const myOccurrences = useMemo(() => occurrences.filter((o) => o.motoristaId === user.id).sort((a, b) => b.criadoEm.localeCompare(a.criadoEm)), [occurrences, user.id]);
  const myTrainings = useMemo(() => trainings.filter((t) => t.motoristaId === user.id), [trainings, user.id]);

  return (
    <div className="space-y-4">
      <div>
        <div className="eyebrow mb-1">Portal do motorista</div>
        <h1 data-tour="driver-historico-title" className="text-[20px] font-extrabold text-primary">Histórico</h1>
        <p className="text-[12.5px] text-subtle mt-1">Tudo que você registrou fica aqui, com data/hora e status. Nada é apagado silenciosamente.</p>
      </div>

      <Tabs
        tabs={[
          { id: 'checklists', label: 'Checklists', icon: <ClipboardCheck size={14} />, count: myChecklists.length },
          { id: 'ocorrencias', label: 'Ocorrências', icon: <AlertTriangle size={14} />, count: myOccurrences.length },
          { id: 'treinamentos', label: 'Ciências', icon: <GraduationCap size={14} />, count: myTrainings.length },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'checklists' && (
        myChecklists.length === 0 ? <EmptyState title="Nenhum checklist ainda" description="O checklist do dia é gerado automaticamente na tela inicial." /> :
        <div className="space-y-2">
          {myChecklists.map((c) => {
            const t = trucks.find((x) => x.id === c.caminhaoId);
            const fails = c.items.filter((i) => i.status === 'falha').length;
            return (
              <div key={c.id} className="card p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13.5px] font-bold text-primary mono">{t?.frota ?? c.caminhaoId}</span>
                  <Badge tone={c.status === 'concluido' ? 'green' : c.status === 'em_analise' ? 'amber' : 'slate'}>{DRIVER_CHECKLIST_STATUS_LABEL[c.status]}</Badge>
                  {c.origem === 'automatico' && <Badge tone="blue">automático</Badge>}
                  {!c.syncedAt && <Badge tone="amber">pendente sync</Badge>}
                </div>
                <div className="text-[12px] text-subtle mt-1">{fmtDate(c.data + 'T12:00:00')} · turno {c.turno} · {checklistProgress(c.items)}% verificado · {fails} falha(s)</div>
                {c.enviadoEm && <div className="text-[11.5px] text-subtle mt-0.5">Enviado em {fmtDateTime(c.enviadoEm)}</div>}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'ocorrencias' && (
        myOccurrences.length === 0 ? <EmptyState title="Nenhuma ocorrência" description="Ocorrências abertas manualmente ou pelo checklist aparecem aqui." /> :
        <div className="space-y-2">
          {myOccurrences.map((o) => (
            <div key={o.id} className="card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="mono text-[13px] font-bold text-primary">{o.codigo}</span>
                <Badge tone={o.status === 'resolvida' ? 'green' : o.status === 'aberta' ? 'red' : o.status === 'em_analise' ? 'amber' : 'slate'}>{DRIVER_OCCURRENCE_STATUS_LABEL[o.status]}</Badge>
                {o.origem === 'checklist' && <Badge tone="blue">automática</Badge>}
              </div>
              <div className="text-[13px] font-semibold text-foreground mt-1">{OCCURRENCE_CATEGORY_LABEL[o.categoria]}</div>
              <div className="text-[12px] text-subtle">{fmtDateTime(o.criadoEm)}</div>
              {o.resposta && <p className="text-[12.5px] text-success mt-1">Resposta: {o.resposta}</p>}
            </div>
          ))}
        </div>
      )}

      {tab === 'treinamentos' && (
        myTrainings.length === 0 ? <EmptyState title="Nenhuma ciência registrada" description="Registre ciência dos treinamentos na aba Treino." /> :
        <div className="space-y-2">
          {myTrainings.map((t) => (
            <div key={t.id} className="card p-4 flex items-start gap-3">
              <CheckCircle2 size={18} className="text-success mt-0.5" aria-hidden />
              <div>
                <div className="text-[13.5px] font-bold text-primary">{t.titulo}</div>
                <div className="text-[12px] text-subtle">Confirmado por {t.nomeConfirmado} em {fmtDateTime(t.confirmadoEm)}</div>
                <div className="text-[11.5px] text-subtle mt-0.5">Confirmação digitada — sem biometria.</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
