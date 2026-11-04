export function fmtDate(iso: string | undefined | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function fmtDateTime(iso: string | undefined | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}

export function fmtShortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  return `há ${d} d`;
}

/** Prazo: retorna horas restantes (negativo = atrasado). */
export function hoursUntil(iso: string): number {
  return (new Date(iso).getTime() - Date.now()) / 3600000;
}

export function deadlineLabel(iso: string): { texto: string; tom: 'ok' | 'warn' | 'late' } {
  const h = hoursUntil(iso);
  if (h < 0) {
    const hrs = Math.abs(Math.round(h));
    return { texto: hrs < 24 ? `Atrasado ${hrs} h` : `Atrasado ${Math.round(hrs / 24)} d`, tom: 'late' };
  }
  if (h < 24) return { texto: `Vence em ${Math.max(1, Math.round(h))} h`, tom: 'warn' };
  return { texto: `Vence em ${Math.round(h / 24)} d`, tom: 'ok' };
}

export function initials(nome: string): string {
  const p = nome.trim().split(/\s+/);
  return (p[0][0] + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase();
}

export function firstName(nome: string): string {
  return nome.trim().split(/\s+/)[0];
}

export function fmtKm(v: number | undefined | null): string {
  if (v == null || Number.isNaN(v)) return '—';
  return `${v.toLocaleString('pt-BR')} km`;
}

export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
