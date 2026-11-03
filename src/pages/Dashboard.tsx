import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText, Hourglass, ClipboardCheck, CheckCircle2, Archive, Plus, BellRing,
  TrendingUp, Timer, ScanLine, ArrowRight, AlertTriangle,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useStore, useCurrentUser } from '../store/useStore';
import { PageHeader } from '../components/AppShell';
import { Badge, Button, StatusBadge, Avatar, ProgressBar, EmptyState } from '../components/ui';
import { STATUS_LABEL, type ReportStatus } from '../data/types';
import { deadlineLabel, hoursUntil, timeAgo, fmtShortDate, firstName } from '../lib/format';
import { cn } from '../lib/cn';
import { toast } from '../components/ui';

const STATUS_COLORS: Record<ReportStatus, string> = {
  pendente: '#d97706', rascunho: '#64748b', em_revisao: '#0369a1', correcao: '#dc2626', aprovado: '#15803d', arquivado: '#0f766e',
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
      arquivados: by(['arquivado']),
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
      .slice(0, 8),
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
      detsTotal: dets.length,
    };
  }, [reports]);

  const kpis = [
    { label: 'Relatórios registrados', value: stats.total, icon: FileText, tone: 'text-primary bg-muted' },
    { label: 'Aguardando preenchimento', value: stats.aguardando, icon: Hourglass, tone: 'text-warning bg-warning-soft' },
    { label: 'Aguardando revisão', value: stats.revisao, icon: ClipboardCheck, tone: 'text-accent bg-accent-soft' },
    { label: 'Aprovados', value: stats.aprovados, icon: CheckCircle2, tone: 'text-success bg-success-soft' },
    { label: 'Arquivados', value: stats.arquivados, icon: Archive, tone: 'text-teal-700 bg-teal-50' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${new Date().getHours() < 12 ? 'Bom dia' : new Date().getHours() < 18 ? 'Boa tarde' : 'Boa noite'}, ${firstName(user.nome)}`}
        subtitle="Visão geral da operação de relatórios de campo — prazos, revisão e produtividade."
        actions={
          <>
            <Button variant="outline" icon={<ClipboardCheck size={16} />} onClick={() => navigate('/revisao')}>
              Revisar ({stats.revisao})
            </Button>
            {user.role === 'admin' && (
              <Button variant="accent" icon={<Plus size={16} />} onClick={() => navigate('/relatorios/novo')}>
                Novo relatório
              </Button>
            )}
          </>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {kpis.map((k) => (
          <div key={k.label} className="card p-4">
            <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center mb-3', k.tone)}>
              <k.icon size={17} aria-hidden />
            </div>
            <div className="text-[26px] font-extrabold tracking-tight text-primary tabular-nums leading-none">{k.value}</div>
            <div className="text-[12px] font-semibold text-subtle mt-1.5 leading-tight">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="section-title">Relatórios por período</h2>
              <p className="text-[12px] text-subtle">Criados × aprovados · últimas 8 semanas</p>
            </div>
            <Badge tone="blue"><TrendingUp size={12} aria-hidden /> {weekly.reduce((a, w) => a + w.total, 0)} no período</Badge>
          </div>
          <div className="h-[240px]" aria-label="Gráfico de relatórios criados e aprovados por semana" role="img">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weekly} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0369A1" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#0369A1" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12.5, fontFamily: 'inherit' }}
                  formatter={(v, name) => [v ?? 0, name === 'total' ? 'Criados' : 'Aprovados']}
                  labelFormatter={(l) => `Semana de ${l}`}
                />
                <Area type="monotone" dataKey="total" stroke="#0369A1" strokeWidth={2.2} fill="url(#gTotal)" name="total" />
                <Area type="monotone" dataKey="aprovados" stroke="#15803d" strokeWidth={2} fill="transparent" name="aprovados" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 mt-2 text-[12px] text-subtle">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-accent" aria-hidden /> Criados</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-success" aria-hidden /> Aprovados</span>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="section-title mb-1">Distribuição por status</h2>
          <p className="text-[12px] text-subtle mb-2">Situação atual de todos os relatórios</p>
          <div className="h-[240px]" role="img" aria-label={`Distribuição: ${byStatus.map((s) => `${s.name}: ${s.value}`).join(', ')}`}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byStatus} dataKey="value" nameKey="name" innerRadius={52} outerRadius={80} paddingAngle={2} strokeWidth={0}>
                  {byStatus.map((s) => <Cell key={s.name} fill={s.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12.5 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11.5 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Produtividade + Prazos */}
      <div className="grid lg:grid-cols-[1fr_1.6fr] gap-4">
        <div className="card p-5 space-y-5">
          <h2 className="section-title">Indicadores de produtividade</h2>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[13px] font-semibold text-secondary flex items-center gap-2"><Timer size={15} className="text-accent" aria-hidden /> Tempo médio de aprovação</span>
              <span className="text-[15px] font-extrabold text-primary tabular-nums">{productivity.avgH} h</span>
            </div>
            <ProgressBar value={Math.min(100, (48 - Math.min(48, productivity.avgH)) / 48 * 100)} tone="accent" />
            <p className="text-[11.5px] text-subtle mt-1">Meta operacional: aprovar em até 48 h do envio</p>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[13px] font-semibold text-secondary flex items-center gap-2"><CheckCircle2 size={15} className="text-success" aria-hidden /> Preenchimentos no prazo</span>
              <span className="text-[15px] font-extrabold text-primary tabular-nums">{productivity.onTimePct}%</span>
            </div>
            <ProgressBar value={productivity.onTimePct} tone="green" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[13px] font-semibold text-secondary flex items-center gap-2"><ScanLine size={15} className="text-teal-600" aria-hidden /> Leituras OCR validadas</span>
              <span className="text-[15px] font-extrabold text-primary tabular-nums">{productivity.ocrPct}%</span>
            </div>
            <ProgressBar value={productivity.ocrPct} tone="accent" />
            <p className="text-[11.5px] text-subtle mt-1">{productivity.detsTotal} leituras registradas · confirmação humana obrigatória</p>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div>
              <h2 className="section-title flex items-center gap-2"><AlertTriangle size={16} className="text-warning" aria-hidden /> Prazos e pendências</h2>
              <p className="text-[12px] text-subtle">Prazo de preenchimento: 48 h após o envio do link</p>
            </div>
            <Link to="/relatorios" className="link text-[12.5px]">Ver todos</Link>
          </div>
          {deadlines.length === 0 ? (
            <EmptyState title="Nenhuma pendência de prazo" description="Todos os relatórios foram preenchidos dentro do fluxo." />
          ) : (
            <div className="divide-y divide-border/70">
              {deadlines.slice(0, 5).map((r) => {
                const dl = deadlineLabel(r.prazoEm);
                const colab = users.find((u) => u.id === r.colaboradorId);
                const client = clients.find((c) => c.id === r.clienteId);
                return (
                  <div key={r.id} className="flex items-center gap-3 px-5 py-3">
                    <Avatar nome={colab?.nome ?? '?'} size="sm" />
                    <div className="min-w-0 flex-1">
                      <Link to={`/relatorios/${r.id}`} className="text-[13.5px] font-bold text-primary hover:text-accent">
                        {r.codigo}
                      </Link>
                      <div className="text-[12px] text-subtle truncate">{colab?.nome} · {client?.nome}</div>
                    </div>
                    <div className="hidden sm:block"><StatusBadge status={r.status} /></div>
                    <Badge tone={dl.tom === 'late' ? 'red' : dl.tom === 'warn' ? 'amber' : 'slate'} dot>{dl.texto}</Badge>
                    {hoursUntil(r.prazoEm) < 24 && (
                      <Button size="sm" variant="outline" icon={<BellRing size={13} />}
                        onClick={() => { sendReminder(r.id, user.nome); toast(`Lembrete enviado a ${colab?.nome} (simulação).`, 'info'); }}>
                        Lembrar
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Atividades recentes */}
      <div className="card">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="section-title">Atividades recentes</h2>
          <Link to="/documentos" className="link text-[12.5px] flex items-center gap-1">Arquivo de documentos <ArrowRight size={13} aria-hidden /></Link>
        </div>
        <div className="divide-y divide-border/70">
          {activity.map((a) => (
            <Link key={a.id} to={`/relatorios/${a.reportId}`} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/40 transition-colors">
              <Avatar nome={a.ator} size="sm" />
              <div className="min-w-0 flex-1">
                <span className="text-[13.5px] font-semibold text-foreground">{a.acao}</span>
                <span className="text-[12.5px] text-subtle"> · {a.codigo}</span>
                {a.detalhe && <div className="text-[12px] text-subtle truncate">{a.detalhe}</div>}
              </div>
              <span className="text-[11.5px] text-subtle whitespace-nowrap">{timeAgo(a.em)} · {a.ator.split(' ')[0]}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
