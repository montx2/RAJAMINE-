import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Plus, Camera, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useStore, useCurrentUser } from '../../store/useStore';
import { Badge, Button, EmptyState, Modal, Tabs } from '../../components/ui';
import PhotoImg from '../../components/PhotoImg';
import { OCCURRENCE_CATEGORY_LABEL, OCCURRENCE_SEVERITY_LABEL } from '../../lib/driver';
import { DRIVER_OCCURRENCE_STATUS_LABEL, type DriverOccurrence, type DriverOccurrenceStatus } from '../../data/types';
import { fmtDateTime } from '../../lib/format';

const STATUS_TONE: Record<DriverOccurrenceStatus, 'red' | 'amber' | 'green' | 'slate'> = {
  aberta: 'red', em_analise: 'amber', resolvida: 'green', rejeitada: 'slate',
};

export default function DriverOccurrences() {
  const user = useCurrentUser()!;
  const occurrences = useStore((s) => s.driverOccurrences);
  const trucks = useStore((s) => s.trucks);
  const equipment = useStore((s) => s.equipment);
  const [tab, setTab] = useState('abertas');
  const [detail, setDetail] = useState<DriverOccurrence | null>(null);

  const mine = useMemo(() => occurrences.filter((o) => o.motoristaId === user.id), [occurrences, user.id]);
  const list = mine.filter((o) => tab === 'todas' ? true : tab === 'abertas' ? (o.status === 'aberta' || o.status === 'em_analise') : (o.status === 'resolvida' || o.status === 'rejeitada'));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="eyebrow mb-1">Portal do motorista</div>
          <h1 data-tour="driver-ocorrencias-title" className="text-[20px] font-extrabold text-primary">Minhas ocorrências</h1>
        </div>
        <Link to="/motorista/ocorrencias/nova"><Button variant="accent" icon={<Plus size={16} />}>Nova ocorrência</Button></Link>
      </div>

      <Tabs
        tabs={[
          { id: 'abertas', label: 'Em aberto', icon: <Clock size={14} />, count: mine.filter((o) => o.status === 'aberta' || o.status === 'em_analise').length },
          { id: 'fechadas', label: 'Encerradas', icon: <CheckCircle2 size={14} /> },
          { id: 'todas', label: 'Todas', icon: <AlertTriangle size={14} /> },
        ]}
        active={tab}
        onChange={setTab}
      />

      {list.length === 0 ? (
        <EmptyState icon={<CheckCircle2 size={22} />} title="Nenhuma ocorrência aqui" description="Quando você reportar uma falha, ela aparecerá nesta lista com o status da análise." action={<Link to="/motorista/ocorrencias/nova"><Button variant="outline" icon={<Plus size={15} />}>Abrir ocorrência</Button></Link>} />
      ) : (
        <div className="space-y-2">
          {list.map((o) => {
            const t = trucks.find((x) => x.id === o.caminhaoId);
            const eq = equipment.find((x) => x.id === o.equipmentId);
            return (
              <button key={o.id} type="button" onClick={() => setDetail(o)} className="card press w-full p-4 text-left hover:border-accent/30 cursor-pointer">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="mono text-[13px] font-bold text-primary">{o.codigo}</span>
                  <Badge tone={STATUS_TONE[o.status]} dot>{DRIVER_OCCURRENCE_STATUS_LABEL[o.status]}</Badge>
                  <Badge tone={o.severidade === 'critica' ? 'red' : o.severidade === 'alta' ? 'amber' : 'slate'}>{OCCURRENCE_SEVERITY_LABEL[o.severidade]}</Badge>
                  {o.origem === 'checklist' && <Badge tone="blue">automática</Badge>}
                </div>
                <div className="mt-1 text-[13px] font-semibold text-foreground">{OCCURRENCE_CATEGORY_LABEL[o.categoria]}</div>
                <div className="text-[12px] text-subtle mt-0.5">{t?.frota} ({t?.placa}){eq ? ` · ${eq.codigo}` : ''} · {fmtDateTime(o.criadoEm)}</div>
                <p className="text-[12.5px] text-secondary mt-1.5 line-clamp-2">{o.descricao}</p>
                {o.resposta && <p className="text-[12px] text-success mt-1.5 line-clamp-2">Resposta: {o.resposta}</p>}
              </button>
            );
          })}
        </div>
      )}

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail ? `${detail.codigo} · ${OCCURRENCE_CATEGORY_LABEL[detail.categoria]}` : ''} wide
        footer={<Button variant="ghost" onClick={() => setDetail(null)}>Fechar</Button>}>
        {detail && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge tone={STATUS_TONE[detail.status]} dot>{DRIVER_OCCURRENCE_STATUS_LABEL[detail.status]}</Badge>
              <Badge tone={detail.severidade === 'critica' ? 'red' : detail.severidade === 'alta' ? 'amber' : 'slate'}>{OCCURRENCE_SEVERITY_LABEL[detail.severidade]}</Badge>
              {detail.origem === 'checklist' && <Badge tone="blue">aberta automaticamente pelo checklist</Badge>}
            </div>
            <p className="text-[13.5px] text-secondary leading-relaxed">{detail.descricao}</p>
            {detail.fotos.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {detail.fotos.map((f) => <PhotoImg key={f.id} photo={f} className="h-32 w-full rounded-xl" />)}
              </div>
            )}
            {detail.resposta && (
              <div className="rounded-xl bg-success-soft/60 border border-success/20 p-3 text-[13px] text-success">
                <strong>Resposta da coordenação:</strong> {detail.resposta}
                {detail.resolvidaPor && <div className="text-[11.5px] mt-1 opacity-80">{detail.resolvidaPor} · {detail.resolvidaEm ? fmtDateTime(detail.resolvidaEm) : ''}</div>}
              </div>
            )}
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-subtle mb-2">Histórico</h3>
              <ol className="space-y-2">
                {detail.historico.map((h) => (
                  <li key={h.id} className="flex items-start gap-2 text-[12.5px]">
                    {h.acao.includes('resolvida') ? <CheckCircle2 size={14} className="text-success mt-0.5" aria-hidden /> : h.acao.includes('rejeitada') ? <XCircle size={14} className="text-subtle mt-0.5" aria-hidden /> : <Camera size={14} className="text-accent mt-0.5" aria-hidden />}
                    <div><strong>{h.acao}</strong> — {h.ator}<div className="text-subtle">{h.detalhe} · {fmtDateTime(h.em)}</div></div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
