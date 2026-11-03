# 02 — Design System com UI UX Pro Max

## 1. Como a ferramenta foi utilizada (processo real)

O repositório [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) (MIT, v2.15.0 no momento da análise) foi clonado e estudado. Ele não é uma biblioteca de componentes: é uma **skill de inteligência de design** com:

- banco de dados CSV (192 tipos de produto, 79 estilos, 192 paletas, 74 pares tipográficos, 119 diretrizes UX, 25 tipos de gráfico);
- um **motor de raciocínio em Python** (`src/ui-ux-pro-max/scripts/design_system.py`) que cruza o tipo de produto com regras de estilo, cor, tipografia e anti-padrões;
- busca BM25 por domínio (`search.py --domain chart|ux|style|...`) e guidelines por stack (`--stack react`).

A plataforma desta sessão não instala "skills" nativamente, então — conforme permitido pelo desafio — **executamos o motor oficial diretamente**:

```bash
python3 design_system.py \
  "enterprise B2B SaaS dashboard field operations report management mining industrial professional trustworthy" \
  -p "Rajamine FieldOps" -f markdown
```

A saída completa está preservada em [design-system-output.md](design-system-output.md). Também consultamos os domínios `chart` (dashboards) e `ux` (formulários, tabelas, feedback, acessibilidade) e aplicamos as diretrizes no código.

## 2. Resultado do gerador (resumo)

| Dimensão | Recomendação | Aplicação |
|---|---|---|
| Padrão | **Trust & Authority** — navy/cinza corporativo, azul de confiança, acento só no CTA | Sidebar navy `#0F172A`, conteúdo claro `#F8FAFC`, CTA `#0369A1` |
| Estilo | **Accessible & Ethical** — alto contraste, foco visível, semântica, reduced-motion | `:focus-visible` 3px, `prefers-reduced-motion`, labels reais, `role/aria` em tabs, modais e gráficos |
| Cores | Primary `#0F172A`, Secondary `#334155`, Accent `#0369A1`, Background `#F8FAFC`, Border `#E2E8F0`, Destructive `#DC2626` | Tokens em `src/styles.css` (`@theme` do Tailwind 4) |
| Tipografia | **Plus Jakarta Sans** (enterprise/B2B) | Self-hosted via `@fontsource-variable` (OFL); JetBrains Mono para códigos/IDs |
| Efeitos | Transições 150–300 ms, hover suave, foco 3–4px, alvos de toque 44px | Botões ≥42px, transições 150 ms, sem sombras exageradas |
| Anti-padrões | Design "playful", gradientes roxo/rosa de IA, credenciais ocultas | Nenhum gradiente decorativo; cores de status com texto+ícone (não só cor) |

## 3. Diretrizes UX aplicadas (das buscas no banco da skill)

- **Form Labels**: todo input tem `<label for>` — nunca placeholder-only.
- **Inline Validation**: validação no blur/envio com erros por campo + **sumário de erros focável** no preenchimento (`role="alert"`).
- **Submit Feedback**: estados loading → sucesso/erro em todos os fluxos (toasts + banners).
- **Table Handling**: tabelas com `overflow-x-auto` e cartões no mobile.
- **Loading States**: skeleton/progresso com `aria-busy` implícito; OCR mostra progresso por passe.
- **Charts**: gráficos como complemento de números textuais (KPIs e legendas com valores); tooltips acessíveis; cores de status nunca são o único canal (badges têm texto e ponto).
- **Resilient text**: truncamento com `title`/`line-clamp` e caminho de acesso ao valor completo; chips quebram linha.

## 4. Tokens implementados

```css
@theme {
  --color-primary: #0f172a;      /* navy corporativo */
  --color-accent: #0369a1;       /* azul de confiança (CTA) */
  --color-background: #f8fafc;
  --color-surface: #ffffff;
  --color-muted: #eef1f5;
  --color-border: #e2e8f0;
  --color-success: #15803d;  --color-warning: #b45309;  --color-destructive: #dc2626;
  --font-sans: "Plus Jakarta Sans Variable", ...;
  --font-mono: "JetBrains Mono Variable", ...;
}
```

Componentes consistentes em `src/components/ui.tsx`: Button (6 variantes), Badge/StatusBadge (texto+ponto), Field/Input/Select/Textarea com erro, Modal com foco e Esc, Tabs com `aria-selected`, Toasts `aria-live`, Banner, ConfidenceBar, EmptyState, Avatar, ProgressBar.

## 5. Checklist de pré-entrega (da skill) — verificado

- [x] Sem emojis como ícones (Lucide SVG em tudo)
- [x] `cursor-pointer` em clicáveis
- [x] Hover 150–300 ms
- [x] Contraste de texto ≥ 4.5:1 no light mode (navy/slate sobre branco)
- [x] Foco visível para teclado
- [x] `prefers-reduced-motion` respeitado
- [x] Chips/badges sem clipping; truncamento com acesso ao valor
- [x] Responsivo 375 / 768 / 1024 / 1440 (sidebar → drawer + bottom nav)

## 6. Adaptação à identidade real da Rajamine

Após receber os documentos reais da empresa, a paleta inicial (navy/azul) foi substituída pela identidade observada: **grafite/preto + amarelo/âmbar**.

| Token | Valor | Uso |
|---|---|---|
| `--color-primary` | `#18181B` | Sidebar, títulos, texto principal |
| `--color-brand` | `#FFC400` | Wordmark Mine, faixas de PDF, destaques de marca |
| `--color-accent` | `#B45309` | Links, tabs, CTAs secundários (âmbar escuro para contraste AA sobre branco) |
| `--color-accent-soft` | `#FEF3C7` | Fundos suaves de seleção/avisos |
| `--color-background` | `#FAFAF9` | Fundo geral |

O wordmark `RajaMine` (Raja em preto/branco, Mine em amarelo) foi aproximado tipograficamente para o protótipo; não é o vetor oficial. Os PDFs usam título preto + faixa amarela + wordmark no canto, como nos documentos reais. A base de acessibilidade do UI UX Pro Max (foco visível, reduced-motion, labels, contraste) foi mantida.

## 7. Reformulação v3 — “Liquid Glass Clean” (pedido do usuário)

O usuário pediu: menos informação, mais clean, animações e superfícies transparentes tipo vidro. A reformulação aplicou pesquisa de design + UI UX Pro Max (estilo *Glassmorphism* condicional + *Minimalism & Swiss*).

### Regras pesquisadas e aplicadas

| Regra | Fonte | Aplicação no FieldOps |
|---|---|---|
| Vidro nunca pode depender só do blur para contraste; usar lastro semi-opaco e testar pior fundo | Axess Lab — *Glassmorphism Meets Accessibility*; Clay — *Why Everything Is Going Glassmorphism* | `.glass` usa `rgba(255,255,255,0.72)` + `@supports` fallback sólido `0.94`; texto `#18181B`/`#52525B` mantém AA |
| Blur moderado (8–16px), vidro só onde comunica hierarquia (nav, overlays, cards), CTAs sólidos | Inverness Design Studio; Glassmorphism 2.0 | Sidebar/topbar/modais/toasts em vidro; botões primary/accent sólidos; blur 16px cards, 20px modal, 6px overlay |
| WCAG 2.2 AA: texto 4.5:1, componentes 3:1, foco visível, reduced-motion | Axess Lab; UUPM checklist | `--color-subtle` escurecido para `#52525B`; foco 3px âmbar; `prefers-reduced-motion` zera animações |
| Motion: 100–150ms micro, 200–300ms transições, ease-out entradas / ease-in saídas, só transform/opacity | Superfiles — *12 Motion Design Rules*; Appy Pie — *Mobile App Animation Guide* | Tokens `--dur-fast/base/slow/page` = 120/200/280/360ms; `--ease-out/in/in-out/spring`; `.press`, `.lift`, `.stagger`, `page-enter` |
| Progressive disclosure: essencial primeiro, detalhes sob demanda, no máximo 2 níveis | NN/g — *Progressive Disclosure*; UX Pickle | Dashboard: 4 KPIs + fila + atalhos; gráficos em `Disclosure` fechado. Relatórios: busca + chips de status; filtros avançados sob botão |
| Densidade e hierarquia: reduzir colunas, agrupar navegação, eyebrow + título curto | UUPM Minimalism & Swiss; SaaS UX best practices | Sidebar agrupada (Principal/Campo/Gestão); tabela de relatórios com 5 colunas; subtítulos curtos |

### Tokens principais (src/styles.css)

```css
--glass-bg: rgb(255 255 255 / 0.72);
--glass-bg-strong: rgb(255 255 255 / 0.86);
--glass-dark-bg: rgb(24 24 27 / 0.82);
--blur-glass: 16px; --blur-overlay: 6px;
--dur-fast: 120ms; --dur-base: 200ms; --dur-slow: 280ms; --dur-page: 360ms;
--ease-out: cubic-bezier(0.22, 1, 0.36, 1);
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
```

### O que ficou mais clean

- **Dashboard**: 4 KPIs clicáveis (antes 5), fila de prazos (4 itens), atalhos, referências em card compacto, produtividade em 3 barras, atividade recente (5 itens). Gráficos de período/status só aparecem ao abrir “Análises detalhadas”.
- **Relatórios**: busca sempre visível + chips de status; cliente/colaborador/caminhão/datas escondidos em “Filtros”. Tabela reduzida para Relatório (código + cliente + data), Responsável, Status, Prazo, Ação. Caminhão/trajeto continuam no detalhe e na busca.
- **Navegação**: sidebar de vidro escuro agrupada por Principal/Campo/Gestão; topbar mínima com status “demonstração”, notificações e LGPD; rodapé mobile em vidro.
- **Login**: painel institucional com 3 diferenciais (antes 4), cards de perfil em vidro com stagger de entrada.
- **Componentes**: botões com micro-press (scale 0.97), cards com hover-lift, tabs em pill de vidro, modal com overlay blur + scale-in, toasts slide-in, banners translúcidos, skeleton shimmer.

### Acessibilidade e performance

- `@supports (backdrop-filter)` com fallback sólido para navegadores sem suporte.
- Apenas `transform`/`opacity` animados; nada de loop decorativo no fundo (gradiente ambiente estático).
- `prefers-reduced-motion` respeitado globalmente.
- Gráficos pesados (Recharts) só montam quando o usuário abre a seção de análises.
- Contraste testado conceitualmente contra o pior fundo (gradiente âmbar/grafite claro): texto principal `#18181B` sobre vidro `0.72` permanece > 7:1; subtítulo `#52525B` > 4.5:1.

> A saída bruta do UI UX Pro Max para esta revisão está em `design-system-output.md` (seção “Revisão v3 — glass clean”).
