# 03 — Arquitetura e Tecnologias

## 1. Ponto de partida

O repositório original continha **apenas um README** (commit inicial `800ed75`), sem backend, APIs ou frontend. Não havia stack existente a preservar; a escolha abaixo parte dos requisitos (equipe SENAI, manutenção simples, custo baixo, offline-friendly em campo).

## 2. Stack do protótipo (implementada)

| Camada | Escolha | Por quê |
|---|---|---|
| Build | **Vite 7** | Dev server rápido, build otimizado, padrão de mercado |
| UI | **React 19 + TypeScript 5.9** | Componentização, tipagem do domínio, ecossistema e didática |
| Estilo | **Tailwind CSS 4** | Tokens do design system no `@theme`, consistência, sem CSS morto |
| Rotas | **React Router 7** | SPA com guardas de perfil e rota pública por token |
| Estado | **Zustand 5 + persist** | Store único com regras de negócio; leve e testável |
| Gráficos | **Recharts 3** | Recomendado pelo banco de charts da skill para dashboards |
| Ícones | **Lucide** | SVG acessível, MIT/ISC, sem emojis |
| Validação | **Zod 4** | Esquemas declarativos compartilháveis com o backend futuro |
| PDF | **pdf-lib 1.17 (MIT)** | Geração real no navegador, sem servidor (ver doc 05) |
| OCR | **Tesseract.js 7 (Apache-2.0)** | WASM local, sem enviar fotos (ver doc 05) |
| Fotos | **idb-keyval (IndexedDB)** | Blobs fora do localStorage (quota), simples |
| Testes | **Vitest 5 + Testing Library + Playwright** | Unitários + smoke de telas + E2E |
| Fontes | **Fontsource (OFL)** | Self-hosted: sem dependência de CDN em campo |

**Compatibilidade verificada:** todas as licenças são permissivas (MIT/Apache-2.0/ISC/OFL); versões consultadas no registry npm em 03/11/2026; peers checados (ex.: `@vitejs/plugin-react@5` suporta Vite 4–8; evitamos Vite 8/rolldown por imaturidade do ecossistema de plugins no momento).

## 3. Arquitetura de produção recomendada

```
[Celular/Desktop do colaborador]          [Escritório]
        │ HTTPS                                │
        ▼                                      ▼
┌─────────────────────────────────────────────────────────┐
│  CDN + WAF (Cloudflare)                                  │
└──────────────┬──────────────────────────────────────────┘
               ▼
┌──────────────────────────┐     ┌──────────────────────────┐
│  Frontend SPA (esta base) │     │  API Node.js (Fastify/    │
│  build estático           │────▶│  NestJS) + PostgreSQL     │
└──────────────────────────┘     │  · Auth OIDC + sessões    │
                                 │  · RBAC no servidor       │
┌──────────────────────────┐     │  · Auditoria append-only  │
│  Worker de processamento  │◀────│  · Fila (BullMQ/Redis)    │
│  · OCR server-side opcional│    └──────────┬───────────────┘
│  · PDF (Puppeteer)         │               ▼
│  · LLM padronização        │     ┌──────────────────────────┐
└──────────────────────────┘     │  Object Storage (R2/S3)   │
                                 │  fotos + PDFs privados    │
                                 │  URLs assinadas           │
                                 └──────────────────────────┘
```

- **Frontend**: esta mesma base React. A camada `store/useStore.ts` concentra as mutações — cada ação vira uma chamada de API sem reescrever telas.
- **API**: Node.js + Fastify (ou NestJS para equipes maiores) + PostgreSQL. Mesmos esquemas Zod do frontend.
- **OCR**: mantém-se a opção local (privacidade/custo); worker server-side com **PaddleOCR** para lotes e fotos difíceis (comparação no doc 05).
- **PDF**: no servidor, **Puppeteer** (HTML→PDF) para layouts ainda mais ricos; pdf-lib continua útil para carimbar/assinar/merge.
- **IA de texto**: LLM com o mesmo contrato do motor local (nunca inventar; devolver mudanças estruturadas; preservar original). Pode ser API comercial ou modelo aberto (ex.: família Qwen/Llama) conforme custo e política de dados.
- **Notificações**: e-mail (SMTP transacional) + WhatsApp Business API opcional; no protótipo, simuladas.
- **Monitoramento**: Sentry (erros) + Uptime Kuma (disponibilidade) + logs estruturados.
- **Backups**: PostgreSQL com PITR (WAL) + cópia diária do storage; teste de restauração trimestral.

## 4. Modelo de dados (PostgreSQL proposto)

O modelo do protótipo (`src/data/types.ts`) mapeia 1:1:

```sql
users(id, nome, email, role, cargo, ativo)
clients(id, nome, cnpj, cidade, uf, contato, email)
trucks(id, placa UNIQUE, frota, marca, modelo, ano, client_id FK)
equipment(id, codigo UNIQUE, tipo, serial, status, truck_id FK NULL, instalado_em)
equipment_installations(id, equipment_id FK, truck_id FK, report_id FK NULL,
                        inicio, fim, confirmado_por, origem)      -- histórico de instalações
reports(id, codigo UNIQUE, token_hash, colaborador_id FK, client_id FK, truck_id FK,
        data_viagem, origem, destino, km_inicio, km_fim,
        descricao_original, descricao_atual, status, criado_em, prazo_em,
        enviado_revisao_em, aprovado_em, aprovado_por, enviado_cliente)
text_versions(id, report_id FK, texto, tipo, autor, criada_em, nota)
photos(id, report_id FK, storage_key, mime, legenda, categoria, criada_em, sha256)
ocr_detections(id, photo_id FK, motor, status, candidatos JSONB, texto_bruto,
               confianca, codigo_confirmado, equipment_id FK NULL,
               confirmado_por, confirmado_em, criado_em)
review_notes(id, report_id FK, autor, texto, tipo, criada_em)
audit_events(id, report_id FK NULL, em, ator, acao, detalhe)   -- append-only
documents(id, report_id FK, tipo, versao, storage_key, gerado_em, gerado_por,
          enviado_em, enviado_por)
notifications(id, tipo, titulo, mensagem, criada_em, lida, report_id FK, para)
```

Índices essenciais: `reports(status, prazo_em)`, `reports(client_id, data_viagem)`, `equipment(codigo)`, `equipment(serial)`, `audit_events(report_id, em)`, busca textual em `reports` (pg_trgm) e `photos.sha256` (deduplicação).

**Integridade:** `descricao_original` nunca é atualizada após o primeiro envio (trigger); `audit_events` sem UPDATE/DELETE (permissões); fotos com hash para detectar substituição; `token_hash` (não o token puro) no banco.

## 5. Decisões e alternativas descartadas

| Alternativa | Descartada porque |
|---|---|
| Next.js (SSR) | Protótipo é SPA pura; SSR adiciona servidor sem ganho aqui. Reavaliar se SEO/landing entrar no escopo |
| Firebase/Supabase | Acelerariam o backend, mas acoplam a dados em nuvem de terceiros; PostgreSQL próprio é mais simples de auditar e cabe no orçamento |
| Redux Toolkit | Zustand cobre o estado com muito menos boilerplate para uma equipe técnica |
| tRPC | Ótimo com backend TS, mas adiciona camada que o protótipo não tem |
| Instalar ZAP/PaddleOCR/Puppeteer no protótipo | Pesados e desnecessários no navegador; documentados para o pipeline de produção/CI (docs 04 e 05) |

## 6. Ambientes

- **Dev**: `npm run dev` (dados demo locais).
- **Homologação**: build estático + API com banco de teste anonimizado; ZAP baseline no CI.
- **Produção**: domínio próprio, TLS, backups, monitoramento; **nunca** dados demo.
- Credenciais apenas em variáveis de ambiente/cofre — o repositório não contém segredos (`.env` ignorado).

## 7. Extensões de schema pelas referências reais

```sql
-- Identificadores de dispositivos embarcados (em equipment e activities)
telemetria      VARCHAR(8),   -- preservar zeros à esquerda: '0987'
pulsus          VARCHAR(8),
camera_fadiga   VARCHAR(20),  -- IMEI 15 dígitos
galileo         VARCHAR(20),

activities(id, report_id FK, data, cliente_id FK NULL, colaborador_id FK NULL,
           equipamento_codigo, tipo, componentes JSONB,
           telemetria, pulsus, camera_fadiga, galileo,
           observacao, situacao_telemetria, fotos, descricao)

operation_rows(id, data, empresa, tecnico, equipamento, atividade, observacao,
               telemetria, pulsus, camera_fadiga, galileo,
               situacao_telemetria, fotos, origem_dados)

-- reports ganha:
tipo, setor, cidade_bairro, periodo_inicio, periodo_fim, objetivo,
avaliacao_tecnica, sensacao_cliente, pontos_positivos, melhorias,
origem_dados, fonte_referencia
```

Regras: `telemetria`/`pulsus` são texto (não inteiro) para preservar zeros; IMEI validado com 15 dígitos quando informado; atividades fora do período do relatório geram alerta, não bloqueio automático; consolidado semanal só inclui relatórios com `aprovado_em` preenchido.


## Portal do Motorista (PWA)

O mesmo app React/Vite serve o **Portal do Motorista** em `/motorista` (mobile-first, bottom nav, manifest + service worker em build de produção). O domínio (`DriverChecklist`, `DriverOccurrence`, `DriverTraining`, `DriverSyncItem`) vive no mesmo Zustand store, com persistência local e fila de sincronização **simulada**. A triagem humana fica em `/ocorrencias` (admin/revisora). Contrato e limites: [10-portal-motorista.md](10-portal-motorista.md).
