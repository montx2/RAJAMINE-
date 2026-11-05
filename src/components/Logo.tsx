import { BRAND } from '../lib/brand';

/**
 * Marca Rajamine: um "R" montado em estratos. A haste é o furo de sondagem; as
 * três lâminas à direita são as bancadas empilhadas de uma cava, com o vão de
 * 3 unidades entre elas marcando cada camada. A terceira lâmina vira a perna do
 * "R". Grade de 64×64, vão constante, funciona em 16 px (favicon) e em
 * monocromia. O contorno claro de 0,5 px só aparece sobre fundos grafite.
 */
export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden focusable="false" className={className}>
      <rect width="64" height="64" rx="14" fill={BRAND.cor.grafite} />
      <rect x="0.5" y="0.5" width="63" height="63" rx="13.5" stroke="#fff" strokeOpacity="0.14" />
      <g fill={BRAND.cor.amarelo}>
        <path d="M15 13H24V51H15Z" />
        <path d="M27 13H40L47 20V23H27Z" />
        <path d="M27 26H47V29L40 36H27Z" />
        <path d="M31 39H42L50 51H39Z" />
      </g>
    </svg>
  );
}

/** Nome em texto real (selecionável, lido por leitores de tela, escala com o corpo). */
export function Wordmark({ className = '', light = true }: { className?: string; light?: boolean }) {
  return (
    <span className={`font-display font-bold leading-none tracking-[0.01em] ${light ? 'text-white' : 'text-primary'} ${className}`}>
      {BRAND.empresa}
    </span>
  );
}

/** Lockup horizontal: marca + nome + produto. `light` = sobre fundo escuro. */
export function Logo({ compact, light = true, size = 34, className = '' }: { compact?: boolean; light?: boolean; size?: number; className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      {!compact && (
        <div className="leading-none">
          <Wordmark className="text-[21px]" light={light} />
          <div className={`mt-1 text-xs font-medium tracking-[0.02em] ${light ? 'text-zinc-400' : 'text-subtle'}`}>
            {BRAND.produto}
          </div>
        </div>
      )}
    </div>
  );
}
