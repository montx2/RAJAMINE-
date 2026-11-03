import { useMemo } from 'react';
import { diffWords } from '../lib/diff';

/** Comparação visual palavra a palavra: original × sugerido. */
export default function DiffView({ original, sugerido }: { original: string; sugerido: string }) {
  const segments = useMemo(() => diffWords(original, sugerido), [original, sugerido]);
  return (
    <p className="text-[14px] leading-[1.8] whitespace-pre-wrap">
      {segments.map((s, i) => {
        if (s.type === 'same') return <span key={i}>{s.text}</span>;
        if (s.type === 'del') return <del key={i} className="bg-destructive-soft text-destructive rounded px-0.5 decoration-destructive/70">{s.text}</del>;
        return <ins key={i} className="bg-success-soft text-success rounded px-0.5 no-underline font-medium">{s.text}</ins>;
      })}
    </p>
  );
}
