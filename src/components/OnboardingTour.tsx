import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, X, Check } from 'lucide-react';
import { Button } from './ui';
import { useCurrentUser } from '../store/useStore';
import type { Role } from '../data/types';

/**
 * Guia de introdução. Percorre as áreas principais uma única vez por perfil
 * (localStorage) e pode ser reaberto pelo ícone de ajuda da barra superior.
 *
 * Requisitos de precisão: navega até a página do passo, espera o alvo existir,
 * rastreia o retângulo por frame e congela as animações de entrada da página.
 * Ao encerrar, devolve o usuário à página em que estava.
 */
export interface TourStep {
  id: string;
  title: string;
  body: string;
  /** Alvo do destaque. Ausente na abertura. */
  selector?: string;
  /** Página do passo. */
  route?: string;
  /** Perfis que recebem o passo. */
  roles?: Role[];
}

export const MANAGEMENT_STEPS: TourStep[] = [
  {
    id: 'bem-vindo',
    title: 'Como o FieldOps funciona',
    body: 'O relatório é preenchido em campo, revisado por uma pessoa e só então gerado em PDF para o cliente. Este guia percorre as áreas principais.',
  },
  {
    id: 'dashboard',
    title: 'Indicadores',
    body: 'Totais por situação e a fila de prazos. Cada cartão abre a lista correspondente.',
    selector: '[data-tour="dashboard-kpis"]',
    route: '/',
    roles: ['admin', 'revisora'],
  },
  {
    id: 'novo',
    title: 'Novo relatório',
    body: 'Define cliente, tipo de atividade e responsável. O sistema gera um link individual de preenchimento com prazo de 48 horas.',
    selector: '[data-tour="page-header"]',
    route: '/relatorios/novo',
    roles: ['admin', 'revisora'],
  },
  {
    id: 'relatorios',
    title: 'Texto e fotos',
    body: 'O texto do técnico recebe uma sugestão de padronização e os códigos de equipamento são lidos das fotos. Os dois casos exigem confirmação e o original é preservado.',
    selector: '[data-tour="page-header"]',
    route: '/relatorios',
    roles: ['admin', 'revisora', 'colaborador'],
  },
  {
    id: 'revisao',
    title: 'Revisão',
    body: 'Fila de aprovação. Nenhum documento é liberado ao cliente sem conferência humana, e cada decisão registra autor, data e hora.',
    selector: '[data-tour="page-header"]',
    route: '/revisao',
    roles: ['admin', 'revisora'],
  },
  {
    id: 'operacoes',
    title: 'Operações de campo',
    body: 'Instalações, manutenções e desmobilizações por cliente, com telemetria, tablet e câmera. Permite busca, filtro e exportação em CSV.',
    selector: '[data-tour="page-header"]',
    route: '/operacoes',
    roles: ['admin', 'revisora'],
  },
  {
    id: 'documentos',
    title: 'Documentos',
    body: 'PDF do cliente e PDF interno são gerados a partir de relatórios aprovados. O arquivo e o consolidado semanal ficam reunidos aqui.',
    selector: '[data-tour="page-header"]',
    route: '/documentos',
    roles: ['admin', 'revisora'],
  },
  {
    id: 'notificacoes',
    title: 'Notificações',
    body: 'Prazos a vencer, correções solicitadas e ocorrências de motoristas.',
    selector: '[data-tour="notifications"]',
  },
];

export const DRIVER_STEPS: TourStep[] = [
  {
    id: 'bem-vindo',
    title: 'Como o portal funciona',
    body: 'Checklist do turno, registro de ocorrências e ciência de treinamentos. Os registros ficam no aparelho e são enviados quando há conexão.',
  },
  {
    id: 'checklist',
    title: 'Checklist do turno',
    body: 'Gerado automaticamente com os equipamentos do caminhão. Cada item é marcado como OK, atenção ou falha. A falha abre uma ocorrência para a coordenação.',
    selector: '[data-tour="driver-checklist-title"]',
    route: '/motorista/checklist',
  },
  {
    id: 'ocorrencias',
    title: 'Ocorrências',
    body: 'Registro de problemas com câmera, tablet, telemetria ou veículo. A coordenação responde no mesmo lugar.',
    selector: '[data-tour="driver-ocorrencias-title"]',
    route: '/motorista/ocorrencias',
  },
  {
    id: 'treinamento',
    title: 'Treinamentos',
    body: 'A ciência é confirmada digitando o nome completo, com registro de data e hora.',
    selector: '[data-tour="driver-treinamento-title"]',
    route: '/motorista/treinamento',
  },
  {
    id: 'historico',
    title: 'Histórico',
    body: 'Checklists, ocorrências e ciências já registrados, disponíveis para consulta.',
    selector: '[data-tour="driver-historico-title"]',
    route: '/motorista/historico',
  },
  {
    id: 'sync',
    title: 'Envio dos registros',
    body: 'Sem conexão, os registros aguardam no aparelho. O contador indica quantos estão pendentes de envio.',
    selector: '[data-tour="driver-sync"]',
    route: '/motorista',
  },
];

const KEY_PREFIX = 'rajamine-tour-v2-';
const CARD_W = 340;
const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

export default function OnboardingTour({ variant = 'gestao' }: { variant?: 'gestao' | 'motorista' }) {
  const allSteps = variant === 'motorista' ? DRIVER_STEPS : MANAGEMENT_STEPS;
  const storageKey = KEY_PREFIX + variant;
  const navigate = useNavigate();
  const location = useLocation();
  const role = useCurrentUser()?.role;

  const [index, setIndex] = useState(-1);
  const [steps, setSteps] = useState<TourStep[]>([]);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [cardH, setCardH] = useState(200);
  const [completed, setCompleted] = useState(false);
  const [vp, setVp] = useState({ w: typeof window !== 'undefined' ? window.innerWidth : 1280, h: typeof window !== 'undefined' ? window.innerHeight : 800 });
  const cardRef = useRef<HTMLDivElement>(null);
  const returnToRef = useRef<string | null>(null);
  // Rota atual do roteador (window.location não reflete o MemoryRouter).
  const pathRef = useRef(location.pathname);
  pathRef.current = location.pathname;

  const active = index >= 0 && index < steps.length;
  const step = active ? steps[index] : null;
  const isOpening = !!step && !step.selector;
  const isLast = index === steps.length - 1;
  const centered = completed || isOpening;
  const spotlight = !centered && !!step?.selector && !!rect && rect.width > 0;
  const lastRectRef = useRef<DOMRect | null>(null);
  if (rect) lastRectRef.current = rect;
  const anchorRect = rect ?? lastRectRef.current;
  const hasAnchor = !centered && !!step?.selector && !!anchorRect && anchorRect.width > 0;

  const finish = useCallback(() => {
    try { localStorage.setItem(storageKey, 'done'); } catch { /* modo privado */ }
    setIndex(-1);
    setRect(null);
    setCompleted(false);
    // Devolve o usuário à página em que estava antes do guia.
    const back = returnToRef.current;
    returnToRef.current = null;
    if (back && back !== location.pathname) navigate(back);
  }, [storageKey, location.pathname, navigate]);

  const next = useCallback(() => {
    if (index + 1 >= steps.length) setCompleted(true);
    else setIndex(index + 1);
  }, [index, steps.length]);

  const back = useCallback(() => {
    if (completed) { setCompleted(false); return; }
    setIndex((i) => Math.max(0, i - 1));
  }, [completed]);

  const start = useCallback(() => {
    if (typeof window === 'undefined') return;
    const visible = allSteps.filter((st) => !st.roles || (role && st.roles.includes(role)));
    returnToRef.current = pathRef.current;
    setSteps(visible);
    setRect(null);
    setCompleted(false);
    setIndex(0);
  }, [allSteps, role]);

  // Abre uma única vez por perfil; o ícone de ajuda reabre a qualquer momento.
  useEffect(() => {
    const onStart = () => start();
    window.addEventListener('rajamine-start-tour', onStart);
    let t: number | undefined;
    if (import.meta.env.MODE !== 'test') {
      let done = false;
      try { done = localStorage.getItem(storageKey) === 'done'; } catch { /* ignore */ }
      t = window.setTimeout(() => { if (!done) start(); }, 800);
    }
    return () => { if (t) window.clearTimeout(t); window.removeEventListener('rajamine-start-tour', onStart); };
  }, [start, storageKey]);

  // Congela as animações de entrada para o alvo ser medido na posição final.
  useEffect(() => {
    const root = document.documentElement;
    if (active || completed) root.classList.add('tour-active');
    else root.classList.remove('tour-active');
    return () => root.classList.remove('tour-active');
  }, [active, completed]);

  // Navega até a página do passo e rastreia o alvo por frame.
  useEffect(() => {
    if (!active || !step || completed) return;
    setRect(null);
    if (!step.selector) return;
    if (step.route && location.pathname !== step.route) navigate(step.route);

    let raf = 0;
    let scrolled = false;
    const startedAt = Date.now();
    let last: { top: number; left: number; width: number; height: number } | null = null;

    const loop = () => {
      const el = document.querySelector(step.selector!) as HTMLElement | null;
      const box = el?.getBoundingClientRect();
      if (el && box && box.width > 0) {
        if (!scrolled) {
          el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'auto' });
          scrolled = true;
        }
        const r = el.getBoundingClientRect();
        if (!last || Math.abs(r.top - last.top) > 0.5 || Math.abs(r.left - last.left) > 0.5 ||
            Math.abs(r.width - last.width) > 0.5 || Math.abs(r.height - last.height) > 0.5) {
          last = { top: r.top, left: r.left, width: r.width, height: r.height };
          setRect(r);
        }
        raf = requestAnimationFrame(loop);
        return;
      }
      if (Date.now() - startedAt > 3000) { next(); return; }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, active, completed]);

  useEffect(() => {
    if (!active && !completed) return;
    const onResize = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    cardRef.current?.focus();
    return () => window.removeEventListener('resize', onResize);
  }, [active, completed, index]);

  useLayoutEffect(() => {
    if (cardRef.current) setCardH(cardRef.current.offsetHeight);
  }, [index, active, completed, vp.w]);

  // Teclado: Esc encerra, setas navegam, Tab permanece no diálogo.
  useEffect(() => {
    if (!active && !completed) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { finish(); return; }
      if (e.key === 'ArrowRight') { next(); return; }
      if (e.key === 'ArrowLeft') { back(); return; }
      if (e.key === 'Tab' && cardRef.current) {
        const items = Array.from(cardRef.current.querySelectorAll<HTMLElement>('button, [href], [tabindex]:not([tabindex="-1"])'))
          .filter((el) => !el.hasAttribute('disabled'));
        if (items.length === 0) return;
        const first = items[0];
        const lastEl = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastEl.focus(); }
        else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, completed, finish, next, back]);

  if ((!active && !completed) || (!step && !completed)) return null;

  // ── Posição do cartão e do ponteiro ──
  const mobile = vp.w < 640;
  const pad = 5;
  const gap = 14;
  let cardStyle: React.CSSProperties;

  if (!hasAnchor) {
    cardStyle = mobile
      ? { left: 16, right: 16, bottom: 20 }
      : { left: Math.max(16, (vp.w - CARD_W) / 2), top: Math.max(16, (vp.h - cardH) / 2), width: CARD_W };
  } else if (mobile) {
    const mid = anchorRect!.top + anchorRect!.height / 2;
    cardStyle = mid > vp.h / 2 ? { left: 16, right: 16, top: 16 } : { left: 16, right: 16, bottom: 16 };
  } else {
    const below = anchorRect!.bottom + pad + gap + cardH < vp.h - 16;
    const top = below ? anchorRect!.bottom + pad + gap : Math.max(16, anchorRect!.top - pad - gap - cardH);
    const left = clamp(anchorRect!.left + anchorRect!.width / 2 - CARD_W / 2, 16, vp.w - CARD_W - 16);
    cardStyle = { top, left, width: CARD_W };
  }

  const counter = completed ? null : isOpening ? 'Introdução' : `${index + 1} / ${steps.length}`;

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Guia de introdução">
      {spotlight ? (
        <>
          <div className="absolute inset-0" onClick={finish} aria-hidden />
          <div
            data-tour-spotlight
            className="absolute rounded-lg border border-white/75 shadow-[0_0_0_9999px_rgba(12,13,16,0.52)] pointer-events-none"
            style={{ top: rect!.top - pad, left: rect!.left - pad, width: rect!.width + pad * 2, height: rect!.height + pad * 2 }}
            aria-hidden
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-[rgba(12,13,16,0.52)] animate-fade-in" onClick={finish} aria-hidden />
      )}

      <div ref={cardRef} tabIndex={-1} className="absolute glass-strong rounded-xl overflow-hidden animate-scale-in outline-none" style={cardStyle}>
        <div className="px-5 pt-4 pb-4">
          {completed ? (
            <>
              <div className="flex items-center gap-2 text-subtle">
                <Check size={15} aria-hidden />
                <span className="text-[11px] font-semibold uppercase tracking-[0.1em]">Guia concluído</span>
              </div>
              <p className="text-[13px] text-secondary mt-3 leading-relaxed">
                As áreas principais foram apresentadas. Este guia continua disponível no ícone de ajuda da barra superior.
              </p>
              <div className="flex justify-end mt-4">
                <Button size="sm" onClick={finish}>Fechar</Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-subtle mt-0.5">{counter}</span>
                <button onClick={finish} className="press -mt-1 -mr-1.5 p-1.5 rounded-md text-subtle hover:text-primary hover:bg-primary/5 cursor-pointer" aria-label="Encerrar guia">
                  <X size={14} />
                </button>
              </div>

              <h3 className="text-[15px] font-semibold text-primary mt-2 leading-snug">{step!.title}</h3>
              <p className="text-[12.5px] text-secondary mt-1.5 leading-[1.65]">{step!.body}</p>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-primary/8">
                <button onClick={finish} className="text-[12px] font-medium text-subtle hover:text-primary cursor-pointer">
                  Encerrar
                </button>
                <div className="flex items-center gap-1.5">
                  {index > 0 && (
                    <Button size="sm" variant="ghost" icon={<ArrowLeft size={13} />} onClick={back}>Anterior</Button>
                  )}
                  <Button size="sm" icon={isLast ? undefined : <ArrowRight size={13} />} onClick={next}>
                    {isOpening ? 'Iniciar' : isLast ? 'Concluir' : 'Próximo'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
