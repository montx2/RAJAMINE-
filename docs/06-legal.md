# 06 — Conformidade Legal (Brasil): LGPD, Marco Civil e ANPD

> **Aviso metodológico:** este documento separa (a) **obrigação legal**, (b) **boa prática técnica** e (c) **decisão que depende da empresa/jurídico**. Fontes oficiais consultadas em 03/11/2026, nos textos atualizados. Nada aqui declara "conformidade plena" — isso depende de implantação e validação jurídica.

## 1. LGPD — Lei nº 13.709/2018 (texto atualizado)

Fonte: [Câmara dos Deputados — norma atualizada](https://www2.camara.leg.br/legin/fed/lei/2018/lei-13709-14-agosto-2018-787077-normaatualizada-pl.html). O texto consolidado inclui alterações da Lei 13.853/2019 e, mais recentemente, da **Lei nº 15.352/2026** (conversão da MP 1.317/2025, que ajustou, entre outros, o inciso VIII do art. 5º sobre o encarregado) — verificado no próprio texto oficial.

### Dispositivos relevantes × aplicação ao sistema

| Dispositivo | O que diz (síntese) | Aplicação no FieldOps | Natureza |
|---|---|---|---|
| **Art. 6º, I–III** | Finalidade, adequação, **necessidade** (minimização) | Coletamos só o essencial: viagem, atividades, equipamentos. OCR e IA rodam **localmente** — a foto não precisa sair do dispositivo | Obrigação legal → implementado no desenho |
| **Art. 6º, VI–VII** | Transparência e responsabilização | Banners "demonstração/dados fictícios", simulações rotuladas, documentação pública do tratamento | Obrigação legal → parcialmente implementado (faltam avisos de privacidade formais) |
| **Art. 6º, IX–X** | Não discriminação e prevenção; segurança | Validações, perfis, auditoria; plano de segurança no doc 04 | Obrigação (art. 46) + boa prática |
| **Art. 7º, V e II** | Bases legais: execução de contrato; obrigação legal/regulatória | Dados de colaboradores tratados no contexto laboral e contratual com clientes. **A base legal de cada operação deve ser documentada pela empresa** (não presumimos consentimento) | Decisão jurídica pendente |
| **Art. 11** | Dados sensíveis | O sistema **não coleta** categorias sensíveis. Atenção: fotos de campo podem capturar rostos → orientação de enquadramento e revisão antes do envio | Boa prática de minimização |
| **Art. 18** | Direitos do titular (acesso, correção, portabilidade…) | Exportação JSON implementada na demo; em produção, processo de atendimento com prazos (ver Res. 2/2022) | Obrigação legal → base técnica pronta, processo pendente |
| **Art. 37** | Registro das operações de tratamento | Modelo de dados documentado (doc 03); registro formal (ROPA) a elaborar | Obrigação legal → pendente |
| **Art. 38** | RIPD quando solicitado / tratamento de risco | Recomendável elaborar para OCR+IA sobre dados de colaboradores | Obrigação condicionada + boa prática |
| **Art. 41** | Encarregado (DPO) | Indicação depende do porte (ver Res. 2/2022 abaixo); canal de comunicação é obrigatório de qualquer forma | Obrigação legal (com flexibilização possível) |
| **Arts. 46–49** | Segurança e sigilo; boas práticas | Doc 04: controles implementados + plano de produção (TLS, criptografia, RBAC servidor, backups) | Obrigação legal → parcial no protótipo |
| **Art. 48** | Comunicação de incidentes | Fluxo conforme Res. 15/2024 (abaixo) | Obrigação legal → processo pendente |

**Uso de IA sobre dados pessoais:** a LGPD não proíbe IA, mas exige base legal, finalidade, transparência e segurança. O contrato do motor (nunca inventar, preservar original, decisão humana) reduz riscos do art. 20 (decisões automatizadas) — aqui a IA **sugere** e o humano **decide**, o que afasta decisão exclusivamente automatizada. Revisão do art. 20 aplicada: o colaborador/revisora pode revisar e contestar a sugestão.

## 2. Marco Civil da Internet — Lei nº 12.965/2014

Fonte: [Câmara dos Deputados](https://www2.camara.leg.br/legin/fed/lei/2014/lei-12965-23-abril-2014-778630-norma-pl.html).

| Dispositivo | Aplicação |
|---|---|
| **Art. 7º** (direitos do usuário: inviolabilidade, privacidade, informação clara) | O sistema interno deve respeitar privacidade dos colaboradores; avisos claros sobre o tratamento |
| **Art. 10** (guarda e proteção de registros/dados; sigilo) | Registros de acesso protegidos; divulgação só com consentimento ou ordem judicial |
| **Art. 13** (provedores de **conexão**: registros por 1 ano) | Aplica-se ao provedor de conexão, **não** ao sistema em si — citado para delimitar escopo |
| **Art. 15** (provedores de **aplicações**: registros de acesso por **6 meses**, sob sigilo e segurança) | O FieldOps, como aplicação privada via internet, enquadra-se como provedor de aplicações: **guardar logs de acesso por 6 meses** com segurança. No protótipo há auditoria de operações; a guarda de logs de acesso (IP, timestamp) é requisito de produção |
| **Art. 22** (requisição judicial de registros) | Procedimento de resposta a ordens judiciais a documentar pela empresa |

## 3. Decreto nº 8.771/2016 e a alteração pelo Decreto nº 12.975/2026

Fontes: [Decreto 8.771/2016](https://www2.camara.leg.br/legin/fed/decret/2016/decreto-8771-11-maio-2016-783094-norma-pe.html) · [Decreto 12.975/2026 — publicação original](https://www2.camara.leg.br/legin/fed/decret/2026/decreto-12975-20-maio-2026-799136-publicacaooriginal-179396-pe.html) (DOU 21/05/2026; situação: sem revogação expressa).

**O que o Decreto 12.975/2026 mudou (verificado no texto):**
- **Art. 15-A**: a guarda de registros de IP passa a abranger a **porta lógica de origem** quando necessária à identificação inequívoca do terminal, com dever autônomo de guarda.
- **Capítulo III-A (arts. 16-A a 16-G)**: deveres gerais dos provedores de aplicações (sede/representante no País, canal de denúncia, medidas contra distribuição artificial de conteúdo ilícito), **dever de cuidado** quanto a conteúdo criminoso de terceiros (falha sistêmica), gestão de riscos sistêmicos e procedimento de notificação/remoção.

**Aplicabilidade ao FieldOps (análise cuidadosa, sem presunções):**
- O sistema é uma **aplicação corporativa interna**, não uma plataforma pública de intermediação de conteúdo de terceiros. Os deveres do Capítulo III-A (moderação, dever de cuidado, riscos sistêmicos de conteúdo criminoso) dirigem-se a provedores que intermediam conteúdo de terceiros em escala — **não se aplicam automaticamente** a um sistema interno de relatórios. Essa delimitação deve ser confirmada pelo jurídico.
- Já as regras de **guarda e sigilo de registros** (arts. 10–15 do Marco Civil + padrões de segurança do Decreto 8.771) aplicam-se ao sistema como provedor de aplicações: logs de acesso com IP (e porta lógica quando aplicável, art. 15-A), retenção de 6 meses (art. 15 MCI), acesso restrito.
- **Ação de produção:** incluir IP/porta lógica de origem nos logs de acesso do servidor, com retenção e sigilo; não coletar mais do que o necessário.

## 4. Resolução CD/ANPD nº 15/2024 — Comunicação de Incidentes

Fontes: [Regulamentações ANPD](https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd/) · [FAQ oficial da ANPD sobre incidentes](https://www.gov.br/anpd/pt-br/canais_atendimento/agente-de-tratamento/comunicado-de-incidente-de-seguranca-cis).

- **Art. 9º**: comunicação à ANPD **e aos titulares** em **3 dias úteis**, contados da ciência do controlador de que o incidente afetou dados pessoais, quando puder acarretar **risco ou dano relevante**.
- Complementação fundamentada das informações em até **20 dias úteis** da comunicação.
- Comunicação aos titulares em linguagem simples, por canal direto; declaração à ANPD sobre os meios utilizados.
- **Aplicação ao sistema:** runbook de incidentes (detecção → contenção → avaliação de risco/dano → comunicação → registro). O protótipo registra eventos de segurança na auditoria; o processo formal é da empresa.

## 5. Resolução CD/ANPD nº 2/2022 — Agentes de pequeno porte

Fonte: [texto oficial](https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd/resolucao-cd-anpd-no-2-de-27-de-janeiro-de-2022) (com alterações da Res. 15/2024).

- **Art. 2º**: define agentes de pequeno porte (ME/EPP nos termos da LC 123/2006, startups da LC 182/2021, etc.).
- **Art. 3º**: **não** se beneficiam do tratamento diferenciado quem realiza tratamento de **alto risco**, aufere receita acima dos limites (EPP/startup) ou pertence a grupo econômico acima dos limites.
- **Art. 4º**: alto risco = ao menos um critério **geral** (larga escala OU afetação significativa de direitos) **+** um **específico** (tecnologias emergentes; vigilância de zonas públicas; decisões unicamente automatizadas; dados sensíveis/crianças/adolescentes/idosos), **cumulativamente**.
- Flexibilizações: registro simplificado (art. 9º), **dispensa de indicar encarregado** com canal de comunicação (art. 11), medidas/policy de segurança simplificadas (arts. 12–13), **prazos em dobro** (art. 14, inclusive incidentes na forma da Res. 15/2024).

**Aplicação à Rajamine — sem presunção:** o enquadramento depende do faturamento e da estrutura societária (dados que não temos). O uso de OCR/IA é "tecnologia emergente" (critério específico), mas o alto risco exige **também** um critério geral — a avaliar (número de titulares, escala, impacto). **Não presumimos o enquadramento nem a dispensa de DPO.** Recomendação: manter encarregado/canal e adotar as boas práticas mesmo se houver dispensa (contam na dosimetria, art. 52, §1º, IX da LGPD).

## 6. Guia de Segurança da Informação da ANPD (pequeno porte)

Fonte: [Guia orientativo](https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia-orientativo-sobre-seguranca-da-informacao-para-agentes-de-tratamento-de-pequeno-porte).

Recomendações (boa prática, não lei): controle de acesso, senhas fortes/MFA, atualizações, backups testados, criptografia, conscientização da equipe, política simplificada. O doc 04 mapeia cada uma para o plano de produção.

## 7. Pendências que dependem da empresa + jurídico (checklist honesto)

- [ ] Documento de bases legais por operação (art. 7º) — execução de contrato × obrigação legal × legítimo interesse.
- [ ] Aviso de privacidade para colaboradores e política de retenção/eliminação (incl. fotos e PDFs).
- [ ] ROPA (art. 37) e, se aplicável, RIPD (art. 38) para OCR/IA.
- [ ] Decisão sobre encarregado (art. 41 + Res. 2/2022) e canal de atendimento.
- [ ] Runbook de incidentes com os prazos da Res. 15/2024 treinado com a equipe.
- [ ] Contratos com operadores (nuvem, e-mail, WhatsApp) e avaliação de transferência internacional (Res. 19/2024) se houver processamento fora do Brasil.
- [ ] Delimitação jurídica da aplicabilidade do Decreto 12.975/2026 ao sistema interno.
- [ ] Guarda de registros de acesso (art. 15 MCI + art. 15-A do decreto) em produção.

**Conclusão:** o protótipo implementa a base técnica (minimização, segurança, auditoria, revisão humana, direitos do titular em demonstração) e documenta o caminho. Conformidade é um processo contínuo da empresa, não um selo do software.
