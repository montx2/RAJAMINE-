# -*- coding: utf-8 -*-
"""Conteúdo textual do TCC SAFIP FieldOps (ABNT)."""

TITULO = 'SISTEMA WEB PROGRESSIVO PARA GESTÃO E PADRONIZAÇÃO DE RELATÓRIOS DE CAMPO COM OCR LOCAL E REVISÃO HUMANA OBRIGATÓRIA'
SUBTITULO = 'um estudo de caso aplicado à SAFIP Inteligência em Mineração'
AUTOR = '[NOME COMPLETO DO AUTOR]'
INSTITUICAO = '[NOME DA INSTITUIÇÃO]'
CURSO = '[NOME DO CURSO SUPERIOR DE TECNOLOGIA / BACHARELADO]'
ORIENTADOR = '[NOME DO ORIENTADOR]'
COORIENTADOR = '[NOME DO COORIENTADOR, SE HOUVER]'
CIDADE = '[CIDADE DA INSTITUIÇÃO]'
ANO = '2026'
GRAU = '[Tecnólogo / Bacharel]'
AREA = 'Engenharia de Software / Sistemas de Informação'

RESUMO = (
    'O presente trabalho apresenta o desenvolvimento e a avaliação de um protótipo funcional de sistema web progressivo '
    'para gestão, padronização e auditoria de relatórios de campo, aplicado ao contexto da SAFIP Inteligência em Mineração. '
    'O problema investigado consiste em como reduzir retrabalho, dispersão de evidências e riscos de conformidade na elaboração '
    'de relatórios técnicos sem eliminar a revisão humana obrigatória antes da liberação de documentos ao cliente. A pesquisa '
    'caracteriza-se como aplicada, qualitativa e exploratória, conduzida pelo método Design Science Research, com construção '
    'iterativa de artefato computacional. O sistema foi implementado em React, TypeScript, Vite, Tailwind CSS, Zustand, '
    'Tesseract.js e pdf-lib, incorporando coleta móvel, padronização textual determinística, reconhecimento óptico de caracteres '
    'local, geração de documentos PDF, trilha de auditoria, controle de perfis e um Portal do Motorista instalável como PWA. '
    'A avaliação técnica compreendeu 80 testes automatizados, verificação de build, smoke tests de renderização, ensaios de OCR '
    'e análise de conformidade com diretrizes de segurança, acessibilidade e proteção de dados. Os resultados demonstram a '
    'viabilidade de automatizar captura, roteamento e sincronização de informações operacionais, preservando a decisão humana '
    'sobre aprovação, triagem e envio. Conclui-se que a abordagem proposta oferece uma base técnica consistente para evolução '
    'do processo documental da empresa, desde que complementada por backend autenticado, governança de dados e validação '
    'jurídica institucional.'
)
PALAVRAS_CHAVE = 'relatórios de campo; reconhecimento óptico de caracteres; revisão humana; LGPD; aplicação web progressiva.'

ABSTRACT = (
    'This work presents the development and evaluation of a functional prototype of a progressive web system for managing, '
    'standardizing, and auditing field reports, applied to the context of SAFIP Inteligência em Mineração. The research '
    'problem addresses how to reduce rework, scattered evidence, and compliance risks in technical report preparation without '
    'removing mandatory human review before documents are released to clients. The study is applied, qualitative, and '
    'exploratory, conducted through Design Science Research with iterative construction of a computational artifact. The system '
    'was implemented using React, TypeScript, Vite, Tailwind CSS, Zustand, Tesseract.js, and pdf-lib, incorporating mobile '
    'data collection, deterministic text standardization, local optical character recognition, PDF generation, audit trails, '
    'role-based access control, and an installable Driver Portal as a PWA. Technical evaluation comprised 80 automated tests, '
    'build verification, rendering smoke tests, OCR trials, and compliance analysis against security, accessibility, and data '
    'protection guidelines. Results demonstrate the feasibility of automating capture, routing, and synchronization of '
    'operational information while preserving human decision-making over approval, triage, and sending. The proposed approach '
    'provides a consistent technical foundation for evolving the company’s documentary process, provided it is complemented by '
    'an authenticated backend, data governance, and institutional legal validation.'
)
KEYWORDS = 'field reports; optical character recognition; human review; LGPD; progressive web application.'

SIGLAS = [
    ('ABNT', 'Associação Brasileira de Normas Técnicas'),
    ('ANPD', 'Autoridade Nacional de Proteção de Dados'),
    ('API', 'Application Programming Interface'),
    ('ASVS', 'Application Security Verification Standard'),
    ('CNPJ', 'Cadastro Nacional da Pessoa Jurídica'),
    ('CSV', 'Comma-Separated Values'),
    ('DSR', 'Design Science Research'),
    ('IMEI', 'International Mobile Equipment Identity'),
    ('LGPD', 'Lei Geral de Proteção de Dados Pessoais'),
    ('MFA', 'Multi-Factor Authentication'),
    ('OCR', 'Optical Character Recognition'),
    ('OIDC', 'OpenID Connect'),
    ('OWASP', 'Open Worldwide Application Security Project'),
    ('PDF', 'Portable Document Format'),
    ('PWA', 'Progressive Web Application'),
    ('RBAC', 'Role-Based Access Control'),
    ('SENAI', 'Serviço Nacional de Aprendizagem Industrial'),
    ('SPA', 'Single-Page Application'),
    ('TCC', 'Trabalho de Conclusão de Curso'),
    ('UI', 'User Interface'),
    ('UX', 'User Experience'),
    ('WASM', 'WebAssembly'),
    ('WCAG', 'Web Content Accessibility Guidelines'),
]

DEDICATORIA = (
    'Dedico este trabalho aos profissionais de campo que, muitas vezes longe de suas famílias, '
    'mantêm a operação segura e rastreável, e aos estudantes que encontram na tecnologia '
    'um caminho para transformar trabalho em conhecimento.'
)

AGRADECIMENTOS = (
    'À instituição de ensino e ao corpo docente, pela formação técnica e humana que tornou possível este trabalho. '
    'Ao orientador, pela leitura crítica, pelas correções e pela exigência de rigor metodológico. '
    'À SAFIP Inteligência em Mineração, pela disponibilização de referências operacionais que permitiram '
    'aproximar o artefato de um problema real. Aos colegas de equipe, pela colaboração nas validações, '
    'nos testes e nas discussões de usabilidade. À família e aos amigos, pelo apoio constante durante '
    'as etapas de desenvolvimento, escrita e revisão. Por fim, às comunidades de software livre e às '
    'instituições que publicam normas, diretrizes e documentação técnica aberta, sem as quais este '
    'protótipo não teria a mesma base de qualidade.'
)

EPIGRAFE = (
    '“Programas devem ser escritos para pessoas lerem, e apenas incidentalmente para máquinas executarem.”'
)
EPIGRAFE_AUTOR = 'Abelson e Sussman (1996, tradução nossa)'

BODY = []

def h1(t): BODY.append(('h1', t))
def h2(t): BODY.append(('h2', t))
def h3(t): BODY.append(('h3', t))
def p(t): BODY.append(('p', t))
def quote(t): BODY.append(('quote', t))
def bullets(items): BODY.append(('bullets', items))
def fig(path, caption, source='Elaborado pelo autor (2026).'): BODY.append(('fig', path, caption, source))
def tab(caption, headers, rows, source='Elaborado pelo autor (2026).', kind='Tabela'): BODY.append(('tab', kind, caption, headers, rows, source))

# ─────────────────────────────────────────────
h1('1 INTRODUÇÃO')
h2('1.1 Contextualização')
p('A operação de serviços técnicos em mineração depende de evidências de campo: instalações, manutenções, retiradas, '
  'inspeções, viagens, leituras de equipamentos, fotografias e observações operacionais. Esses registros não são apenas '
  'memórias administrativas; eles sustentam faturamento, rastreabilidade contratual, segurança do trabalho, prestação de '
  'contas ao cliente e melhoria contínua. Quando o relatório é produzido de forma dispersa, em texto livre, com fotos em '
  'aplicativos de mensagem e sem trilha de revisão, a organização passa a depender de esforço manual para reconstruir o que '
  'ocorreu em campo.')
p('No contexto da SAFIP Inteligência em Mineração, foram observados materiais reais de referência, como planilhas de '
  'instalações e manutenções, relatórios de visita técnica, atividades externas e consolidados semanais. Esses materiais '
  'evidenciam a necessidade de padronizar códigos de equipamentos, identificadores de telemetria, tablets, câmeras, '
  'rastreadores e dados de viagem, preservando ao mesmo tempo a originalidade das informações coletadas. O desafio não é '
  'apenas digitalizar formulários, mas estruturar um fluxo documental confiável, auditável e compatível com a legislação '
  'brasileira de proteção de dados.')
p('Este trabalho propõe e avalia o SAFIP FieldOps, um protótipo funcional de sistema web progressivo que reúne coleta '
  'móvel, padronização assistida de texto, OCR local, revisão humana obrigatória, geração de PDFs, gestão de equipamentos '
  'e frota, arquivo histórico e um Portal do Motorista. A proposta parte do princípio de que a automação deve reduzir '
  'trabalho repetitivo e risco operacional, mas não deve substituir a responsabilidade humana sobre aprovação, triagem e '
  'liberação de documentos ao cliente.')

h2('1.2 Problema de pesquisa')
p('O problema que orienta esta pesquisa pode ser formulado da seguinte maneira: como estruturar um sistema web progressivo '
  'capaz de padronizar, rastrear e acelerar a produção de relatórios de campo, preservando os registros originais e garantindo '
  'revisão humana obrigatória antes da liberação de documentos ao cliente?')
p('Esse problema desdobra-se em questões secundárias: como extrair identificadores de equipamentos a partir de fotografias '
  'sem enviar imagens a serviços externos? Como evitar que sugestões automáticas de texto sobrescrevam o relato original? '
  'Como permitir que motoristas registrem checklists e ocorrências de forma simples, inclusive offline, sem criar mecanismos '
  'invasivos de monitoramento? Como demonstrar, em um protótipo acadêmico, a diferença entre funcionalidades implementadas, '
  'simulações rotuladas e medidas que dependem de backend de produção?')

h2('1.3 Objetivos')
h3('1.3.1 Objetivo geral')
p('Desenvolver e avaliar um protótipo funcional de sistema web progressivo para gestão e padronização de relatórios de campo, '
  'com OCR local, trilha de auditoria, revisão humana obrigatória e Portal do Motorista, aplicado ao contexto da SAFIP '
  'Inteligência em Mineração.')
h3('1.3.2 Objetivos específicos')
bullets([
    'Diagnosticar gargalos documentais a partir de referências operacionais reais e de requisitos de rastreabilidade, segurança e conformidade.',
    'Comparar alternativas técnicas de OCR, geração de PDF, persistência local e arquitetura frontend, justificando as escolhas do artefato.',
    'Implementar fluxo de relatório com link individual, preenchimento móvel, padronização textual preservando o original e confirmação humana de leituras OCR.',
    'Implementar central de revisão com bloqueio de aprovação quando houver pendências e geração de dois PDFs: cliente sem fotos e interno completo.',
    'Implementar Portal do Motorista como PWA, com checklist automático, ocorrências, ciência de treinamentos, histórico e fila offline simulada.',
    'Aplicar controles demonstrativos de RBAC, validação de uploads, auditoria, proveniência de dados e rotulagem de simulações.',
    'Avaliar o artefato por testes automatizados, smoke tests, build de produção, ensaios de OCR e checklist de conformidade documental.',
    'Documentar limites, riscos, custos estimados e evoluções necessárias para produção, incluindo backend, governança LGPD e validação jurídica.',
])

h2('1.4 Justificativa')
p('A justificativa técnica reside na oportunidade de aplicar engenharia de software, interação humano-computador, segurança '
  'da informação e proteção de dados a um problema concreto de campo. Em vez de desenvolver um sistema genérico de formulários, '
  'o trabalho investiga como combinar OCR local, padronização determinística, revisão humana e PWA em um fluxo único. '
  'A justificativa acadêmica está na contribuição de um artefato avaliado segundo Design Science Research, com documentação '
  'reprodutível, testes e discussão explícita de limitações. A justificativa social e organizacional está na redução de '
  'retrabalho, na melhoria da rastreabilidade e na proteção dos trabalhadores e clientes contra uso indevido de dados ou '
  'liberação automática de documentos não revisados.')
p('O trabalho também se justifica por sua postura de integridade: dados demonstrativos são rotulados, envios são simulados, '
  'imagens reais da empresa não são commitadas no repositório e a conformidade plena com a LGPD não é presumida. Essa '
  'delimitação é essencial em um TCC, pois evita transformar protótipo em promessa comercial e mantém o rigor sobre o que '
  'foi efetivamente implementado e avaliado.')

h2('1.5 Escopo e delimitações')
p('O escopo compreende um protótipo frontend funcional, com persistência local no navegador, serviços locais de OCR e PDF, '
  'dados mistos de demonstração e documentação técnica. Não fazem parte do escopo: backend real, autenticação OIDC/MFA, '
  'banco de dados servidor, envio real de e-mail/WhatsApp, push notification real, integração com sistemas internos da empresa, '
  'certificação de conformidade LGPD, biometria, GPS contínuo ou score de fadiga. A avaliação é técnica e documental; não '
  'constitui estudo longitudinal com usuários em produção.')

h2('1.6 Estrutura do trabalho')
p('A apresentação deste documento segue as normas ABNT NBR 14724 (ABNT, 2024), NBR 6024 (ABNT, 2012), '
  'NBR 6027 (ABNT, 2012), NBR 6028 (ABNT, 2021), NBR 10520 (ABNT, 2023) e NBR 6023 (ABNT, 2025), '
  'com adaptações documentadas no Apêndice B. Quando houver manual institucional específico, ele deve prevalecer '
  'sobre este modelo.')
p('Além desta introdução, o trabalho organiza-se em cinco seções. A seção 2 apresenta o referencial teórico sobre relatórios '
  'de campo, OCR, revisão humana, PWA, segurança, LGPD e Design Science Research. A seção 3 descreve a metodologia. A seção 4 '
  'apresenta o desenvolvimento e os resultados do artefato. A seção 5 discute aderência aos objetivos, limitações e trabalhos '
  'futuros. A seção 6 apresenta a conclusão. Ao final, incluem-se referências e apêndices com roteiro de demonstração, '
  'checklist ABNT e estrutura do repositório.')

# ─────────────────────────────────────────────
h1('2 REFERENCIAL TEÓRICO')
h2('2.1 Relatórios de campo, rastreabilidade e qualidade da informação')
p('Relatórios de campo são documentos operacionais que registram atividades, condições, evidências e decisões tomadas fora '
  'do ambiente administrativo. Em serviços de mineração, sua qualidade influencia diretamente a capacidade de demonstrar '
  'conformidade contratual, investigar incidentes, planejar manutenção e cobrar serviços. Sob a perspectiva da engenharia de '
  'software, o problema pode ser tratado como um fluxo de informação com requisitos de integridade, disponibilidade, '
  'confidencialidade e auditabilidade (Pressman; Maxim, 2020; Sommerville, 2016).')
p('A rastreabilidade exige que cada dado relevante preserve origem, autor, data/hora e histórico de alterações. A preservação '
  'do original é especialmente importante quando há sugestões automáticas de texto ou leitura de imagens: o sistema deve '
  'permitir aceitar, editar ou rejeitar uma sugestão sem apagar silenciosamente o registro inicial. Essa decisão de projeto '
  'aproxima o artefato de princípios de auditoria e de proteção de dados, como necessidade, transparência e responsabilização.')

h2('2.2 Reconhecimento óptico de caracteres em imagens de campo')
p('O reconhecimento óptico de caracteres (OCR) permite converter texto presente em imagens em dados editáveis. Em campo, '
  'fotografias de etiquetas, chassis, painéis e dispositivos frequentemente apresentam iluminação irregular, reflexos, '
  'sujeira, ângulos oblíquos e fontes de baixa legibilidade. Por isso, a extração automática não deve ser tratada como '
  'verdade absoluta. O Tesseract é um motor OCR aberto amplamente utilizado, originalmente descrito por Smith (2007), e '
  'sua versão JavaScript/WebAssembly possibilita execução local no navegador.')
p('Alternativas baseadas em aprendizado profundo, como PaddleOCR, podem oferecer melhor desempenho em certos cenários, '
  'mas introduzem dependências maiores, custos de implantação e considerações de envio de imagens a serviços externos '
  '(Du et al., 2020). Neste trabalho, a escolha pelo Tesseract.js prioriza execução local, custo zero de API, simplicidade '
  'de distribuição e minimização de dados, ainda que com limitações de acurácia. A estratégia adotada combina múltiplas '
  'passagens, expressões regulares adaptadas ao português brasileiro, indicadores de confiança e confirmação humana.')

p('O Quadro 1 compara as alternativas de OCR consideradas para o protótipo.')

tab('Comparação entre alternativas de OCR para o protótipo',
    ['Critério', 'Tesseract.js', 'PaddleOCR / serviço externo'],
    [
        ['Execução', 'Local no navegador via WASM', 'Servidor, GPU ou API externa'],
        ['Privacidade', 'Imagem não sai do dispositivo no protótipo', 'Pode exigir envio da imagem ou infraestrutura dedicada'],
        ['Custo recorrente', 'Sem custo de API', 'Custo de computação, GPU ou chamada de API'],
        ['Implantação', 'Simples, assets locais', 'Mais complexa, dependências maiores'],
        ['Acurácia em campo', 'Limitada; exige confirmação humana', 'Potencialmente maior, dependendo do modelo'],
        ['Decisão do projeto', 'Adotado com multi-pass e revisão humana', 'Documentado como alternativa futura'],
    ], kind='Quadro')

h2('2.3 Padronização textual, IA assistida e preservação do original')
p('A padronização textual pode ser realizada por regras determinísticas ou por modelos generativos. No protótipo, optou-se '
  'por um motor local de regras para conversão de primeira para terceira pessoa, ajustes de concordância, alertas de '
  'identificadores e períodos, e comparação entre texto original e sugerido. Essa escolha não deve ser confundida com um '
  'modelo de linguagem de grande porte; trata-se de um mecanismo explicável, testável e sem chamada externa.')
p('A literatura de interação humano-IA recomenda que sistemas assistivos mantenham o usuário no controle, tornem claro o '
  'que o sistema pode fazer e permitam correção eficiente de erros (Amershi et al., 2019). No artefato, a sugestão de texto '
  'é apresentada com diff, opções de aceitar, editar ou rejeitar, e preservação do original em versão. Essa decisão reduz '
  'o risco de automação silenciosa e mantém a responsabilidade humana sobre o conteúdo final.')

h2('2.4 Revisão humana obrigatória e governança documental')
p('A revisão humana obrigatória é um mecanismo de controle, não apenas uma etapa burocrática. Em documentos que serão '
  'enviados a clientes, a aprovação deve registrar autor, data/hora e versão aprovada. No protótipo, a central de revisão '
  'bloqueia aprovação quando há leituras OCR pendentes e bloqueia geração/liberação de documento do cliente antes da '
  'aprovação. O envio ao cliente é simulado e rotulado, pois o trabalho não realiza comunicação real.')
p('Esse desenho está alinhado à ideia de que automações devem ser limitadas por regras de negócio explícitas. No Portal do '
  'Motorista, por exemplo, falhas de checklist podem abrir ocorrências automaticamente e notificar a coordenação, mas a '
  'triagem, resolução ou rejeição continua sendo humana. A automação atua na captura e no roteamento; a decisão permanece '
  'com pessoas responsáveis.')

h2('2.5 Aplicações web progressivas e trabalho offline')
p('Aplicações web progressivas (PWA) combinam alcance da web com capacidades típicas de aplicativos instaláveis, como '
  'manifesto, ícones, service worker e experiência em tela cheia. Em contextos de campo, a conectividade pode ser '
  'intermitente; por isso, estratégias offline-first e filas locais de sincronização são relevantes (MDN, 2026). No '
  'protótipo, o Portal do Motorista utiliza manifesto e service worker em build de produção, persistência local e uma '
  'fila de sincronização simulada. A sincronização real com servidor é documentada como evolução necessária.')
p('A decisão de não registrar service worker em ambiente de desenvolvimento evita cache obsoleto durante a avaliação. '
  'Em produção, a estratégia network-first para navegação e cache de assets permite abertura offline do shell da aplicação, '
  'mas não substitui uma API idempotente com retry, resolução de conflitos e autenticação.')

h2('2.6 Segurança da informação e desenvolvimento seguro')
p('A segurança do artefato foi orientada por defense-in-depth e por referências OWASP, incluindo Top 10, ASVS e cheat sheets '
  '(OWASP, 2021; OWASP, 2025). No protótipo, foram implementados controles demonstrativos de perfis, validação de entradas, '
  'validação de uploads por MIME e magic bytes, limite de tamanho, preservação de originais, trilha de auditoria e rotulagem '
  'de simulações. Em produção, seriam necessários autenticação forte, autorização server-side, TLS, criptografia em repouso, '
  'rate limiting, cabeçalhos de segurança, logs imutáveis, backups e testes de segurança.')
p('É importante distinguir controle implementado de controle documentado. RBAC no frontend melhora a experiência, mas não '
  'substitui autorização no servidor. Criptografia e autenticação, por si só, não garantem conformidade legal. Essa distinção '
  'é mantida ao longo do trabalho para evitar alegações excessivas.')

h2('2.7 LGPD, Marco Civil e proteção de dados no contexto do artefato')
p('A Lei nº 13.709/2018, Lei Geral de Proteção de Dados Pessoais, estabelece princípios como finalidade, adequação, '
  'necessidade, livre acesso, qualidade dos dados, transparência, segurança, prevenção, não discriminação e '
  'responsabilização (Brasil, 2018). O princípio da finalidade é definido como a "realização do tratamento para '
  'propósitos legítimos, específicos, explícitos e informados ao titular" (Brasil, 2018, art. 6º, I). O tratamento de dados de colaboradores e motoristas exige base legal adequada, '
  'minimização, controle de acesso, retenção definida e atendimento aos direitos dos titulares. Alterações recentes na '
  'governança da autoridade nacional, como a **Lei nº 15.352**/2026, reforçam a necessidade de acompanhamento normativo '
  'contínuo (Brasil, 2026b).')
p('O **Decreto nº 12.975**/2026 altera a regulamentação do Marco Civil da Internet e impõe deveres a provedores de aplicações '
  'em hipóteses específicas; seu escopo não deve ser automaticamente presumido para um sistema interno de relatórios '
  '(Brasil, 2026a). Resoluções da ANPD, como a nº 2/2022 e a nº 15/2024, tratam, respectivamente, de agentes de pequeno '
  'porte e comunicação de incidentes, e devem ser analisadas caso a caso (ANPD, 2022; ANPD, 2024). O trabalho não presume '
  'enquadramento da empresa como agente de pequeno porte nem declara conformidade plena; recomenda validação jurídica, '
  'RIPD quando cabível, política de retenção e governança formal.')

h2('2.8 Design Science Research como método de construção e avaliação')
p('A Design Science Research (DSR) orienta pesquisas que buscam criar e avaliar artefatos para resolver problemas '
  'organizacionais relevantes. Hevner et al. (2004) destacam que o conhecimento é produzido na construção e aplicação do '
  'artefato, enquanto Peffers et al. (2007) propõem um processo com identificação do problema, definição de objetivos, '
  'projeto e desenvolvimento, demonstração, avaliação e comunicação. Dresch, Lacerda e Antunes Júnior (2015) sistematizam '
  'a aplicação da DSR no contexto brasileiro.')
p('A Figura 1 sintetiza o ciclo de DSR adotado. Neste trabalho, a DSR é adequada porque o resultado não é apenas uma descrição do problema, mas um sistema funcional, '
  'acompanhado de documentação, testes e avaliação crítica. O rigor é buscado por meio de requisitos explícitos, decisões '
  'arquiteturais justificadas, testes automatizados, rastreabilidade de dados e discussão honesta de limitações.')

fig('figuras/fig3_dsr.png', 'Ciclo de Design Science Research adaptado ao desenvolvimento do artefato')


h2('2.9 Usabilidade, acessibilidade e design system')
p('A usabilidade é um atributo de qualidade que influencia diretamente a adoção do sistema em campo. Nielsen (1993) '
  'define usabilidade por componentes como aprendibilidade, eficiência, memorabilidade, erros e satisfação. No artefato, '
  'esses componentes orientaram decisões como navegação agrupada, feedback de salvamento, confirmação de ações críticas, '
  'redução de informação por tela e progressive disclosure. A acessibilidade foi tratada como requisito, não como '
  'ornamento: contraste, foco visível, rótulos de formulário, áreas de toque adequadas e respeito a reduced-motion '
  'aproximam o protótipo das diretrizes WCAG 2.2 (W3C, 2023).')
p('O design system denominado Liquid Glass Clean utiliza superfícies translúcidas com lastro de contraste, tipografia '
  'self-hosted, tokens de cor e movimento, e componentes reutilizáveis. A escolha estética não se sobrepõe à legibilidade: '
  'textos longos utilizam fundo sólido ou semiopaco, e ações primárias possuem contraste suficiente. Essa decisão é '
  'relevante porque interfaces excessivamente decorativas podem prejudicar leitura em ambientes externos, com luz solar '
  'e telas de baixa qualidade.')

# ─────────────────────────────────────────────
h1('3 METODOLOGIA')
h2('3.1 Classificação da pesquisa')
p('Quanto à natureza, a pesquisa é aplicada, pois busca resolver um problema operacional concreto. Quanto à abordagem, é '
  'qualitativa, pois analisa requisitos, decisões de projeto, conformidade e usabilidade de forma interpretativa, apoiada '
  'por métricas técnicas. Quanto aos objetivos, é exploratória, pois investiga a combinação de OCR local, padronização '
  'assistida, revisão humana e PWA em um domínio específico. Quanto aos procedimentos, adota estudo de caso aplicado e '
  'Design Science Research, com construção iterativa de artefato (Gil, 2017; Hevner et al., 2004; Peffers et al., 2007).')

h2('3.2 Etapas do método')
p('O desenvolvimento seguiu as etapas da DSRM propostas por Peffers et al. (2007), adaptadas ao contexto do projeto:')
bullets([
    'Identificação do problema e motivação: análise de referências operacionais, gargalos documentais e riscos de conformidade.',
    'Definição dos objetivos da solução: requisitos funcionais, não funcionais, regras de negócio e limites de automação.',
    'Projeto e desenvolvimento: arquitetura, design system, implementação incremental, dados demonstrativos e documentação.',
    'Demonstração: roteiro de uso com perfis administrador, revisão, colaborador e motorista; simulação de fluxo completo.',
    'Avaliação: testes unitários, smoke tests, build, ensaios de OCR, checklist de segurança/acessibilidade e revisão documental.',
    'Comunicação: TCC, README, documentação técnica, apêndices e repositório versionado.',
])

h2('3.3 Ambiente, ferramentas e stack tecnológica')
p('O artefato foi desenvolvido em Node.js 22, React 19, TypeScript 5.9, Vite 7, Tailwind CSS 4, React Router 7, Zustand 5, '
  'Recharts 3, pdf-lib 1.17, Tesseract.js 7, Zod 4, idb-keyval, Vitest 5 e Playwright. As fontes Plus Jakarta Sans e JetBrains '
  'Mono são self-hosted. O OCR utiliza worker, core WASM e modelo de idioma servidos localmente. A geração de PDF é feita '
  'no navegador com pdf-lib, evitando dependência de servidor para o protótipo.')

p('O Quadro 2 sintetiza a stack tecnológica e a justificativa de cada escolha.')

tab('Stack tecnológica e justificativa de escolha',
    ['Camada', 'Tecnologia', 'Justificativa'],
    [
        ['Interface', 'React 19 + TypeScript', 'Componentização, tipagem e ecossistema maduro'],
        ['Build', 'Vite 7', 'Desenvolvimento rápido e build otimizado'],
        ['Estilo', 'Tailwind CSS 4', 'Design system consistente e utilitário'],
        ['Estado', 'Zustand 5 + persist', 'Estado global simples, auditável e persistível'],
        ['OCR', 'Tesseract.js 7', 'Execução local, privacidade e custo zero de API'],
        ['PDF', 'pdf-lib', 'Geração client-side, sem servidor no protótipo'],
        ['Validação', 'Zod 4', 'Esquemas declarativos e mensagens de erro'],
        ['Testes', 'Vitest 5 + Playwright', 'Unitários, smoke e E2E'],
        ['PWA', 'Manifest + service worker', 'Instalabilidade e offline demonstrativo'],
    ], kind='Quadro')

h2('3.4 Coleta de requisitos e uso de referências reais')
p('Os requisitos foram derivados de materiais fornecidos pela empresa: planilhas de operações, relatórios de visita técnica, '
  'atividade externa, consolidado semanal e exemplos de identificação de equipamentos. Esses materiais foram tratados como '
  'referência de domínio, não como dados a serem expostos publicamente. O repositório utiliza base mista: exemplos sintéticos '
  'e referências reais marcadas por proveniência. Imagens originais da empresa não são commitadas; as fotografias utilizadas na '
  'demonstração são sintéticas e rotuladas.')
p('A análise documental buscou identificar campos recorrentes, códigos de equipamentos, IMEIs, placas, clientes, caminhões, '
  'períodos, atividades e observações. Quando um campo não estava presente na referência, ele não foi inventado como dado '
  'real; quando necessário para demonstração, foi marcado como sintético. Essa prática reduz o risco de o TCC afirmar '
  'informações não verificadas sobre a empresa.')

h2('3.5 Desenvolvimento do artefato')
p('O desenvolvimento foi incremental. Primeiro, estruturaram-se tipos, dados demonstrativos, store e regras de negócio. '
  'Em seguida, implementaram-se telas administrativas, fluxo de relatório, padronização, OCR, revisão e PDFs. Posteriormente, '
  'foram incorporadas referências reais, operações de campo, consolidado semanal, redesign visual e expansão da galeria '
  'demonstrativa. Por fim, implementou-se o Portal do Motorista como PWA, com checklist automático, ocorrências, ciência '
  'de treinamentos, histórico e fila offline simulada.')
p('O design system foi gerado e adaptado com apoio da skill UI UX Pro Max, resultando em uma interface denominada '
  'Liquid Glass Clean: superfícies translúcidas com lastro de contraste, animações curtas, foco visível, respeito a '
  'reduced-motion e progressive disclosure. A identidade visual utiliza grafite e amarelo, aproximando-se da referência '
  'institucional sem copiar materiais protegidos.')

h2('3.6 Avaliação e validação')
p('A avaliação técnica compreendeu: (i) testes unitários de regras de negócio, padronização, OCR, PDF, fotos demonstrativas '
  'e Portal do Motorista; (ii) smoke tests de renderização em jsdom; (iii) build de produção; (iv) ensaios de OCR com '
  'imagens de exemplo; (v) verificação de rotas e assets por HTTP; e (vi) checklist de conformidade com diretrizes de '
  'segurança, acessibilidade e proteção de dados. A suíte final registrou 80 testes aprovados em 10 arquivos.')
p('A avaliação não substitui testes de aceitação com usuários reais, testes de carga, auditoria de segurança independente '
  'ou validação jurídica. Esses itens são registrados como limitações e trabalhos futuros. A honestidade sobre o tipo de '
  'avaliação é parte do rigor acadêmico do trabalho.')

h2('3.7 Aspectos éticos e de integridade')
p('O trabalho adota três compromissos de integridade. Primeiro, não declara conformidade plena com a LGPD apenas por '
  'implementar login ou criptografia. Segundo, não realiza envio real de documentos ou mensagens a clientes. Terceiro, '
  'não apresenta dados sintéticos como reais. Simulações são rotuladas na interface, na auditoria e na documentação. '
  'O uso de ferramentas de apoio à escrita e à prototipagem foi submetido a revisão humana, e o texto final deve ser '
  'validado pelo autor e pelo orientador conforme as políticas da instituição.')


h2('3.8 Instrumentos, métricas e critérios de avaliação')
p('Os instrumentos de avaliação foram organizados em quatro grupos: testes automatizados, inspeção técnica, ensaios de '
  'OCR e checklist documental. Os testes automatizados verificam regras de negócio, preservação de original, bloqueios de '
  'aprovação, geração de PDF, validação de fotos, RBAC demonstrativo e automações do Portal do Motorista. A inspeção '
  'técnica verificou build, rotas, assets, acessibilidade básica e separação entre implementado e simulado. Os ensaios de '
  'OCR avaliaram leitura de códigos e IMEIs em imagens demonstrativas. O checklist documental verificou estrutura ABNT, '
  'citações, referências, legendas, fontes e paginação.')
p('Os critérios de aceite foram: nenhum teste crítico falhando; build de produção concluído; documento do cliente '
  'bloqueado antes da aprovação; OCR pendente bloqueando aprovação; original preservado; simulações rotuladas; e '
  'Portal do Motorista sem automação de aprovação ou envio real. Esses critérios não medem satisfação do usuário em '
  'produção, mas estabelecem uma linha de base técnica para evolução.')

# ─────────────────────────────────────────────
h1('4 DESENVOLVIMENTO E RESULTADOS')
h2('4.1 Visão geral do artefato')
p('O SAFIP FieldOps é uma aplicação web de página única com rotas protegidas por perfil, estado persistido localmente '
  'e serviços executados no navegador. O artefato reúne módulos administrativos e operacionais: dashboard, relatórios, '
  'preenchimento por link, central de revisão, operações de campo, consolidado semanal, equipamentos, caminhões, cadastros, '
  'documentos, conformidade e Portal do Motorista. A Figura 2 apresenta a arquitetura lógica.')
fig('figuras/fig1_arquitetura.png', 'Arquitetura lógica do protótipo SAFIP FieldOps')

h2('4.2 Fluxo de relatório de campo')
p('O fluxo começa com a criação de um relatório, que gera código sequencial, token individual e prazo de 48 horas. O '
  'colaborador preenche atividades por equipamento, texto livre e fotos. O motor de padronização sugere uma versão em '
  'terceira pessoa, preservando o original. O OCR local extrai códigos e IMEIs, mas o usuário confirma, corrige ou rejeita '
  'a leitura. O envio para revisão exige campos mínimos. A revisão humana pode solicitar correção ou aprovar. Somente após '
  'aprovação são liberados os documentos ao cliente. A Figura 3 sintetiza o fluxo.')
fig('figuras/fig2_fluxo_relatorio.png', 'Fluxo do relatório de campo com revisão humana obrigatória')
p('Os dois PDFs gerados têm finalidades distintas: o documento do cliente, sem fotos, e o documento interno completo, com '
  'fotos, OCR, texto original, histórico e observações. O envio ao cliente é marcado como simulação. O consolidado semanal '
  'utiliza apenas relatórios aprovados, reforçando a regra de que automação não substitui aprovação.')

h2('4.3 OCR local e confirmação humana')
p('O pipeline de OCR executa pré-processamento, múltiplas passagens com diferentes configurações de segmentação, extração '
  'por expressões regulares e cálculo de confiança. Os padrões foram adaptados para códigos como CP-101, EQ-2041 e IMEIs '
  'de 15 dígitos, evitando falsos positivos em prefixos e letras acentuadas. A Figura 4 apresenta o pipeline.')
fig('figuras/fig4_ocr.png', 'Pipeline de OCR local com confirmação humana')
p('Os ensaios demonstraram que imagens de campo exigem confirmação humana. Leituras com baixa confiança são destacadas, '
  'e o sistema não permite aprovar relatório com OCR pendente. Quando o OCR real não está disponível, o modo demonstrativo '
  'é explicitamente rotulado como simulação. Essa decisão evita que o protótipo apresente resultados fictícios como se '
  'fossem extrações reais.')

h2('4.4 Geração de documentos e arquivo')
p('A geração de PDFs utiliza pdf-lib no navegador. O documento do cliente segue formato mais limpo, sem fotografias; o '
  'documento interno preserva evidências completas. O arquivo histórico permite consultar relatórios arquivados, documentos '
  'gerados e status de envio simulado. A preservação de versões e a trilha de auditoria permitem identificar quem criou, '
  'editou, revisou, aprovou e gerou documentos.')

h2('4.5 Portal do Motorista')
p('O Portal do Motorista foi implementado como PWA mobile-first, com navegação inferior, badge online/offline e fila de '
  'sincronização. O motorista visualiza seus caminhões, equipamentos instalados e checklist do dia/turno. O checklist é '
  'gerado automaticamente a partir do vínculo motorista-caminhão e dos equipamentos instalados. Itens podem ser marcados '
  'como OK, atenção ou falha. Falhas abrem ocorrências automaticamente, com categoria, severidade sugerida, texto padrão '
  'e notificação interna simulada. A triagem é realizada por coordenação/revisão em rota administrativa.')
p('A Figura 5 apresenta o Portal do Motorista e seus limites de automação.')
fig('figuras/fig5_motorista.png', 'Portal do Motorista: automação limitada e triagem humana')
p('O portal também permite ocorrência manual com foto, ciência de treinamentos por confirmação digitada e histórico com '
  'status e resposta. Não há biometria, reconhecimento facial, GPS contínuo ou score de fadiga. A fila offline acumula '
  'registros pendentes e os marca como sincronizados quando há conexão, em simulação rotulada. O Quadro 3 resume as '
  'automações permitidas e proibidas.')

tab('Automações do Portal do Motorista',
    ['Automação', 'Status', 'Regra preservada'],
    [
        ['Gerar checklist por caminhão/equipamentos', 'Implementada', 'Não inventa equipamento; usa cadastro'],
        ['Preencher data/turno/cliente', 'Implementada', 'Motorista confirma antes de enviar'],
        ['Salvar rascunho local', 'Implementada', 'Original preservado e auditado'],
        ['Falha abrir ocorrência', 'Implementada', 'Ocorrência nasce aberta, não resolvida'],
        ['Notificar coordenação', 'Simulada', 'Nenhum envio real'],
        ['Sincronizar fila offline', 'Simulada', 'Produção exige API idempotente'],
        ['Aprovar relatório ou liberar PDF', 'Proibida', 'Decisão humana obrigatória'],
        ['GPS contínuo/biometria/fadiga', 'Proibida', 'Minimização e não invasividade'],
    ], kind='Quadro')

h2('4.6 Segurança, RBAC e conformidade demonstrativa')
p('O artefato implementa perfis administrador, revisão, colaborador e motorista. O colaborador acessa seus relatórios; o '
  'motorista acessa apenas seu portal e caminhões vinculados; a triagem de ocorrências é restrita a administrador/revisão. '
  'Uploads são validados por tipo, assinatura mágica e tamanho. Dados originais não são sobrescritos silenciosamente. '
  'A Figura 6 apresenta as camadas de segurança e conformidade.')
fig('figuras/fig6_seguranca.png', 'Camadas de segurança e conformidade do artefato')
p('A página de conformidade separa medidas implementadas, simulações e pendências de produção. Essa separação é um resultado '
  'importante do trabalho, pois impede que o protótipo seja interpretado como sistema pronto para operação crítica. '
  'A conformidade LGPD depende de bases legais, governança, contratos, retenção, encarregado, resposta a incidentes e '
  'validação jurídica, não apenas de controles técnicos.')

h2('4.7 Dados demonstrativos e proveniência')
p('A base de demonstração combina exemplos sintéticos e referências reais marcadas. Foram utilizadas 14 imagens sintéticas '
  'de campo, distribuídas em relatórios e galeria demonstrativa, sem commit de imagens reais da empresa. Os dados incluem '
  'clientes, caminhões, equipamentos, códigos, IMEIs, atividades e status. A proveniência é registrada para que o leitor '
  'distinga o que veio de referência operacional e o que foi criado para demonstração.')

h2('4.8 Testes, build e métricas técnicas')
p('A suíte de testes finalizou com 80 testes aprovados em 10 arquivos, cobrindo regras de negócio, padronização, OCR, PDF, '
  'fotos demonstrativas e Portal do Motorista. O build de produção foi verificado com TypeScript e Vite. A Tabela 1 apresenta '
  'as principais métricas observadas.')

tab('Métricas técnicas do artefato',
    ['Indicador', 'Resultado'],
    [
        ['Testes automatizados', '80 aprovados / 10 arquivos'],
        ['Smoke tests', 'Renderização jsdom das telas principais e portal'],
        ['Build de produção', 'TypeScript + Vite concluído'],
        ['Imagens demonstrativas', '14 JPEGs sintéticos, aproximadamente 3,35 MB'],
        ['PDFs', 'Cliente sem fotos; interno completo; consolidado semanal'],
        ['OCR', 'Tesseract.js local com fallback simulado rotulado'],
        ['PWA', 'Manifest, ícones e service worker em build de produção'],
    ])

p('As métricas de build indicam oportunidade de otimização futura, especialmente por code splitting de bibliotecas pesadas '
  'como Recharts, Tesseract e pdf-lib. Essa limitação é registrada porque um TCC profissional deve reconhecer trade-offs '
  'de desempenho, e não apenas apresentar funcionalidades.')

h2('4.9 Estimativa de custos de evolução')
p('A estimativa de custos considera premissas explícitas: operação inicial em servidor virtual simples, armazenamento de '
  'objetos para fotos, banco gerenciado ou auto-hospedado, backup e domínio. Os valores são apresentados em reais com '
  'base em câmbio e preços públicos de referência, sujeitos a variação. A Tabela 2 apresenta uma faixa estimada para MVP.')

tab('Estimativa mensal de infraestrutura para MVP (premissas em BRL)',
    ['Item', 'Premissa', 'Faixa mensal estimada'],
    [
        ['Servidor de aplicação', 'VPS 2–4 vCPU, câmbio de referência', 'R$ 30–80'],
        ['Banco de dados', 'Gerenciado pequeno ou auto-hospedado', 'R$ 0–150'],
        ['Storage de fotos', 'Objetos + backup, volume inicial baixo', 'R$ 5–40'],
        ['Domínio e DNS', '.com.br ou equivalente', 'R$ 3–10'],
        ['E-mail transacional', 'Baixo volume, envio real futuro', 'R$ 0–50'],
        ['Observabilidade/backup', 'Logs, métricas e cópias', 'R$ 10–60'],
    ], source='Elaborado pelo autor (2026), com premissas documentadas em docs/07-custos.md.')

p('Esses valores não incluem horas de desenvolvimento, auditoria de segurança, validação jurídica, treinamento de usuários '
  'ou licenças comerciais. O objetivo da tabela é apoiar planejamento acadêmico e de MVP, não constituir orçamento '
  'comercial definitivo.')


h2('4.10 Síntese de requisitos, riscos e rastreabilidade')
p('O Quadro 4 sintetiza requisitos funcionais implementados no protótipo. O Quadro 5 apresenta requisitos não funcionais '
  'e o tratamento dado a cada um. O Quadro 6 registra riscos técnicos e organizacionais, com mitigação proposta. Essa '
  'rastreabilidade é importante para que a banca e a empresa identifiquem o que foi entregue, o que foi simulado e o que '
  'depende de produção.')

tab('Requisitos funcionais implementados',
    ['Código', 'Requisito', 'Situação'],
    [
        ['RF01', 'Criar relatório com código, token e prazo', 'Implementado'],
        ['RF02', 'Preencher relatório por link individual', 'Implementado'],
        ['RF03', 'Padronizar texto preservando original', 'Implementado'],
        ['RF04', 'Executar OCR local e confirmar leitura', 'Implementado'],
        ['RF05', 'Bloquear aprovação com OCR pendente', 'Implementado'],
        ['RF06', 'Gerar PDF cliente e interno', 'Implementado'],
        ['RF07', 'Gerar consolidado semanal com aprovados', 'Implementado'],
        ['RF08', 'Checklist automático do motorista', 'Implementado'],
        ['RF09', 'Ocorrência automática por falha', 'Implementado'],
        ['RF10', 'Triagem humana de ocorrências', 'Implementado'],
        ['RF11', 'Envio real ao cliente', 'Simulado/rotulado'],
        ['RF12', 'Sincronização servidor real', 'Pendente de backend'],
    ], kind='Quadro')

tab('Requisitos não funcionais e tratamento no protótipo',
    ['Requisito', 'Tratamento', 'Limite'],
    [
        ['Privacidade', 'OCR e PDF locais; sem envio real', 'Produção exige backend e storage seguros'],
        ['Auditabilidade', 'Histórico por evento com autor/data', 'Produção exige log append-only'],
        ['Disponibilidade offline', 'PWA + fila local simulada', 'Sync real pendente'],
        ['Acessibilidade', 'Contraste, foco, rótulos, reduced-motion', 'Auditoria completa futura'],
        ['Desempenho', 'Build verificado; assets locais', 'Code splitting futuro'],
        ['Segurança', 'RBAC, validação de upload, simulações rotuladas', 'OIDC/MFA e autorização server-side futuros'],
    ], kind='Quadro')

tab('Riscos e mitigações',
    ['Risco', 'Impacto', 'Mitigação'],
    [
        ['OCR com baixa acurácia', 'Dados incorretos', 'Confiança, multi-pass e confirmação humana'],
        ['Perda de dados locais', 'Perda de rascunhos', 'Backend, backup e sync idempotente futuros'],
        ['Uso indevido de dados pessoais', 'Risco legal e trabalhista', 'Minimização, RBAC, governança e RIPD'],
        ['Resistência de usuários', 'Baixa adoção', 'Treinamento, UX simples e piloto assistido'],
        ['Bundle grande', 'Carregamento lento', 'Lazy loading e code splitting'],
        ['Presunção de conformidade', 'Falsa segurança jurídica', 'Validação jurídica e documentação de limites'],
    ], kind='Quadro')

# ─────────────────────────────────────────────
h1('5 DISCUSSÃO')
h2('5.1 Aderência aos objetivos')
p('Os objetivos específicos foram atendidos em nível de protótipo. O diagnóstico foi documentado; alternativas técnicas '
  'foram comparadas; o fluxo de relatório foi implementado com preservação do original; a revisão humana bloqueia '
  'liberação indevida; o Portal do Motorista foi entregue como PWA; controles demonstrativos de segurança e proveniência '
  'foram aplicados; e a avaliação técnica foi registrada. O objetivo geral foi alcançado na medida em que o artefato '
  'demonstra um fluxo integrado, auditável e instalável, ainda que dependa de backend para operação real.')

h2('5.2 Limitações')
p('As principais limitações são: ausência de backend e autenticação real; persistência local sujeita a perda ou manipulação '
  'pelo usuário; OCR com acurácia limitada em imagens adversas; ausência de estudo longitudinal com usuários; ausência de '
  'auditoria de segurança independente; e conformidade LGPD não certificada. O service worker e a fila offline são '
  'demonstrativos, não uma sincronização distribuída completa. Essas limitações não invalidam o artefato, mas delimitam '
  'sua validade como protótipo acadêmico.')

h2('5.3 Riscos e ameaças à validade')
p('Riscos técnicos incluem desempenho do bundle, conflitos de sincronização, qualidade de imagens e evolução de dependências. '
  'Riscos organizacionais incluem resistência de usuários, necessidade de treinamento e governança de dados. Riscos legais '
  ' incluem uso indevido de dados de trabalhadores, retenção excessiva e presunção incorreta de obrigações regulatórias. '
  'Ameaças à validade incluem o uso de dados mistos, a avaliação centrada em testes técnicos e a ausência de métricas '
  'de produtividade em produção. O trabalho mitiga essas ameaças por rotulagem, documentação e separação explícita entre '
  'implementado, simulado e pendente.')

h2('5.4 Trabalhos futuros')
p('Como evolução, recomenda-se: backend com API autenticada e autorização server-side; OIDC/MFA; banco relacional com '
  'trilha append-only; storage de fotos com antivírus, EXIF strip e URLs assinadas; sincronização idempotente com retry; '
  'push consentido; ordem de serviço de manutenção integrada às ocorrências; code splitting e lazy loading; testes E2E '
  'em CI; auditoria de segurança; RIPD e política de retenção; e estudo de usabilidade com motoristas, revisores e '
  'coordenadores. Também se recomenda avaliar PaddleOCR ou modelos locais mais robustos para etiquetas difíceis, '
  'mantendo confirmação humana.')


h2('5.5 Recomendações para implantação')
p('Recomenda-se implantar o artefato em ondas. A primeira onda deve validar o fluxo documental com um grupo reduzido de '
  'colaboradores e revisores, medindo tempo de elaboração, taxa de correção e pendências de OCR. A segunda onda deve '
  'introduzir o Portal do Motorista em um subconjunto da frota, com treinamento e suporte. A terceira onda deve integrar '
  'backend, autenticação, storage e sincronização real. Em todas as ondas, a revisão humana deve permanecer obrigatória '
  'e as simulações devem ser substituídas por integrações reais apenas quando houver contrato, base legal e auditoria.')
p('Do ponto de vista de governança, recomenda-se nomear encarregado de dados, documentar bases legais, definir retenção, '
  'registrar operações de tratamento, avaliar RIPD e estabelecer plano de resposta a incidentes. Do ponto de vista técnico, '
  'recomenda-se CI com testes, lint, auditoria de dependências, backups testados e monitoramento. Do ponto de vista '
  'acadêmico, recomenda-se estudo quase-experimental antes/depois para medir impacto real do sistema.')

# ─────────────────────────────────────────────
h1('6 CONCLUSÃO')
p('Este trabalho apresentou o desenvolvimento e a avaliação de um protótipo funcional de sistema web progressivo para '
  'gestão e padronização de relatórios de campo, aplicado ao contexto da SAFIP Inteligência em Mineração. A contribuição '
  'principal está em demonstrar, de forma integrada, como OCR local, padronização assistida, revisão humana obrigatória, '
  'auditoria, geração de PDFs e Portal do Motorista podem compor um fluxo documental mais rastreável e seguro.')
p('A pesquisa mostrou que automação não precisa significar perda de controle. Ao automatizar captura, sugestão, roteamento '
  'e sincronização, mas preservar aprovação, triagem e envio como decisões humanas, o artefato reduz retrabalho sem '
  'eliminar responsabilidade. A avaliação técnica, com 80 testes aprovados, build verificado e documentação de conformidade, '
  'oferece evidências de viabilidade, embora não substitua validação em produção.')
p('Conclui-se que o SAFIP FieldOps constitui uma base acadêmica e técnica consistente para evolução do processo '
  'documental da empresa. Para produção, serão necessários backend autenticado, governança de dados, validação jurídica, '
  'auditoria de segurança e estudos com usuários. Como trabalho futuro, recomenda-se medir impacto real em tempo de '
  'elaboração, taxa de correção, satisfação dos usuários e redução de pendências documentais.')

# ─────────────────────────────────────────────
h1('REFERÊNCIAS')
REFERENCIAS = [    'ABELSON, Harold; SUSSMAN, Gerald Jay. **Structure and interpretation of computer programs**. 2. ed. Cambridge: MIT Press, 1996.',
    'AMERSHI, Saleema et al. Guidelines for human-AI interaction. In: CONFERENCE ON HUMAN FACTORS IN COMPUTING SYSTEMS, 2019, Glasgow. **Proceedings [...]**. New York: ACM, 2019. p. 1–13.',
    'ANPD. **Resolução CD/ANPD nº 15**, de 24 de abril de 2024. Aprova o Regulamento de Comunicação de Incidente de Segurança. Brasília, DF: ANPD, 2024. Disponível em: https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd. Acesso em: 3 nov. 2026.',
    'ANPD. **Resolução CD/ANPD nº 2**, de 27 de janeiro de 2022. Aprova o Regulamento de aplicação da Lei nº 13.709/2018 para agentes de tratamento de pequeno porte. Brasília, DF: ANPD, 2022. Disponível em: https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd. Acesso em: 3 nov. 2026.',
    'ASSOCIAÇÃO BRASILEIRA DE NORMAS TÉCNICAS. **NBR 10520: informação e documentação: citações em documentos: apresentação**. Rio de Janeiro: ABNT, 2023.',
    'ASSOCIAÇÃO BRASILEIRA DE NORMAS TÉCNICAS. **NBR 14724: informação e documentação: trabalhos acadêmicos: apresentação**. Rio de Janeiro: ABNT, 2024.',
    'ASSOCIAÇÃO BRASILEIRA DE NORMAS TÉCNICAS. **NBR 6023: informação e documentação: referências: elaboração**. Rio de Janeiro: ABNT, 2025.',
    'ASSOCIAÇÃO BRASILEIRA DE NORMAS TÉCNICAS. **NBR 6024: informação e documentação: numeração progressiva das seções de um documento: apresentação**. Rio de Janeiro: ABNT, 2012.',
    'ASSOCIAÇÃO BRASILEIRA DE NORMAS TÉCNICAS. **NBR 6027: informação e documentação: sumário: apresentação**. Rio de Janeiro: ABNT, 2012.',
    'ASSOCIAÇÃO BRASILEIRA DE NORMAS TÉCNICAS. **NBR 6028: informação e documentação: resumo, resenha e recensão: apresentação**. Rio de Janeiro: ABNT, 2021.',
    'BRASIL. **Decreto nº 12.975**, de 20 de maio de 2026. Altera o Decreto nº 8.771/2016, que regulamenta a Lei nº 12.965/2014. Brasília, DF: Presidência da República, 2026a. Disponível em: https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/decreto/d12975.htm. Acesso em: 3 nov. 2026.',
    'BRASIL. **Lei nº 13.709**, de 14 de agosto de 2018. Lei Geral de Proteção de Dados Pessoais (LGPD). Brasília, DF: Presidência da República, 2018. Disponível em: https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm. Acesso em: 3 nov. 2026.',
    'BRASIL. **Lei nº 15.352**, de 25 de fevereiro de 2026. Altera a Lei nº 13.709/2018 e a estrutura da autoridade nacional de proteção de dados. Brasília, DF: Presidência da República, 2026b. Disponível em: https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/lei/l15352.htm. Acesso em: 3 nov. 2026.',
    'DRESCH, Aline; LACERDA, Daniel Pacheco; ANTUNES JÚNIOR, José Antônio Valle. **Design science research: método de pesquisa para avanço da ciência e tecnologia**. Porto Alegre: Bookman, 2015.',
    'DU, Yuning et al. **PP-OCR: a practical ultra lightweight OCR system**. arXiv preprint arXiv:2009.09941, 2020.',
    'GIL, Antonio Carlos. **Como elaborar projetos de pesquisa**. 6. ed. São Paulo: Atlas, 2017.',
    'HEVNER, Alan R. et al. Design science in information systems research. **MIS Quarterly**, v. 28, n. 1, p. 75–105, 2004.',
    'MDN WEB DOCS. **Progressive web apps**. Mozilla, 2026. Disponível em: https://developer.mozilla.org/pt-BR/docs/Web/Progressive_web_apps. Acesso em: 3 nov. 2026.',
    'NIELSEN, Jakob. **Usability engineering**. San Francisco: Morgan Kaufmann, 1993.',
    'OWASP. **Application Security Verification Standard 5.0**. Open Worldwide Application Security Project, 2025. Disponível em: https://owasp.org/www-project-application-security-verification-standard/. Acesso em: 3 nov. 2026.',
    'OWASP. **OWASP Top 10:2021**. Open Worldwide Application Security Project, 2021. Disponível em: https://owasp.org/Top10/. Acesso em: 3 nov. 2026.',
    'PEFFERS, Ken et al. A design science research methodology for information systems research. **Journal of Management Information Systems**, v. 24, n. 3, p. 45–77, 2007.',
    'PRESSMAN, Roger S.; MAXIM, Bruce R. **Engenharia de software: uma abordagem profissional**. 9. ed. Porto Alegre: AMGH, 2020.',
    'SMITH, Ray. An overview of the Tesseract OCR engine. In: INTERNATIONAL CONFERENCE ON DOCUMENT ANALYSIS AND RECOGNITION, 2007, Curitiba. **Proceedings [...]**. IEEE, 2007. p. 629–633.',
    'SOMMERVILLE, Ian. **Engenharia de software**. 10. ed. São Paulo: Pearson, 2016.',
    'W3C. **Web Content Accessibility Guidelines (WCAG) 2.2**. W3C Recommendation, 5 out. 2023. Disponível em: https://www.w3.org/TR/WCAG22/. Acesso em: 3 nov. 2026.',

]

h1('APÊNDICE A – ROTEIRO DE DEMONSTRAÇÃO DO PROTÓTIPO')
p('Este apêndice apresenta um roteiro sugerido para demonstração do artefato em banca ou avaliação prática.')
bullets([
    'Acessar /login e escolher o perfil administrador para visualizar dashboard, prazos e indicadores.',
    'Abrir Operações de campo e verificar consistência de equipamentos, telemetria, Pulsus e câmera.',
    'Criar novo relatório e gerar link individual com prazo de 48 horas.',
    'Preencher relatório como colaborador, registrar atividades por equipamento e texto livre.',
    'Aplicar padronização e comparar original versus sugestão; aceitar, editar ou rejeitar.',
    'Anexar foto demonstrativa e executar OCR local; confirmar, corrigir ou rejeitar leitura.',
    'Enviar para revisão e tentar aprovar com OCR pendente para demonstrar bloqueio.',
    'Aprovar como revisora e gerar PDF cliente sem fotos e PDF interno completo.',
    'Registrar envio simulado e consultar arquivo histórico.',
    'Acessar Portal do Motorista, executar checklist, marcar falha e verificar ocorrência automática.',
    'Como coordenação, triar ocorrência, resolver com resposta e verificar histórico do motorista.',
    'Registrar ciência de treinamento e simular fila offline/online.',
])

h1('APÊNDICE B – CHECKLIST DE CONFORMIDADE ABNT DO DOCUMENTO')
p('Este checklist resume os principais pontos de normalização aplicados ao documento. A instituição pode possuir manual '
  'próprio; em caso de diverência, o manual institucional deve prevalecer.')
bullets([
    'Estrutura em seções, não em capítulos, conforme NBR 14724:2024.',
    'Elementos pré-textuais: capa, folha de rosto, ficha catalográfica, folha de aprovação, dedicatória, agradecimentos, epígrafe, resumo, abstract, listas e sumário.',
    'Resumo em parágrafo único, com objetivo, método, resultados e conclusão; palavras-chave separadas por ponto e vírgula.',
    'Margens A4: superior e esquerda 3 cm; inferior e direita 2 cm.',
    'Fonte 12 no corpo; fonte 10 em citações longas, legendas, fontes e notas.',
    'Espaçamento 1,5 no corpo; simples em citações longas, referências, legendas e natureza do trabalho.',
    'Recuo de primeira linha de 1,25 cm no corpo; citação longa com recuo de 4 cm.',
    'Numeração progressiva até seção quinária, sem ponto após o indicativo.',
    'Paginação contada a partir da folha de rosto e exibida a partir da introdução, no canto superior direito.',
    'Sumário como último elemento pré-textual, sem incluir elementos pré-textuais.',
    'Referências em ordem alfabética, espaçamento simples e separadas por linha em branco.',
    'Citações no sistema autor-data conforme NBR 10520:2023, com maiúsculas e minúsculas dentro dos parênteses.',
])

h1('APÊNDICE C – ESTRUTURA DO REPOSITÓRIO E REPRODUTIBILIDADE')
p('O repositório do artefato está organizado para permitir reprodução dos testes e do build. Os comandos principais são:')
bullets([
    'npm install — instala dependências.',
    'npm run setup:ocr — prepara assets locais do Tesseract.',
    'npm run dev — inicia servidor de desenvolvimento.',
    'npm test — executa a suíte Vitest.',
    'npm run build — gera build de produção.',
    'npm run test:e2e — executa Playwright, quando houver navegador disponível.',
])
p('A documentação técnica encontra-se em docs/, incluindo diagnóstico, design system, arquitetura, segurança, IA/OCR, '
  'legal, custos, plano, referências da empresa e Portal do Motorista. O TCC encontra-se em tcc/, com figuras, conteúdo '
  'e scripts de geração do documento.')


h1('APÊNDICE D – DECLARAÇÃO DE USO DE FERRAMENTAS DE APOIO')
p('Este trabalho utilizou ferramentas computacionais de apoio à prototipagem, organização de código, geração de figuras, '
  'verificação de testes e estruturação documental. O uso dessas ferramentas não substitui a responsabilidade do autor '
  'sobre o conteúdo, a análise crítica, a validação dos resultados e a observância das políticas de integridade '
  'acadêmica da instituição. Todas as decisões de projeto, regras de negócio, limitações e conclusões foram revisadas '
  'humanamente. Dados reais da empresa não foram expostos publicamente; imagens demonstrativas são sintéticas e '
  'rotuladas. Recomenda-se que o autor e o orientador validem esta declaração conforme as normas institucionais.')

h1('APÊNDICE E – CRONOGRAMA DE EVOLUÇÃO PARA PRODUÇÃO')
p('O cronograma abaixo é uma proposta de evolução do protótipo para um MVP operável, sujeita à disponibilidade da equipe '
  'e à validação da empresa.')
bullets([
    'Mês 1: backend mínimo, autenticação, autorização server-side e banco de dados.',
    'Mês 2: storage seguro de fotos, sync idempotente, logs e backup.',
    'Mês 3: piloto com colaboradores/revisores, métricas de tempo e correção.',
    'Mês 4: piloto do Portal do Motorista, treinamento e ajuste de UX.',
    'Mês 5: governança LGPD, RIPD quando cabível, política de retenção e incidentes.',
    'Mês 6: auditoria de segurança, code splitting, testes E2E e expansão controlada.',
])
