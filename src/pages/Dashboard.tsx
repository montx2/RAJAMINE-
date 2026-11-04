import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText, Hourglass, ClipboardCheck, CheckCircle2, Plus, BellRing,
  Timer, ScanLine, ArrowRight, AlertTriangle, Table2, CalendarRange, BadgeCheck, TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useStore, useCurrentUser } from '../store/useStore';
import { PageHeader } from '../components/AppShell';
import { Badge, Button, StatusBadge, Avatar, ProgressBar, EmptyState, Disclosure, toast } from '../components/ui';
import { STATUS_LABEL, type ReportStatus } from '../data/types';
import { deadlineLabel, hoursUntil, timeAgo, fmtShortDate, firstName } from '../lib/format';

const STATUS_COLORS: Record<ReportStatus, string> = {
  pendente: '#f59e0b', rascunho: '#71717a', em_revisao: '#2563eb', correcao: '#dc2626', aprovado: '#15803d', arquivado: '#0f766e',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const user = useCurrentUser()!;
  const reports = useStore((s) => s.reports);
  const users = useStore((s) => s.users);
  const clients = useStore((s) => s.clients);
  const sendReminder = useStore((s) => s.sendReminder);

  const stats = useMemo(() => {
    const by = (st: ReportStatus[]) => reports.filter((r) => st.includes(r.status)).length;
    return {
      total: reports.length,
      aguardando: by(['pendente', 'rascunho']),
      revisao: by(['em_revisao']),
      aprovados: by(['aprovado']),
      correcao: by(['correcao']),
    };
  }, [reports]);

  const weekly = useMemo(() => {
    const weeks: Array<{ label: string; total: number; aprovados: number }> = [];
    for (let i = 7; i >= 0; i--) {
      const end = Date.now() - i * 7 * 86400000;
      const start = end - 7 * 86400000;
      const inWeek = reports.filter((r) => {
        const t = new Date(r.criadoEm).getTime();
        return t > start && t <= end;
      });
      weeks.push({
        label: fmtShortDate(new Date(end).toISOString()),
        total: inWeek.length,
        aprovados: inWeek.filter((r) => ['aprovado', 'arquivado'].includes(r.status)).length,
      });
    }
    return weeks;
  }, [reports]);

  const byStatus = useMemo(() => {
    const order: ReportStatus[] = ['pendente', 'rascunho', 'correcao', 'em_revisao', 'aprovado', 'arquivado'];
    return order
      .map((st) => ({ name: STATUS_LABEL[st], value: reports.filter((r) => r.status === st).length, color: STATUS_COLORS[st] }))
      .filter((x) => x.value > 0);
  }, [reports]);

  const deadlines = useMemo(() =>
    reports
      .filter((r) => ['pendente', 'rascunho', 'correcao'].includes(r.status))
      .sort((a, b) => a.prazoEm.localeCompare(b.prazoEm)),
  [reports]);

  const activity = useMemo(() =>
    reports
      .flatMap((r) => r.historico.map((h) => ({ ...h, reportId: r.id, codigo: r.codigo })))
      .sort((a, b) => b.em.localeCompare(a.em))
      .slice(0, 5),
  [reports]);

  const productivity = useMemo(() => {
    const approved = reports.filter((r) => r.aprovadoEm && r.enviadoRevisaoEm);
    const avgH = approved.length
      ? approved.reduce((acc, r) => acc + (new Date(r.aprovadoEm!).getTime() - new Date(r.enviadoRevisaoEm!).getTime()) / 3600000, 0) / approved.length
      : 0;
    const submitted = reports.filter((r) => r.enviadoRevisaoEm);
    const onTime = submitted.filter((r) => new Date(r.enviadoRevisaoEm!).getTime() <= new Date(r.prazoEm).getTime()).length;
    const dets = reports.flatMap((r) => r.deteccoes);
    const confirmed = dets.filter((d) => d.status === 'confirmado' || d.status === 'corrigido').length;
    return {
      avgH: Math.round(avgH),
      onTimePct: submitted.length ? Math.round((onTime / submitted.length) * 100) : 0,
      ocrPct: dets.length ? Math.round((confirmed / dets.length) * 100) : 0,
    };
  }, [reports]);

  const kpis = [
    { label: 'Relatórios registrados', value: stats.total, icon: FileText, to: '/relatorios' },
    { label: 'Aguardando preenchimento', value: stats.aguardando, icon: Hourglass, to: '/relatorios' },
    { label: 'Aguardando revisão', value: stats.revisao, icon: ClipboardCheck, to: '/revisao' },
    { label: 'Aprovados', value: stats.aprovados, icon: CheckCircle2, to: '/documentos' },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Visão geral"
        title={`${new Date().getHours() < 12 ? 'Bom dia' : new Date().getHours() < 18 ? 'Boa tarde' : 'Boa noite'}, ${firstName(user.nome)}`}
        subtitle="O que precisa da sua atenção agora."
        actions={
          <>
            <Button variant="outline" icon={<ClipboardCheck size={15} />} onClick={() => navigate('/revisao')}>
              Revisar ({stats.revisao})
            </Button>
            {user.role === 'admin' && (
              <Button variant="primary" icon={<Plus size={15} />} onClick={() => navigate('/relatorios/novo')}>
                Novo relatório
              </Button>
            )}
          </>
        }
      />

      {/* KPIs essenciais */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 stagger" data-tour="dashboard-kpis">
        {kpis.map((k, i) => (
          <Link key={k.label} to={k.to} style={{ '--i': i } as React.CSSProperties}
            className="card card-hover p-4 block cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <span className="w-8 h-8 rounded-xl bg-primary/5 flex items-center justify-center text-secondary">
                <k.icon size={16} aria-hidden />
              </span>
              <ArrowRight size={14} className="text-subtle/60" aria-hidden />
            </div>
            <div className="text-[28px] font-semibold tracking-tight text-primary tabular-nums leading-none">{k.value}</div>
            <div className="text-[12px] font-semibold text-subtle mt-1.5 leading-tight">{k.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-4 items-start">
        {/* Fila de prazos */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-4 pb-3">
            <h2 className="section-title flex items-center gap-2">
              <AlertTriangle size={15} className="text-warning" aria-hidden /> Prazos e pendências
            </h2>
            <Link to="/relatorios" className="link text-[12px]">Ver todos</Link>
          </div>
          {deadlines.length === 0 ? (
            <EmptyState title="Nenhuma pendência de prazo" description="Todos os relatórios estão dentro do fluxo." />
          ) : (
            <div className="divide-soft">
              {deadlines.slice(0, 4).map((r) => {
                const dl = deadlineLabel(r.prazoEm);
                const colab = users.find((u) => u.id === r.colaboradorId);
                const client = clients.find((c) => c.id === r.clienteId);
                return (
                  <div key={r.id} className="flex items-start sm:items-center gap-3 px-5 py-3 hover:bg-primary/[0.02] transition-colors">
                    <Avatar nome={colab?.nome ?? '?'} size="sm" />
                    <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                      <div className="min-w-0 flex-1">
                        <Link to={`/relatorios/${r.id}`} className="text-[13px] font-bold text-primary hover:text-accent whitespace-nowrap">{r.codigo}</Link>
                        <div className="text-[12px] text-subtle truncate" title={`${colab?.nome} · ${client?.nome}`}>{colab?.nome} · {client?.nome}</div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <StatusBadge status={r.status} />
                        <Badge tone={dl.tom === 'late' ? 'red' : dl.tom === 'warn' ? 'amber' : 'slate'} dot>{dl.texto}</Badge>
                        {hoursUntil(r.prazoEm) < 24 && (
                          <Button size="sm" variant="ghost" icon={<BellRing size={13} />}
                            onClick={() => { sendReminder(r.id, user.nome); toast(`Lembrete enviado a ${colab?.nome} (simulação).`, 'info'); }}>
                            Lembrar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Atalhos (compacto) */}
        <div className="space-y-4">
          <div className="card p-4">
            <div className="eyebrow mb-3">Atalhos</div>
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="outline" icon={<Table2 size={14} />} onClick={() => navigate('/operacoes')}>Operações</Button>
              <Button size="sm" variant="outline" icon={<CalendarRange size={14} />} onClick={() => navigate('/semanal')}>Semanal</Button>
              <Button size="sm" variant="outline" icon={<FileText size={14} />} onClick={() => navigate('/relatorios')}>Relatórios</Button>
              <Button size="sm" variant="outline" icon={<BadgeCheck size={14} />} onClick={() => navigate('/relatorios/r_201')}>Visita técnica</Button>
            </div>
          </div>
          <div className="card p-4">
            <div className="eyebrow mb-2">Fluxo seguro</div>
            <p className="text-[12.5px] text-subtle leading-relaxed">
              Todo documento passa por revisão humana antes de ser liberado ao cliente. OCR e envios são simulados e auditados.
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_1.5fr] gap-4 items-start">
        {/* Produtividade compacta */}
        <div className="card p-5">
          <h2 className="section-title mb-4">Indicadores de produtividade</h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[12.5px] font-semibold text-secondary flex items-center gap-2"><Timer size={14} className="text-accent" aria-hidden /> Aprovação média</span>
                <span className="text-[14px] font-semibold text-primary tabular-nums">{productivity.avgH} h</span>
              </div>
              <ProgressBar value={Math.min(100, (48 - Math.min(48, productivity.avgH)) / 48 * 100)} tone="accent" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[12.5px] font-semibold text-secondary flex items-center gap-2"><CheckCircle2 size={14} className="text-success" aria-hidden /> No prazo</span>
                <span className="text-[14px] font-semibold text-primary tabular-nums">{productivity.onTimePct}%</span>
              </div>
              <ProgressBar value={productivity.onTimePct} tone="green" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[12.5px] font-semibold text-secondary flex items-center gap-2"><ScanLine size={14} className="text-subtle" aria-hidden /> OCR validado</span>
                <span className="text-[14px] font-semibold text-primary tabular-nums">{productivity.ocrPct}%</span>
              </div>
              <ProgressBar value={productivity.ocrPct} tone="accent" />
            </div>
          </div>
        </div>

        {/* Atividade recente */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-4 pb-3">
            <h2 className="section-title">Atividade recente</h2>
            <Link to="/documentos" className="link text-[12px] flex items-center gap-1">Documentos <ArrowRight size={12} aria-hidden /></Link>
          </div>
          <div className="divide-soft">
            {activity.map((a) => (
              <Link key={a.id} to={`/relatorios/${a.reportId}`} className="flex items-center gap-3 px-5 py-3 hover:bg-primary/[0.02] transition-colors">
                <Avatar nome={a.ator} size="sm" />
                <div className="min-w-0 flex-1">
                  <span className="text-[13px] font-semibold text-foreground">{a.acao}</span>
                  <span className="text-[12px] text-subtle whitespace-nowrap"> · {a.codigo}</span>
                </div>
                <span className="text-[11px] text-subtle whitespace-nowrap">{timeAgo(a.em)}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Análises sob demanda (progressive disclosure) */}
      <Disclosure title="Análises detalhadas" subtitle="Gráficos de período e distribuição por status — abra quando precisar." defaultOpen={false}>
        <div className="grid lg:grid-cols-[1.6fr_1fr] gap-4 pt-2">
          <div className="rounded-2xl border border-primary/8 bg-surface/50 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[13px] font-bold text-primary flex items-center gap-2"><TrendingUp size={14} className="text-accent" aria-hidden /> Relatórios por período</h3>
              <Badge tone="blue">{weekly.reduce((a, w) => a + w.total, 0)} em 8 semanas</Badge>
            </div>
            <div className="h-[220px]" aria-label="Gráfico de relatórios criados e aprovados por semana" role="img">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weekly} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.18} />
                      <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--color-subtle)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--color-subtle)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--color-border)', fontSize: 12.5, fontFamily: 'inherit', background: 'var(--glass-bg-strong)', color: 'var(--color-foreground)' }}
                    formatter={(v, name) => [v ?? 0, name === 'total' ? 'Criados' : 'Aprovados']}
                    labelFormatter={(l) => `Semana de ${l}`} />
                  <Area type="monotone" dataKey="total" stroke="var(--color-accent)" strokeWidth={2.2} fill="url(#gTotal)" name="total" />
                  <Area type="monotone" dataKey="aprovados" stroke="var(--color-success)" strokeWidth={2} fill="transparent" name="aprovados" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-2xl border border-primary/8 bg-surface/50 p-4">
            <h3 className="text-[13px] font-bold text-primary mb-3">Distribuição por status</h3>
            <div className="h-[220px]" role="img" aria-label={`Distribuição: ${byStatus.map((s) => `${s.name}: ${s.value}`).join(', ')}`}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byStatus} dataKey="value" nameKey="name" innerRadius={50} outerRadius={76} paddingAngle={2} strokeWidth={0}>
                    {byStatus.map((s) => <Cell key={s.name} fill={s.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--color-border)', fontSize: 12.5, background: 'var(--glass-bg-strong)', color: 'var(--color-foreground)' }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11.5, color: 'var(--color-subtle)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </Disclosure>
    </div>
  );
}
