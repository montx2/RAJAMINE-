import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Search, FileText, PenLine, Eye, Filter } from 'lucide-react';
import { useStore, useCurrentUser } from '../store/useStore';
import { PageHeader } from '../components/AppShell';
import { Button, Input, Select, StatusBadge, Badge, Avatar, EmptyState } from '../components/ui';
import { STATUS_LABEL, type ReportStatus } from '../data/types';
import { fmtDate, deadlineLabel } from '../lib/format';

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
          const hay = `${r.codigo} ${colab} ${client} ${truck?.placa} ${truck?.frota} ${r.origem} ${r.destino} ${eqCodes}`.toLowerCase();
          if (!hay.includes(term)) return false;
        }
        return true;
      })
      .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
  }, [reports, user, q, status, clientId, colabId, truckId, de, ate, users, clients, trucks, equipment]);

  const hasFilters = q || status || clientId || colabId || truckId || de || ate;

  return (
    <div>
      <PageHeader
        title={user.role === 'colaborador' ? 'Meus relatórios' : 'Gestão de relatórios'}
        subtitle={user.role === 'colaborador'
          ? 'Preencha os relatórios das suas viagens dentro do prazo de 48 h.'
          : 'Pesquise por código, colaborador, cliente, caminhão, trajeto ou equipamento.'}
        actions={user.role === 'admin' && (
          <Button variant="accent" icon={<Plus size={16} />} onClick={() => navigate('/relatorios/novo')}>Novo relatório</Button>
        )}
      />

      {/* Filtros */}
      <div className="card p-4 mb-4 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle" aria-hidden />
          <Input
            value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por código, pessoa, cliente, placa, cidade ou equipamento (ex.: EQ-2041)…"
            className="pl-10" aria-label="Pesquisar relatórios"
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2.5">
          <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filtrar por status">
            <option value="">Status: todos</option>
            {(Object.keys(STATUS_LABEL) as ReportStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </Select>
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
          <Input type="date" value={de} onChange={(e) => setDe(e.target.value)} aria-label="Data inicial" title="Viagem a partir de" />
          <Input type="date" value={ate} onChange={(e) => setAte(e.target.value)} aria-label="Data final" title="Viagem até" />
        </div>
        {hasFilters && (
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] text-subtle flex items-center gap-1.5"><Filter size={13} aria-hidden /> {filtered.length} resultado(s)</span>
            <button className="link text-[12.5px]" onClick={() => { setQ(''); setStatus(''); setClientId(''); setColabId(''); setTruckId(''); setDe(''); setAte(''); }}>
              Limpar filtros
            </button>
          </div>
        )}
      </div>

      {/* Tabela */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="th">Relatório</th>
                <th className="th">Colaborador</th>
                <th className="th">Cliente</th>
                <th className="th">Caminhão</th>
                <th className="th">Viagem</th>
                <th className="th">Trajeto</th>
                <th className="th">Status</th>
                <th className="th">Prazo</th>
                <th className="th"><span className="sr-only">Ações</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {filtered.map((r) => {
                const colab = users.find((u) => u.id === r.colaboradorId);
                const client = clients.find((c) => c.id === r.clienteId);
                const truck = trucks.find((t) => t.id === r.caminhaoId);
                const pendingFill = ['pendente', 'rascunho', 'correcao'].includes(r.status);
                const dl = pendingFill ? deadlineLabel(r.prazoEm) : null;
                return (
                  <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                    <td className="td">
                      <Link to={`/relatorios/${r.id}`} className="mono font-bold text-accent hover:underline">{r.codigo}</Link>
                      {r.enviadoCliente && <Badge tone="teal" className="ml-2">enviado</Badge>}
                    </td>
                    <td className="td">
                      <div className="flex items-center gap-2.5">
                        <Avatar nome={colab?.nome ?? '?'} size="sm" />
                        <span className="font-medium">{colab?.nome}</span>
                      </div>
                    </td>
                    <td className="td text-secondary">{client?.nome}</td>
                    <td className="td"><span className="mono">{truck?.frota}</span> <span className="text-subtle text-[12px]">{truck?.placa}</span></td>
                    <td className="td whitespace-nowrap">{fmtDate(r.dataViagem + 'T12:00:00')}</td>
                    <td className="td">
                      <div className="max-w-[220px] truncate text-[13px] text-secondary" title={`${r.origem} → ${r.destino}`}>
                        {r.origem.split('—')[1]?.trim() ?? r.origem} → {r.destino.split('—')[1]?.trim() ?? r.destino}
                      </div>
                    </td>
                    <td className="td"><StatusBadge status={r.status} /></td>
                    <td className="td">
                      {dl ? <Badge tone={dl.tom === 'late' ? 'red' : dl.tom === 'warn' ? 'amber' : 'slate'}>{dl.texto}</Badge> : <span className="text-subtle text-[12.5px]">—</span>}
                    </td>
                    <td className="td">
                      {user.role === 'colaborador' && pendingFill ? (
                        <Button size="sm" variant="accent" icon={<PenLine size={13} />} onClick={() => navigate(`/preencher/${r.token}`)}>
                          Preencher
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" icon={<Eye size={14} />} onClick={() => navigate(`/relatorios/${r.id}`)}>
                          Detalhes
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <EmptyState
            icon={<FileText size={22} />}
            title="Nenhum relatório encontrado"
            description={hasFilters ? 'Ajuste a pesquisa ou limpe os filtros.' : 'Crie o primeiro relatório para iniciar o fluxo.'}
            action={user.role === 'admin' && !hasFilters ? <Button variant="accent" icon={<Plus size={16} />} onClick={() => navigate('/relatorios/novo')}>Novo relatório</Button> : undefined}
          />
        )}
      </div>
    </div>
  );
}
