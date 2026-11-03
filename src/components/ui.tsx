import { useEffect, useRef, type ReactNode, type ButtonHTMLAttributes, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { create } from 'zustand';
import { X, CheckCircle2, AlertTriangle, Info, Loader2, Inbox } from 'lucide-react';
import { cn } from '../lib/cn';
import { initials } from '../lib/format';
import type { ReportStatus } from '../data/types';
import { STATUS_LABEL } from '../data/types';

/* ── Button ── */
type BtnVariant = 'primary' | 'accent' | 'outline' | 'ghost' | 'danger' | 'success';
interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
}
export function Button({ variant = 'primary', size = 'md', loading, icon, className, children, disabled, ...rest }: BtnProps) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-colors duration-150 cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap';
  const variants: Record<BtnVariant, string> = {
    primary: 'bg-primary text-primary-foreground hover:bg-navy-800',
    accent: 'bg-accent text-accent-foreground hover:bg-accent-hover',
    outline: 'border border-border bg-surface text-secondary hover:bg-muted hover:border-slate-300',
    ghost: 'text-secondary hover:bg-muted',
    danger: 'bg-destructive text-white hover:bg-red-700',
    success: 'bg-success text-white hover:bg-green-800',
  };
  const sizes = { sm: 'text-[13px] px-3 py-1.5 min-h-[34px]', md: 'text-[14px] px-4 py-2.5 min-h-[42px]', lg: 'text-[15px] px-5 py-3 min-h-[48px]' };
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} disabled={disabled || loading} {...rest}>
      {loading ? <Loader2 size={16} className="animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
}

/* ── Badge ── */
type Tone = 'slate' | 'blue' | 'green' | 'amber' | 'red' | 'teal' | 'violet';
export function Badge({ tone = 'slate', children, className, dot }: { tone?: Tone; children: ReactNode; className?: string; dot?: boolean }) {
  const tones: Record<Tone, string> = {
    slate: 'bg-muted text-secondary',
    blue: 'bg-accent-soft text-accent',
    green: 'bg-success-soft text-success',
    amber: 'bg-warning-soft text-warning',
    red: 'bg-destructive-soft text-destructive',
    teal: 'bg-teal-50 text-teal-700',
    violet: 'bg-violet-50 text-violet-700',
  };
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-semibold whitespace-nowrap', tones[tone], className)}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  );
}

export function StatusBadge({ status, className }: { status: ReportStatus; className?: string }) {
  const map: Record<ReportStatus, Tone> = {
    pendente: 'amber', rascunho: 'slate', em_revisao: 'blue', correcao: 'red', aprovado: 'green', arquivado: 'teal',
  };
  return <Badge tone={map[status]} dot className={className}>{STATUS_LABEL[status]}</Badge>;
}

/* ── Form fields ── */
export function Field({ label, error, hint, required, children, htmlFor }: { label: string; error?: string; hint?: string; required?: boolean; children: ReactNode; htmlFor?: string }) {
  return (
    <div>
      <label className="label" htmlFor={htmlFor}>
        {label} {required && <span className="text-destructive" aria-hidden>*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-[12.5px] text-subtle">{hint}</p>}
      {error && <p className="mt-1 text-[12.5px] text-destructive font-medium" role="alert">{error}</p>}
    </div>
  );
}

export function Input({ className, invalid, ...rest }: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return <input className={cn('input', invalid && 'input-error', className)} {...rest} />;
}
export function Select({ className, invalid, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return <select className={cn('input appearance-none bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23475569%22%20stroke-width%3D%222.5%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E")] bg-no-repeat bg-[right_12px_center] pr-9', invalid && 'input-error', className)} {...rest}>{children}</select>;
}
export function Textarea({ className, invalid, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return <textarea className={cn('input min-h-[120px] leading-relaxed', invalid && 'input-error', className)} {...rest} />;
}

/* ── Modal ── */
export function Modal({ open, onClose, title, children, wide, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean; footer?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    ref.current?.focus();
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-primary/50 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div ref={ref} tabIndex={-1} className={cn('relative bg-surface w-full rounded-t-2xl sm:rounded-2xl shadow-pop max-h-[92vh] flex flex-col animate-fade-up outline-none', wide ? 'sm:max-w-4xl' : 'sm:max-w-lg')}>
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-[16px] font-bold text-primary">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-lg text-subtle hover:bg-muted hover:text-secondary cursor-pointer" aria-label="Fechar">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 sm:px-6 py-5 overflow-y-auto">{children}</div>
        {footer && <div className="px-5 sm:px-6 py-4 border-t border-border flex justify-end gap-2 shrink-0">{footer}</div>}
      </div>
    </div>
  );
}

/* ── Tabs ── */
export function Tabs({ tabs, active, onChange }: { tabs: Array<{ id: string; label: string; icon?: ReactNode; count?: number }>; active: string; onChange: (id: string) => void }) {
  return (
    <div className="flex gap-1 border-b border-border overflow-x-auto" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={active === t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 text-[13.5px] font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors cursor-pointer',
            active === t.id ? 'border-accent text-accent' : 'border-transparent text-subtle hover:text-secondary hover:border-border',
          )}
        >
          {t.icon}
          {t.label}
          {t.count != null && t.count > 0 && (
            <span className={cn('rounded-full px-1.5 py-0.5 text-[11px] font-bold min-w-[20px] text-center', active === t.id ? 'bg-accent-soft text-accent' : 'bg-muted text-subtle')}>{t.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

/* ── Empty state ── */
export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6">
      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-subtle mb-4">
        {icon ?? <Inbox size={22} />}
      </div>
      <h3 className="text-[15px] font-bold text-primary">{title}</h3>
      {description && <p className="mt-1 text-[13.5px] text-subtle max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ── Avatar ── */
const AVATAR_COLORS = ['bg-sky-700', 'bg-emerald-700', 'bg-amber-600', 'bg-violet-700', 'bg-rose-700', 'bg-teal-700'];
export function Avatar({ nome, size = 'md' }: { nome: string; size?: 'sm' | 'md' | 'lg' }) {
  const idx = nome.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length;
  const sizes = { sm: 'w-7 h-7 text-[10px]', md: 'w-9 h-9 text-[12px]', lg: 'w-12 h-12 text-[15px]' };
  return (
    <span className={cn('inline-flex items-center justify-center rounded-full text-white font-bold shrink-0', AVATAR_COLORS[idx], sizes[size])} aria-hidden>
      {initials(nome)}
    </span>
  );
}

/* ── Progress ── */
export function ProgressBar({ value, tone = 'accent' }: { value: number; tone?: 'accent' | 'green' | 'amber' }) {
  const colors = { accent: 'bg-accent', green: 'bg-success', amber: 'bg-amber-500' };
  return (
    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn('h-full rounded-full transition-all duration-500', colors[tone])} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

/* ── Toasts ── */
interface Toast { id: string; tipo: 'success' | 'error' | 'info'; msg: string }
interface ToastState { toasts: Toast[]; push: (t: Omit<Toast, 'id'>) => void; remove: (id: string) => void }
export const useToasts = create<ToastState>((set) => ({
  toasts: [],
  push: (t) => {
    const id = Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })), 5000);
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));

export function toast(msg: string, tipo: Toast['tipo'] = 'success') {
  useToasts.getState().push({ msg, tipo });
}

export function Toaster() {
  const { toasts, remove } = useToasts();
  return (
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-[60] flex flex-col gap-2 sm:w-96" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={cn('flex items-start gap-3 rounded-xl border px-4 py-3 shadow-pop bg-surface animate-fade-up',
          t.tipo === 'success' && 'border-green-200', t.tipo === 'error' && 'border-red-200', t.tipo === 'info' && 'border-sky-200')}>
          {t.tipo === 'success' && <CheckCircle2 size={18} className="text-success shrink-0 mt-0.5" />}
          {t.tipo === 'error' && <AlertTriangle size={18} className="text-destructive shrink-0 mt-0.5" />}
          {t.tipo === 'info' && <Info size={18} className="text-accent shrink-0 mt-0.5" />}
          <p className="text-[13.5px] text-foreground flex-1">{t.msg}</p>
          <button onClick={() => remove(t.id)} className="text-subtle hover:text-secondary cursor-pointer" aria-label="Dispensar"><X size={15} /></button>
        </div>
      ))}
    </div>
  );
}

/* ── Banner ── */
export function Banner({ tone = 'info', icon, children, className }: { tone?: 'info' | 'warn' | 'success' | 'danger'; icon?: ReactNode; children: ReactNode; className?: string }) {
  const tones = {
    info: 'bg-accent-soft/60 border-sky-200 text-sky-900',
    warn: 'bg-warning-soft/70 border-amber-200 text-amber-900',
    success: 'bg-success-soft/70 border-green-200 text-green-900',
    danger: 'bg-destructive-soft/70 border-red-200 text-red-900',
  };
  return (
    <div className={cn('flex items-start gap-3 rounded-xl border px-4 py-3 text-[13.5px] leading-relaxed', tones[tone], className)}>
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
      <div className="h-1.5 w-24 rounded-full bg-muted overflow-hidden">
        <div className={cn('h-full rounded-full', tone)} style={{ width: `${value}%` }} />
      </div>
      <span className={cn('text-[12px] font-bold tabular-nums', value >= 85 ? 'text-success' : value >= 65 ? 'text-warning' : 'text-destructive')}>
        {value}% · {label}
      </span>
    </div>
  );
}
