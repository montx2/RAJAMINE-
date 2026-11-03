import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Archive, Camera, Download, Eye, Search, Send, FileText, Loader2, Check } from 'lucide-react';
import { useStore, useCurrentUser } from '../store/useStore';
import { PageHeader } from '../components/AppShell';
import { Button, Badge, Input, Select, Tabs, Modal, EmptyState, toast, StatusBadge } from '../components/ui';
import PhotoImg from '../components/PhotoImg';
import { useDocBuilder } from '../lib/docs';
import { fmtDateTime } from '../lib/format';
import type { GeneratedDoc, Report } from '../data/types';
import type { DocKind } from '../services/pdf';

interface Row { doc: GeneratedDoc; report: Report }

export default function Documents() {
  const user = useCurrentUser()!;
  const reports = useStore((s) => s.reports);
  const clients = useStore((s) => s.clients);
  const users = useStore((s) => s.users);
  const trucks = useStore((s) => s.trucks);
  const equipment = useStore((s) => s.equipment);

  const [tab, setTab] = useState('docs');
  const [q, setQ] = useState('');
  const [tipo, setTipo] = useState('');
  const [clientId, setClientId] = useState('');
  const [de, setDe] = useState('');
  const [ate, setAte] = useState('');
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);

  const rows = useMemo(() => {
    const all: Row[] = reports.flatMap((r) => r.documentos.map((doc) => ({ doc, report: r })));
    const term = q.trim().toLowerCase();
    return all
      .filter(({ doc, report }) => {
        if (tipo && doc.tipo !== tipo) return false;
        if (clientId && report.clienteId !== clientId) return false;
        const d = doc.geradoEm.slice(0, 10);
        if (de && d < de) return false;
        if (ate && d > ate) return false;
        if (term) {
          const colab = users.find((u) => u.id === report.colaboradorId)?.nome ?? '';
          const client = clients.find((c) => c.id === report.clienteId)?.nome ?? '';
          const truck = trucks.find((t) => t.id === report.caminhaoId);
          const eqs = report.equipamentosIds.map((id) => equipment.find((e) => e.id === id)?.codigo ?? '').join(' ');
          if (!`${report.codigo} ${colab} ${client} ${truck?.placa} ${truck?.frota} ${eqs}`.toLowerCase().includes(term)) return false;
        }
        return true;
      })
      .sort((a, b) => b.doc.geradoEm.localeCompare(a.doc.geradoEm));
  }, [reports, q, tipo, clientId, de, ate, users, clients, trucks, equipment]);

  const photos = useMemo(() => {
    const term = q.trim().toLowerCase();
    return reports.flatMap((r) => r.fotos.map((p) => ({ photo: p, report: r })))
      .filter(({ report }) => {
        if (clientId && report.clienteId !== clientId) return false;
        if (term) {
          const client = clients.find((c) => c.id === report.clienteId)?.nome ?? '';
          if (!`${report.codigo} ${client} ${report.fotos.map((f) => f.legenda).join(' ')}`.toLowerCase().includes(term)) return false;
        }
        return true;
      })
      .sort((a, b) => b.photo.criadaEm.localeCompare(a.photo.criadaEm));
  }, [reports, q, clientId, clients]);

  const totalPhotos = reports.reduce((a, r) => a + r.fotos.length, 0);

  return (
    <div>
      <PageHeader
        eyebrow="Arquivo"
        title="Arquivo de Documentos"
        subtitle="PDFs gerados, envios simulados e fotos por relatório."
      />

      <Tabs
        tabs={[
          { id: 'docs', label: 'Documentos PDF', icon: <Archive size={15} />, count: rows.length },
          { id: 'fotos', label: 'Fotografias', icon: <Camera size={15} />, count: totalPhotos },
        ]}
        active={tab} onChange={setTab}
      />

      <div className="card p-4 my-4">
        <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-2.5">
          <div className="relative xl:col-span-2">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle" aria-hidden />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por relatório, cliente, colaborador, placa ou EQ-…" className="pl-10" aria-label="Pesquisar arquivo" />
          </div>
          {tab === 'docs' && (
            <Select value={tipo} onChange={(e) => setTipo(e.target.value)} aria-label="Tipo de documento">
              <option value="">Tipo: todos</option>
              <option value="cliente">Cliente (sem fotos)</option>
              <option value="interno">Interno (completo)</option>
            </Select>
          )}
          <Select value={clientId} onChange={(e) => setClientId(e.target.value)} aria-label="Cliente">
            <option value="">Cliente: todos</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </Select>
          <div className="flex gap-2">
            <Input type="date" value={de} onChange={(e) => setDe(e.target.value)} aria-label="De" />
            <Input type="date" value={ate} onChange={(e) => setAte(e.target.value)} aria-label="Até" />
          </div>
        </div>
      </div>

      {tab === 'docs' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px]">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="th">Relatório</th>
                  <th className="th">Documento</th>
                  <th className="th">Cliente</th>
                  <th className="th">Versão</th>
                  <th className="th">Gerado em</th>
                  <th className="th">Envio ao cliente</th>
                  <th className="th">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {rows.map((row) => <DocRow key={row.doc.id} row={row} onPreview={setPreview} canSend={user.role !== 'colaborador'} />)}
              </tbody>
            </table>
          </div>
          {rows.length === 0 && (
            <EmptyState icon={<FileText size={22} />} title="Nenhum documento no arquivo"
              description="Documentos aparecem aqui após a aprovação humana e a geração dos PDFs no relatório." />
          )}
        </div>
      )}

      {tab === 'fotos' && (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {photos.map(({ photo, report }) => (
            <Link key={photo.id} to={`/relatorios/${report.id}?tab=fotos`} className="card overflow-hidden group hover:border-accent/40 transition-colors">
              <div className="relative">
                <PhotoImg photo={photo} className="w-full h-36 group-hover:opacity-95 transition-opacity" />
                <Badge tone={photo.categoria === 'equipamento' ? 'blue' : 'teal'} className="absolute top-2 left-2">{photo.categoria}</Badge>
              </div>
              <div className="p-3">
                <div className="mono text-[12.5px] font-bold text-primary">{report.codigo}</div>
                <div className="text-[11.5px] text-subtle line-clamp-2 mt-0.5">{photo.legenda}</div>
              </div>
            </Link>
          ))}
          {photos.length === 0 && <div className="col-span-full card"><EmptyState icon={<Camera size={22} />} title="Nenhuma fotografia encontrada" /></div>}
        </div>
      )}

      {preview && (
        <Modal open onClose={() => { URL.revokeObjectURL(preview.url); setPreview(null); }} title={preview.title} wide
          footer={<Button variant="ghost" onClick={() => { URL.revokeObjectURL(preview.url); setPreview(null); }}>Fechar</Button>}>
          <iframe src={preview.url} title="Pré-visualização do PDF" className="w-full h-[65vh] rounded-lg border border-border bg-muted" />
        </Modal>
      )}
    </div>
  );
}

function DocRow({ row, onPreview, canSend }: { row: Row; onPreview: (p: { url: string; title: string }) => void; canSend: boolean }) {
  const { doc, report } = row;
  const clients = useStore((s) => s.clients);
  const user = useCurrentUser()!;
  const markClientSent = useStore((s) => s.markClientSent);
  const docs = useDocBuilder(report);
  const [loading, setLoading] = useState<'preview' | 'download' | null>(null);
  const client = clients.find((c) => c.id === report.clienteId);
  const kind: DocKind = doc.tipo;

  const doPreview = async () => {
    setLoading('preview');
    try {
      const url = await docs.previewUrl(kind);
      onPreview({ url, title: `${report.codigo} — ${doc.tipo === 'cliente' ? 'Cliente' : 'Interno'} (v${doc.versao})` });
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Falha ao gerar preview.', 'error');
    } finally { setLoading(null); }
  };

  const doDownload = async () => {
    setLoading('download');
    try { await docs.download(kind); toast('PDF baixado.'); }
    catch (e) { toast(e instanceof Error ? e.message : 'Falha ao baixar.', 'error'); }
    finally { setLoading(null); }
  };

  return (
    <tr className="hover:bg-muted/30 transition-colors">
      <td className="td">
        <Link to={`/relatorios/${report.id}?tab=documentos`} className="mono font-bold text-accent hover:underline">{report.codigo}</Link>
        <div className="mt-1"><StatusBadge status={report.status} /></div>
      </td>
      <td className="td"><Badge tone={doc.tipo === 'cliente' ? 'blue' : 'slate'}>{doc.tipo === 'cliente' ? 'Cliente · sem fotos' : 'Interno · completo'}</Badge></td>
      <td className="td text-secondary">{client?.nome}</td>
      <td className="td mono">v{doc.versao}</td>
      <td className="td whitespace-nowrap">{fmtDateTime(doc.geradoEm)}<div className="text-[11.5px] text-subtle">por {doc.geradoPor}</div></td>
      <td className="td">
        {doc.tipo === 'cliente'
          ? doc.enviadoEm
            ? <span className="text-[12.5px] text-teal-700 font-semibold flex items-center gap-1"><Check size={13} aria-hidden /> {fmtDateTime(doc.enviadoEm)}<br />(simulado)</span>
            : <span className="text-[12.5px] text-subtle">não enviado</span>
          : <span className="text-subtle">—</span>}
      </td>
      <td className="td">
        <div className="flex gap-1.5">
          <Button size="sm" variant="ghost" icon={loading === 'preview' ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />} onClick={doPreview} disabled={!!loading} aria-label="Visualizar">Ver</Button>
          <Button size="sm" variant="ghost" icon={loading === 'download' ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} onClick={doDownload} disabled={!!loading} aria-label="Baixar">PDF</Button>
          {doc.tipo === 'cliente' && !doc.enviadoEm && canSend && report.status === 'arquivado' && (
            <Button size="sm" variant="outline" icon={<Send size={13} />} onClick={() => { markClientSent(report.id, user.nome); toast('Envio registrado (SIMULAÇÃO).', 'info'); }}>
              Enviar
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}
