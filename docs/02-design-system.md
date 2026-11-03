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
