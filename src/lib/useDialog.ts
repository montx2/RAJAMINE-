import { useEffect, useRef, type RefObject } from 'react';

/** Quantos diálogos modais estão abertos: o scroll do body só volta quando o último fecha. */
let scrollLocks = 0;

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

interface Options {
  /** Prende o Tab dentro do contêiner (diálogos modais e drawers). Padrão: true. */
  trapFocus?: boolean;
  /** Trava a rolagem do fundo enquanto aberto. Padrão: true. */
  lockScroll?: boolean;
  /** Move o foco para o contêiner ao abrir. Padrão: true. */
  autoFocus?: boolean;
}

/**
 * Comportamento comum de camadas sobrepostas (Modal, drawer, popover):
 * Esc fecha, foco entra ao abrir e volta ao gatilho ao fechar, Tab não escapa
 * (quando `trapFocus`) e o fundo não rola (quando `lockScroll`).
 *
 * `onClose` costuma chegar como arrow function inline; guardá-la em ref evita
 * que o efeito rode a cada render e devolva o foco ao contêiner a cada tecla.
 */
export function useDialogBehavior(
  ref: RefObject<HTMLElement | null>,
  open: boolean,
  onClose: () => void,
  { trapFocus = true, lockScroll = true, autoFocus = true }: Options = {},
) {
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onCloseRef.current(); return; }
      if (e.key !== 'Tab' || !trapFocus || !ref.current) return;
      // Critério por atributo, não por layout: offsetParent é nulo em ancestrais
      // fixos e em ambientes sem layout, o que desligaria a armadilha de foco.
      const items = Array.from(ref.current.querySelectorAll<HTMLElement>(FOCUSABLE))
        .filter((el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true' && el.tabIndex !== -1);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };

    document.addEventListener('keydown', onKey);
    if (lockScroll) { scrollLocks++; document.body.style.overflow = 'hidden'; }
    if (autoFocus) ref.current?.focus();

    return () => {
      document.removeEventListener('keydown', onKey);
      if (lockScroll) { scrollLocks = Math.max(0, scrollLocks - 1); if (scrollLocks === 0) document.body.style.overflow = ''; }
      previous?.focus?.();
    };
  }, [open, ref, trapFocus, lockScroll, autoFocus]);
}
