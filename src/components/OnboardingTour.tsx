import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, X, Link2, Sparkles, ClipboardCheck, FileCheck2, CircleHelp,
} from 'lucide-react';
import { Button } from './ui';
import { LogoMark } from './Logo';
import { useCurrentUser } from '../store/useStore';
import type { Role } from '../data/types';

/**
 * Tutorial guiado de introdução — explica as funções principais em linguagem
 * simples, para quem nunca teve contato com o sistema. Navega sozinho pelas
 * páginas e destaca cada área. Reabrível a qualquer momento pelo botão de ajuda.
 */
export interface TourStep {
  id: string;
  title: string;
  body: string;
  /** Elemento a destacar (ausente = card centralizado de boas-vindas). */
  selector?: string;
  /** Página para onde o tour navega antes de destacar o elemento. */
  route?: string;
  /** Perfis que veem este passo (ausente = todos os perfis da área). */
  roles?: Role[];
}

export const MANAGEMENT_STEPS: TourStep[] = [
  {
    id: 'bem-vindo',
    title: 'Bem-vindo ao Rajamine FieldOps',
    body: 'Este sistema transforma o trabalho de campo em relatórios profissionais para o cliente. Vou mostrar o caminho completo em poucos passos — leva menos de 2 minutos e você pode pular quando quiser.',
  },
  {
    id: 'dashboard',
    title: 'Painel de controle',
    body: 'Aqui você vê a operação em números: quantos relatórios existem, quantos aguardam preenchimento, quantos esperam revisão e quantos já foram aprovados. Logo abaixo, a fila de prazos mostra o que está perto de vencer — clique em qualquer cartão para ir direto aos detalhes.',
    selector: '[data-tour="dashboard-kpis"]',
    route: '/',
    roles: ['admin', 'revisora'],
  },
  {
    id: 'novo',
    title: 'Criar um novo relatório',
    body: 'É aqui que tudo começa: o gestor escolhe o cliente, o tipo de atividade e o técnico responsável. O sistema gera um link individual — o técnico preenche pelo celular, sem precisar de login, com prazo de 48 horas e lembretes automáticos.',
    selector: '[data-tour="page-header"]',
    route: '/relatorios/novo',
    roles: ['admin', 'revisora'],
  },
  {
    id: 'relatorios',
    title: 'Relatórios: IA e leitura de fotos',
    body: 'Todos os relatórios ficam aqui com seu status. Dentro de cada um há duas ajudas automáticas: a IA reescreve o texto do técnico em linguagem profissional (o original nunca é apagado) e a leitura de fotos identifica os códigos dos equipamentos. As duas sempre pedem confirmação humana.',
    selector: '[data-tour="page-header"]',
    route: '/relatorios',
    roles: ['admin', 'revisora', 'colaborador'],
  },
  {
    id: 'revisao',
    title: 'Revisão humana obrigatória',
    body: 'Antes de qualquer documento chegar ao cliente, ele passa por esta fila. Uma pessoa confere os dados, o texto e as fotos e decide: aprovar ou pedir correção. Nada é liberado automaticamente — e cada decisão fica registrada com autor, data e hora.',
    selector: '[data-tour="page-header"]',
    route: '/revisao',
    roles: ['admin', 'revisora'],
  },
  {
    id: 'operacoes',
    title: 'Operações de campo',
    body: 'A base de tudo que foi instalado, mantido ou retirado em cada cliente: código do equipamento, telemetria, tablet e câmera de fadiga, com os IDs corretos. Dá para pesquisar, filtrar e exportar para Excel (CSV).',
    selector: '[data-tour="page-header"]',
    route: '/operacoes',
    roles: ['admin', 'revisora'],
  },
  {
    id: 'documentos',
    title: 'PDFs e arquivo de documentos',
    body: 'Depois de aprovado, o relatório vira dois PDFs: um para o cliente, limpo e sem fotos internas, e outro para uso interno, com fotos e histórico completo. Tudo fica arquivado aqui, e o consolidado semanal reúne a operação inteira em um único documento.',
    selector: '[data-tour="page-header"]',
    route: '/documentos',
    roles: ['admin', 'revisora'],
  },
  {
    id: 'notificacoes',
    title: 'Notificações',
    body: 'Prazos vencendo, pedidos de correção e ocorrências de motoristas chegam neste sino. Pronto! Se quiser rever esta explicação, é só clicar no botão de ajuda (?) no topo da tela.',
    selector: '[data-tour="notifications"]',
  },
];

export const DRIVER_STEPS: TourStep[] = [
  {
    id: 'bem-vindo',
    title: 'Bem-vindo ao Portal do Motorista',
    body: 'Aqui fica a sua rotina de cada turno: checklist do caminhão, registro de problemas e ciência de treinamentos. Tudo funciona mesmo sem internet. Vou mostrar cada parte em poucos passos.',
  },
  {
    id: 'checklist',
    title: 'Checklist automático',
    body: 'O checklist do turno é criado sozinho, já com os equipamentos do seu caminhão. Você só marca cada item: OK ou falha. Se marcar falha, o sistema abre uma ocorrência automaticamente e avisa a coordenação — você não precisa escrever nada a mais.',
    selector: '[data-tour="driver-checklist-title"]',
    route: '/motorista/checklist',
  },
  {
    id: 'ocorrencias',
    title: 'Ocorrências',
    body: 'Viu um problema na câmera, no tablet, na telemetria ou no caminhão? Registre aqui com suas palavras. A coordenação responde por este mesmo lugar, e você acompanha o andamento de cada ocorrência.',
    selector: '[data-tour="driver-ocorrencias-title"]',
    route: '/motorista/ocorrencias',
  },
  {
    id: 'treinamento',
    title: 'Treinamentos e ciência',
    body: 'Quando a empresa publicar uma orientação, ela aparece aqui. Você lê e confirma digitando o seu nome completo — fica registrado com data e hora. É simples e substitui a assinatura em papel.',
    selector: '[data-tour="driver-treinamento-title"]',
    route: '/motorista/treinamento',
  },
  {
    id: 'historico',
    title: 'Histórico',
    body: 'Tudo que você registrou fica guardado aqui: checklists, ocorrências e ciências de treinamento. Pode consultar quando quiser, mesmo offline.',
    selector: '[data-tour="driver-historico-title"]',
    route: '/motorista/historico',
  },
  {
    id: 'sync',
    title: 'Sem internet? Sem problema',
    body: 'Sem sinal, tudo fica salvo no aparelho. Quando a internet volta, os registros são enviados sozinhos — ou você toca neste botão para enviar na hora. O número mostra quantos registros estão esperando. Pronto! Para rever o tutorial, toque no botão de ajuda (?) no topo.',
    selector: '[data-tour="driver-sync"]',
    route: '/motorista',
  },
];

const KEY_PREFIX = 'rajamine-tour-v2-';
const CARD_W = 360;

export default function OnboardingTour({ variant = 'gestao' }: { variant?: 'gestao' | 'motorista' }) {
  const allSteps = variant === 'motorista' ? DRIVER_STEPS : MANAGEMENT_STEPS;
  const storageKey = KEY_PREFIX + variant;
  const navigate = useNavigate();
  const location = useLocation();
  const role = useCurrentUser()?.role;

  const [index, setIndex] = useState(-1);
  const [steps, setSteps] = useState<TourStep[]>([]);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [cardH, setCardH] = useState(240);
  const [vp, setVp] = useState({ w: typeof window !== 'undefined' ? window.innerWidth : 1280, h: typeof window !== 'undefined' ? window.innerHeight : 800 });
  const cardRef = useRef<HTMLDivElement>(null);

  const active = index >= 0 && index < steps.length;
  const step = active ? steps[index] : null;
  const isWelcome = !!step && !step.selector;
  const isLast = index === steps.length - 1;
  const spotlight = !!step?.selector && !!rect && rect.width > 0;
  // Guarda o último retângulo válido para o card não "pular" durante a troca
  // de passo (o spotlight some até o novo alvo ser medido, mas o card fica parado).
  const lastRectRef = useRef<DOMRect | null>(null);
  if (rect) lastRectRef.current = rect;
  const anchorRect = rect ?? lastRectRef.current;
  const hasAnchor = !!step?.selector && !!anchorRect && anchorRect.width > 0;

  const finish = useCallback(() => {
    try { localStorage.setItem(storageKey, 'done'); } catch { /* modo privado */ }
    setIndex(-1);
    setRect(null);
  }, [storageKey]);

  const next = useCallback(() => {
    if (index + 1 >= steps.length) finish();
    else setIndex(index + 1);
  }, [index, steps.length, finish]);

  const back = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);

  const start = useCallback(() => {
    if (typeof window === 'undefined') return;
    // Mantém apenas os passos do perfil atual (ex.: revisão e operações somem para colaborador).
    const visible = allSteps.filter((st) => !st.roles || (role && st.roles.includes(role)));
    setSteps(visible);
    setRect(null);
    setIndex(0);
  }, [allSteps, role]);

  // Auto-início no primeiro acesso + botão de ajuda (evento sempre disponível).
  useEffect(() => {
    const onStart = () => start();
    window.addEventListener('rajamine-start-tour', onStart);
    let t: number | undefined;
    if (import.meta.env.MODE !== 'test') {
      let done = false;
      try { done = localStorage.getItem(storageKey) === 'done'; } catch { /* ignore */ }
      t = window.setTimeout(() => { if (!done) start(); }, 700);
    }
    return () => { if (t) window.clearTimeout(t); window.removeEventListener('rajamine-start-tour', onStart); };
  }, [start, storageKey]);

  // Enquanto o tour está aberto, congela as animações de entrada das páginas
  // (page-enter/stagger) para que o alvo não se mova depois de medido.
  useEffect(() => {
    const root = document.documentElement;
    if (active) root.classList.add('tour-active');
    else root.classList.remove('tour-active');
    return () => root.classList.remove('tour-active');
  }, [active]);

  // Navega até a página do passo e rastreia o alvo continuamente (rAF),
  // mantendo o spotlight colado mesmo com scroll, resize ou layout shift.
  useEffect(() => {
    if (!active || !step) return;
    setRect(null); // esconde o spotlight antigo até achar o novo alvo (sem "voar")
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
      if (Date.now() - startedAt > 3000) { next(); return; } // alvo não existe: pula o passo
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, active]);

  // Atualiza o tamanho da viewport para posicionar o card.
  useEffect(() => {
    if (!active) return;
    const onResize = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [active]);

  useLayoutEffect(() => {
    if (cardRef.current) setCardH(cardRef.current.offsetHeight);
  }, [index, active, vp.w]);

  // Teclado: Esc fecha, setas navegam.
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') back();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, finish, next, back]);

  if (!active || !step) return null;

  // Posição do card: centralizado na boas-vindas; ancorado ao alvo no desktop;
  // no celular, fica no lado oposto ao alvo para nunca cobri-lo.
  const mobile = vp.w < 640;
  const pad = 6;
  let cardStyle: React.CSSProperties;
  if (!hasAnchor) {
    cardStyle = mobile
      ? { left: 12, right: 12, bottom: 16 }
      : { left: Math.max(12, (vp.w - CARD_W) / 2), top: Math.max(12, (vp.h - cardH) / 2), width: CARD_W };
  } else if (mobile) {
    const targetMid = anchorRect!.top + anchorRect!.height / 2;
    cardStyle = targetMid > vp.h / 2
      ? { left: 12, right: 12, top: 12 }
      : { left: 12, right: 12, bottom: 12 };
  } else {
    const below = anchorRect!.bottom + pad + 14 + cardH < vp.h - 12;
    const top = below ? anchorRect!.bottom + pad + 14 : Math.max(12, anchorRect!.top - pad - 14 - cardH);
    const left = Math.min(Math.max(12, anchorRect!.left + anchorRect!.width / 2 - CARD_W / 2), vp.w - CARD_W - 12);
    cardStyle = { top, left, width: CARD_W };
  }

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Tutorial de introdução">
      {spotlight ? (
        <>
          <div className="absolute inset-0" onClick={finish} aria-hidden />
          <div
            data-tour-spotlight
            className="absolute rounded-xl border-2 border-brand shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] animate-fade-in pointer-events-none"
            style={{ top: rect!.top - pad, left: rect!.left - pad, width: rect!.width + pad * 2, height: rect!.height + pad * 2 }}
            aria-hidden
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-black/55 animate-fade-in" style={{ backdropFilter: 'blur(3px)' }} onClick={finish} aria-hidden />
      )}

      <div ref={cardRef} className="absolute glass-strong rounded-2xl overflow-hidden animate-scale-in" style={cardStyle}>
        {/* Barra de progresso */}
        <div className="h-1 bg-primary/10" aria-hidden>
          <div className="h-full bg-brand transition-all duration-300" style={{ width: `${((index + 1) / steps.length) * 100}%` }} />
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-accent">
              {isWelcome ? 'Tutorial rápido' : `Passo ${index + 1} de ${steps.length}`}
            </div>
            <button onClick={finish} className="press -mt-1 -mr-1 p-1.5 rounded-lg text-subtle hover:bg-primary/5 cursor-pointer" aria-label="Fechar tutorial">
              <X size={15} />
            </button>
          </div>

          {isWelcome && (
            <div className="flex items-center gap-3 mt-2">
              <LogoMark size={38} />
              <h3 className="text-[17px] font-extrabold text-primary leading-snug">{step.title}</h3>
            </div>
          )}
          {!isWelcome && <h3 className="text-[16px] font-extrabold text-primary mt-1 leading-snug">{step.title}</h3>}

          <p className="text-[13px] text-secondary mt-2 leading-relaxed">{step.body}</p>

          {isWelcome && (
            <div className="mt-4 rounded-xl bg-primary/[0.04] border border-primary/8 p-3">
              <div className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-subtle mb-2">
                {variant === 'motorista' ? 'Sua rotina no portal' : 'O caminho do relatório'}
              </div>
              <div className="flex items-center justify-between gap-1 text-center">
                {(variant === 'motorista'
                  ? [
                      { icon: ClipboardCheck, label: 'Checklist' },
                      { icon: Link2, label: 'Ocorrências' },
                      { icon: FileCheck2, label: 'Ciência' },
                      { icon: Sparkles, label: 'Sync' },
                    ]
                  : [
                      { icon: Link2, label: 'Link' },
                      { icon: Sparkles, label: 'IA + OCR' },
                      { icon: ClipboardCheck, label: 'Revisão' },
                      { icon: FileCheck2, label: 'PDF' },
                    ]
                ).map((p, i, arr) => (
                  <div key={p.label} className="flex items-center gap-1 flex-1 min-w-0">
                    <div className="flex-1 min-w-0">
                      <span className="mx-auto w-8 h-8 rounded-lg bg-accent-soft text-accent flex items-center justify-center">
                        <p.icon size={15} aria-hidden />
                      </span>
                      <div className="text-[10px] font-bold text-secondary mt-1 truncate">{p.label}</div>
                    </div>
                    {i < arr.length - 1 && <ArrowRight size={11} className="text-subtle shrink-0" aria-hidden />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {isLast && !isWelcome && (
            <p className="flex items-center gap-1.5 text-[11.5px] text-subtle mt-3">
              <CircleHelp size={13} aria-hidden /> O tutorial pode ser reaberto a qualquer momento no botão de ajuda.
            </p>
          )}

          <div className="flex items-center justify-between mt-4">
            <button onClick={finish} className="text-[12.5px] font-semibold text-subtle hover:text-primary cursor-pointer">
              {isWelcome ? 'Pular tutorial' : 'Pular'}
            </button>
            <div className="flex items-center gap-2">
              {index > 0 && (
                <Button size="sm" variant="ghost" icon={<ArrowLeft size={14} />} onClick={back}>Voltar</Button>
              )}
              <Button size="sm" variant="accent" icon={isLast ? undefined : <ArrowRight size={14} />} onClick={next}>
                {isWelcome ? 'Começar' : isLast ? 'Concluir' : 'Próximo'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
