"""
TCC em formato de artigo científico (ABNT NBR 6022), versão simplificada.

Gera PDF (ReportLab) e DOCX (python-docx) a partir do mesmo conteúdo, usando
capturas reais do sistema auditado. Substitui a monografia de 45 páginas, que
permanece arquivada em tcc/arquivo-45-paginas/.

Uso:  python3 tcc/gerar_artigo.py
"""
from __future__ import annotations

import re
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    BaseDocTemplate, Frame, Image, KeepTogether, PageTemplate, Paragraph, Spacer, Table, TableStyle,
)

HERE = Path(__file__).resolve().parent
FIGS = HERE / 'figuras_artigo'
OUT_PDF = HERE / 'TCC_Rajamine_FieldOps.pdf'
OUT_DOCX = HERE / 'TCC_Rajamine_FieldOps.docx'

INK = colors.HexColor('#000000')
RULE = colors.HexColor('#808080')

# ─────────────────────────── Identificação ───────────────────────────
TITULO = 'PADRONIZAÇÃO DE RELATÓRIOS DE CAMPO COM OCR LOCAL E REVISÃO HUMANA OBRIGATÓRIA'
SUBTITULO = 'desenvolvimento e auditoria de uma aplicação web progressiva'
AUTOR = '[NOME COMPLETO DO AUTOR]'
FILIACAO = ('Trabalho de Conclusão de Curso apresentado ao [NOME DO CURSO] da [NOME DA INSTITUIÇÃO]. '
            'Orientador: [NOME DO ORIENTADOR]. E-mail: [e-mail do autor].')
CIDADE_ANO = '[CIDADE] – 2026'

RESUMO = (
    'Relatórios de campo produzidos por equipes distribuídas apresentam redação heterogênea, códigos de '
    'equipamento transcritos manualmente e pouca rastreabilidade de aprovação, concentrando retrabalho na '
    'revisão. Este trabalho descreve o desenvolvimento e a auditoria de uma aplicação web progressiva que '
    'padroniza esses relatórios sem transferir ao software a autoridade de decisão. Adotou-se Design Science '
    'Research em estudo de caso único, com base sintética por exigência ética. O artefato implementa link '
    'individual de preenchimento com prazo de 48 horas, sugestão de padronização que preserva o texto original, '
    'reconhecimento óptico de caracteres no navegador, revisão humana obrigatória antes da geração de documentos '
    'e portal do motorista sem conexão. A verificação combinou 99 testes automatizados, 49 capturas em navegador '
    'real e 16 verificações funcionais; seis defeitos foram corrigidos, dois bloqueantes no celular. Conclui-se '
    'que a automação assistida reduz variabilidade sem suprimir a decisão humana, e que a auditoria visual '
    'instrumentada revela defeitos que testes de unidade não alcançam.'
)
PALAVRAS_CHAVE = 'relatórios de campo; reconhecimento óptico de caracteres; revisão humana; aplicação web progressiva; Design Science Research.'

ABSTRACT = (
    'Field reports written by distributed teams show heterogeneous wording, manually transcribed equipment codes '
    'and weak approval traceability, concentrating rework at the review stage. This paper describes the development '
    'and audit of a progressive web application that standardises such reports without transferring decision '
    'authority to the software. Design Science Research was applied in a single case study with a synthetic dataset. '
    'The artefact provides an individual filling link with a 48-hour deadline, a standardisation suggestion that '
    'preserves the original text, in-browser optical character recognition, mandatory human review before document '
    'generation, and an offline driver portal. Verification combined 99 automated tests, 49 real-browser screenshots '
    'and 16 functional checks; six defects were fixed, two blocking on mobile. Assisted automation reduced '
    'variability without suppressing human decision.'
)
KEYWORDS = 'field reports; optical character recognition; human review; progressive web application; Design Science Research.'

# ─────────────────────────── Conteúdo textual ───────────────────────────
# Cada item: ('h1'|'h2'|'p'|'fig'|'tab', ...). Legendas e fontes em fonte 10.
BODY: list[tuple] = []


def h1(t): BODY.append(('h1', t))
def h2(t): BODY.append(('h2', t))
def p(t): BODY.append(('p', t))
def fig(path, caption, width_cm): BODY.append(('fig', path, caption, width_cm))
def tab(caption, headers, rows): BODY.append(('tab', caption, headers, rows))


h1('1 INTRODUÇÃO')
p('Equipes de instalação e manutenção em mineração registram suas atividades em campo, frequentemente em '
  'deslocamento e com conectividade intermitente. Quando cada técnico redige o relato à sua maneira, a '
  'coordenação recebe documentos de qualidade desigual: objetivos ausentes, códigos de equipamento grafados '
  'de forma inconsistente e períodos sem data. O custo desse desalinhamento aparece concentrado na revisão, '
  'que precisa reescrever e conferir antes de liberar qualquer documento ao cliente.')
p('Duas soluções extremas são insuficientes. Formulários rígidos eliminam a variação, mas descartam o '
  'contexto que só o texto livre captura. Automatizar a redação e a aprovação, por outro lado, transfere ao '
  'software uma decisão que tem efeito contratual e que, no tratamento de dados pessoais, exige '
  'responsabilização identificável (Brasil, 2018). A questão que orienta este trabalho é, portanto: como '
  'reduzir a variabilidade dos relatórios de campo preservando a autoridade humana sobre o que é aprovado?')
p('O objetivo geral é desenvolver e auditar uma aplicação web progressiva que padronize relatórios de campo '
  'com automação assistida e revisão humana obrigatória. Como objetivos específicos: (i) implementar coleta '
  'móvel com prazo controlado e funcionamento sem conexão; (ii) oferecer sugestão de padronização e leitura '
  'de códigos por OCR que nunca substituam o registro original; (iii) bloquear a geração de documentos '
  'destinados ao cliente antes de aprovação registrada; e (iv) submeter o artefato a uma auditoria '
  'instrumentada de interface e de funções.')
p('A justificativa é dupla. Tecnicamente, o problema é recorrente em operações distribuídas e admite '
  'solução com tecnologia web madura. Juridicamente, a Lei nº 13.709/2018 impõe minimização e finalidade '
  'no tratamento de dados de colaboradores, o que favorece processamento local das imagens e registro '
  'auditável de cada decisão (Brasil, 2018).')

h1('2 FUNDAMENTAÇÃO')
p('Aplicações web progressivas combinam instalação no dispositivo, cache controlado por service worker e '
  'fila de sincronização, permitindo que o registro sobreviva à perda de rede (MDN Web Docs, 2026). Esse '
  'modelo é adequado ao campo, onde a conectividade é a variável menos confiável do ambiente.')
p('O reconhecimento óptico de caracteres converte a imagem de uma etiqueta em texto candidato. Smith (2007) '
  'descreve a arquitetura do Tesseract e mostra que a acurácia depende de contraste, fonte e ruído — '
  'condições raras em fotos de equipamento instalado. A consequência de projeto é tratar o resultado como '
  'hipótese a confirmar, não como dado.')
p('Esse princípio é formalizado nas diretrizes de interação humano-automação de Amershi et al. (2019), que '
  'recomendam tornar claro o que o sistema pode fazer, permitir correção eficiente e preservar o controle do '
  'usuário. Em termos de usabilidade, trata-se de reduzir a carga de edição sem retirar a decisão '
  '(Nielsen, 1993).')
p('Do ponto de vista legal, a LGPD estabelece minimização, finalidade e segurança, além de exigir '
  'responsabilização do agente de tratamento (Brasil, 2018). Processar imagens no navegador reduz a '
  'superfície de exposição, e a trilha de auditoria com autor, data e hora atende ao dever de demonstração.')
p('O método segue a Design Science Research, que produz e avalia artefatos destinados a problemas reais '
  '(Hevner et al., 2004), operacionalizada pelas seis atividades de Peffers et al. (2007) e pelas orientações '
  'de Dresch, Lacerda e Antunes Júnior (2015).')

h1('3 METODOLOGIA')
p('A pesquisa é aplicada, de abordagem qualitativa e natureza tecnológica, conduzida como estudo de caso '
  'único em uma empresa de inteligência em mineração. Percorreu-se o ciclo de DSR em cinco etapas: '
  'identificação do problema, definição dos objetivos da solução, projeto e desenvolvimento, demonstração '
  'e avaliação. A avaliação foi formativa e repetida: cada rodada de auditoria gerou correções que '
  'alimentaram a rodada seguinte.')
p('Por exigência ética, nenhum dado pessoal ou operacional real foi utilizado. A base é sintética e '
  'realista: quatro clientes fictícios, treze equipamentos, cinco perfis de acesso e vinte e um relatórios '
  'em diferentes estágios. Todas as ações com efeito externo — envio ao cliente, notificação e '
  'sincronização — são simuladas e rotuladas como tal na própria interface e na trilha de auditoria.')
p('O artefato foi construído em React 19 com TypeScript, Vite e Tailwind CSS 4; o estado é persistido '
  'localmente com Zustand, as imagens são lidas por Tesseract compilado em WebAssembly e os documentos '
  'são gerados no cliente com pdf-lib. Não há servidor de aplicação, o que mantém o protótipo '
  'autocontido e distribuível em mídia removível.')
p('A verificação usou três instrumentos complementares. Primeiro, 99 testes automatizados em 13 arquivos '
  '(Vitest), cobrindo regras de negócio, guards por perfil, padronização, OCR e o guia de introdução. '
  'Segundo, uma auditoria visual em Chromium real, com 49 capturas em quatro resoluções (1440×900, '
  '1280×720, 768×1024 e 390×844), nos temas claro e escuro e em localidade pt-BR, com verificação '
  'programática de estouro horizontal, colisão entre elementos do cabeçalho, texto truncado, alvo de '
  'toque e alinhamento do destaque do guia. '
  'Terceiro, 16 verificações funcionais de ponta a ponta executadas no navegador, incluindo persistência '
  'da exibição única do guia e o fluxo completo do checklist do motorista. A apresentação deste artigo segue '
  'a NBR 6022 (ABNT, 2018), com citações no sistema autor-data conforme a NBR 10520 (ABNT, 2023) e referências '
  'elaboradas segundo a NBR 6023 (ABNT, 2025).')

h1('4 RESULTADOS E DISCUSSÃO')

h2('4.1 Fluxo com autoridade humana preservada')
p('O relatório percorre cinco estados — pendente, rascunho, em revisão, aprovado e arquivado — com '
  'transições restritas por perfil. A coordenação gera um link individual com prazo de 48 horas; o '
  'técnico preenche sem necessidade de conta; a sugestão de padronização é apresentada lado a lado com o '
  'original, que é sempre preservado no histórico de versões. A geração do PDF destinado ao cliente é '
  'bloqueada enquanto não houver aprovação registrada com autor, data e hora, e a leitura de OCR pendente '
  'de confirmação também impede a aprovação. Nenhuma dessas regras depende da boa vontade do operador: '
  'são verificadas na camada de estado e cobertas por testes.')

h2('4.2 Guia de introdução com exibição única')
p('A adoção de um sistema com cinco perfis exige orientação inicial, mas tours repetidos são abandonados. '
  'Implementou-se um guia que abre automaticamente uma única vez por perfil, com persistência local, e '
  'permanece reabrível pelo ícone de ajuda. O percurso é segmentado: oito passos para a coordenação, seis '
  'para o motorista e três para o colaborador, que não acessa revisão nem operações. O destaque é medido '
  'por laço de animação, que aguarda o alvo existir, congela as animações de entrada da página e só '
  'reposiciona o cartão quando o retângulo varia mais que meio pixel — evitando o deslocamento do '
  'destaque observado em implementações que medem uma única vez. O percurso é operável por teclado, com '
  'foco contido no diálogo e devolvido ao elemento de origem ao fechar, conforme os critérios de '
  'acessibilidade de teclado e foco das WCAG 2.2 (W3C, 2023).')
fig('fig1_guia.png', 'Figura 1 – Guia de introdução com destaque ancorado nos indicadores do painel', 14.5)
p('A Figura 1 mostra o segundo passo do guia. A medição em navegador real confirmou que o anel de '
  'destaque coincide com o alvo com folga exata de cinco pixels em cada lado. Ao encerrar, o guia '
  'devolve o usuário à página em que estava, em vez de abandoná-lo na última página visitada.')

h2('4.3 Padronização e leitura de códigos com confirmação')
p('A sugestão de padronização reescreve o relato sem acrescentar acontecimentos e é aceita, editada ou '
  'rejeitada item a item. O OCR é executado localmente em múltiplas passagens, e cada código reconhecido '
  'exige confirmação, correção ou rejeição antes de ser associado ao relatório; leituras que coincidem '
  'com equipamento de outro caminhão são sinalizadas como conflito. A Figura 2 apresenta o detalhe do '
  'relatório, com o resumo do fluxo à direita explicitando quais etapas permanecem pendentes.')
fig('fig2_relatorio.png', 'Figura 2 – Detalhe do relatório com resumo do fluxo e etapas pendentes', 14.5)

h2('4.4 Portal do motorista e operação sem conexão')
p('O portal do motorista gera o checklist do turno a partir dos equipamentos instalados no caminhão, '
  'com deduplicação por motorista, caminhão, data e turno. O envio é bloqueado enquanto houver item não '
  'verificado. Um item marcado como falha abre ocorrência automaticamente no momento do envio e coloca o '
  'checklist em análise, notificando a coordenação. Sem conexão, os registros aguardam no dispositivo e o '
  'contador indica a fila pendente. O mesmo portal registra a ciência de treinamentos, confirmada pela '
  'digitação do nome completo do motorista, com data e hora — mecanismo que produz evidência de '
  'ciência sem depender de assinatura em papel. A Figura 3 mostra a tela em resolução de celular, com '
  'os itens já verificados e o envio liberado.')
fig('fig3_checklist.png', 'Figura 3 – Checklist do turno em tela de 390 px, itens verificados e envio liberado', 7.6)

h2('4.5 Auditoria instrumentada e defeitos corrigidos')
p('A auditoria foi tratada como parte do método, e não como conferência final. Os critérios e resultados '
  'estão na Tabela 1; os defeitos identificados, na Tabela 2.')
tab('Tabela 1 – Critérios de verificação e resultados obtidos',
    ['Instrumento', 'Escopo', 'Resultado'],
    [
        ['Testes automatizados', '13 arquivos: regras, guards, padronização, OCR, guia, componentes', '99 aprovados'],
        ['Auditoria visual', '49 capturas; quatro resoluções; claro e escuro; pt-BR', '0 estouros, 0 colisões'],
        ['Precisão do destaque', 'Retângulo do alvo versus anel, em navegador real', 'folga de 5 px por lado'],
        ['Verificações funcionais', 'Exibição única do guia, checklist, falha e ocorrência', '16 aprovadas'],
        ['Verificação de tipos', 'TypeScript em modo estrito, sem supressões', 'sem erros'],
    ])
tab('Tabela 2 – Defeitos identificados pela auditoria e correções aplicadas',
    ['Defeito observado', 'Causa', 'Correção'],
    [
        ['Confirmar inacessível no celular', 'Transform da animação cria contexto de empilhamento e prende o diálogo sob a barra fixa', 'Diálogo renderizado na raiz do documento'],
        ['Elemento oculto visível em 390 px', 'Classes concatenadas sem resolver conflito de display', 'Fusão de classes com resolução de conflito'],
        ['Alvo de toque de 19 px no login', 'Link auxiliar com área clicável insuficiente', 'Área ampliada para 32 px, sem alterar o alinhamento'],
        ['Estouro de 82 px no arquivo', 'Grade de filtros com colunas fixas', 'Filtros com quebra de linha'],
        ['Guia encerrava em página estranha', 'Rota de origem lida do objeto global', 'Rota do roteador e retorno'],
        ['Barra de envio cobria itens', 'Elemento fixo sobre a lista incompleta', 'Flutua só quando acionável'],
    ])
p('Dois achados merecem destaque. O primeiro é que nenhum dos seis defeitos era detectável pelos testes '
  'de unidade então existentes: todos dependiam de layout, de ordem de regras CSS ou de contexto de '
  'empilhamento. O segundo é que o próprio instrumento de auditoria produziu um resultado falso antes de '
  'ser corrigido — a configuração de processo único do navegador fazia todos os contextos compartilharem '
  'o armazenamento local, de modo que as capturas atribuídas ao motorista mostravam, na verdade, o perfil '
  'administrador. O achado reforça a necessidade de validar o instrumento antes de confiar em sua saída.')

h2('4.6 Limitações')
p('Os resultados são de um protótipo avaliado formativamente. Não houve teste com usuários finais, de '
  'modo que as escolhas de interface se apoiam em diretrizes e em inspeção, não em evidência empírica de '
  'usabilidade. A acurácia do OCR não foi medida em corpus de campo, apenas em imagens de demonstração. '
  'Não há servidor, autenticação real nem envio efetivo de documentos: todas as integrações são simuladas. '
  'A base sintética garante conformidade ética, mas impede afirmar ganho de produtividade em operação real.')

h1('5 CONSIDERAÇÕES FINAIS')
p('O artefato atendeu aos objetivos específicos: coleta móvel com prazo e funcionamento sem conexão, '
  'sugestões que preservam o original, bloqueio de documentos antes de aprovação registrada e auditoria '
  'instrumentada de interface e funções. A resposta à questão inicial é que a variabilidade pode ser '
  'reduzida deslocando a automação para a posição de sugestão, e reservando ao software o papel de '
  'guardião das regras — não de autor da decisão.')
p('Como contribuição de método, a auditoria visual com verificação programática mostrou-se capaz de '
  'revelar defeitos bloqueantes invisíveis à suíte de testes, o que sugere sua incorporação como etapa '
  'formal de avaliação em pesquisas de DSR que produzem interfaces. Como trabalhos futuros: medição de '
  'acurácia do OCR em corpus real de etiquetas, estudo de usabilidade com técnicos e motoristas, '
  'substituição das simulações por backend autenticado e avaliação do efeito sobre o tempo de revisão.')

REFERENCIAS = [
    'AMERSHI, Saleema et al. Guidelines for human-AI interaction. In: CONFERENCE ON HUMAN FACTORS IN COMPUTING SYSTEMS, 2019, Glasgow. **Proceedings [...]**. New York: ACM, 2019. p. 1–13.',
    'ASSOCIAÇÃO BRASILEIRA DE NORMAS TÉCNICAS. **NBR 6022: informação e documentação: artigo em publicação periódica técnica e/ou científica: apresentação**. Rio de Janeiro: ABNT, 2018.',
    'ASSOCIAÇÃO BRASILEIRA DE NORMAS TÉCNICAS. **NBR 6023: informação e documentação: referências: elaboração**. Rio de Janeiro: ABNT, 2025.',
    'ASSOCIAÇÃO BRASILEIRA DE NORMAS TÉCNICAS. **NBR 10520: informação e documentação: citações em documentos: apresentação**. Rio de Janeiro: ABNT, 2023.',
    'BRASIL. **Lei nº 13.709, de 14 de agosto de 2018**. Lei Geral de Proteção de Dados Pessoais (LGPD). Brasília, DF: Presidência da República, 2018. Disponível em: https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm. Acesso em: 4 nov. 2026.',
    'DRESCH, Aline; LACERDA, Daniel Pacheco; ANTUNES JÚNIOR, José Antônio Valle. **Design science research: método de pesquisa para avanço da ciência e tecnologia**. Porto Alegre: Bookman, 2015.',
    'HEVNER, Alan R. et al. Design science in information systems research. **MIS Quarterly**, v. 28, n. 1, p. 75–105, 2004.',
    'MDN WEB DOCS. **Progressive web apps**. Mozilla, 2026. Disponível em: https://developer.mozilla.org/pt-BR/docs/Web/Progressive_web_apps. Acesso em: 4 nov. 2026.',
    'NIELSEN, Jakob. **Usability engineering**. San Francisco: Morgan Kaufmann, 1993.',
    'PEFFERS, Ken et al. A design science research methodology for information systems research. **Journal of Management Information Systems**, v. 24, n. 3, p. 45–77, 2007.',
    'SMITH, Ray. An overview of the Tesseract OCR engine. In: INTERNATIONAL CONFERENCE ON DOCUMENT ANALYSIS AND RECOGNITION, 2007, Curitiba. **Proceedings [...]**. IEEE, 2007. p. 629–633.',
    'W3C. **Web Content Accessibility Guidelines (WCAG) 2.2**. W3C Recommendation, 5 out. 2023. Disponível em: https://www.w3.org/TR/WCAG22/. Acesso em: 4 nov. 2026.',
]

FONTE_FIG = 'Fonte: captura do artefato em navegador real, base sintética (2026).'
FONTE_TAB = 'Fonte: elaborado pelo autor (2026).'

# ─────────────────────────── PDF ───────────────────────────
W, H = A4
ML, MT, MR, MB = 3 * cm, 3 * cm, 2 * cm, 2 * cm
CW = W - ML - MR  # 16 cm


def esc(t: str) -> str:
    return t.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def rich(t: str) -> str:
    """Converte **negrito** em markup do ReportLab."""
    return re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', esc(t))


S = {}
S['titulo'] = ParagraphStyle('titulo', fontName='Times-Bold', fontSize=12, leading=15,
                             alignment=TA_CENTER, textColor=INK, spaceAfter=6)
S['subtitulo'] = ParagraphStyle('subtitulo', fontName='Times-Roman', fontSize=12, leading=15,
                                alignment=TA_CENTER, textColor=INK, spaceAfter=14)
S['autor'] = ParagraphStyle('autor', fontName='Times-Roman', fontSize=12, leading=15,
                            alignment=TA_CENTER, textColor=INK, spaceAfter=4)
S['filiacao'] = ParagraphStyle('filiacao', fontName='Times-Roman', fontSize=10, leading=12,
                               alignment=TA_JUSTIFY, textColor=INK, spaceAfter=14)
S['body'] = ParagraphStyle('body', fontName='Times-Roman', fontSize=12, leading=18,
                           alignment=TA_JUSTIFY, firstLineIndent=1.25 * cm, textColor=INK)
S['flat'] = ParagraphStyle('flat', parent=S['body'], firstLineIndent=0)
S['h1'] = ParagraphStyle('h1', fontName='Times-Bold', fontSize=12, leading=18,
                         alignment=TA_LEFT, textColor=INK, spaceBefore=12, spaceAfter=6)
S['h2'] = ParagraphStyle('h2', fontName='Times-Bold', fontSize=12, leading=18,
                         alignment=TA_LEFT, textColor=INK, spaceBefore=10, spaceAfter=4)
S['label'] = ParagraphStyle('label', fontName='Times-Bold', fontSize=12, leading=18,
                            alignment=TA_LEFT, textColor=INK, spaceBefore=10, spaceAfter=4)
S['caption'] = ParagraphStyle('caption', fontName='Times-Roman', fontSize=10, leading=12,
                              alignment=TA_CENTER, textColor=INK, spaceAfter=4)
S['caption_keep'] = ParagraphStyle('caption_keep', parent=S['caption'], keepWithNext=1)
S['source'] = ParagraphStyle('source', fontName='Times-Roman', fontSize=10, leading=12,
                             alignment=TA_CENTER, textColor=INK, spaceBefore=4, spaceAfter=10)
S['ref'] = ParagraphStyle('ref', fontName='Times-Roman', fontSize=12, leading=14,
                          alignment=TA_LEFT, textColor=INK, spaceAfter=8)
S['cell'] = ParagraphStyle('cell', fontName='Times-Roman', fontSize=10, leading=12,
                           alignment=TA_LEFT, textColor=INK)
S['cellb'] = ParagraphStyle('cellb', parent=S['cell'], fontName='Times-Bold')


def _numbered(canvas, doc):
    canvas.saveState()
    canvas.setFont('Times-Roman', 10)
    canvas.setFillColor(INK)
    canvas.drawRightString(W - MR, H - MT + 0.7 * cm, str(doc.page))
    canvas.restoreState()


def pdf_fig(path, caption, width_cm):
    from PIL import Image as PILImage
    fp = FIGS / path
    iw, ih = PILImage.open(fp).size
    w = width_cm * cm
    h = w * ih / iw
    return KeepTogether([
        Paragraph(esc(caption), S['caption']),
        Image(str(fp), width=w, height=h),
        Paragraph(esc(FONTE_FIG), S['source']),
    ])


def pdf_tab(caption, headers, rows):
    data = [[Paragraph(esc(h), S['cellb']) for h in headers]]
    for r in rows:
        data.append([Paragraph(esc(c), S['cell']) for c in r])
    ncol = len(headers)
    widths = [CW * 0.28, CW * 0.44, CW * 0.28] if ncol == 3 else [CW / ncol] * ncol
    t = Table(data, colWidths=widths, repeatRows=1, hAlign='CENTER')
    t.setStyle(TableStyle([
        ('LINEABOVE', (0, 0), (-1, 0), 0.8, INK),
        ('LINEBELOW', (0, 0), (-1, 0), 0.5, INK),
        ('LINEBELOW', (0, -1), (-1, -1), 0.8, INK),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    return [
        Paragraph(esc(caption), S['caption_keep']),
        t,
        Paragraph(esc(FONTE_TAB), S['source']),
    ]


def build_pdf():
    doc = BaseDocTemplate(str(OUT_PDF), pagesize=A4,
                          leftMargin=ML, rightMargin=MR, topMargin=MT, bottomMargin=MB,
                          title=TITULO, author=AUTOR, subject='TCC – artigo científico')
    frame = Frame(ML, MB, CW, H - MT - MB, id='main',
                  leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    doc.addPageTemplates([PageTemplate(id='all', frames=[frame], onPage=_numbered)])

    story = [
        Paragraph(esc(TITULO), S['titulo']),
        Paragraph(esc(SUBTITULO), S['subtitulo']),
        Paragraph(esc(AUTOR), S['autor']),
        Paragraph(esc(FILIACAO), S['filiacao']),
        Paragraph('RESUMO', S['label']),
        Paragraph(esc(RESUMO), S['flat']),
        Spacer(1, 6),
        Paragraph('<b>Palavras-chave:</b> ' + esc(PALAVRAS_CHAVE), S['flat']),
        Paragraph('ABSTRACT', S['label']),
        Paragraph(esc(ABSTRACT), S['flat']),
        Spacer(1, 6),
        Paragraph('<b>Keywords:</b> ' + esc(KEYWORDS), S['flat']),
    ]
    for item in BODY:
        kind = item[0]
        if kind == 'h1':
            story.append(Paragraph(esc(item[1]), S['h1']))
        elif kind == 'h2':
            story.append(Paragraph(esc(item[1]), S['h2']))
        elif kind == 'p':
            story.append(Paragraph(rich(item[1]), S['body']))
        elif kind == 'fig':
            story.append(pdf_fig(item[1], item[2], item[3]))
        elif kind == 'tab':
            story.extend(pdf_tab(item[1], item[2], item[3]))
    story.append(Paragraph('REFERÊNCIAS', S['h1']))
    for r in REFERENCIAS:
        story.append(Paragraph(rich(r), S['ref']))
    doc.build(story)
    print('PDF:', OUT_PDF.name)


# ─────────────────────────── DOCX ───────────────────────────
def build_docx():
    from docx import Document
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    from docx.oxml.ns import qn
    from docx.shared import Cm, Pt

    d = Document()
    sec = d.sections[0]
    sec.page_width, sec.page_height = Cm(21), Cm(29.7)
    sec.left_margin, sec.top_margin = Cm(3), Cm(3)
    sec.right_margin, sec.bottom_margin = Cm(2), Cm(2)

    normal = d.styles['Normal']
    normal.font.name = 'Times New Roman'
    normal.font.size = Pt(12)
    normal.element.rPr.rFonts.set(qn('w:eastAsia'), 'Times New Roman')
    pf = normal.paragraph_format
    pf.line_spacing = 1.5
    pf.space_before = Pt(0)
    pf.space_after = Pt(0)
    pf.first_line_indent = Cm(1.25)
    pf.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY

    # numeração de página no canto superior direito
    hdr = sec.header.paragraphs[0]
    hdr.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    run = hdr.add_run()
    fld = run._r.makeelement(qn('w:fldSimple'), {qn('w:instr'): 'PAGE'})
    run._r.addnext(fld)
    hdr.style = d.styles['Header']
    for r in hdr.runs:
        r.font.name = 'Times New Roman'
        r.font.size = Pt(10)

    def para(text, *, bold=False, align=None, size=12, indent=True, spacing=1.5, after=0, before=0):
        p_ = d.add_paragraph()
        p_.paragraph_format.alignment = align if align is not None else WD_ALIGN_PARAGRAPH.JUSTIFY
        p_.paragraph_format.first_line_indent = Cm(1.25) if indent else Cm(0)
        p_.paragraph_format.line_spacing = spacing
        p_.paragraph_format.space_after = Pt(after)
        p_.paragraph_format.space_before = Pt(before)
        # **negrito** inline
        for i, chunk in enumerate(re.split(r'\*\*(.+?)\*\*', text)):
            if not chunk:
                continue
            r = p_.add_run(chunk)
            r.bold = bold or (i % 2 == 1)
            r.font.size = Pt(size)
            r.font.name = 'Times New Roman'
        return p_

    para(TITULO, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, indent=False, spacing=1.0, after=6)
    para(SUBTITULO, align=WD_ALIGN_PARAGRAPH.CENTER, indent=False, spacing=1.0, after=12)
    para(AUTOR, align=WD_ALIGN_PARAGRAPH.CENTER, indent=False, spacing=1.0, after=4)
    para(FILIACAO, size=10, indent=False, spacing=1.0, after=12)
    para('RESUMO', bold=True, align=WD_ALIGN_PARAGRAPH.LEFT, indent=False, spacing=1.0, after=4)
    para(RESUMO, indent=False, spacing=1.0)
    para('**Palavras-chave:** ' + PALAVRAS_CHAVE, indent=False, spacing=1.0, before=6)
    para('ABSTRACT', bold=True, align=WD_ALIGN_PARAGRAPH.LEFT, indent=False, spacing=1.0, before=10, after=4)
    para(ABSTRACT, indent=False, spacing=1.0)
    para('**Keywords:** ' + KEYWORDS, indent=False, spacing=1.0, before=6)

    from PIL import Image as PILImage
    for item in BODY:
        kind = item[0]
        if kind == 'h1':
            para(item[1], bold=True, align=WD_ALIGN_PARAGRAPH.LEFT, indent=False, before=12, after=6)
        elif kind == 'h2':
            para(item[1], bold=True, align=WD_ALIGN_PARAGRAPH.LEFT, indent=False, before=10, after=4)
        elif kind == 'p':
            para(item[1])
        elif kind == 'fig':
            path, caption, width_cm = item[1], item[2], item[3]
            para(caption, size=10, align=WD_ALIGN_PARAGRAPH.CENTER, indent=False, spacing=1.0, after=4)
            ip = d.add_paragraph()
            ip.alignment = WD_ALIGN_PARAGRAPH.CENTER
            ip.paragraph_format.first_line_indent = Cm(0)
            ip.add_run().add_picture(str(FIGS / path), width=Cm(width_cm))
            para(FONTE_FIG, size=10, align=WD_ALIGN_PARAGRAPH.CENTER, indent=False, spacing=1.0, before=4, after=10)
        elif kind == 'tab':
            caption, headers, rows = item[1], item[2], item[3]
            para(caption, size=10, align=WD_ALIGN_PARAGRAPH.CENTER, indent=False, spacing=1.0, after=4)
            t = d.add_table(rows=1, cols=len(headers))
            t.alignment = WD_ALIGN_PARAGRAPH.CENTER
            for i, h in enumerate(headers):
                c = t.rows[0].cells[i]
                c.text = ''
                r = c.paragraphs[0].add_run(h)
                r.bold = True
                r.font.size = Pt(10)
                r.font.name = 'Times New Roman'
                c.paragraphs[0].paragraph_format.first_line_indent = Cm(0)
                c.paragraphs[0].paragraph_format.line_spacing = 1.0
            for row in rows:
                cells = t.add_row().cells
                for i, val in enumerate(row):
                    cells[i].text = ''
                    r = cells[i].paragraphs[0].add_run(val)
                    r.font.size = Pt(10)
                    r.font.name = 'Times New Roman'
                    cells[i].paragraphs[0].paragraph_format.first_line_indent = Cm(0)
                    cells[i].paragraphs[0].paragraph_format.line_spacing = 1.0
            para(FONTE_TAB, size=10, align=WD_ALIGN_PARAGRAPH.CENTER, indent=False, spacing=1.0, before=4, after=10)

    para('REFERÊNCIAS', bold=True, align=WD_ALIGN_PARAGRAPH.LEFT, indent=False, before=12, after=6)
    for r in REFERENCIAS:
        para(r, align=WD_ALIGN_PARAGRAPH.LEFT, indent=False, spacing=1.0, after=8)

    d.save(str(OUT_DOCX))
    print('DOCX:', OUT_DOCX.name)


if __name__ == '__main__':
    build_pdf()
    build_docx()
    import pymupdf
    with pymupdf.open(str(OUT_PDF)) as pdf:
        print('Páginas do PDF:', pdf.page_count)
        words = sum(len(pg.get_text().split()) for pg in pdf)
        print('Palavras:', words)
