export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden>
      <rect width="64" height="64" rx="14" fill="#0F172A" />
      <path d="M32 12 L50 22.5 V43.5 L32 54 L14 43.5 V22.5 Z" stroke="#38BDF8" strokeWidth="3.2" strokeLinejoin="round" />
      <path d="M22 38 L30 26 L35 33 L38 29 L44 38 Z" fill="#F8FAFC" />
    </svg>
  );
}

export function Logo({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark size={34} />
      {!compact && (
        <div className="leading-none">
          <div className="text-[15px] font-extrabold tracking-tight text-white">RAJAMINE</div>
          <div className="text-[10px] font-semibold tracking-[0.18em] text-sky-300/90 mt-1">FIELDOPS</div>
        </div>
      )}
    </div>
  );
}
