import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Home, ClipboardCheck, AlertTriangle, History, GraduationCap, LogOut, Bell,
  RefreshCw, Wifi, WifiOff, ShieldCheck,
} from 'lucide-react';
import { useStore, useCurrentUser } from '../store/useStore';
import { cn } from '../lib/cn';
import { timeAgo } from '../lib/format';
import { Avatar, Badge, toast } from './ui';
import { LogoMark, Wordmark } from './Logo';
import ThemeToggle from './ThemeToggle';

const NAV = [
  { to: '/motorista', label: 'Início', icon: Home, end: true },
  { to: '/motorista/checklist', label: 'Checklist', icon: ClipboardCheck, end: false },
  { to: '/motorista/ocorrencias', label: 'Ocorrências', icon: AlertTriangle, end: false },
  { to: '/motorista/historico', label: 'Histórico', icon: History, end: false },
  { to: '/motorista/treinamento', label: 'Treino', icon: GraduationCap, end: false },
];

/** Layout mobile-first do Portal do Motorista (PWA). */
export default function DriverShell() {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useStore((s) => s.logout);
  const notifications = useStore((s) => s.notifications);
  const markRead = useStore((s) => s.markNotificationRead);
  const syncQueue = useStore((s) => s.syncDriverQueue);
  const queue = useStore((s) => s.driverSyncQueue);
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [notifOpen, setNotifOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const pending = queue.filter((q) => q.status === 'pendente').length;
  const myNotifs = useMemo(() => {
    if (!user) return [];
    return notifications.filter((n) => n.userId === user.id || (n.para === 'motorista' && !n.userId));
  }, [notifications, user]);
  const unread = myNotifs.filter((n) => !n.lida).length;

  const doSync = (silent = false) => {
    if (!navigator.onLine) {
      if (!silent) toast('Sem conexão. Os registros continuam salvos localmente e serão sincronizados depois.', 'info');
      return;
    }
    setSyncing(true);
    // Sincronização SIMULADA: em produção seria uma chamada de API com fila retry.
    setTimeout(() => {
      const n = syncQueue();
      setSyncing(false);
      if (n > 0) toast(`${n} registro(s) sincronizados (simulação).`);
      else if (!silent) toast('Nada pendente para sincronizar.', 'info');
    }, 600);
  };

  useEffect(() => {
    const on = () => { setOnline(true); doSync(true); };
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    const t = setInterval(() => { if (navigator.onLine) doSync(true); }, 20000);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); clearInterval(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <a href="#driver-main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-xl focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground">
        Pular para o conteúdo
      </a>

      <header className="sticky top-0 z-30 glass border-b border-primary/8">
        <div className="mx-auto flex h-[58px] max-w-3xl items-center gap-3 px-4">
          <LogoMark size={30} />
          <div className="min-w-0 flex-1">
            <Wordmark className="text-[15px]" light={false} />
            <div className="text-[9.5px] font-bold tracking-[0.18em] text-accent">PORTAL DO MOTORISTA</div>
          </div>
          <Badge tone={online ? 'green' : 'amber'} dot className="hidden sm:inline-flex">
            {online ? <Wifi size={11} aria-hidden /> : <WifiOff size={11} aria-hidden />}
            {online ? 'Online' : 'Offline'}
          </Badge>
          <button
            type="button"
            onClick={() => doSync()}
            className="press relative rounded-xl p-2.5 text-secondary hover:bg-primary/5 cursor-pointer"
            aria-label={`Sincronizar${pending ? ` (${pending} pendentes)` : ''}`}
            title="Sincronização simulada"
          >
            <RefreshCw size={17} className={cn(syncing && 'animate-spin')} />
            {pending > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center">{pending}</span>}
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setNotifOpen((v) => !v)}
              className="press relative rounded-xl p-2.5 text-secondary hover:bg-primary/5 cursor-pointer"
              aria-label={`Notificações${unread ? ` (${unread} não lidas)` : ''}`}
            >
              <Bell size={17} />
              {unread > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 rounded-full bg-destructive text-white dark:text-[#18181b] text-[10px] font-bold flex items-center justify-center">{unread}</span>}
            </button>
            {notifOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} aria-hidden />
                <div className="absolute right-0 mt-2 w-[min(360px,calc(100vw-2rem))] glass-strong rounded-2xl z-40 overflow-hidden animate-scale-in">
                  <div className="px-4 py-3 border-b border-primary/8 text-[13px] font-bold text-primary">Notificações</div>
                  <div className="max-h-[360px] overflow-y-auto">
                    {myNotifs.slice(0, 12).map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        className={cn('w-full text-left px-4 py-3 border-b border-primary/5 hover:bg-primary/[0.03] cursor-pointer', !n.lida && 'bg-accent-soft/30')}
                        onClick={() => {
                          markRead(n.id);
                          setNotifOpen(false);
                          if (n.occurrenceId) navigate('/motorista/ocorrencias');
                          else if (n.checklistId) navigate('/motorista/historico');
                        }}
                      >
                        <div className="text-[13px] font-semibold text-foreground">{n.titulo}</div>
                        <div className="text-[12px] text-subtle line-clamp-2 mt-0.5">{n.mensagem}</div>
                        <div className="text-[11px] text-subtle mt-1">{timeAgo(n.criadaEm)}</div>
                      </button>
                    ))}
                    {myNotifs.length === 0 && <p className="px-4 py-8 text-center text-[13px] text-subtle">Nenhuma notificação.</p>}
                  </div>
                </div>
              </>
            )}
          </div>
          <ThemeToggle />
          <button
            type="button"
            onClick={() => { logout(); navigate('/login'); }}
            className="press rounded-xl p-2.5 text-secondary hover:bg-primary/5 cursor-pointer"
            aria-label="Sair"
          >
            <LogOut size={17} />
          </button>
        </div>
      </header>

      {!online && (
        <div className="bg-warning-soft border-b border-warning/20 px-4 py-2 text-center text-[12px] font-semibold text-warning">
          Modo offline — checklist, ocorrências e ciência ficam salvos no aparelho e sincronizam depois (simulação).
        </div>
      )}
      {pending > 0 && online && (
        <button type="button" onClick={() => doSync()} className="bg-accent-soft border-b border-accent/20 px-4 py-2 text-center text-[12px] font-semibold text-accent cursor-pointer">
          {pending} registro(s) aguardando sincronização — toque para sincronizar (simulação)
        </button>
      )}

      <main id="driver-main" key={location.pathname} className="page-enter mx-auto w-full max-w-3xl flex-1 px-4 py-5 pb-28">
        <div className="mb-4 flex items-center gap-3">
          <Avatar nome={user.nome} />
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-bold text-primary truncate">{user.nome}</div>
            <div className="text-[11.5px] text-subtle truncate">{user.cargo}</div>
          </div>
        </div>
        <Outlet />
        <p className="mt-8 flex items-start gap-2 text-[11px] text-subtle leading-relaxed">
          <ShieldCheck size={13} className="mt-0.5 shrink-0" aria-hidden />
          Protótipo: notificações e sincronização são simuladas. O motorista reporta; a coordenação humana decide. Nenhum documento de cliente é liberado automaticamente.
        </p>
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-30 glass border-t border-primary/8" aria-label="Navegação do motorista">
        <div className="mx-auto flex max-w-3xl">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => cn(
                'flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition-colors min-h-[56px]',
                isActive ? 'text-accent' : 'text-subtle hover:text-secondary',
              )}
            >
              <item.icon size={19} aria-hidden />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
