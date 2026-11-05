import { History } from 'lucide-react';
import type { AuditEvent } from '../data/types';
import { fmtDateTime } from '../lib/format';

export default function Timeline({ events }: { events: AuditEvent[] }) {
  const sorted = [...events].sort((a, b) => b.em.localeCompare(a.em));
  return (
    <ol className="relative space-y-0" aria-label="Histórico de alterações">
      {sorted.map((e, i) => (
        <li key={e.id} className="relative pl-7 pb-5">
          {i < sorted.length - 1 && <span className="absolute left-[9px] top-5 bottom-0 w-px bg-border" aria-hidden />}
          <span className="absolute left-0 top-1 w-[19px] h-[19px] rounded-full bg-accent-soft border-2 border-accent/40 flex items-center justify-center" aria-hidden>
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
          </span>
          <div className="text-[13.5px] font-semibold text-foreground">{e.acao}</div>
          {e.detalhe && <div className="text-[12.5px] text-subtle mt-0.5">{e.detalhe}</div>}
          <div className="text-xs text-subtle/80 mt-1 flex items-center gap-1.5">
            <History size={11} aria-hidden />
            {fmtDateTime(e.em)} · {e.ator}
          </div>
        </li>
      ))}
      {sorted.length === 0 && <p className="text-[13px] text-subtle pl-7">Sem eventos registrados.</p>}
    </ol>
  );
}
