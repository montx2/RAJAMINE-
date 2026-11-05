import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarRange, Download, Eye, Loader2 } from 'lucide-react';
import { useStore, useCurrentUser } from '../store/useStore';
import { PageHeader } from '../components/AppShell';
import { Button, Input, Badge, Modal, StatusBadge, toast, EmptyState } from '../components/ui';
import { buildWeeklyPdf, downloadBytes, pdfBlobUrl, type PdfRefs } from '../services/pdf';
import { demoWeeklyPeriod } from '../data/demoReports';
import { fmtDate } from '../lib/format';
import { ACTIVITY_KIND_LABEL, type Report } from '../data/types';

export default function Weekly() {
  const user = useCurrentUser()!;
  const reports = useStore((s) => s.reports);
  const clients = useStore((s) => s.clients);
  const users = useStore((s) => s.users);
  const equipment = useStore((s) => s.equipment);
  const trucks = useStore((s) => s.trucks);

  const [inicio, setInicio] = useState(demoWeeklyPeriod.inicio);
  const [fim, setFim] = useState(demoWeeklyPeriod.fim);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const inRange = useMemo(() => reports.filter((r) => {
    if (r.tipo === 'semanal_viagens') return false;
    const acts = r.atividades ?? [];
    const dates = [r.dataViagem, ...acts.map((a) => a.data)];
    return dates.some((d) => d >= inicio && d <= fim);
  }), [reports, inicio, fim]);

  const chosen = inRange.filter((r) => selected.has(r.id));
  const refsFor = (r: Report): PdfRefs => ({
    colaborador: users.find((u) => u.id === r.colaboradorId),
    cliente: clients.find((c) => c.id === r.clienteId),
    caminhao: trucks.find((t) => t.id === r.caminhaoId),
    equipamentos: equipment.filter((e) => r.equipamentosIds.includes(e.id)),
  });

  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const generate = async (asPreview: boolean) => {
    if (chosen.length === 0) { toast('Selecione ao menos um relatório aprovado no período.', 'error'); return; }
    setBusy(true);
    try {
      const bytes = await buildWeeklyPdf(chosen, refsFor, { inicio, fim });
      if (asPreview) setPreview(pdfBlobUrl(bytes));
      else { downloadBytes(bytes, `safip-semanal-${inicio}-a-${fim}.pdf`); toast('Consolidado semanal gerado.'); }
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Falha ao gerar consolidado.', 'error');
    } finally { setBusy(false); }
  };

  const grouped = useMemo(() => {
    const map = new Map<string, Report[]>();
    for (const r of chosen) {
      const name = clients.find((c) => c.id === r.clienteId)?.nome ?? 'Consolidado / sem cliente único';
      map.set(name, [...(map.get(name) ?? []), r]);
    }
    return [...map.entries()];
  }, [chosen, clients]);

  return (
    <div>
      <PageHeader
        eyebrow="Campo"
        title="Consolidado semanal de viagens"
        subtitle="Relatórios aprovados agrupados por cliente e período."
      />

      <div className="card p-5 mb-4">
        <h2 className="section-title mb-3">Gerar consolidado a partir de relatórios aprovados</h2>
        <div className="grid sm:grid-cols-[1fr_1fr_auto_auto] gap-2.5 items-end">
          <div><label className="label" htmlFor="wk-ini">Início</label><Input id="wk-ini" type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} /></div>
          <div><label className="label" htmlFor="wk-fim">Fim</label><Input id="wk-fim" type="date" value={fim} onChange={(e) => setFim(e.target.value)} /></div>
          <Button variant="outline" icon={busy ? <Loader2 size={15} className="animate-spin" /> : <Eye size={15} />} onClick={() => generate(true)} disabled={busy || user.role === 'colaborador'}>Visualizar</Button>
          <Button variant="primary" icon={busy ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />} onClick={() => generate(false)} disabled={busy || user.role === 'colaborador'}>Baixar PDF</Button>
        </div>
        <p className="text-[12px] text-subtle mt-2">Somente relatórios com aprovação humana registrada podem entrar no documento enviado ao cliente.</p>
      </div>

      <div className="card overflow-hidden mb-4">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <span className="text-[13px] font-bold text-primary">Relatórios no período ({inRange.length})</span>
          <span className="text-[12px] text-subtle">{chosen.length} selecionado(s)</span>
        </div>
        {inRange.length === 0 ? <EmptyState icon={<CalendarRange size={22} />} title="Nenhum relatório no período" /> : (
          <div className="divide-y divide-border/70">
            {inRange.map((r) => (
              <label key={r.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 cursor-pointer">
                <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} className="accent-amber-600" aria-label={`Selecionar ${r.codigo}`} />
                <div className="min-w-0 flex-1">
                  <Link to={`/relatorios/${r.id}`} className="mono font-bold text-accent hover:underline">{r.codigo}</Link>
                  <span className="text-[12.5px] text-subtle ml-2">{clients.find((c) => c.id === r.clienteId)?.nome ?? 'Consolidado'} · {fmtDate(r.dataViagem + 'T12:00:00')}</span>
                </div>
                <StatusBadge status={r.status} />
                {!r.aprovadoEm && <Badge tone="amber">aprovação pendente</Badge>}
              </label>
            ))}
          </div>
        )}
      </div>

      {grouped.length > 0 && (
        <div className="card p-5">
          <h2 className="section-title mb-3">Prévia da estrutura</h2>
          {grouped.map(([name, list]) => (
            <div key={name} className="mb-4">
              <h3 className="text-[14px] font-semibold text-primary bg-brand/20 inline-block px-2 py-0.5 rounded">{name}</h3>
              {list.map((r) => (
                <div key={r.id} className="mt-2 text-[13px] text-secondary">
                  <strong>{fmtDate(r.dataViagem + 'T12:00:00')}</strong> · {users.find((u) => u.id === r.colaboradorId)?.nome} · {r.objetivo || '—'}
                  <div className="text-[12.5px] text-subtle">{(r.atividades ?? []).length} atividade(s) estruturada(s)</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {preview && (
        <Modal open onClose={() => { URL.revokeObjectURL(preview); setPreview(null); }} title="Consolidado semanal" wide
          footer={<Button variant="ghost" onClick={() => { URL.revokeObjectURL(preview); setPreview(null); }}>Fechar</Button>}>
          <iframe src={preview} title="Pré-visualização do consolidado semanal" className="w-full h-[65dvh] rounded-lg border border-border bg-muted" />
        </Modal>
      )}
    </div>
  );
}
