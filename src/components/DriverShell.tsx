import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Home, ClipboardCheck, AlertTriangle, History, GraduationCap, LogOut,
  RefreshCw, Wifi, WifiOff, ShieldCheck, CircleHelp,
} from 'lucide-react';
import { useStore, useCurrentUser } from '../store/useStore';
import { cn } from '../lib/cn';
import { Avatar, Badge, toast } from './ui';
import { LogoMark, Wordmark } from './Logo';
import ThemeToggle from './ThemeToggle';
import NotificationsPopover from './NotificationsPopover';
import OnboardingTour from './OnboardingTour';
import PageFallback from './PageFallback';

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
  const mainRef = useRef<HTMLElement>(null);
  const firstRender = useRef(true);
  const [syncing, setSyncing] = useState(false);

  const pending = queue.filter((q) => q.status === 'pendente').length;
  const myNotifs = useMemo(() => {
    if (!user) return [];
    return notifications.filter((n) => n.userId === user.id || (n.para === 'motorista' && !n.userId));
  }, [notifications, user]);

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

  // Avisa a troca de tela a leitores de tela levando o foco ao conteúdo.
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    mainRef.current?.focus({ preventScroll: true });
  }, [location.pathname]);

  if (!user) return null;

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <a href="#driver-main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-xl focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground">
        Pular para o conteúdo
      </a>

      <header className="sticky top-0 z-30 glass-bar border-b border-primary/8 pt-safe">
        <div className="mx-auto flex h-[58px] max-w-3xl items-center gap-3 px-4">
          <LogoMark size={32} />
          <div className="min-w-0 flex-1">
            <Wordmark className="text-[18px] hidden min-[420px]:block" light={false} />
            <div className="text-xs font-medium text-accent whitespace-nowrap min-[420px]:mt-1">
              <span className="min-[420px]:hidden">Motorista</span>
              <span className="hidden min-[420px]:inline">Portal do motorista</span>
            </div>
          </div>
          <Badge tone={online ? 'green' : 'amber'} dot className="hidden sm:inline-flex">
            {online ? <Wifi size={11} aria-hidden /> : <WifiOff size={11} aria-hidden />}
            {online ? 'Online' : 'Offline'}
          </Badge>
          <button
            type="button"
            onClick={() => doSync()}
            data-tour="driver-sync"
            className="press relative rounded-xl p-2.5 text-secondary hover:bg-primary/5 cursor-pointer"
            aria-label={`Sincronizar${pending ? ` (${pending} pendentes)` : ''}`}
            title="Sincronização simulada"
          >
            <RefreshCw size={17} className={cn(syncing && 'animate-spin')} aria-hidden />
            {pending > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 rounded-full bg-accent text-accent-foreground text-xs font-bold flex items-center justify-center">{pending}</span>}
          </button>
          <NotificationsPopover
            notifications={myNotifs}
            onSelect={(n) => {
              markRead(n.id);
              if (n.occurrenceId) navigate('/motorista/ocorrencias');
              else if (n.checklistId) navigate('/motorista/historico');
            }}
          />
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('safip-start-tour'))}
            className="press rounded-xl p-2.5 text-secondary hover:bg-primary/5 cursor-pointer"
            aria-label="Abrir tutorial"
            title="Tutorial — como usar o portal"
          >
            <CircleHelp size={17} aria-hidden />
          </button>
          <ThemeToggle />
          <button
            type="button"
            onClick={() => { logout(); navigate('/login'); }}
            className="press rounded-xl p-2.5 text-secondary hover:bg-primary/5 cursor-pointer"
            aria-label="Sair"
          >
            <LogOut size={17} aria-hidden />
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

      <main id="driver-main" ref={mainRef} tabIndex={-1} key={location.pathname} className="page-enter mx-auto w-full max-w-3xl flex-1 px-4 py-5 pb-nav-driver outline-none">
        <div className="mb-4 flex items-center gap-3">
          <Avatar nome={user.nome} />
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-bold text-primary truncate">{user.nome}</div>
            <div className="text-xs text-subtle truncate">{user.cargo}</div>
          </div>
        </div>
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
        <p className="mt-8 flex items-start gap-2 text-xs text-subtle leading-relaxed">
          <ShieldCheck size={13} className="mt-0.5 shrink-0" aria-hidden />
          Protótipo: notificações e sincronização são simuladas. O motorista reporta; a coordenação humana decide. Nenhum documento de cliente é liberado automaticamente.
        </p>
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-30 glass-bar border-t border-primary/8 pb-safe" aria-label="Navegação do motorista">
        <div className="mx-auto flex max-w-3xl">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              data-tour={`driver-nav-${item.to.split('/').pop()}`}
              className={({ isActive }) => cn(
                'flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-semibold transition-colors min-h-[56px]',
                isActive ? 'text-accent' : 'text-subtle hover:text-secondary',
              )}
            >
              <item.icon size={19} aria-hidden />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      <OnboardingTour variant="motorista" />
    </div>
  );
}
