import { BRAND } from '../lib/brand';

/**
 * Corte de uma cava em bancadas, desenhado como perfil técnico. A linha amarela
 * é o caminho do relatório: nasce no fundo da cava (coleta em campo), sobe
 * bancada a bancada (revisão humana) e chega à borda (relatório aprovado).
 * O traço vertical tracejado é o furo de sondagem, o mesmo da haste da marca.
 *
 * Decorativa (aria-hidden): o texto da tela diz a mesma coisa em palavras.
 * A única animação é o traço da rota sendo desenhado uma vez; com
 * `prefers-reduced-motion` o estado final aparece de imediato.
 */
export default function LoginArt({ className }: { className?: string }) {
  const Y = BRAND.cor.amarelo;
  const profile = 'M0 90 H120 L160 140 H200 L240 190 H280 L320 240 H360 L380 285 H450 L478 245 H518 L546 205 H586 L600 170';
  const route = 'M415 285 H450 L478 245 H518 L546 205 H586 L600 170';
  return (
    <svg viewBox="0 0 600 400" fill="none" preserveAspectRatio="xMaxYMax meet" className={className} aria-hidden focusable="false">
      {/* massa de rocha: o corte do terreno abaixo do perfil */}
      <path d={`${profile} V400 H0 Z`} fill="#fff" fillOpacity="0.035" />
      {/* estratos */}
      <g stroke="#fff" strokeOpacity="0.09" strokeWidth="1.5">
        <path d="M0 322H600" /><path d="M0 352H600" /><path d="M0 380H600" />
      </g>
      {/* perfil do terreno: parede esquerda em bancadas, piso e parede direita */}
      <path
        d={profile}
        stroke="#fff" strokeOpacity="0.2" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"
      />
      {/* furo de sondagem */}
      <path d="M415 285 V392" stroke={Y} strokeWidth="2" strokeDasharray="3 6" strokeLinecap="round" opacity="0.7" />
      {/* rota do relatório */}
      <path
        d={route} pathLength={100} stroke={Y} strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round"
        className="animate-draw-route" style={{ '--len': 100 } as React.CSSProperties}
      />
      {/* marcos */}
      <g className="animate-fade-in" style={{ animationDelay: '0.5s' }}>
        <circle cx="415" cy="285" r="7" fill="#18181b" stroke={Y} strokeWidth="3" />
        <text x="402" y="309" textAnchor="end" fontSize="15" fill="#d4d4d8" fontWeight="500">Coleta em campo</text>
      </g>
      <g className="animate-fade-in" style={{ animationDelay: '0.95s' }}>
        <circle cx="518" cy="245" r="7" fill="#18181b" stroke={Y} strokeWidth="3" />
        <text x="504" y="233" textAnchor="end" fontSize="15" fill="#d4d4d8" fontWeight="500">Revisão humana</text>
      </g>
      <g className="animate-fade-in" style={{ animationDelay: '1.4s' }}>
        <circle cx="586" cy="205" r="8" fill={Y} />
        <path d="M582 205 l3 3 l5-6" stroke="#18181b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <text x="572" y="196" textAnchor="end" fontSize="15" fill="#fafafa" fontWeight="600">Relatório aprovado</text>
      </g>
    </svg>
  );
}
