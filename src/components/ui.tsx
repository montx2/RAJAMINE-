import { cloneElement, isValidElement, useEffect, useId, useRef, useState, type ReactElement, type ReactNode, type ButtonHTMLAttributes, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { create } from 'zustand';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, AlertTriangle, Info, Loader2, Inbox, ChevronDown } from 'lucide-react';
import { cn } from '../lib/cn';
import { initials } from '../lib/format';
import { useDialogBehavior } from '../lib/useDialog';
import type { ReportStatus } from '../data/types';
import { STATUS_LABEL } from '../data/types';

/* ── Button ── */
type BtnVariant = 'primary' | 'outline' | 'ghost' | 'danger' | 'success';
interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
}
export function Button({ variant = 'primary', size = 'md', loading, icon, className, children, disabled, type = 'button', ...rest }: BtnProps) {
  const base = 'press inline-flex items-center justify-center gap-2 font-semibold rounded-xl cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out';
  const variants: Record<BtnVariant, string> = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_6px_16px_-8px_rgb(24_24_27/0.5)]',
    outline: 'glass text-secondary hover:border-accent/30 hover:text-primary',
    ghost: 'text-secondary hover:bg-primary/5',
    danger: 'bg-destructive text-white dark:text-[#18181b] hover:bg-destructive/90',
    success: 'bg-success text-white dark:text-[#18181b] hover:bg-success/90',
  };
  const sizes = { sm: 'text-[12.5px] px-3 py-1.5 min-h-[34px]', md: 'text-[13.5px] px-4 py-2.5 min-h-[42px]', lg: 'text-[14.5px] px-5 py-3 min-h-[48px]' };
  return (
    <button type={type} className={cn(base, variants[variant], sizes[size], className)} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading ? <Loader2 size={16} className="animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
}

/* ── Badge ── */
type Tone = 'slate' | 'blue' | 'green' | 'amber' | 'red';
export function Badge({ tone = 'slate', children, className, dot }: { tone?: Tone; children: ReactNode; className?: string; dot?: boolean }) {
  const tones: Record<Tone, string> = {
    slate: 'bg-primary/5 text-secondary border-primary/10',
    blue: 'bg-info-soft text-info border-info/25',
    green: 'bg-success-soft/70 text-success border-success/20',
    amber: 'bg-warning-soft/70 text-warning border-warning/20',
    red: 'bg-destructive-soft/70 text-destructive border-destructive/20',
  };
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap', tones[tone], className)}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  );
}

export function StatusBadge({ status, className }: { status: ReportStatus; className?: string }) {
  const map: Record<ReportStatus, Tone> = {
    pendente: 'amber', rascunho: 'slate', em_revisao: 'blue', correcao: 'red', aprovado: 'green', arquivado: 'slate',
  };
  return <Badge tone={map[status]} dot className={className}>{STATUS_LABEL[status]}</Badge>;
}

/* ── Form fields ── */
type FieldChildProps = {
  id?: string; required?: boolean; 'aria-invalid'?: boolean; 'aria-describedby'?: string;
};

/**
 * Rótulo + controle + dica/erro. O controle filho recebe `id`, `required`,
 * `aria-invalid` e `aria-describedby` automaticamente: leitores de tela anunciam
 * o rótulo, a obrigatoriedade, o estado inválido e a mensagem de erro/dica.
 * `action` ocupa o lado direito do rótulo (ex.: "Esqueci minha senha").
 */
export function Field({ label, error, hint, required, children, htmlFor, action }: {
  label: string; error?: string; hint?: string; required?: boolean; children: ReactNode; htmlFor?: string; action?: ReactNode;
}) {
  const uid = useId();
  const id = htmlFor ?? uid;
  const msgId = `${id}-msg`;
  const hasMsg = Boolean(error || hint);
  const control = isValidElement(children)
    ? cloneElement(children as ReactElement<FieldChildProps>, {
        id,
        required: required || (children.props as FieldChildProps).required,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': hasMsg ? msgId : undefined,
      })
    : children;
  return (
    <div>
      <div className={action ? 'flex items-center justify-between gap-3 mb-1.5' : undefined}>
        <label className={cn('label', action ? 'mb-0' : undefined)} htmlFor={id}>
          {label} {required && <span className="text-destructive" aria-hidden>*</span>}
        </label>
        {action}
      </div>
      {control}
      {hasMsg && (
        <p id={msgId} className={cn('mt-1 text-xs', error ? 'text-destructive font-medium' : 'text-subtle')} role={error ? 'alert' : undefined}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}

export function Input({ className, invalid, ...rest }: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return <input className={cn('input', invalid && 'input-error', className)} {...rest} />;
}
export function Select({ className, invalid, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return <select className={cn('input select', invalid && 'input-error', className)} {...rest}>{children}</select>;
}
export function Textarea({ className, invalid, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return <textarea className={cn('input min-h-[120px] leading-relaxed', invalid && 'input-error', className)} {...rest} />;
}

/* ── Modal ── */
export function Modal({ open, onClose, title, children, wide, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean; footer?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useDialogBehavior(ref, open, onClose);

  if (!open) return null;
  // Portal para o body: as páginas usam `.page-enter` (animação com transform),
  // que cria contexto de empilhamento e prenderia o diálogo abaixo das barras
  // fixas de navegação — no celular os botões do rodapé ficavam inacessíveis.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={onClose} aria-hidden />
      <div ref={ref} tabIndex={-1} className={cn('relative glass-strong w-full rounded-t-3xl sm:rounded-3xl max-h-[92dvh] flex flex-col animate-scale-in outline-none pb-safe sm:pb-0', wide ? 'sm:max-w-4xl' : 'sm:max-w-lg')}>
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-primary/8 shrink-0">
          <h2 id={titleId} className="text-[18px] font-semibold text-primary tracking-tight">{title}</h2>
          <button type="button" onClick={onClose} className="press p-2 rounded-xl text-subtle hover:bg-primary/5 hover:text-secondary cursor-pointer" aria-label="Fechar">
            <X size={18} aria-hidden />
          </button>
        </div>
        <div className="px-5 sm:px-6 py-5 overflow-y-auto">{children}</div>
        {footer && <div className="px-5 sm:px-6 py-4 border-t border-primary/8 flex justify-end gap-2 shrink-0">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

/* ── Tabs (alternância de visões) ──
   Não há painéis ARIA ligados a estas abas, então o padrão `tablist` prometeria
   navegação por setas e `aria-controls` que não existem. Como grupo de botões
   com `aria-pressed`, o teclado (Tab/Enter/Espaço) e o leitor de tela se comportam
   exatamente como anunciado. */
export function Tabs({ tabs, active, onChange, label = 'Visões' }: { tabs: Array<{ id: string; label: string; icon?: ReactNode; count?: number }>; active: string; onChange: (id: string) => void; label?: string }) {
  return (
    <div className="glass inline-flex flex-wrap max-w-full gap-1 rounded-2xl p-1" role="group" aria-label={label}>
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          aria-pressed={active === t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            'press flex items-center gap-2 rounded-xl px-3.5 py-2 text-[13px] font-semibold whitespace-nowrap cursor-pointer transition-[background-color,color,box-shadow] duration-150',
            active === t.id ? 'bg-primary text-primary-foreground shadow-[0_6px_16px_-8px_rgb(24_24_27/0.5)]' : 'text-subtle hover:text-primary hover:bg-primary/5',
          )}
        >
          {t.icon}
          {t.label}
          {t.count != null && t.count > 0 && (
            <span className={cn('rounded-full px-1.5 py-0.5 text-xs font-bold min-w-[20px] text-center', active === t.id ? 'bg-primary-foreground/15 text-primary-foreground' : 'bg-primary/8 text-subtle')}>{t.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

/* ── Disclosure (progressive disclosure) ── */
export function Disclosure({ title, subtitle, children, defaultOpen = false, className, action }: {
  title: string; subtitle?: string; children: ReactNode; defaultOpen?: boolean; className?: string; action?: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={cn('card overflow-hidden', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center gap-3 px-5 py-4 text-left cursor-pointer hover:bg-primary/[0.03] transition-colors"
      >
        <div className="min-w-0 flex-1">
          <div className="section-title">{title}</div>
          {subtitle && <div className="text-[12px] text-subtle mt-0.5">{subtitle}</div>}
        </div>
        {action}
        <ChevronDown size={16} className={cn('text-subtle shrink-0 transition-transform duration-200', open && 'rotate-180')} aria-hidden />
      </button>
      {open && <div className="px-5 pb-5 animate-fade-in">{children}</div>}
    </div>
  );
}

/* ── Empty state ── */
export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6 animate-fade-in">
      <div className="w-12 h-12 rounded-2xl glass flex items-center justify-center text-subtle mb-4">
        {icon ?? <Inbox size={22} />}
      </div>
      <h3 className="text-[15px] font-bold text-primary">{title}</h3>
      {description && <p className="mt-1 text-[13px] text-subtle max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ── Avatar ── */
const AVATAR_COLORS = ['bg-zinc-700', 'bg-stone-600', 'bg-neutral-600', 'bg-zinc-600', 'bg-stone-700', 'bg-neutral-700'];
export function Avatar({ nome, size = 'md' }: { nome: string; size?: 'sm' | 'md' | 'lg' }) {
  const idx = nome.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length;
  const sizes = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-[12px]', lg: 'w-12 h-12 text-[15px]' };
  return (
    <span className={cn('inline-flex items-center justify-center rounded-full text-white font-bold shrink-0 ring-2 ring-surface/60', AVATAR_COLORS[idx], sizes[size])} aria-hidden>
      {initials(nome)}
    </span>
  );
}

/* ── Progress ── */
export function ProgressBar({ value, tone = 'accent', label = 'Progresso' }: { value: number; tone?: 'accent' | 'green' | 'amber'; label?: string }) {
  const colors = { accent: 'bg-accent', green: 'bg-success', amber: 'bg-amber-500' };
  return (
    <div className="h-1.5 w-full rounded-full bg-primary/8 overflow-hidden" role="progressbar" aria-label={label} aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn('h-full rounded-full transition-[width] duration-500 ease-out', colors[tone])} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

/* ── Toasts ── */
interface Toast { id: string; tipo: 'success' | 'error' | 'info'; msg: string }
interface ToastState { toasts: Toast[]; push: (t: Omit<Toast, 'id'>) => void; remove: (id: string) => void }
export const useToasts = create<ToastState>((set) => ({
  toasts: [],
  // Máximo de 4 na tela: o mais antigo sai quando chega o quinto.
  push: (t) => set((s) => ({ toasts: [...s.toasts, { ...t, id: Math.random().toString(36).slice(2) }].slice(-4) })),
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));

export function toast(msg: string, tipo: Toast['tipo'] = 'success') {
  useToasts.getState().push({ msg, tipo });
}

/** Tempo na tela. Erros não somem sozinhos: a pessoa precisa conseguir ler e agir (WCAG 2.2.1). */
const TOAST_MS: Record<Toast['tipo'], number | null> = { success: 6000, info: 8000, error: null };

function ToastItem({ t, onRemove }: { t: Toast; onRemove: (id: string) => void }) {
  const [paused, setPaused] = useState(false);
  const ms = TOAST_MS[t.tipo];
  // Pausa em hover/foco e recomeça a contagem ao sair.
  useEffect(() => {
    if (ms == null || paused) return;
    const h = window.setTimeout(() => onRemove(t.id), ms);
    return () => window.clearTimeout(h);
  }, [ms, paused, onRemove, t.id]);

  return (
    <div
      role={t.tipo === 'error' ? 'alert' : 'status'}
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}
      className={cn('flex items-start gap-3 rounded-2xl border px-4 py-3 glass-strong animate-slide-in-right',
        t.tipo === 'success' && 'border-success/25', t.tipo === 'error' && 'border-destructive/40', t.tipo === 'info' && 'border-accent/25')}
    >
      {t.tipo === 'success' && <CheckCircle2 size={18} className="text-success shrink-0 mt-0.5" aria-hidden />}
      {t.tipo === 'error' && <AlertTriangle size={18} className="text-destructive shrink-0 mt-0.5" aria-hidden />}
      {t.tipo === 'info' && <Info size={18} className="text-accent shrink-0 mt-0.5" aria-hidden />}
      <p className="text-[13px] text-foreground flex-1">{t.msg}</p>
      <button type="button" onClick={() => onRemove(t.id)} className="text-subtle hover:text-secondary cursor-pointer" aria-label="Dispensar aviso"><X size={15} aria-hidden /></button>
    </div>
  );
}

export function Toaster({ className }: { className?: string }) {
  const { toasts, remove } = useToasts();
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div className={cn('fixed right-4 left-4 sm:left-auto z-[60] flex flex-col gap-2 sm:w-96', className)}>
      {toasts.map((t) => <ToastItem key={t.id} t={t} onRemove={remove} />)}
    </div>,
    document.body,
  );
}

/* ── Banner ─ */
export function Banner({ tone = 'info', icon, children, className }: { tone?: 'info' | 'warn' | 'success' | 'danger'; icon?: ReactNode; children: ReactNode; className?: string }) {
  const tones = {
    info: 'bg-info-soft border-info/20 text-secondary',
    warn: 'bg-warning-soft/60 border-warning/20 text-warning',
    success: 'bg-success-soft/60 border-success/20 text-success',
    danger: 'bg-destructive-soft/60 border-destructive/20 text-destructive',
  };
  return (
    <div className={cn('flex items-start gap-3 rounded-2xl border px-4 py-3 text-[13px] leading-relaxed animate-fade-in', tones[tone], className)}>
      {icon && <span className="shrink-0 mt-0.5">{icon}</span>}
      <div className="flex-1">{children}</div>
    </div>
  );
}

/* ── Confidence meter ── */
export function ConfidenceBar({ value }: { value: number }) {
  const tone = value >= 85 ? 'bg-success' : value >= 65 ? 'bg-amber-500' : 'bg-destructive';
  const label = value >= 85 ? 'Alta' : value >= 65 ? 'Média' : 'Baixa — conferir';
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-1.5 w-24 rounded-full bg-primary/8 overflow-hidden" aria-hidden>
        <div className={cn('h-full rounded-full transition-[width] duration-500', tone)} style={{ width: `${value}%` }} />
      </div>
      <span className={cn('text-[12px] font-bold tabular-nums', value >= 85 ? 'text-success' : value >= 65 ? 'text-warning' : 'text-destructive')}>
        {value}% · {label}
      </span>
    </div>
  );
}
