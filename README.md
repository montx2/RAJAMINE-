# Rajamine FieldOps

**Sistema de Gestão e Padronização de Relatórios de Campo**
Protótipo de alta fidelidade para a **Rajamine Inteligência em Mineração LTDA** — competição tecnológica SENAI.

> Do link de preenchimento ao arquivo final: coleta móvel, padronização de textos, leitura de equipamentos por foto (OCR real no navegador), revisão humana obrigatória e geração de PDFs profissionais — com trilha de auditoria completa.
>
> **Atualizado com referências reais da empresa (set/2026):** planilha de instalações/manutenções/retiradas, relatório de visita técnica, atividade externa e consolidado semanal. Identidade visual grafite + amarelo Rajamine.
>
> **Design v3 — Liquid Glass Clean:** superfícies de vidro com lastro acessível, animações sutis (120–360ms, ease-out, reduced-motion), navegação agrupada e progressive disclosure — essencial primeiro, detalhes sob demanda. Ver [docs/02-design-system.md](docs/02-design-system.md).

---

## ▶ Como executar

Pré-requisitos: **Node.js 20+** (recomendado 22) e npm.

```bash
npm install          # instala as dependências
npm run setup:ocr    # prepara worker/core WASM + modelo de idioma locais (1x)
npm run dev          # http://localhost:5173
```

Outros comandos:

```bash
npm test             # 80 testes unitários + smoke de renderização (Vitest)
npm run build        # build de produção (TypeScript + Vite)
npm run test:e2e     # Playwright (requer: npx playwright install chromium)
node scripts/ocr-smoke.mjs   # verifica o OCR real nas fotos de exemplo (Node)
```

> **OCR:** `setup:ocr` copia worker/core do `node_modules` e baixa o modelo `eng.traineddata` do repositório oficial `tesseract-ocr/tessdata_fast` (Apache-2.0). Tudo é servido localmente de `public/ocr/` — **nenhuma imagem sai do dispositivo**. Se o download falhar, o sistema continua com o modo demonstrativo rotulado.

## 🧭 Roteiro de demonstração (10–12 minutos)

1. **Login** — Helena (Administradora), Marta (Revisão), Glauber (colaborador de referência real) ou **João Batista (Motorista)**.
2. **Dashboard** — KPIs, prazos, produtividade e o painel **Referências reais da Rajamine integradas**.
3. **Operações de campo** (`/operacoes`) — planilha real MFS 22/09/2026: equipamento, telemetria, Pulsus, câmera (IMEI), atividade, observação e fotos. Exporte CSV e veja alertas de consistência.
4. **Novo relatório** — caminhão agora é **opcional**; escolha visita técnica / atividade externa / viagem, informe objetivo, setor e cidade. O sistema gera o **link individual** com prazo de 48 h.
5. **Preenchimento (colaborador)** — stepper em 4 passos. Registre **atividades por equipamento** com IDs reais (telemetria `0987`, Pulsus `2758`, câmera `864993060408250`). Escreva o relato livre e veja a **IA sugerir 3ª pessoa / correções** com diff. Aceite, edite ou rejeite — o original é preservado.
6. **Fotos & OCR** — galeria demonstrativa com **14 imagens de campo** (etiquetas, câmera de fadiga, tablet Pulsus, Galileo, chicote, checklist, caminhão na mina), anexo aleatório sem repetição ou foto sintética. OCR real multi-pass; confirme/corrija/rejeite. Reconhece códigos reais (`CP-101`, `TYE-9A00`) e IMEI de 15 dígitos.
7. **Central de Revisão** — como Marta, tente aprovar com OCR pendente: **bloqueia**. Confira e aprove.
8. **Documentos** — gere os **2 PDFs reais** nos formatos da empresa: cliente (Visita Técnica / Atividade Externa, sem fotos) e interno (fotos, OCR, original, sensação do cliente, melhorias, histórico). Envio ao cliente é **simulado**.
9. **Consolidado semanal** (`/semanal`) — referência real AMDA/FDX e gerador de PDF semanal a partir de relatórios **aprovados**. O sistema sinaliza atividade fora do período sem alterá-la.
10. **Equipamentos & IDs** — busque `0987`, `2758` ou um IMEI e veja equipamentos/relatórios vinculados.
11. **Portal do Motorista** (`/motorista`) — como João Batista: checklist automático do C-101, falha que abre ocorrência, ciência de treinamento digitada e fila offline simulada. Como Helena: triagem em **Ocorrências de motoristas** (`/ocorrencias`).
12. **Segurança & LGPD** — medidas implementadas, pendências de produção, mapa legal, exportação JSON com proveniência e restauração da base demo.

## ✅ Real × simulado (integridade)

| Funcionalidade | Status |
|---|---|
| Navegação, formulários, filtros, cadastros, atividades por equipamento | **Real** (persistência local do navegador) |
| Padronização 1ª→3ª pessoa + concordância + alertas de IDs/período | **Real, motor local de regras** (determinístico; não é LLM) |
| OCR de etiquetas/códigos/IMEI | **Real — Tesseract.js 7 (WASM) local**, multi-pass; fallback simulado **rotulado** |
| Geração dos 2 PDFs + consolidado semanal | **Real — pdf-lib**, download e preview funcionais |
| Aprovação humana obrigatória | **Real** (regra bloqueante, inclusive no semanal) |
| Trilha de auditoria / versões / proveniência de dados | **Real** |
| Portal do Motorista (checklist, ocorrência, treino, histórico) | **Real no protótipo** (PWA mobile-first, regras locais, RBAC demonstrativo) |
| Sincronização offline / notificações do motorista | **Simuladas e rotuladas** (fila local; produção exige API + push consentido) |
| Autenticação | **Simulada** (seleção de perfil; produção exige OIDC/MFA) |
| Envio de link, lembretes, envio ao cliente | **Simulados e rotulados** |
| Banco de dados / backend | **Camada demonstrativa** (localStorage + IndexedDB); arquitetura de produção documentada |
| Dados | **Base mista**: exemplos sintéticos + referências reais fornecidas pela empresa, marcadas com `origemDados`. Imagens originais não são commitadas. |

## 🗂 Estrutura

```
├── src/
│   ├── components/      # UI kit, layout, painel IA, painel OCR, diff, timeline
│   ├── pages/           # Dashboard, Relatórios, Preencher, Revisão, Operações,
│   │                    # Semanal, Equipamentos, Caminhões, Ocorrências de motoristas,
│   │                    # Cadastros, Documentos, Conformidade, Login
│   │   └── driver/      # Portal do Motorista (PWA): início, checklist, ocorrências,
│   │                    # histórico, treinamento
│   ├── services/        # padronizacao.ts, ocr.ts (Tesseract), pdf.ts (pdf-lib + semanal)
│   ├── store/           # Zustand + persistência; fotos no IndexedDB
│   ├── data/            # types, seed sintético, referencias.ts (material real)
│   └── lib/             # diff, formatação, operations.ts (consistência real), docs
├── public/ocr/          # assets locais do Tesseract (gerados por setup:ocr)
├── public/demo/         # 14 fotos demonstrativas sintéticas (não são fotos reais da empresa)
├── public/icons/        # ícones PWA do Portal do Motorista
├── public/manifest.webmanifest + sw.js  # PWA (registro apenas em build de produção)
├── tests/               # Vitest: motores, regras, PDF, referências reais, smoke de telas
├── e2e/                 # Playwright: fluxos completos (CI/local)
├── scripts/             # setup-ocr.mjs, ocr-smoke.mjs
└── docs/                # documentação técnica (índice abaixo)
```

## 📚 Documentação técnica

| Doc | Conteúdo |
|---|---|
| [01-diagnostico.md](docs/01-diagnostico.md) | Problema, gargalos, proposta e diferenciais |
| [02-design-system.md](docs/02-design-system.md) | UI UX Pro Max + adaptação à identidade real Rajamine |
| [03-arquitetura.md](docs/03-arquitetura.md) | Stack, comparações, banco de dados, produção |
| [04-seguranca.md](docs/04-seguranca.md) | OWASP (Top 10, ASVS 5.0, Cheat Sheets, API, ZAP) |
| [05-ia-ocr.md](docs/05-ia-ocr.md) | IA/OCR, PaddleOCR × Tesseract, PDFs, IDs reais |
| [06-legal.md](docs/06-legal.md) | LGPD, Marco Civil, decretos e resoluções ANPD |
| [07-custos.md](docs/07-custos.md) | Estimativas mensais em R$ com premissas e fontes |
| [08-plano.md](docs/08-plano.md) | MVP, plano de desenvolvimento, riscos e demonstração |
| [09-referencias-empresa.md](docs/09-referencias-empresa.md) | **Material real recebido, correções aplicadas e limites de inferência** |
| [10-portal-motorista.md](docs/10-portal-motorista.md) | **Portal do Motorista PWA**: automações permitidas/proibidas, rotas, dados, offline, testes |
| [design-system-output.md](docs/design-system-output.md) | Saída bruta do gerador UI UX Pro Max |

## 🧰 Stack

Vite 7 · React 19 · TypeScript 5.9 · Tailwind CSS 4 · React Router 7 · Zustand 5 · Recharts 3 · Lucide · **pdf-lib** (MIT) · **Tesseract.js 7** (Apache-2.0) · Zod 4 · idb-keyval · Vitest 5 · Playwright · Fontes self-hosted (Plus Jakarta Sans + JetBrains Mono, OFL).

---

*Protótipo demonstrativo — base mista (sintética + referências reais marcadas), envios simulados. A conformidade plena com a LGPD depende das medidas de produção e de validação jurídica da empresa (ver [docs/06-legal.md](docs/06-legal.md)).*
