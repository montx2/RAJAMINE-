import { useMemo, useState } from 'react';
import { Table2, Search, Download } from 'lucide-react';
import { PageHeader } from '../components/AppShell';
import { Badge, Button, Input, Select, EmptyState, toast } from '../components/ui';
import { demoOperations } from '../data/demoOperations';
import { toCsv } from '../lib/operations';
import { downloadBytes } from '../services/pdf';
import { fmtDate } from '../lib/format';

export default function Operations() {
  const [q, setQ] = useState('');
  const [tecnico, setTecnico] = useState('');
  const [atividade, setAtividade] = useState('');
  const rows = demoOperations;
  const tecnicos = useMemo(() => Array.from(new Set(rows.map((r) => r.tecnico))), [rows]);
  const atividades = useMemo(() => Array.from(new Set(rows.map((r) => r.atividade))), [rows]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (tecnico && r.tecnico !== tecnico) return false;
      if (atividade && r.atividade !== atividade) return false;
      if (term) {
        const hay = `${r.empresa} ${r.equipamento} ${r.telemetria ?? ''} ${r.pulsus ?? ''} ${r.cameraFadiga ?? ''} ${r.galileo ?? ''} ${r.observacao} ${r.atividade}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [rows, q, tecnico, atividade]);

  const exportCsv = () => {
    const bytes = new TextEncoder().encode('\uFEFF' + toCsv(filtered));
    downloadBytes(bytes, `rajamine-operacoes-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8');
    toast('CSV exportado.');
  };

  return (
    <div>
      <PageHeader
        title="Operações de campo"
        subtitle="Instalações, manutenções e desmobilizações registradas pela equipe."
        actions={<Button variant="outline" icon={<Download size={15} />} onClick={exportCsv}>Exportar CSV</Button>}
      />

      <div className="card p-3 mb-4">
        <div className="grid md:grid-cols-[1fr_200px_260px] gap-2.5">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle" aria-hidden />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar cliente, equipamento ou ID…" className="pl-10" aria-label="Pesquisar operações" />
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
          <table className="w-full min-w-[980px]">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                {['Data', 'Cliente', 'Técnico', 'Equipamento', 'Atividade', 'Dispositivos', 'Fotos'].map((h) => (
                  <th key={h} className="th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-soft">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-primary/[0.02] transition-colors">
                  <td className="td whitespace-nowrap text-subtle">{fmtDate(r.data + 'T12:00:00')}</td>
                  <td className="td font-semibold">{r.empresa}</td>
                  <td className="td">{r.tecnico}</td>
                  <td className="td mono font-bold text-primary">{r.equipamento}</td>
                  <td className="td text-[13px]">{r.atividade}</td>
                  <td className="td">
                    <div className="flex flex-wrap gap-1">
                      {r.telemetria && <span className="chip mono">T {r.telemetria}</span>}
                      {r.pulsus && <span className="chip mono">P {r.pulsus}</span>}
                      {r.cameraFadiga && <span className="chip mono">C {r.cameraFadiga.slice(-6)}</span>}
                      {r.galileo && <span className="chip mono">G {r.galileo.slice(-6)}</span>}
                      {!r.telemetria && !r.pulsus && !r.cameraFadiga && !r.galileo && <span className="text-subtle">—</span>}
                    </div>
                  </td>
                  <td className="td"><Badge tone={r.fotos === 'enviadas' ? 'green' : 'amber'}>{r.fotos === 'enviadas' ? 'Enviadas' : 'Pendentes'}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <EmptyState icon={<Table2 size={22} />} title="Nenhuma operação encontrada" description="Ajuste a busca ou os filtros." />}
      </div>
      <p className="mt-3 text-[12px] text-subtle">{filtered.length} operação(ões) · base demonstrativa sintética.</p>
    </div>
  );
}
