import { useMemo, useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FileText, ClipboardCheck, Cpu, Truck, Users, Archive,
  Bell, LogOut, Menu, X, ChevronRight, PenLine, Table2, CalendarRange, AlertTriangle, CircleHelp,
} from 'lucide-react';
import { useStore, useCurrentUser } from '../store/useStore';
import { ROLE_LABEL } from '../data/types';
import type { Role } from '../data/types';
import { cn } from '../lib/cn';
import { timeAgo } from '../lib/format';
import { Avatar } from './ui';
import { Logo } from './Logo';
import ThemeToggle from './ThemeToggle';
import OnboardingTour from './OnboardingTour';

interface NavItem { to: string; label: string; short: string; icon: typeof LayoutDashboard; roles: Role[]; group: string }

const NAV: NavItem[] = [
  { to: '/', label: 'Dashboard', short: 'Início', icon: LayoutDashboard, roles: ['admin', 'revisora'], group: 'Principal' },
  { to: '/relatorios', label: 'Relatórios', short: 'Relatórios', icon: FileText, roles: ['admin', 'revisora', 'colaborador'], group: 'Principal' },
  { to: '/revisao', label: 'Central de Revisão', short: 'Revisão', icon: ClipboardCheck, roles: ['admin', 'revisora'], group: 'Principal' },
  { to: '/operacoes', label: 'Operações de campo', short: 'Operações', icon: Table2, roles: ['admin', 'revisora', 'colaborador'], group: 'Campo' },
  { to: '/semanal', label: 'Consolidado semanal', short: 'Semanal', icon: CalendarRange, roles: ['admin', 'revisora'], group: 'Campo' },
  { to: '/equipamentos', label: 'Equipamentos & IDs', short: 'Equipamentos', icon: Cpu, roles: ['admin', 'revisora'], group: 'Campo' },
  { to: '/caminhoes', label: 'Caminhões / Frota', short: 'Frota', icon: Truck, roles: ['admin', 'revisora'], group: 'Campo' },
  { to: '/ocorrencias', label: 'Ocorrências', short: 'Ocorrências', icon: AlertTriangle, roles: ['admin', 'revisora'], group: 'Campo' },
  { to: '/cadastros', label: 'Equipe & clientes', short: 'Cadastros', icon: Users, roles: ['admin'], group: 'Gestão' },
  { to: '/documentos', label: 'Arquivo de Documentos', short: 'Documentos', icon: Archive, roles: ['admin', 'revisora'], group: 'Gestão' },
];

export default function AppShell() {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useStore((s) => s.logout);
  const notifications = useStore((s) => s.notifications);
  const reports = useStore((s) => s.reports);
  const markRead = useStore((s) => s.markNotificationRead);
  const markAllRead = useStore((s) => s.markAllRead);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const myNotifs = useMemo(() => {
    if (!user) return [];
    return notifications.filter((n) => {
      if (user.role === 'colaborador') {
        const r = reports.find((x) => x.id === n.reportId);
        return n.para === 'todos' || (r && r.colaboradorId === user.id) || n.para === 'colaborador';
      }
      return n.para === 'todos' || n.para === user.role;
    });
  }, [notifications, user, reports]);
  const unread = myNotifs.filter((n) => !n.lida).length;

  if (!user) return null;
  const items = NAV.filter((n) => n.roles.includes(user.role));
  const groups = ['Principal', 'Campo', 'Gestão'].map((g) => ({ name: g, items: items.filter((i) => i.group === g) })).filter((g) => g.items.length);

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="px-5 pt-6 pb-5">
        <Logo />
      </div>
      <nav className="flex-1 px-3 space-y-5 overflow-y-auto" aria-label="Navegação principal">
        {groups.map((g) => (
          <div key={g.name}>
            <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">{g.name}</div>
            <div className="space-y-0.5">
              {g.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setMobileOpen(false)}
                  data-tour={item.to === '/relatorios' ? 'nav-relatorios' : item.to === '/revisao' ? 'nav-revisao' : undefined}
                  className={({ isActive }) => cn(
                    'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-[background-color,color,transform] duration-150 ease-out',
                    isActive
                      ? 'bg-white/10 text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)]'
                      : 'text-zinc-300 hover:text-white hover:bg-white/5',
                  )}
                >
                  {({ isActive }) => (
                    <>
                      <span className={cn('flex items-center justify-center w-7 h-7 rounded-lg transition-colors', isActive ? 'bg-brand text-[#18181b]' : 'bg-white/[0.07] text-zinc-300 group-hover:text-white')}>
                        <item.icon size={15} aria-hidden />
                      </span>
                      <span className="truncate">{item.label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <Avatar nome={user.nome} />
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-bold text-white truncate">{user.nome}</div>
            <div className="text-[11px] text-zinc-400">{ROLE_LABEL[user.role]}</div>
          </div>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="press p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer"
            aria-label="Sair"
            title="Sair"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex">
      {/* Sidebar desktop — vidro escuro */}
      <aside className="hidden lg:flex w-[248px] shrink-0 glass-dark flex-col fixed inset-y-0 z-30 border-r border-white/10">
        {sidebar}
      </aside>

      {/* Sidebar mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40 animate-fade-in" style={{ backdropFilter: 'blur(4px)' }} onClick={() => setMobileOpen(false)} aria-hidden />
          <aside className="absolute inset-y-0 left-0 w-[272px] glass-dark animate-slide-in-right border-r border-white/10">
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-3 p-2 text-zinc-400 hover:text-white cursor-pointer z-10" aria-label="Fechar menu">
              <X size={18} />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <OnboardingTour />
      <div className="flex-1 lg:ml-[248px] flex flex-col min-w-0">
        {/* Topbar — vidro claro, mínima */}
        <header className="sticky top-0 z-20 glass border-b border-primary/8">
          <div className="flex items-center gap-3 px-4 sm:px-6 h-[58px]">
            <button className="lg:hidden press p-2 -ml-2 rounded-xl text-secondary hover:bg-primary/5 cursor-pointer" onClick={() => setMobileOpen(true)} aria-label="Abrir menu">
              <Menu size={20} />
            </button>
            <div className="lg:hidden"><Logo compact /></div>

            <div className="flex-1" />
            <div className="relative">
              <button
                onClick={() => setNotifOpen((v) => !v)}
                data-tour="notifications"
                className="press relative p-2.5 rounded-xl text-secondary hover:bg-primary/5 cursor-pointer"
                aria-label={`Notificações${unread ? ` (${unread} não lidas)` : ''}`}
              >
                <Bell size={18} />
                {unread > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-destructive text-white dark:text-[#18181b] text-[10px] font-bold flex items-center justify-center">
                    {unread}
                  </span>
                )}
              </button>
              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} aria-hidden />
                  <div className="absolute right-0 mt-2 w-[min(380px,calc(100vw-2rem))] glass-strong rounded-2xl z-40 overflow-hidden animate-scale-in">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-primary/8">
                      <span className="text-[13px] font-bold text-primary">Notificações</span>
                      <button onClick={markAllRead} className="text-[12px] link">Marcar todas como lidas</button>
                    </div>
                    <div className="max-h-[380px] overflow-y-auto">
                      {myNotifs.slice(0, 12).map((n) => (
                        <button
                          key={n.id}
                          className={cn('w-full text-left px-4 py-3 border-b border-primary/5 hover:bg-primary/[0.03] cursor-pointer transition-colors', !n.lida && 'bg-accent-soft/30')}
                          onClick={() => {
                            markRead(n.id);
                            setNotifOpen(false);
                            if (n.occurrenceId) navigate('/ocorrencias');
                            else if (n.reportId) navigate(`/relatorios/${n.reportId}`);
                          }}
                        >
                          <div className="flex items-start gap-2.5">
                            {!n.lida && <span className="w-2 h-2 rounded-full bg-accent mt-1.5 shrink-0 animate-pulse-dot" aria-hidden />}
                            <div className={cn('min-w-0', n.lida && 'pl-[18px]')}>
                              <div className="text-[13px] font-semibold text-foreground">{n.titulo}</div>
                              <div className="text-[12px] text-subtle line-clamp-2 mt-0.5">{n.mensagem}</div>
                              <div className="text-[11px] text-subtle/80 mt-1">{timeAgo(n.criadaEm)}</div>
                            </div>
                          </div>
                        </button>
                      ))}
                      {myNotifs.length === 0 && <p className="px-4 py-8 text-center text-[13px] text-subtle">Nenhuma notificação.</p>}
                    </div>
                  </div>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('safip-start-tour'))}
              className="press p-2.5 rounded-xl text-secondary hover:bg-primary/5 cursor-pointer"
              aria-label="Abrir tutorial"
              title="Tutorial — como usar o sistema"
            >
              <CircleHelp size={18} />
            </button>
            <ThemeToggle />
          </div>
        </header>

        <main key={location.pathname} className="page-enter flex-1 px-4 sm:px-6 py-6 max-w-[1520px] w-full mx-auto pb-24 lg:pb-10">
          <Outlet />
        </main>
      </div>

      {/* Navegação inferior mobile — vidro */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 glass border-t border-primary/8 flex" aria-label="Navegação rápida">
        {items.slice(0, 4).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => cn('flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition-colors', isActive ? 'text-accent' : 'text-subtle')}
          >
            <item.icon size={19} aria-hidden />
            {item.short}
          </NavLink>
        ))}
        <button onClick={() => setMobileOpen(true)} className="flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold text-subtle cursor-pointer">
          <ChevronRight size={19} aria-hidden />
          Mais
        </button>
      </nav>
    </div>
  );
}

export function PageHeader({ title, subtitle, actions, eyebrow }: { title: string; subtitle?: string; actions?: React.ReactNode; eyebrow?: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-6" data-tour="page-header">
      <div className="min-w-0">
        {eyebrow && <div className="eyebrow mb-1">{eyebrow}</div>}
        <h1 className="text-[24px] font-semibold tracking-tight text-primary text-balance">{title}</h1>
        {subtitle && <p className="text-[13px] text-subtle mt-1 max-w-2xl">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export { PenLine };
