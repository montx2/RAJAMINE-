# 08 — Plano de Desenvolvimento, MVP, Riscos e Demonstração

## 1. O que já está construído (este protótipo)

- 12 telas navegáveis com RBAC demonstrativo e link individual por token.
- Fluxo completo: criar → link → preencher (4 passos) → IA → fotos/OCR → revisão → aprovação → 2 PDFs → arquivo → envio simulado.
- Motores reais: padronização (regras), OCR (Tesseract WASM multi-pass), PDF (pdf-lib).
- Auditoria por evento, versões de texto, preservação de originais, bloqueios de integridade.
- 50 testes automatizados passando (motores, regras, PDF, renderização) + suíte E2E Playwright pronta.
- Design system gerado com UI UX Pro Max e aplicado integralmente.

## 2. MVP de produção (escopo mínimo vendável)

| Dentro do MVP | Fora do MVP (fase 2) |
|---|---|
| API + PostgreSQL + auth OIDC/MFA | App nativo (o web mobile atende) |
| Links individuais com expiração/revogação | WhatsApp Business API |
| Upload p/ storage privado + antivírus | PaddleOCR server-side em lote |
| OCR local + confirmação humana | LLM de padronização (regras atendem o padrão) |
| Revisão/aprovação + 2 PDFs (worker Puppeteer) | Assinatura digital ICP-Brasil |
| Notificações por e-mail (reais) | BI avançado / exportações contábeis |
| Auditoria append-only + logs de acesso (MCI) | Integração ERP/frota |
| Backups testados + monitoramento | Multi-idioma |

## 3. Fases e cronograma (equipe SENAI + supervisão)

| Fase | Duração | Entregas |
|---|---|---|
| **0 — Protótipo** | ✅ concluído | Esta base, validada com a empresa (roteiro abaixo) |
| **1 — Fundação** | 2 semanas | API Fastify + PostgreSQL + schema (doc 03); auth OIDC; ambientes dev/homolog; CI com testes + ZAP baseline |
| **2 — Fluxo real** | 2–3 semanas | Substituir store local por API (ações já isoladas); uploads p/ R2; links com expiração; e-mails reais |
| **3 — Documentos e workers** | 1–2 semanas | Puppeteer no worker; fila BullMQ; hash/verificação; antivírus |
| **4 — Piloto assistido** | 2 semanas | 1 cliente + 2 técnicos reais; medir tempo de revisão, taxa de aceite da IA, acurácia do OCR em campo |
| **5 — Go-live** | 1 semana | Backups/restore testados; runbook de incidentes; treinamento; política de retenção aprovada pelo jurídico |

**Critérios de aceite do piloto:** ≥30% de redução no tempo de revisão por relatório; ≥90% das leituras OCR confirmadas sem correção em etiquetas limpas; 0 documentos enviados sem aprovação; 100% dos eventos auditados.

## 4. Riscos e mitigação

| Risco | Prob. | Impacto | Mitigação |
|---|---|---|---|
| OCR erra em fotos muito ruins | Alta | Médio | Confiança visível + confirmação humana obrigatória; fallback manual; PaddleOCR server-side na fase 2 |
| Regras de padronização não cobrem um dialeto/erro | Média | Baixo | Diff + editar/rejeitar; alerta de 1ª pessoa residual; evolução para LLM com o mesmo contrato |
| Colaborador sem smartphone compatível com WASM | Baixa | Médio | Fallback simulado não é usado em produção: entrada manual do código + OCR no servidor |
| Vazamento de fotos/dados | Baixa | Alto | Storage privado, URLs assinadas, RBAC servidor, criptografia, runbook ANPD (3 dias úteis) |
| Dependência de provedor estrangeiro (VPS) | Média | Médio | Alternativa nacional cotada; dados criptografados; backups portáveis |
| Resistência da equipe ao novo fluxo | Média | Médio | Preenchimento em 4 passos no celular; treinamento; piloto assistido |
| Escopo jurídico (LGPD) subestimado | Média | Alto | Checklist do doc 06 com responsável e prazos antes do go-live |

## 5. Limitações conhecidas do protótipo (honestidade técnica)

1. **Sem backend**: persistência no navegador (localStorage/IndexedDB); dados não sincronizam entre dispositivos. A camada de ações do store foi desenhada para virar API sem reescrever telas.
2. **Autenticação demonstrativa**: seleção de perfil, sem senhas/sessões reais — explicitamente rotulado.
3. **OCR**: funciona de verdade, mas a acurácia em fotos difíceis é limitada (medida e documentada no doc 05); por isso a confirmação humana é parte do produto, não um detalhe.
4. **Padronização**: motor de regras, não LLM — cobre os padrões mais comuns; casos fora do dicionário são sinalizados para revisão manual.
5. **Envios**: links, lembretes e envio ao cliente são simulados e registrados como tal.
6. **E2E Playwright**: suíte escrita; a instalação dos browsers não foi possível no sandbox de desenvolvimento (CDN bloqueada) — roda em CI/local com `npx playwright install chromium`.
7. **PDF**: código de verificação é hash simples de protótipo, não assinatura digital.

## 6. Roteiro de demonstração para a banca (10 min)

1. Login Helena → dashboard (KPIs, prazos, gráficos) → "Lembrar" (simulação auditada).
2. Novo relatório → link individual → abrir como colaborador.
3. Preencher em 4 passos; escrever em 1ª pessoa; mostrar **diff da IA**; aceitar.
4. Fotos: anexar exemplo **EQ-3315 (suja)** → OCR real → confiança baixa → corrigir/confirmar; anexar **foto sintética** → OCR alta confiança → confirmar e ver associação ao caminhão.
5. Enviar → login Marta → Central de Revisão → tentar aprovar com OCR pendente (**bloqueio**) → conferir → aprovar.
6. Gerar os **2 PDFs** → abrir o do cliente (sem fotos, com aprovação) e o interno (fotos + OCR + original + histórico) → enviar ao cliente (simulado).
7. Equipamentos: buscar EQ-2041 → histórico e relatórios. Arquivo: filtros. Conformidade: exportar JSON + mapa LGPD.
8. Fechar com o slide mental: **custo ≈ R$ 50/mês, dados no dispositivo, humano no controle**.

## 7. Papéis da equipe (sugestão para o curso)

- 2 frontend (React/TS) · 1 backend (API/DB) · 1 UX/QA (testes, acessibilidade) · 1 segurança/LGPD (checklists, ZAP) — com rodízio para aprendizado integral.
