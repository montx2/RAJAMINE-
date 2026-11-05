import { useId, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import type { Notification as AppNotification } from '../data/types';
import { cn } from '../lib/cn';
import { timeAgo } from '../lib/format';
import { useDialogBehavior } from '../lib/useDialog';

interface Props {
  /** Já filtradas para a pessoa logada. */
  notifications: AppNotification[];
  /** Chamada ao escolher uma notificação; o popover fecha antes. */
  onSelect: (n: AppNotification) => void;
  onMarkAllRead?: () => void;
  /** Atributo `data-tour` do botão (âncora do tutorial). */
  tourId?: string;
  /** Texto do rótulo da região, para leitores de tela. */
  className?: string;
}

/**
 * Sino de notificações com painel suspenso. Compartilhado pelos dois shells
 * (gestão e motorista): o botão anuncia `aria-expanded`/`aria-controls`,
 * Esc fecha, o foco entra no painel ao abrir e volta ao sino ao fechar.
 * Clicar fora fecha (camada transparente); o teclado usa Esc.
 */
export default function NotificationsPopover({ notifications, onSelect, onMarkAllRead, tourId, className }: Props) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const close = () => setOpen(false);
  useDialogBehavior(panelRef, open, close, { trapFocus: false, lockScroll: false });

  const unread = notifications.filter((n) => !n.lida).length;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        data-tour={tourId}
        className={cn('press relative p-2.5 rounded-xl text-secondary hover:bg-primary/5 cursor-pointer', className)}
        aria-label={`Notificações${unread ? ` (${unread} não lidas)` : ''}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
      >
        <Bell size={18} aria-hidden />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-white dark:text-[#18181b] text-xs font-bold leading-none flex items-center justify-center" aria-hidden>
            {unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={close} aria-hidden />
          <div
            ref={panelRef}
            id={panelId}
            role="dialog"
            aria-label="Notificações"
            tabIndex={-1}
            className="absolute right-0 mt-2 w-[min(380px,calc(100vw-2rem))] glass-strong rounded-2xl z-40 overflow-hidden animate-scale-in outline-none"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-primary/8">
              <span className="text-[13px] font-bold text-primary">Notificações</span>
              {onMarkAllRead && <button type="button" onClick={onMarkAllRead} className="text-xs link">Marcar todas como lidas</button>}
            </div>
            <div className="max-h-[min(380px,60dvh)] overflow-y-auto">
              {notifications.slice(0, 12).map((n) => (
                <button
                  key={n.id}
                  type="button"
                  className={cn('w-full text-left px-4 py-3 border-b border-primary/5 hover:bg-primary/[0.03] cursor-pointer transition-colors', !n.lida && 'bg-accent-soft/30')}
                  onClick={() => { close(); onSelect(n); }}
                >
                  <div className="flex items-start gap-2.5">
                    {!n.lida && <span className="w-2 h-2 rounded-full bg-accent mt-1.5 shrink-0 animate-pulse-dot" aria-hidden />}
                    <div className={cn('min-w-0', n.lida && 'pl-[18px]')}>
                      <div className="text-[13px] font-semibold text-foreground">
                        {!n.lida && <span className="sr-only">Não lida: </span>}{n.titulo}
                      </div>
                      <div className="text-xs text-subtle line-clamp-2 mt-0.5">{n.mensagem}</div>
                      <div className="text-xs text-subtle mt-1">{timeAgo(n.criadaEm)}</div>
                    </div>
                  </div>
                </button>
              ))}
              {notifications.length === 0 && <p className="px-4 py-8 text-center text-[13px] text-subtle">Nenhuma notificação.</p>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
