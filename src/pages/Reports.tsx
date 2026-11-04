import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Search, FileText, PenLine, Eye, SlidersHorizontal, X } from 'lucide-react';
import { useStore, useCurrentUser } from '../store/useStore';
import { PageHeader } from '../components/AppShell';
import { Button, Input, Select, StatusBadge, Badge, Avatar, EmptyState } from '../components/ui';
import { STATUS_LABEL, type ReportStatus } from '../data/types';
import { fmtDate, deadlineLabel } from '../lib/format';
import { cn } from '../lib/cn';

export default function Reports() {
  const navigate = useNavigate();
  const user = useCurrentUser()!;
  const reports = useStore((s) => s.reports);
  const users = useStore((s) => s.users);
  const clients = useStore((s) => s.clients);
  const trucks = useStore((s) => s.trucks);
  const equipment = useStore((s) => s.equipment);

  const [searchParams] = useSearchParams();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [clientId, setClientId] = useState('');
  const [colabId, setColabId] = useState('');
  const [truckId, setTruckId] = useState(searchParams.get('caminhao') ?? '');
  const [de, setDe] = useState('');
  const [ate, setAte] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    const mine = user.role === 'colaborador' ? reports.filter((r) => r.colaboradorId === user.id) : reports;
    const term = q.trim().toLowerCase();
    return mine
      .filter((r) => {
        if (status && r.status !== status) return false;
        if (clientId && r.clienteId !== clientId) return false;
        if (colabId && r.colaboradorId !== colabId) return false;
        if (truckId && r.caminhaoId !== truckId) return false;
        if (de && r.dataViagem < de) return false;
        if (ate && r.dataViagem > ate) return false;
        if (term) {
          const colab = users.find((u) => u.id === r.colaboradorId)?.nome ?? '';
          const client = clients.find((c) => c.id === r.clienteId)?.nome ?? '';
          const truck = trucks.find((t) => t.id === r.caminhaoId);
          const eqCodes = r.equipamentosIds.map((id) => equipment.find((e) => e.id === id)?.codigo ?? '').join(' ');
          const actCodes = (r.atividades ?? []).map((a) => `${a.equipamentoCodigo} ${a.telemetria ?? ''} ${a.pulsus ?? ''} ${a.cameraFadiga ?? ''} ${a.galileo ?? ''}`).join(' ');
          const hay = `${r.codigo} ${colab} ${client} ${truck?.placa} ${truck?.frota} ${r.origem} ${r.destino} ${r.objetivo ?? ''} ${r.cidadeBairro ?? ''} ${eqCodes} ${actCodes}`.toLowerCase();
          if (!hay.includes(term)) return false;
        }
        return true;
      })
      .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
  }, [reports, user, q, status, clientId, colabId, truckId, de, ate, users, clients, trucks, equipment]);

  const activeFilters = [status, clientId, colabId, truckId, de, ate].filter(Boolean).length;
  const hasFilters = q || activeFilters > 0;
  const clearAll = () => { setQ(''); setStatus(''); setClientId(''); setColabId(''); setTruckId(''); setDe(''); setAte(''); };

  const statusChips: Array<{ id: string; label: string }> = [
    { id: '', label: 'Todos' },
    { id: 'pendente', label: 'Pendentes' },
    { id: 'em_revisao', label: 'Em revisão' },
    { id: 'aprovado', label: 'Aprovados' },
    { id: 'correcao', label: 'Correção' },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Relatórios"
        title={user.role === 'colaborador' ? 'Meus relatórios' : 'Gestão de relatórios'}
        subtitle={user.role === 'colaborador' ? 'Preencha suas viagens dentro do prazo.' : 'Busque por código, pessoa, cliente ou equipamento.'}
        actions={user.role === 'admin' && (
          <Button variant="primary" icon={<Plus size={15} />} onClick={() => navigate('/relatorios/novo')}>Novo relatório</Button>
        )}
      />

      {/* Busca + filtros sob demanda */}
      <div className="card p-3 mb-4 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle" aria-hidden />
            <Input value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar código, cliente, equipamento…"
              className="pl-10" aria-label="Pesquisar relatórios" />
          </div>
          <Button variant={showFilters || activeFilters ? 'primary' : 'outline'} icon={<SlidersHorizontal size={15} />}
            onClick={() => setShowFilters((v) => !v)} aria-expanded={showFilters}>
            Filtros{activeFilters > 0 && <span className="ml-1 rounded-full bg-brand text-[#18181b] text-[10px] font-bold px-1.5">{activeFilters}</span>}
          </Button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {statusChips.map((c) => (
            <button key={c.id} onClick={() => setStatus(c.id)}
              className={cn('press rounded-full px-3 py-1.5 text-[12px] font-semibold border transition-colors cursor-pointer',
                status === c.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-surface/60 text-subtle border-primary/10 hover:text-primary hover:border-primary/20')}>
              {c.label}
            </button>
          ))}
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2.5 pt-1 animate-fade-in">
            <Select value={clientId} onChange={(e) => setClientId(e.target.value)} aria-label="Filtrar por cliente">
              <option value="">Cliente: todos</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </Select>
            {user.role !== 'colaborador' && (
              <Select value={colabId} onChange={(e) => setColabId(e.target.value)} aria-label="Filtrar por colaborador">
                <option value="">Colaborador: todos</option>
                {users.filter((u) => u.role === 'colaborador').map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
              </Select>
            )}
            <Select value={truckId} onChange={(e) => setTruckId(e.target.value)} aria-label="Filtrar por caminhão">
              <option value="">Caminhão: todos</option>
              {trucks.map((t) => <option key={t.id} value={t.id}>{t.frota} · {t.placa}</option>)}
            </Select>
            <Input type="date" value={de} onChange={(e) => setDe(e.target.value)} aria-label="Data inicial" title="A partir de" />
            <Input type="date" value={ate} onChange={(e) => setAte(e.target.value)} aria-label="Data final" title="Até" />
          </div>
        )}

        {hasFilters && (
          <div className="flex items-center justify-between text-[12px] text-subtle">
            <span>{filtered.length} resultado(s)</span>
            <button className="link flex items-center gap-1" onClick={clearAll}><X size={12} /> Limpar</button>
          </div>
        )}
      </div>

      {/* Tabela enxuta */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className="border-b border-primary/8">
              <tr>
                <th className="th">Relatório</th>
                <th className="th">Responsável</th>
                <th className="th">Status</th>
                <th className="th">Prazo</th>
                <th className="th"><span className="sr-only">Ações</span></th>
              </tr>
            </thead>
            <tbody className="divide-soft">
              {filtered.map((r) => {
                const colab = users.find((u) => u.id === r.colaboradorId);
                const client = clients.find((c) => c.id === r.clienteId);
                const pendingFill = ['pendente', 'rascunho', 'correcao'].includes(r.status);
                const dl = pendingFill ? deadlineLabel(r.prazoEm) : null;
                return (
                  <tr key={r.id} className="hover:bg-primary/[0.02] transition-colors">
                    <td className="td">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link to={`/relatorios/${r.id}`} className="mono font-bold text-accent hover:underline">{r.codigo}</Link>
                        {r.enviadoCliente && <Badge tone="green">enviado</Badge>}
                      </div>
                      <div className="text-[12px] text-subtle mt-0.5">
                        {client?.nome || '—'} · {fmtDate(r.dataViagem + 'T12:00:00')}
                      </div>
                    </td>
                    <td className="td">
                      <div className="flex items-center gap-2.5">
                        <Avatar nome={colab?.nome ?? '?'} size="sm" />
                        <span className="font-medium text-[13px]">{colab?.nome}</span>
                      </div>
                    </td>
                    <td className="td"><StatusBadge status={r.status} /></td>
                    <td className="td">
                      {dl ? <Badge tone={dl.tom === 'late' ? 'red' : dl.tom === 'warn' ? 'amber' : 'slate'}>{dl.texto}</Badge> : <span className="text-subtle text-[12px]">—</span>}
                    </td>
                    <td className="td text-right">
                      {user.role === 'colaborador' && pendingFill ? (
                        <Button size="sm" variant="primary" icon={<PenLine size={13} />} onClick={() => navigate(`/preencher/${r.token}`)}>Preencher</Button>
                      ) : (
                        <Button size="sm" variant="ghost" icon={<Eye size={14} />} onClick={() => navigate(`/relatorios/${r.id}`)}>Abrir</Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <EmptyState icon={<FileText size={22} />} title="Nenhum relatório encontrado"
            description={hasFilters ? 'Ajuste a pesquisa ou limpe os filtros.' : 'Crie o primeiro relatório para iniciar o fluxo.'}
            action={user.role === 'admin' && !hasFilters ? <Button variant="primary" icon={<Plus size={15} />} onClick={() => navigate('/relatorios/novo')}>Novo relatório</Button> : undefined} />
        )}
      </div>
    </div>
  );
}
