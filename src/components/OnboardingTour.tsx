import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { Button } from './ui';

interface Step { selector: string; title: string; body: string }
const STEPS: Step[] = [
  { selector: '[data-tour="nav-relatorios"]', title: 'Relatórios', body: 'Crie, preencha e acompanhe os relatórios de campo por aqui.' },
  { selector: '[data-tour="nav-revisao"]', title: 'Revisão humana', body: 'Aprove ou solicite correção antes de liberar qualquer documento ao cliente.' },
  { selector: '[data-tour="notifications"]', title: 'Notificações', body: 'Prazos, revisões e ocorrências chegam aqui em tempo real.' },
  { selector: '[data-tour="theme-toggle"]', title: 'Tema claro/escuro', body: 'Alterne o visual sem perder contraste ou legibilidade.' },
];
const KEY = 'rajamine-tour-v1';

export default function OnboardingTour() {
  const [index, setIndex] = useState(-1);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const [steps, setSteps] = useState<Step[]>([]);

  const measure = useCallback(() => {
    if (index < 0 || index >= steps.length) return;
    const el = document.querySelector(steps[index].selector) as HTMLElement | null;
    if (!el) { setRect(null); return; }
    el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    setRect(el.getBoundingClientRect());
  }, [index, steps]);

  const finish = useCallback(() => {
    try { localStorage.setItem(KEY, 'done'); } catch { /* ignore */ }
    setIndex(-1);
  }, []);

  const start = useCallback(() => {
    if (typeof window === 'undefined') return;
    const visible = STEPS.filter((st) => {
      const el = document.querySelector(st.selector) as HTMLElement | null;
      return !!el && el.getBoundingClientRect().width > 0;
    });
    if (visible.length === 0) return;
    setSteps(visible);
    setIndex(0);
  }, []);

  useEffect(() => {
    if (import.meta.env.MODE === 'test') return;
    let done = false;
    try { done = localStorage.getItem(KEY) === 'done'; } catch { /* ignore */ }
    const t = window.setTimeout(() => { if (!done) start(); }, 700);
    const onStart = () => start();
    window.addEventListener('rajamine-start-tour', onStart);
    return () => { window.clearTimeout(t); window.removeEventListener('rajamine-start-tour', onStart); };
  }, [start]);

  useEffect(() => {
    if (index < 0) return;
    measure();
    const onResize = () => measure();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') finish(); };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('resize', onResize); window.removeEventListener('scroll', onResize, true); window.removeEventListener('keydown', onKey); };
  }, [index, measure, finish]);

  if (index < 0 || index >= steps.length || !rect) return null;
  const step = steps[index];
  const pad = 6;
  const top = rect.top - pad;
  const left = rect.left - pad;
  const width = rect.width + pad * 2;
  const height = rect.height + pad * 2;
  const tooltipBelow = top + height + 190 < window.innerHeight;
  const tooltipTop = tooltipBelow ? top + height + 12 : Math.max(12, top - 190);
  const tooltipLeft = Math.min(Math.max(12, left), window.innerWidth - 332);

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Tutorial rápido">
      <div className="absolute inset-0" onClick={finish} aria-hidden />
      <div
        className="absolute rounded-xl border-2 border-brand shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] transition-all duration-200"
        style={{ top, left, width, height }}
        aria-hidden
      />
      <div
        className="absolute w-[320px] glass-strong rounded-2xl p-4 animate-scale-in"
        style={{ top: tooltipTop, left: tooltipLeft }}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-accent">Passo {index + 1} de {steps.length}</div>
            <h3 className="text-[15px] font-extrabold text-primary mt-0.5">{step.title}</h3>
          </div>
          <button onClick={finish} className="press p-1.5 rounded-lg text-subtle hover:bg-primary/5 cursor-pointer" aria-label="Fechar tutorial"><X size={15} /></button>
        </div>
        <p className="text-[13px] text-secondary mt-1.5 leading-relaxed">{step.body}</p>
        <div className="flex items-center justify-between mt-4">
          <button onClick={finish} className="text-[12.5px] font-semibold text-subtle hover:text-primary cursor-pointer">Pular</button>
          <Button size="sm" variant="accent" icon={<ArrowRight size={14} />} onClick={() => (index + 1 >= steps.length ? finish() : setIndex(index + 1))}>
            {index + 1 >= steps.length ? 'Concluir' : 'Próximo'}
          </Button>
        </div>
      </div>
    </div>
  );
}
