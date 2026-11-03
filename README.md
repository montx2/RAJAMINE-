# Rajamine FieldOps

**Sistema de Gestão e Padronização de Relatórios de Campo**
Protótipo de alta fidelidade desenvolvido para o desafio da **Rajamine Inteligência em Mineração LTDA** — competição tecnológica SENAI.

> Do link de preenchimento ao arquivo final: coleta móvel, padronização inteligente de textos, leitura de equipamentos por foto (OCR real no navegador), revisão humana obrigatória e geração de dois PDFs profissionais — com trilha de auditoria completa.

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
npm test             # 50 testes unitários + smoke de renderização (Vitest)
npm run build        # build de produção (TypeScript + Vite)
npm run test:e2e     # Playwright (requer: npx playwright install chromium)
node scripts/ocr-smoke.mjs   # verifica o OCR real nas fotos de exemplo (Node)
```

> **Nota sobre o OCR:** `setup:ocr` copia o worker e o core WASM do `node_modules` e baixa o modelo `eng.traineddata` do repositório oficial `tesseract-ocr/tessdata_fast` (Apache-2.0). Tudo é servido localmente de `public/ocr/` — **nenhuma imagem sai do dispositivo**. Se o download falhar, o sistema continua funcionando com o modo demonstrativo rotulado.

## 🧭 Roteiro de demonstração (10 minutos)

1. **Login** — escolha **Helena Duarte (Administradora)**. Três perfis demonstrativos com permissões diferentes.
2. **Dashboard** — KPIs, gráficos por período, prazos atrasados/psóximos, produtividade e atividades recentes. Clique em **Lembrar** num prazo crítico (lembrete simulado, registrado na auditoria).
3. **Novo relatório** — crie um relatório: o sistema gera o **link individual** do colaborador com prazo de 48 h. Copie ou abra o link.
4. **Preenchimento (visão do colaborador)** — stepper em 4 passos, pensado para celular. Escreva em 1ª pessoa ("Cheguei na mina as 8h e instalei o sensor…") e veja a **IA sugerir a 3ª pessoa** com diff visual. Aceite, edite ou rejeite — o original é preservado.
5. **Fotos & OCR** — anexe uma foto de exemplo e clique **Executar OCR** (Tesseract WASM real, multi-pass). Ou gere uma **foto sintética de teste** para ver o reconhecimento com alta confiança. Confirme/corrija/rejeite a leitura — só então o equipamento é associado ao caminhão.
6. **Central de Revisão** — entre como **Marta Fonseca (Revisão)**. Tente aprovar um relatório com OCR pendente: o sistema **bloqueia**. Confira a leitura, aprove e veja o registro com autor/data.
7. **Documentos** — gere os **2 PDFs reais**: cliente (sem fotos, com bloco de aprovação) e interno (fotos, OCR, texto original, histórico). Visualize no navegador e baixe. Registre o **envio ao cliente (simulado)**.
8. **Equipamentos / Caminhões** — pesquise `EQ-2041` e veja o histórico de instalações e relatórios vinculados.
9. **Arquivo** — documentos e fotografias com filtros por cliente, período, tipo e identificação.
10. **Segurança & LGPD** — o que está implementado, o que depende de produção, mapa de dispositivos legais, exportação de dados (JSON) e restauração da base demo.

## ✅ O que é real × o que é simulado (integridade)

| Funcionalidade | Status no protótipo |
|---|---|
| Navegação, formulários, filtros, cadastros | **Real** (persistência local do navegador) |
| Padronização 1ª→3ª pessoa + alertas | **Real, motor local de regras** (determinístico, auditável; não é LLM) |
| OCR de etiquetas | **Real — Tesseract.js 7 (WASM) local**, pipeline multi-pass; fallback simulado **rotulado** |
| Geração dos 2 PDFs | **Real — pdf-lib**, download e preview funcionais |
| Aprovação humana obrigatória | **Real** (regra de negócio bloqueante) |
| Trilha de auditoria / versões | **Real** (quem, quando, o quê; originais preservados) |
| Autenticação | **Simulada** (seleção de perfil; produção exige OIDC/MFA — ver docs) |
| Envio de link, lembretes, envio ao cliente | **Simulados e rotulados** (nenhuma mensagem real disparada) |
| Banco de dados / backend | **Camada demonstrativa** (localStorage + IndexedDB); arquitetura de produção documentada |
| Dados | **100% fictícios**; fotos de exemplo geradas por IA e identificadas como demonstrativas |

## 🗂 Estrutura

```
├── src/
│   ├── components/      # UI kit, layout, painel IA, painel OCR, diff, timeline
│   ├── pages/           # Dashboard, Relatórios, Preencher, Revisão, Equipamentos,
│   │                    # Caminhões, Cadastros, Documentos, Conformidade, Login
│   ├── services/        # padronizacao.ts (motor de regras), ocr.ts (Tesseract),
│   │                    # pdf.ts (pdf-lib)
│   ├── store/           # Zustand + persistência; fotos no IndexedDB
│   ├── data/            # tipos de domínio + seed fictício
│   └── lib/             # diff LCS, formatação, helpers de documentos
├── public/ocr/          # assets locais do Tesseract (gerados por setup:ocr)
├── public/demo/         # fotos demonstrativas (geradas por IA, fictícias)
├── tests/               # Vitest: motores, regras de negócio, PDF, smoke de telas
├── e2e/                 # Playwright: fluxos completos (CI/local)
├── scripts/             # setup-ocr.mjs, ocr-smoke.mjs
└── docs/                # documentação técnica completa (índice abaixo)
```

## 📚 Documentação técnica

| Doc | Conteúdo |
|---|---|
| [01-diagnostico.md](docs/01-diagnostico.md) | Problema, gargalos, proposta e diferenciais |
| [02-design-system.md](docs/02-design-system.md) | UI UX Pro Max: processo, saída do gerador e aplicação |
| [03-arquitetura.md](docs/03-arquitetura.md) | Stack, comparações, banco de dados, produção |
| [04-seguranca.md](docs/04-seguranca.md) | OWASP (Top 10, ASVS 5.0, Cheat Sheets, API, ZAP) |
| [05-ia-ocr.md](docs/05-ia-ocr.md) | Estratégia de IA/OCR, PaddleOCR × Tesseract, PDFs |
| [06-legal.md](docs/06-legal.md) | LGPD, Marco Civil, decretos e resoluções ANPD |
| [07-custos.md](docs/07-custos.md) | Estimativas mensais em R$ com premissas e fontes |
| [08-plano.md](docs/08-plano.md) | MVP, plano de desenvolvimento, riscos e limitações |
| [design-system-output.md](docs/design-system-output.md) | Saída bruta do gerador UI UX Pro Max |

## 🧰 Stack

Vite 7 · React 19 · TypeScript 5.9 · Tailwind CSS 4 · React Router 7 · Zustand 5 · Recharts 3 · Lucide · **pdf-lib** (MIT) · **Tesseract.js 7** (Apache-2.0) · Zod 4 · idb-keyval · Vitest 5 · Playwright · Fontes self-hosted (Plus Jakarta Sans + JetBrains Mono, OFL).

Nenhuma biblioteca foi adicionada sem necessidade: cada escolha está justificada em [docs/03-arquitetura.md](docs/03-arquitetura.md) e [docs/05-ia-ocr.md](docs/05-ia-ocr.md).

---

*Protótipo demonstrativo — dados fictícios, envios simulados. A conformidade plena com a LGPD depende das medidas de produção e de validação jurídica da empresa (ver [docs/06-legal.md](docs/06-legal.md)).*
