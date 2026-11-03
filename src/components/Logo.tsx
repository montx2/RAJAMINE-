/* Wordmark inspirado na identidade real da Rajamine (preto/grafite + amarelo).
   Não é o arquivo vetorial oficial; é uma aproximação tipográfica para o protótipo. */
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden>
      <rect width="64" height="64" rx="14" fill="#18181B" />
      <path d="M14 44 L24 20 L34 34 L40 26 L50 44 Z" fill="#FFC400" />
      <path d="M12 48 H52" stroke="#FFC400" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Wordmark({ className = '', light = true }: { className?: string; light?: boolean }) {
  return (
    <span className={`font-extrabold italic tracking-tight leading-none ${className}`} aria-label="Rajamine">
      <span className={light ? 'text-white' : 'text-primary'}>Raja</span>
      <span className="text-brand">Mine</span>
    </span>
  );
}

export function Logo({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark size={34} />
      {!compact && (
        <div className="leading-none">
          <Wordmark className="text-[19px]" />
          <div className="text-[9.5px] font-semibold tracking-[0.22em] text-zinc-400 mt-1">FIELDOPS</div>
        </div>
      )}
    </div>
  );
}
