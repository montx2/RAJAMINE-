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

## 6. Identidade Rajamine

A paleta inicial (navy/azul) foi substituída por **grafite/preto + amarelo-segurança**, a identidade observada nos documentos de exemplo do desafio e coerente com o setor (sinalização industrial de mineração).

| Token | Valor | Uso |
|---|---|---|
| `--color-primary` | `#18181B` | Sidebar, títulos, texto principal |
| `--color-brand` | `#FFC400` | Marca, faixas de PDF, filete de sinalização (`hazard`) |
| `--color-accent` | `#A34A08` | Links, CTAs secundários (âmbar escuro, 5,06:1 sobre o fundo) |
| `--color-accent-soft` | `#FEF3C7` | Fundos suaves de seleção/avisos |
| `--color-background` | `#EEEDE9` | Fundo geral |

**Marca (`src/components/Logo.tsx`).** Um "R" montado em estratos: a haste é o furo de sondagem e as três lâminas à direita são as bancadas empilhadas de uma cava; a terceira vira a perna do "R". Grade 64×64, vão constante de 3 unidades, legível em 16 px (favicon) e em monocromia. O nome é texto real em Barlow Semi Condensed 700, seguido de "FieldOps". O mesmo desenho é usado no favicon, nos ícones PWA e nos PDFs. Todo texto de marca vem de `src/lib/brand.ts`: trocar o nome é editar um arquivo.

**Tipografia.** IBM Plex Sans (texto), Barlow Semi Condensed (títulos, KPIs e marca) e JetBrains Mono (IDs operacionais). Piso de 12 px para qualquer texto.

Os PDFs usam título preto + faixa amarela + marca no canto. A base de acessibilidade do UI UX Pro Max (foco visível, reduced-motion, labels, contraste) foi mantida.

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

## 8. Revisão v4 — sobriedade editorial (auditoria final antes do cliente)

Pedido do usuário: *“elegante, minimalista e clean, zero cara de IA”*. A revisão v3
ainda tinha vários marcadores visuais associados a interfaces geradas
automaticamente. Eles foram removidos e as regras abaixo viraram restrição do
design system — não preferência de tela.

### O que foi removido e por quê

| Marcador removido | Onde estava | Substituição |
| --- | --- | --- |
| Ícone `Sparkles` | guia, aba do relatório, painel de padronização | `AlignLeft` / `Info`; aba renomeada de “Texto & IA” para “Texto” |
| Brilho pulsante no alvo (`.tour-glow`) | guia de introdução | anel neutro de 1 px (`border-white/75`) |
| Infográfico de 4 chips com setas | abertura do guia | um parágrafo factual |
| Ícone âmbar por passo + barra de progresso amarela | cartão do guia | contador `N / M`; peso `semibold` |
| Círculo verde + “Tudo pronto!” + “Bom trabalho!” | conclusão do guia | “Guia concluído” + uma frase |
| Cores decorativas (`violet`, `teal`, `sky`) | badges, avatares, ícones, realces | tons semânticos apenas |
| Manchas desfocadas coloridas (`blur-3xl`) | painel institucional do login | removidas |
| Gradiente ambiente âmbar forte | fundo global | opacidade reduzida de 0.14 → 0.05 |
| CTAs laranja-queimado (`variant="accent"`) | 26 botões | tom primário neutro (grafite / off-white) |
| Títulos `font-extrabold` | 13 arquivos | `font-semibold` (marca mantém o wordmark) |
| Copy publicitária e exclamações | login, revisão, motorista, guia | frases factuais, sem elogio ao usuário |
| Emoji nos títulos do README | documentação | títulos simples |

### Regras permanentes

1. **Cor tem significado ou não existe.** O tipo `Tone` aceita apenas
   `slate | blue | green | amber | red` (neutro, destaque, sucesso, alerta, erro).
   `violet` e `teal` foram removidos do tipo, então não podem voltar por engano.
   O status `arquivado` passou de `teal` para `slate`.
2. **Um único CTA por tela, no tom primário.** A variante `accent` foi removida de
   `BtnVariant`. O amarelo da marca fica no logotipo, no item de navegação ativo e
   em realces pequenos — nunca em botões grandes.
3. **Banner informativo é neutro.** `tone="info"` usa `bg-primary/[0.03]`; apenas
   `warn`, `success` e `danger` carregam cor.
4. **Texto de interface não menciona “IA”.** A automação é descrita pelo que faz
   (“sugestão de padronização”, “leitura dos códigos nas fotos”), sempre com a
   confirmação humana explícita.
5. **Nada de celebração.** Conclusões de fluxo dizem o que aconteceu e onde
   continuar. Sem exclamação, sem parabenização.
6. **Peso de título é `semibold`.** `extrabold` fica restrito ao wordmark.

### Correções estruturais decorrentes da auditoria

- **`cn` agora resolve conflitos do Tailwind** (`tailwind-merge`). Antes apenas
  concatenava: um `className="hidden sm:inline-flex"` não vencia o `inline-flex`
  da classe base, porque no CSS vence a ordem da folha e não a das classes. Isso
  fazia o pill “Online” aparecer em 390 px e colidir com os ícones do cabeçalho.
- **`Modal` e `Toaster` usam portal para o `body`.** As páginas usam `.page-enter`,
  cuja animação mantém um `transform` e cria contexto de empilhamento; o diálogo
  em `z-50` ficava abaixo da barra fixa em `z-30` e o botão “Confirmar” era
  inacessível no celular. O `Modal` também recebeu armadilha de foco, devolução do
  foco ao fechar e `aria-labelledby`.
- **Grade do login com `grid-cols-1`.** O track implícito usava o min-content de
  341 px dos cards de perfil e estourava 49 px em 390 px de largura.
- **Filtros do Arquivo de Documentos** passaram de grade fixa para `flex-wrap`,
  eliminando 82 px de estouro horizontal; códigos de relatório não quebram linha.
- **Barra de envio do checklist** só flutua quando está acionável, para não cobrir
  os itens que o motorista ainda precisa marcar.

### Verificação

Auditoria em navegador real (Chromium headless, 1440×900 e 390×844, claro e
escuro, `pt-BR`): 30 capturas, zero estouro horizontal, zero colisão no
cabeçalho, zero texto truncado na navegação, zero jargão de IA visível e destaque
do guia medido em −5/−5/+10/+10 px em relação ao alvo (o padding exato de 5 px).
Os scripts ficam em `.audit/` (fora do versionamento).

## 9. Revisão v5 — tela de acesso

O primeiro contato com o produto era uma tela dividida: painel institucional
escuro à esquerda com título de marketing e três cartões de diferenciais, e a
escolha de perfil à direita. Em telas estreitas o painel empurrava o acesso para
baixo, e a lista de cinco perfis dava à tela aparência de protótipo, não de produto.

A pesquisa sobre telas de acesso corporativas é convergente: Stripe, GitHub,
Notion e Linear usam **coluna única centrada**, com a marca presente mas discreta
e apenas os campos essenciais. A recomendação prática é tratar a tela como porta
de entrada, não como lugar de exploração, e manter a identidade reconhecível sem
competir com o formulário.

### O que mudou

- **Painel institucional removido.** Título de marketing, parágrafo e três
  cartões de diferenciais saíram da tela de acesso.
- **Formulário real:** e-mail e senha, com rótulos, `autocomplete`, alternador de
  visibilidade, aviso de Caps Lock e validação inline (campo vazio, formato
  inválido, e-mail não cadastrado). O acesso autentica pelo e-mail corporativo.
- **Divulgação progressiva:** os cinco perfis de demonstração e o link individual
  do colaborador ficam num painel recolhido, aberto por “Acesso de demonstração”.
  Recolhido, o painel recebe `inert`, saindo da ordem de foco e da árvore de
  acessibilidade sem impedir a animação de altura.
- **Marca discreta:** símbolo, wordmark e “FIELDOPS” centralizados acima do
  cartão; rodapé de uma linha com a razão social e o aviso de dados sintéticos.
- **Cartão sólido**, não vidro: sobre fundo liso o vidro fica turvo. Sombra em
  duas camadas, raio de 16 px.
- **Movimento contido:** entrada em cascata do cartão e dos campos, expansão
  suave do painel, micro-press no botão. Nada em laço; `prefers-reduced-motion`
  respeitado.

### Regra permanente: foco é neutro

O anel de foco (`:focus-visible` e `.input:focus`) usava o âmbar de destaque —
herança da versão em que os botões também eram coloridos. Foco é *affordance*,
não significado, e por isso passou a usar `--input-border-focus` (grafite a 65%
no claro, off-white a 65% no escuro), com contraste acima de 3:1 contra o fundo
nos dois temas, conforme WCAG 2.2 (2.4.11). Isso removeu o último elemento
“alto” da interface, incluindo o contorno que aparecia no cartão do guia quando
ele recebia foco programático.

### Verificação

Auditoria dedicada em Chromium real: 12 capturas em 1440×900, 1280×720, 768×1024
e 390×844, nos dois temas, cobrindo estado inicial, validação vazia, formato
inválido, e-mail desconhecido, painel aberto, alternância de senha e login por
e-mail. Zero estouro horizontal, zero elemento fora da viewport e nenhum alvo de
toque abaixo de 24 px — o link “Esqueci minha senha” tinha 19 px e foi ampliado
com padding e margem negativa, preservando o alinhamento visual.
