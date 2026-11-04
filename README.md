# Rajamine FieldOps

**Sistema de Gestão e Padronização de Relatórios de Campo**
Protótipo funcional de alta fidelidade para a **Rajamine Inteligência em Mineração LTDA**.

> Do link de preenchimento ao arquivo final: coleta móvel, padronização de textos, leitura de equipamentos por foto (OCR local no navegador), revisão humana obrigatória e geração de PDFs profissionais — com trilha de auditoria completa.
>
> **Base 100% sintética e realista.** Nenhum dado real de cliente, colaborador ou planilha da empresa é utilizado. Envios, lembretes e sincronização são simulados e rotulados.
>
> **Design v4 — Clean Glass:** superfícies de vidro com lastro acessível, tema claro/escuro, animações sutis (120–360ms, reduced-motion), tutorial rápido e progressive disclosure.

---

## ▶ Como executar (desenvolvimento)

Pré-requisitos: **Node.js 20+** (recomendado 22) e npm.

```bash
npm install          # instala as dependências
npm run setup:ocr    # prepara worker/core WASM + modelo de idioma locais (1x)
npm run dev          # http://localhost:5173
```

Outros comandos:

```bash
npm test             # testes unitários + smoke de renderização (Vitest)
npm run build        # build de produção (TypeScript + Vite)
npm run portable     # gera portable/app a partir do build
npm run test:e2e     # Playwright (requer: npx playwright install chromium)
node scripts/ocr-smoke.mjs   # verifica o OCR real nas fotos de exemplo (Node)
```

## 💾 Pacote pendrive (Windows, sem Node)

Para apresentar em máquinas sem Node/npm:

```bash
npm run portable     # gera portable/app
```

Depois copie a pasta `portable/` inteira para o pendrive. No Windows:

1. Dê dois cliques em `portable/INICIAR.bat`.
2. O navegador abre em `http://localhost:8080`.
3. Mantenha a janela do servidor aberta enquanto usar o sistema.

O pacote usa apenas PowerShell (já incluso no Windows 10/11). Todos os assets (OCR, fontes, fotos demo) vão junto. Não abra `app/index.html` diretamente; use sempre `INICIAR.bat`.

> OCR: `setup:ocr` copia worker/core do `node_modules` e baixa o modelo `eng.traineddata` do repositório oficial `tesseract-ocr/tessdata_fast` (Apache-2.0). Tudo é servido localmente de `public/ocr/` — **nenhuma imagem sai do dispositivo**.

## 🧭 Roteiro de demonstração (8–10 minutos)

1. **Login** — Helena (Administradora), Marta (Revisão), Carlos (Colaborador) ou **João Batista (Motorista)**.
2. **Dashboard** — KPIs, prazos, produtividade e atalhos.
3. **Operações de campo** (`/operacoes`) — base sintética: equipamento, telemetria, Pulsus, câmera (IMEI), atividade e fotos. Exporte CSV.
4. **Novo relatório** — caminhão opcional; escolha visita técnica / atividade externa / viagem. O sistema gera o **link individual** com prazo de 48 h.
5. **Preenchimento (colaborador)** — stepper em 4 passos. Registre **atividades por equipamento** com IDs operacionais. Escreva o relato livre e veja a **padronização sugerir 3ª pessoa / correções** com diff. Aceite, edite ou rejeite — o original é preservado.
6. **Fotos & OCR** — galeria demonstrativa com **14 imagens sintéticas de campo**. OCR real multi-pass; confirme/corrija/rejeite. Reconhece códigos (`SA-101`, `VA-205`) e IMEI de 15 dígitos.
7. **Central de Revisão** — como Marta, tente aprovar com OCR pendente: **bloqueia**. Confira e aprove.
8. **Documentos** — gere os **2 PDFs**: cliente e interno. Envio ao cliente é **simulado**.
9. **Consolidado semanal** (`/semanal`) — gerador de PDF semanal a partir de relatórios **aprovados**. O sistema sinaliza atividade fora do período sem alterá-la.
10. **Portal do Motorista** (`/motorista`) — checklist automático, falha que abre ocorrência, ciência de treinamento digitada e fila offline simulada. Triagem em **Ocorrências** (`/ocorrencias`).

## ✅ Real × simulado (integridade)

| Funcionalidade | Status |
|---|---|
| Navegação, formulários, filtros, cadastros, atividades por equipamento | **Real** (persistência local do navegador) |
| Padronização 1ª→3ª pessoa + concordância + alertas de IDs/período | **Real, motor local de regras** (determinístico; não é LLM) |
| OCR de etiquetas/códigos/IMEI | **Real — Tesseract.js 7 (WASM) local**, multi-pass; fallback simulado **rotulado** |
| Geração dos 2 PDFs + consolidado semanal | **Real — pdf-lib**, download e preview funcionais |
| Aprovação humana obrigatória | **Real** (regra bloqueante, inclusive no semanal) |
| Trilha de auditoria / versões | **Real** |
| Portal do Motorista (checklist, ocorrência, treino, histórico) | **Real no protótipo** (PWA mobile-first, regras locais, RBAC demonstrativo) |
| Sincronização offline / notificações do motorista | **Simuladas e rotuladas** |
| Autenticação | **Simulada** (seleção de perfil; produção exige OIDC/MFA) |
| Envio de link, lembretes, envio ao cliente | **Simulados e rotulados** |
| Banco de dados / backend | **Camada demonstrativa** (localStorage + IndexedDB); arquitetura de produção documentada |
| Dados | **Base 100% sintética realista**. Nenhuma informação real da empresa é persistida ou exibida. |

## 🗂 Estrutura

```
├── src/
│   ├── components/      # UI kit, layout, painel IA, painel OCR, diff, timeline, tema, tour
│   ├── pages/           # Dashboard, Relatórios, Preencher, Revisão, Operações,
│   │                    # Semanal, Equipamentos, Caminhões, Ocorrências, Cadastros,
│   │                    # Documentos, Login
│   │   └── driver/      # Portal do Motorista (PWA)
│   ├── services/        # padronizacao.ts, ocr.ts (Tesseract), pdf.ts (pdf-lib + semanal)
│   ├── store/           # Zustand + persistência; fotos no IndexedDB
│   ├── data/            # types, seed sintético, demoOperations, demoReports
│   └── lib/             # diff, formatação, operations.ts, docs, theme
├── public/ocr/          # assets locais do Tesseract (gerados por setup:ocr)
├── public/demo/         # 14 fotos demonstrativas sintéticas
├── public/icons/        # ícones PWA do Portal do Motorista
├── public/manifest.webmanifest + sw.js  # PWA (registro apenas em build de produção)
├── portable/            # INICIAR.bat + servidor.ps1 + app (build para pendrive)
├── tests/               # Vitest: motores, regras, PDF, dados demo, smoke de telas
├── e2e/                 # Playwright: fluxos completos (CI/local)
├── scripts/             # setup-ocr.mjs, ocr-smoke.mjs, make-portable.mjs
└── docs/                # documentação técnica
```

## 📚 Documentação técnica

| Doc | Conteúdo |
|---|---|
| [01-diagnostico.md](docs/01-diagnostico.md) | Problema, gargalos, proposta e diferenciais |
| [02-design-system.md](docs/02-design-system.md) | UI UX Pro Max + identidade Rajamine |
| [03-arquitetura.md](docs/03-arquitetura.md) | Stack, comparações, banco de dados, produção |
| [04-seguranca.md](docs/04-seguranca.md) | OWASP (Top 10, ASVS 5.0, Cheat Sheets, API, ZAP) |
| [05-ia-ocr.md](docs/05-ia-ocr.md) | IA/OCR, PaddleOCR × Tesseract, PDFs, IDs operacionais |
| [06-legal.md](docs/06-legal.md) | LGPD, Marco Civil, decretos e resoluções ANPD |
| [07-custos.md](docs/07-custos.md) | Estimativas mensais em R$ com premissas e fontes |
| [08-plano.md](docs/08-plano.md) | MVP, plano de desenvolvimento, riscos e demonstração |
| [09-dados-demo.md](docs/09-dados-demo.md) | Base sintética realista, formatos de IDs e limites |
| [10-portal-motorista.md](docs/10-portal-motorista.md) | Portal do Motorista PWA |
| [design-system-output.md](docs/design-system-output.md) | Saída bruta do gerador UI UX Pro Max |

## 🧰 Stack

Vite 7 · React 19 · TypeScript 5.9 · Tailwind CSS 4 · React Router 7 · Zustand 5 · Recharts 3 · Lucide · **pdf-lib** (MIT) · **Tesseract.js 7** (Apache-2.0) · Zod 4 · idb-keyval · Vitest 5 · Playwright · Fontes self-hosted (Plus Jakarta Sans + JetBrains Mono, OFL).

---

*Protótipo demonstrativo — base sintética realista, envios simulados. A conformidade plena com a LGPD depende das medidas de produção e de validação jurídica da empresa (ver [docs/06-legal.md](docs/06-legal.md)).*
