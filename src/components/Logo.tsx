import { BRAND } from '../lib/brand';

/**
 * Marca SAFIP: ladrilho grafite com montanha amarela e linha de base.
 * É o símbolo usado antes da revisão de frontend; o "I" do wordmark recebe
 * o amarelo da marca. Grade 64×64, legível em 16 px (favicon) e em monocromia.
 */
export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden focusable="false" className={className}>
      <rect width="64" height="64" rx="14" fill={BRAND.cor.grafite} />
      <path d="M14 44 L24 20 L34 34 L40 26 L50 44 Z" fill={BRAND.cor.amarelo} />
      <path d="M12 48 H52" stroke={BRAND.cor.amarelo} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** Nome em texto real (selecionável, lido por leitores de tela, escala com o corpo). */
export function Wordmark({ className = '', light = true }: { className?: string; light?: boolean }) {
  const nome = BRAND.empresa;
  const i = nome.indexOf('I');
  return (
    <span
      className={`font-extrabold italic tracking-tight leading-none ${light ? 'text-white' : 'text-primary'} ${className}`}
      aria-label={nome}
    >
      {i >= 0 ? (
        <>
          {nome.slice(0, i)}
          <span className="text-brand">{nome.charAt(i)}</span>
          {nome.slice(i + 1)}
        </>
      ) : (
        nome
      )}
    </span>
  );
}

/** Lockup horizontal: marca + nome + produto. `light` = sobre fundo escuro. */
export function Logo({ compact, light = true, size = 34, className = '' }: { compact?: boolean; light?: boolean; size?: number; className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`} aria-label={`${BRAND.nomeCompleto}`}>
      <LogoMark size={size} />
      {!compact && (
        <div className="leading-none">
          <Wordmark className="text-[20px]" light={light} />
          <div className={`mt-1 text-xs font-semibold tracking-[0.22em] ${light ? 'text-zinc-400' : 'text-subtle'}`}>
            {BRAND.produto.toUpperCase()}
          </div>
        </div>
      )}
    </div>
  );
}
