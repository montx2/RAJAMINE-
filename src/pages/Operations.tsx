import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Table2, Search, Download, AlertTriangle, Info, FileText } from 'lucide-react';
import { PageHeader } from '../components/AppShell';
import { Badge, Button, Input, Select, Banner, EmptyState, toast } from '../components/ui';
import { realOperations } from '../data/referencias';
import { operationAlerts, toCsv } from '../lib/operations';
import { downloadBytes } from '../services/pdf';
import { fmtDate } from '../lib/format';

export default function Operations() {
  const [q, setQ] = useState('');
  const [tecnico, setTecnico] = useState('');
  const [atividade, setAtividade] = useState('');
  const rows = realOperations;
  const alerts = useMemo(() => operationAlerts(rows), [rows]);
  const tecnicos = useMemo(() => Array.from(new Set(rows.map((r) => r.tecnico))), [rows]);
  const atividades = useMemo(() => Array.from(new Set(rows.map((r) => r.atividade))), [rows]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (tecnico && r.tecnico !== tecnico) return false;
      if (atividade && r.atividade !== atividade) return false;
      if (term) {
        const hay = `${r.equipamento} ${r.telemetria ?? ''} ${r.pulsus ?? ''} ${r.cameraFadiga ?? ''} ${r.galileo ?? ''} ${r.observacao} ${r.atividade}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [rows, q, tecnico, atividade]);

  const exportCsv = () => {
    const bytes = new TextEncoder().encode('\uFEFF' + toCsv(filtered));
    downloadBytes(bytes, 'rajamine-operacoes-2026-09-22.csv', 'text/csv;charset=utf-8');
    toast('CSV exportado a partir da transcrição da planilha real.');
  };

  return (
    <div>
      <PageHeader
        title="Operações de campo"
        subtitle="Transcrição estruturada da planilha real “Instalações/Manutenções/Retiradas — Equipamentos” (MFS, 22/09/2026). Os IDs preservam zeros à esquerda."
        actions={<Button variant="outline" icon={<Download size={15} />} onClick={exportCsv}>Exportar CSV</Button>}
      />

      <Banner tone="info" icon={<Info size={16} />} className="mb-4">
        Esta tela reproduz o formato operacional real da Rajamine: equipamento do cliente, telemetria, Pulsus, câmera de fadiga, atividade, observação e situação das fotos.
        <Link to="/relatorios/r_203" className="link ml-1">Ver relatório de referência vinculado</Link>.
      </Banner>

      {alerts.length > 0 && (
        <div className="card p-4 mb-4 space-y-1.5">
          <h2 className="text-[13px] font-bold text-primary flex items-center gap-2"><AlertTriangle size={15} className="text-warning" aria-hidden /> Verificações de consistência ({alerts.length})</h2>
          {alerts.slice(0, 8).map((a, i) => (
            <p key={i} className="text-[12.5px] text-secondary flex items-start gap-1.5">
              <span className={a.nivel === 'atencao' ? 'text-warning' : 'text-subtle'}>•</span> {a.mensagem}
            </p>
          ))}
          {alerts.length > 8 && <p className="text-[12px] text-subtle">+ {alerts.length - 8} outras verificações…</p>}
        </div>
      )}

      <div className="card p-4 mb-4">
        <div className="grid md:grid-cols-[1fr_180px_260px] gap-2.5">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle" aria-hidden />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar equipamento, telemetria, Pulsus, IMEI…" className="pl-10" aria-label="Pesquisar operações" />
          </div>
          <Select value={tecnico} onChange={(e) => setTecnico(e.target.value)} aria-label="Técnico">
            <option value="">Técnico: todos</option>
            {tecnicos.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
          <Select value={atividade} onChange={(e) => setAtividade(e.target.value)} aria-label="Atividade">
            <option value="">Atividade: todas</option>
            {atividades.map((a) => <option key={a} value={a}>{a}</option>)}
          </Select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px]">
            <thead className="bg-primary text-white">
              <tr>
                {['Data', 'Empresa', 'Técnico', 'Equipamento', 'Telemetria', 'Pulsus', 'Câmera de fadiga', 'Atividade', 'Observação', 'Situação Telemetria', 'Fotos'].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="td whitespace-nowrap">{fmtDate(r.data + 'T12:00:00')}</td>
                  <td className="td font-semibold">{r.empresa}</td>
                  <td className="td">{r.tecnico}</td>
                  <td className="td mono font-bold text-primary">{r.equipamento}</td>
                  <td className="td mono">{r.telemetria ?? '—'}</td>
                  <td className="td mono">{r.pulsus ?? '—'}</td>
                  <td className="td mono text-[12px]">{r.cameraFadiga ?? '—'}</td>
                  <td className="td text-[13px]">{r.atividade}</td>
                  <td className="td text-[12.5px] text-subtle">{r.observacao || '—'}</td>
                  <td className="td text-[12.5px] text-subtle">{r.situacaoTelemetria === 'nao_informada' ? '—' : r.situacaoTelemetria}</td>
                  <td className="td"><Badge tone={r.fotos === 'enviadas' ? 'green' : 'amber'}>{r.fotos === 'enviadas' ? 'Enviadas' : r.fotos}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <EmptyState icon={<Table2 size={22} />} title="Nenhuma operação encontrada" />}
      </div>
      <p className="mt-3 text-[12px] text-subtle flex items-center gap-1.5"><FileText size={13} aria-hidden /> {filtered.length} linha(s) · dados de referência fornecidos pela empresa; arquivos de fotos originais não foram anexados ao protótipo.</p>
    </div>
  );
}
