# 07 — Custos e Viabilidade (estimativas em R$)

> **Premissas de volume** (a validar com a Rajamine): 100 relatórios/mês · 8 usuários internos · 4 fotos/relatório (~2 MB cada) · 2 PDFs/relatório (~300 KB) · crescimento de armazenamento ≈ 0,9 GB/mês · retenção de 5 anos para documentos.
> **Câmbio de referência:** €1 = R$ 6,11 (03/11/2026, [currency.wiki](https://currency.wiki/eur-brl)). Valores em US$ são apresentados na moeda original quando o volume fica em faixa gratuita.

## 1. Cenário A — Protótipo / demonstração (o que foi entregue)

| Item | Custo mensal |
|---|---|
| Software (React, Vite, Tailwind, pdf-lib, Tesseract.js, PostgreSQL futuro) — tudo open source | **R$ 0** |
| OCR no navegador (WASM local, modelo tessdata_fast) | **R$ 0** |
| Padronização por motor local de regras | **R$ 0** |
| Hospedagem do build estático (qualquer servidor/CDN free tier) | **R$ 0** |
| **Total** | **R$ 0/mês** |

## 2. Cenário B — Produção MVP auto-hospedada (recomendado)

| Item | Especificação | Fonte do preço | Estimativa mensal |
|---|---|---|---|
| VPS API + PostgreSQL + worker (OCR/PDF) | Hetzner CX32: 4 vCPU, 8 GB RAM | ~€7,69/mês ([pickhosting.co](https://pickhosting.co/tools/hetzner/), [vpsfor.dev](https://vpsfor.dev/posts/hetzner-cx22-pricing-2026/)) | **≈ R$ 47** |
| Object storage (fotos + PDFs) | Cloudflare R2: US$ 0,015/GB/mês, **10 GB grátis**, egress US$ 0 | [leanopstech.com](https://leanopstech.com/blog/cloudflare-r2-pricing-2026/) | **R$ 0 no 1º ano** (≈10,8 GB acumulado); depois ≈ US$ 0,02–0,20/mês |
| Backups | Dump diário + WAL no mesmo R2 (versionado) | incluso na faixa acima | **≈ R$ 0–2** |
| Domínio `.com.br` | registro.br (preço de referência público) | registro.br | **≈ R$ 3,30** (R$ 40/ano) |
| TLS | Let's Encrypt / Cloudflare | gratuito | **R$ 0** |
| E-mail transacional (links/lembretes) | SMTP do e-mail corporativo já existente | — | **R$ 0** (ou serviço free tier) |
| Monitoramento | Uptime Kuma + Sentry (free tier dev) self-hosted | open source | **R$ 0** |
| Padronização de texto | Motor de regras (padrão) | — | **R$ 0** |
| **Total MVP** | | | **≈ R$ 50–55/mês** |

**Premissa explícita:** preços de VPS variam por região/impostos; o valor final deve ser confirmado no painel do provedor no momento da contratação. Hetzner não tem datacenter no Brasil — se latência/soberania exigir nuvem nacional, contratar VPS equivalente brasileiro (faixa típica R$ 60–150/mês para 4 vCPU/8 GB — **premissa a cotar**, não verificada nesta análise).

## 3. Cenário C — Produção com serviços gerenciados (alternativa)

| Item | Observação | Estimativa |
|---|---|---|
| Banco gerenciado (ex.: Supabase Pro / Neon) | reduz operação; preço em US$ a confirmar no provedor | variável (ordem de US$ 25/mês — **cotar**) |
| Auth gerenciada (OIDC) | pode estar inclusa no banco/plataforma | variável |
| VPS menor só para worker | CX22 ~€4,35 ≈ R$ 27 | ≈ R$ 27 |
| **Total** | menos operação, mais custo recorrente e dependência | **a cotar** |

## 4. Custos variáveis opcionais (só se ativados)

| Recurso | Quando usar | Custo |
|---|---|---|
| **LLM para padronização** | textos muito fora do padrão das regras | Por token, conforme provedor. Volume estimado: 100 relatórios × ~2k tokens ≈ 200k tokens/mês — **cotar no provedor escolhido**; o motor de regras mantém o padrão em R$ 0 |
| **PaddleOCR server-side** | fotos difíceis em lote | CPU no mesmo VPS: R$ 0 adicional; GPU dedicada só se o volume justificar (**cotar**) |
| **WhatsApp Business API** | lembretes por WhatsApp | Cobrança por conversa da Meta — **cotar**; e-mail continua R$ 0 |
| **Armazenamento após 5 anos** | ~54 GB | R2: ≈ US$ 0,81/mês (~R$ 4–5) |

## 5. Custo de pessoas (premissa, não preço de mercado)

- Implantação MVP: 2 devs × 6–8 semanas (plano no doc 08) + revisão jurídica pontual.
- Manutenção: ~4–8 h/mês (atualizações, backups, suporte) — pode ser absorvido pela equipe técnica.

## 6. Conclusão de viabilidade

O desenho **edge-first** (OCR e IA no dispositivo, PDFs determinísticos) mantém o custo de produção na casa de **dezenas de reais por mês** para o volume premissado, sem licenças e sem enviar fotos a terceiros. Os maiores custos reais são **pessoas e processo** (revisão, governança LGPD), não infraestrutura — exatamente onde o produto gera economia ao automatizar o trabalho repetitivo.
