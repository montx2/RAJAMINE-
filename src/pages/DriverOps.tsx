import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, XCircle, UserRound, Truck } from 'lucide-react';
import { useStore, useCurrentUser } from '../store/useStore';
import { PageHeader } from '../components/AppShell';
import { Badge, Banner, Button, EmptyState, Modal, Tabs, Textarea, toast } from '../components/ui';
import PhotoImg from '../components/PhotoImg';
import { OCCURRENCE_CATEGORY_LABEL, OCCURRENCE_SEVERITY_LABEL, checklistProgress } from '../lib/driver';
import { DRIVER_OCCURRENCE_STATUS_LABEL, DRIVER_CHECKLIST_STATUS_LABEL, type DriverOccurrence, type DriverOccurrenceStatus } from '../data/types';
import { fmtDateTime, fmtDate } from '../lib/format';

const STATUS_TONE: Record<DriverOccurrenceStatus, 'red' | 'amber' | 'green' | 'slate'> = {
  aberta: 'red', em_analise: 'amber', resolvida: 'green', rejeitada: 'slate',
};

/** Triagem humana das ocorrências/checklists de motoristas (coordenação/revisão). */
export default function DriverOps() {
  const user = useCurrentUser()!;
  const occurrences = useStore((s) => s.driverOccurrences);
  const checklists = useStore((s) => s.driverChecklists);
  const users = useStore((s) => s.users);
  const trucks = useStore((s) => s.trucks);
  const equipment = useStore((s) => s.equipment);
  const setStatus = useStore((s) => s.setDriverOccurrenceStatus);

  const [tab, setTab] = useState('ocorrencias');
  const [filter, setFilter] = useState<'todas' | DriverOccurrenceStatus>('todas');
  const [detail, setDetail] = useState<DriverOccurrence | null>(null);
  const [resposta, setResposta] = useState('');

  const list = useMemo(() => occurrences
    .filter((o) => filter === 'todas' || o.status === filter)
    .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm)), [occurrences, filter]);
  const myChecklists = useMemo(() => checklists.slice().sort((a, b) => b.criadoEm.localeCompare(a.criadoEm)), [checklists]);
  const open = occurrences.filter((o) => o.status === 'aberta' || o.status === 'em_analise').length;

  const act = (status: DriverOccurrenceStatus) => {
    if (!detail) return;
    if ((status === 'resolvida' || status === 'rejeitada') && resposta.trim().length < 5) {
      toast('Escreva uma resposta ao motorista (mín. 5 caracteres).', 'error');
      return;
    }
    const res = setStatus(detail.id, status, user.nome, resposta.trim() || undefined);
    if (!res.ok) { toast(res.erro ?? 'Não foi possível atualizar.', 'error'); return; }
    toast(`Ocorrência ${detail.codigo} atualizada. Motorista notificado (simulação).`);
    setDetail(null);
    setResposta('');
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Campo"
        title="Ocorrências de motoristas"
        subtitle="Triagem humana do que o Portal do Motorista reporta. O motorista não aprova relatórios nem libera documentos."
        actions={<Badge tone={open ? 'amber' : 'green'} dot>{open} em aberto</Badge>}
      />

      <Banner tone="info" icon={<AlertTriangle size={16} />}>
        Automações do portal: checklist gerado por caminhão/equipamentos, falha abre ocorrência, notificação interna roteada e fila offline sincronizada.
        A decisão continua humana: coloque em análise, resolva ou rejeite com resposta ao motorista.
      </Banner>

      <Tabs
        tabs={[
          { id: 'ocorrencias', label: 'Ocorrências', icon: <AlertTriangle size={14} />, count: occurrences.length },
          { id: 'checklists', label: 'Checklists', icon: <CheckCircle2 size={14} />, count: checklists.length },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'ocorrencias' && (
        <>
          <div className="flex flex-wrap gap-2">
            {(['todas', 'aberta', 'em_analise', 'resolvida', 'rejeitada'] as const).map((f) => (
              <button key={f} type="button" onClick={() => setFilter(f)}
                className={`press rounded-full border px-3 py-1.5 text-[12px] font-semibold cursor-pointer ${filter === f ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-secondary hover:border-accent/40'}`}>
                {f === 'todas' ? 'Todas' : DRIVER_OCCURRENCE_STATUS_LABEL[f]}
              </button>
            ))}
          </div>
          {list.length === 0 ? <EmptyState title="Nenhuma ocorrência neste filtro" description="Quando motoristas reportarem falhas, elas aparecerão aqui para triagem." /> : (
            <div className="space-y-2">
              {list.map((o) => {
                const mot = users.find((u) => u.id === o.motoristaId);
                const t = trucks.find((x) => x.id === o.caminhaoId);
                const eq = equipment.find((x) => x.id === o.equipmentId);
                return (
                  <button key={o.id} type="button" onClick={() => { setDetail(o); setResposta(o.resposta ?? ''); }} className="card press w-full p-4 text-left hover:border-accent/30 cursor-pointer">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="mono text-[13px] font-bold text-primary">{o.codigo}</span>
                      <Badge tone={STATUS_TONE[o.status]} dot>{DRIVER_OCCURRENCE_STATUS_LABEL[o.status]}</Badge>
                      <Badge tone={o.severidade === 'critica' ? 'red' : o.severidade === 'alta' ? 'amber' : 'slate'}>{OCCURRENCE_SEVERITY_LABEL[o.severidade]}</Badge>
                      {o.origem === 'checklist' && <Badge tone="blue">automática</Badge>}
                    </div>
                    <div className="mt-1 text-[13.5px] font-semibold text-foreground">{OCCURRENCE_CATEGORY_LABEL[o.categoria]}</div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[12px] text-subtle mt-1">
                      <span className="inline-flex items-center gap-1"><UserRound size={12} aria-hidden /> {mot?.nome}</span>
                      <span className="inline-flex items-center gap-1"><Truck size={12} aria-hidden /> {t?.frota} ({t?.placa})</span>
                      {eq && <span className="mono">{eq.codigo}</span>}
                      <span>{fmtDateTime(o.criadoEm)}</span>
                    </div>
                    <p className="text-[12.5px] text-secondary mt-1.5 line-clamp-2">{o.descricao}</p>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === 'checklists' && (
        myChecklists.length === 0 ? <EmptyState title="Nenhum checklist enviado" description="Checklists aparecem aqui quando o motorista envia." /> : (
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-muted/50 border-b border-border">
                <tr><th scope="col" className="th">Motorista</th><th scope="col" className="th">Caminhão</th><th scope="col" className="th">Data/turno</th><th scope="col" className="th">Progresso</th><th scope="col" className="th">Falhas</th><th scope="col" className="th">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {myChecklists.map((c) => {
                  const mot = users.find((u) => u.id === c.motoristaId);
                  const t = trucks.find((x) => x.id === c.caminhaoId);
                  const fails = c.items.filter((i) => i.status === 'falha').length;
                  return (
                    <tr key={c.id}>
                      <td className="td font-semibold">{mot?.nome}</td>
                      <td className="td mono">{t?.frota} · {t?.placa}</td>
                      <td className="td">{fmtDate(c.data + 'T12:00:00')} · {c.turno}</td>
                      <td className="td">{checklistProgress(c.items)}%</td>
                      <td className="td">{fails ? <Badge tone="red">{fails}</Badge> : <Badge tone="green">0</Badge>}</td>
                      <td className="td"><Badge tone={c.status === 'concluido' ? 'green' : c.status === 'em_analise' ? 'amber' : 'slate'}>{DRIVER_CHECKLIST_STATUS_LABEL[c.status]}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail ? `${detail.codigo} · triagem` : ''} wide
        footer={detail && (detail.status === 'aberta' || detail.status === 'em_analise') ? <>
          <Button variant="ghost" onClick={() => setDetail(null)}>Fechar</Button>
          {detail.status === 'aberta' && <Button variant="outline" icon={<Clock size={15} />} onClick={() => act('em_analise')}>Colocar em análise</Button>}
          <Button variant="danger" icon={<XCircle size={15} />} onClick={() => act('rejeitada')}>Rejeitar</Button>
          <Button variant="success" icon={<CheckCircle2 size={15} />} onClick={() => act('resolvida')}>Resolver</Button>
        </> : <Button variant="ghost" onClick={() => setDetail(null)}>Fechar</Button>}>
        {detail && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge tone={STATUS_TONE[detail.status]} dot>{DRIVER_OCCURRENCE_STATUS_LABEL[detail.status]}</Badge>
              <Badge tone={detail.severidade === 'critica' ? 'red' : detail.severidade === 'alta' ? 'amber' : 'slate'}>{OCCURRENCE_SEVERITY_LABEL[detail.severidade]}</Badge>
              {detail.origem === 'checklist' && <Badge tone="blue">aberta automaticamente pelo checklist</Badge>}
            </div>
            <p className="text-[13.5px] text-secondary leading-relaxed">{detail.descricao}</p>
            {detail.fotos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {detail.fotos.map((f) => <PhotoImg thumb key={f.id} photo={f} className="h-28 w-full rounded-xl" />)}
              </div>
            )}
            <div className="grid sm:grid-cols-2 gap-3 text-[12.5px] text-subtle">
              <div><strong className="text-foreground">Motorista:</strong> {users.find((u) => u.id === detail.motoristaId)?.nome}</div>
              <div><strong className="text-foreground">Caminhão:</strong> {trucks.find((t) => t.id === detail.caminhaoId)?.frota}</div>
              <div><strong className="text-foreground">Equipamento:</strong> {equipment.find((e) => e.id === detail.equipmentId)?.codigo ?? '—'}</div>
              <div><strong className="text-foreground">Criada:</strong> {fmtDateTime(detail.criadoEm)}</div>
            </div>
            {(detail.status === 'aberta' || detail.status === 'em_analise') && (
              <Textarea value={resposta} onChange={(e) => setResposta(e.target.value)} placeholder="Resposta ao motorista (obrigatória para resolver/rejeitar). Ex.: equipe de campo acionada, suporte reapertado, etc." aria-label="Resposta ao motorista" />
            )}
            {detail.resposta && (
              <div className="rounded-xl bg-success-soft/60 border border-success/20 p-3 text-[13px] text-success">
                <strong>Resposta registrada:</strong> {detail.resposta}
                <div className="text-xs mt-1 opacity-80">{detail.resolvidaPor} · {detail.resolvidaEm ? fmtDateTime(detail.resolvidaEm) : ''}</div>
              </div>
            )}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-subtle mb-2">Histórico</h3>
              <ol className="space-y-2">
                {detail.historico.map((h) => (
                  <li key={h.id} className="text-[12.5px] text-secondary"><strong>{h.acao}</strong> — {h.ator}<div className="text-subtle">{h.detalhe} · {fmtDateTime(h.em)}</div></li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
