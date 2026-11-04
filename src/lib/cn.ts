import { twMerge } from 'tailwind-merge';

/**
 * Junta classes e resolve conflitos do Tailwind pela última ocorrência.
 *
 * Sem o merge, um `className="hidden sm:inline-flex"` passado a um componente
 * cuja classe base já traz `inline-flex` não tinha efeito: as duas utilidades
 * iam para o CSS e vencia a ordem da folha, não a ordem das classes — o que
 * fazia elementos aparecerem em breakpoints em que deveriam estar ocultos.
 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return twMerge(parts.filter(Boolean).join(' '));
}
