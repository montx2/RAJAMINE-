# 10 — Portal do Motorista (PWA)

> **Status:** implementado no protótipo (frontend + store local). Backend, push real e sincronização com servidor são **simulados/pendentes**.
> **Princípio:** o mais automático possível na **captura, roteamento e sincronização**; **zero automação** de aprovação, liberação de documento ou envio real ao cliente.

## 1. Objetivo

Dar ao motorista da SAFIP um canal simples, mobile-first e instalável para:

1. ver **seu caminhão** e os equipamentos embarcados;
2. preencher o **checklist diário por turno** (pneus, luzes, freios, espelhos, fixação, telemetria, tablet, câmera, Galileo, rastreador, sensor de carga);
3. abrir **ocorrências** com foto, categoria e severidade;
4. registrar **ciência de treinamentos** com confirmação digitada (sem biometria/ICP-Brasil);
5. consultar **histórico** com status e resposta da coordenação;
6. trabalhar **offline-first** com fila local e sincronização simulada.

A coordenação/revisão humana faz a **triagem** em `/ocorrencias`: colocar em análise, resolver ou rejeitar, sempre com resposta ao motorista.

## 2. Rotas e perfis

| Rota | Perfil | Tela |
|---|---|---|
| `/motorista` | motorista | Início: meus caminhões, checklist do dia, ações rápidas, ocorrências abertas |
| `/motorista/checklist/:caminhaoId` | motorista | Checklist automático do dia/turno |
| `/motorista/ocorrencias` | motorista | Minhas ocorrências + detalhe |
| `/motorista/ocorrencias/nova` | motorista | Nova ocorrência assistida |
| `/motorista/historico` | motorista | Checklists, ocorrências e ciências |
| `/motorista/treinamento` | motorista | Treinamentos e ciência digitada |
| `/ocorrencias` | admin / revisora | Triagem humana de ocorrências e checklists |

Login demonstrativo inclui **João Batista (Motorista)** — `u_mot_joao`, vinculado ao `C-101`.
Outros motoristas seed: Antônio Ferreira (`t103`), Marcos Paulo (`t105`).

## 3. Automações permitidas (implementadas)

| Automação | Como funciona | Regra preservada |
|---|---|---|
| Checklist gerado sozinho | `ensureDriverChecklist` cria itens padrão do veículo + 1 item por tipo de equipamento **instalado** no caminhão | Não inventa equipamento; usa cadastro real |
| Data/turno/caminhão/cliente | Preenchidos automaticamente (`todayISO`, `currentShift`, vínculo `User.truckIds`) | Motorista confirma antes de enviar |
| Rascunho local | Cada alteração salva no Zustand/persist + IndexedDB para fotos | Original não é sobrescrito sem trilha |
| Falha → ocorrência | Item `falha` abre `DriverOccurrence` automática com categoria, severidade sugerida e texto padrão | Ocorrência nasce `aberta`, não resolvida |
| Notificação interna | Coordenação/revisão recebem notificação simulada; motorista recebe resposta direcionada por `userId` | Nenhum envio real (e-mail/WhatsApp/push) |
| Fila offline | `driverSyncQueue` acumula pendentes; `syncDriverQueue` marca sincronizado quando online | Simulação rotulada; produção exige API + retry |
| Texto/severidade sugeridos | `occurrenceTemplate` e `suggestSeverity` | Motorista pode editar; decisão final humana |
| Marcar tudo OK | Ação explícita com modal de confirmação | Não envia sozinho; não aprova relatório |

## 4. Automações proibidas (não implementadas)

- Aprovar relatório, liberar PDF do cliente ou marcar envio real.
- Enviar mensagem real a cliente, motorista ou terceiros.
- GPS contínuo, biometria, reconhecimento facial, score de fadiga ou monitoramento invasivo.
- Resolver/rejeitar ocorrência automaticamente.
- Sobrescrever texto/foto original sem versão e auditoria.
- Presumir conformidade LGPD plena apenas por ter login/RBAC.

## 5. Modelo de dados (resumo)

```ts
DriverChecklist {
  id, motoristaId, caminhaoId, clienteId, data, turno: 'dia'|'noite',
  items: DriverChecklistItem[],           // nao_verificado | ok | atencao | falha
  status: 'rascunho'|'enviado'|'em_analise'|'concluido',
  origem: 'automatico'|'manual',
  ocorrenciasIds[], historico[], syncedAt?
}

DriverOccurrence {
  id, codigo: 'OCO-2026-####',
  motoristaId, caminhaoId, equipmentId?, checklistId?,
  categoria, severidade: 'baixa'|'media'|'alta'|'critica',
  descricao, fotos: Photo[],
  status: 'aberta'|'em_analise'|'resolvida'|'rejeitada',
  origem: 'checklist'|'manual',
  resposta?, resolvidaPor?, resolvidaEm?, historico[], syncedAt?
}

DriverTraining { id, motoristaId, treinamentoId, titulo, nomeConfirmado, ciencia, confirmadoEm, historico[] }
DriverSyncItem { id, tipo: 'checklist'|'ocorrencia'|'treinamento', refId, status: 'pendente'|'sincronizado' }
```

Regras de envio do checklist:

- todos os itens devem estar respondidos;
- sem falhas → `concluido` automaticamente;
- com falhas → `em_analise` + ocorrências automáticas;
- checklist já enviado não é reenviado.

## 6. PWA e offline

- `public/manifest.webmanifest` com `start_url: /motorista`, ícones 192/512 e maskable.
- `public/sw.js`: network-first para navegação, cache para assets/ícones/demo; registrado **apenas em build de produção** (`import.meta.env.PROD`) para não atrapalhar HMR/preview.
- Fila de sincronização é **local e simulada**. Em produção: API autenticada, idempotência por `refId`, retry exponencial, conflito resolvido no servidor, push opcional com consentimento.

## 7. Segurança e LGPD (limites do protótipo)

Implementado: RBAC demonstrativo, motorista só acessa o próprio portal e caminhões vinculados; triagem restrita a admin/revisora; validação de upload (MIME + magic bytes + 8 MB); trilha de auditoria; ciência digitada sem biometria; notificações simuladas rotuladas.

Produção (pendente): OIDC/MFA, autorização server-side, TLS, criptografia em repouso, rate limiting, CSP/HSTS, logs imutáveis, bases legais e RIPD, retenção/eliminação, contrato com operadores, testes OWASP. Ver `docs/04-seguranca.md` e `docs/06-legal.md`.

## 8. Testes

- `tests/driver.test.ts` — geração/dedupe de checklist, bloqueio de envio incompleto, falha→ocorrência, RBAC de triagem, ciência digitada, fila de sync.
- `tests/driver-smoke.test.tsx` — renderização jsdom do portal, login motorista, checklist, nova ocorrência, treinamento e triagem administrativa.
- Suíte completa: **80 testes / 10 arquivos** (Vitest). E2E Playwright permanece CI-only.

## 9. Como demonstrar (3–4 min)

1. Login → **João Batista (Motorista)**.
2. Início → `C-101` → **Continuar checklist**.
3. Marque um item de equipamento como **Falha**, escreva observação e **Enviar checklist**.
4. Veja a ocorrência automática em **Ocorrências** e a notificação simulada.
5. Saia e entre como **Helena (Administradora)** → **Ocorrências de motoristas** → resolva com resposta.
6. Volte como João → histórico/notificação com a resposta.
7. Em **Treino**, registre ciência digitando o nome completo.
8. Simule offline (DevTools → Network → Offline): registre ocorrência; volte online e sincronize.

## 10. Próximos passos (backend real)

1. API REST/GraphQL com os mesmos contratos do store.
2. Auth OIDC + MFA; escopos por motorista/caminhão.
3. Storage de fotos com antivírus, EXIF strip e URLs assinadas.
4. Fila de sync idempotente + webpush opcional.
5. Painel de manutenção integrado à ocorrência (ordem de serviço).
6. Auditoria append-only e exportação LGPD.
