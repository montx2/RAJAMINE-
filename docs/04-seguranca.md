# 04 — Segurança da Informação (OWASP)

Referências consultadas (READMEs/licenças/manutenção verificados via GitHub em 03/11/2026):
[OWASP/Top10](https://github.com/OWASP/Top10) · [OWASP/ASVS](https://github.com/OWASP/ASVS) (CC-BY-SA-4.0, v5.0) · [OWASP/CheatSheetSeries](https://github.com/OWASP/CheatSheetSeries) (CC-BY-SA-4.0) · [OWASP/API-Security](https://github.com/OWASP/API-Security) · [zaproxy/zaproxy](https://github.com/zaproxy/zaproxy) (Apache-2.0).

## 1. Defesa em profundidade — o que o protótipo já faz

| Controle | Implementação | Onde |
|---|---|---|
| Menor privilégio (UX) | Perfis admin/revisora/colaborador; colaborador só vê os próprios relatórios; link por token dá acesso a UM relatório | `App.tsx`, `ReportDetail.tsx`, `FillReport.tsx` |
| Validação de entrada | Zod nos formulários; regras de negócio no store (KM, datas, tamanhos) | `NewReport.tsx`, `useStore.ts` |
| Upload seguro | MIME + **magic bytes** + limite 8 MB; imagens nunca executáveis; remoção bloqueada após envio | `store/photos.ts` |
| Minimização de dados | OCR e padronização **locais**: fotos/textos não saem do dispositivo | `services/ocr.ts`, `services/padronizacao.ts` |
| Integridade de originais | Texto original imutável após envio; versões append-only; fotos não substituídas | `useStore.ts` |
| Aprovação humana | PDF do cliente bloqueado sem aprovação; OCR pendente bloqueia aprovação | `services/pdf.ts`, `useStore.ts` |
| Auditoria | Todo evento com autor/data/detalhe; simulações rotuladas na trilha | `useStore.ts`, `Timeline.tsx` |
| Sem segredos no código | Nenhum token/credencial no repositório; `.env` ignorado | `.gitignore` |
| XSS | React escapa por padrão; nenhum `dangerouslySetInnerHTML`; texto do usuário renderizado como texto | toda a UI |
| Dependências | Versões fixadas por major, licenças permissivas, sem pacotes abandonados | `package.json` |

> **Honestidade:** o RBAC do frontend é experiência de uso, **não** fronteira de segurança. A fronteira real é o servidor (abaixo).

## 2. OWASP Top 10 (2025) → mitigação no produto

| Risco | Mitigação planejada/implementada |
|---|---|
| A01 Broken Access Control | Autorização por objeto no servidor (report_id × usuário), testes IDOR; no protótipo, escopo por perfil/token |
| A02 Security Misconfiguration | Cabeçalhos CSP/HSTS/X-Content-Type-Options no deploy; configs separadas dev/prod; `allowedHosts` do Vite restrito em produção |
| A03 Software Supply Chain | Lockfile, majors fixos, SCA (Dependabot/`npm audit`) no CI |
| A04 Cryptographic Failures | TLS 1.2+; criptografia em repouso (disco + storage); hash de token; Argon2id para senhas quando existirem |
| A05 Injection | ORM/queries parametrizadas (nunca concatenar SQL); validação Zod |
| A06 Insecure Design | Aprovação humana como porta de saída; originais imutáveis; modelagem de ameaças no doc 08 |
| A07 Authentication Failures | OIDC/SSO + MFA; rate limit de login; bloqueio progressivo; sessões curtas com rotação |
| A08 Software/Data Integrity | Hash SHA-256 das fotos; PDFs com código de verificação; auditoria append-only |
| A09 Logging & Alerting | Logs estruturados + Sentry; alertas de anomalia (muitas leituras OCR, acessos fora do horário) |
| A10 Mishandling of Exceptional Conditions | Erros tratados com mensagens ao usuário sem vazar stack; fallback de OCR rotulado |

## 3. ASVS v5.0 — trilha de verificação (nível 2 alvo)

- **V2 Authentication**: OIDC + MFA (produção); protótipo declara acesso demonstrativo.
- **V3 Session Management**: cookies `httpOnly`, `Secure`, `SameSite=Lax`, expiração e rotação (produção).
- **V4 Access Control**: checagem no servidor por papel e por objeto; testes automatizados de BOLA.
- **V5 Validation**: Zod compartilhado; sanitização de nomes de arquivo; limites de payload.
- **V7 Cryptography**: TLS, KMS para chaves, sem criptografia caseira.
- **V9 Communications**: HSTS, certificados válidos, sem mixed content.
- **V12 Files**: uploads validados (já no protótipo), storage privado com URLs assinadas, antivírus no worker (produção).
- **V14 Configuration**: segredos em cofre, ambientes separados, headers de segurança.

## 4. API Security (OWASP API Top 10)

- **API1 BOLA / API5 BFLA**: cada endpoint valida papel + propriedade do objeto; testes dedicados.
- **API2 Broken Auth**: tokens curtos, refresh rotativo, rate limit por IP/usuário.
- **API3 Excessive Data Exposure**: DTOs por perfil (cliente nunca recebe fotos internas nem texto original).
- **API4 Unrestricted Resource Consumption**: limites de upload (já), rate limiting, quotas por usuário, fila para OCR/PDF.
- **API8 Misconfiguration**: CORS restrito ao domínio; métodos e headers mínimos.

## 5. Cheat Sheets aplicados (concretos)

- *File Upload*: extensão ≠ conteúdo → magic bytes; tamanho; nome gerado pelo servidor; storage fora do webroot.
- *Session Management*: IDs opacos, regeneração no login, expiração absoluta + ociosa.
- *Password Storage* (quando houver senhas): Argon2id com parâmetros OWASP.
- *Cross-Site Request Forgery*: token anti-CSRF para sessões cookie; APIs stateless com Bearer não precisam.
- *Logging*: nunca logar texto de relatório/fotos; logar IDs e metadados.

## 6. ZAP no CI (produção)

```yaml
# Exemplo de etapa (GitHub Actions) — não executada neste sandbox
- uses: zaproxy/action-baseline@v0.14.0
  with:
    target: 'https://homolog.rajamine.example'
    rules_file_name: '.zap/rules.tsv'
```

Baseline a cada deploy de homologação; scan de API (OpenAPI) semanal; falhas de risco alto bloqueiam o release. **Limitação do sandbox:** o download do ZAP/browsers não é possível aqui (hosts restritos); o pipeline fica documentado e pronto para o CI do projeto.

## 7. Backup e recuperação

- PostgreSQL: PITR (WAL contínuo) + dump diário criptografado, retenção 30 dias.
- Storage: versionamento de objetos + cópia cross-region semanal.
- Teste de restauração trimestral com evidência (runbook).
- RPO alvo: 24 h (dump) / minutos (WAL); RTO alvo: 4 h — a validar com a empresa.


## Portal do Motorista — limites de automação

Implementado: RBAC demonstrativo (motorista só acessa `/motorista` e caminhões vinculados; triagem só admin/revisora), validação de upload, trilha de auditoria, ciência digitada sem biometria, notificações/sync simulados rotulados.

Proibido no protótipo: aprovação automática, liberação de PDF de cliente, envio real, GPS contínuo, biometria/score de fadiga. Produção exige autorização server-side, OIDC/MFA, TLS, criptografia, rate limiting, CSP/HSTS, logs imutáveis e governança LGPD (ver [06-legal.md](06-legal.md) e [10-portal-motorista.md](10-portal-motorista.md)).
