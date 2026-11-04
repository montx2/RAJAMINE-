#!/usr/bin/env python3
"""TCC em formato ABNT — texto enxuto, estrutura completa e muitas figuras.

Gera PDF e DOCX a partir desta única fonte.

Estrutura (NBR 14724): capa, folha de rosto, sumário, parte textual,
referências. Numeração de páginas aparece só a partir da primeira página
textual, no canto superior direito (NBR 14724, 5.2).

O sumário é resolvido em duas passadas: a primeira coleta a página real de
cada título; a segunda imprime os números. Como o número de linhas do
sumário não muda entre as passadas, a paginação permanece estável.

Figuras: capturas reais do sistema, em tcc/figuras_tcc/ (2× para impressão).
Rode antes:  node .audit/capturas_tcc.mjs && python3 .audit/prepara_figuras.py
Depois:      python3 tcc/gerar_tcc_visual.py
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
    BaseDocTemplate, Frame, Image, KeepTogether, PageBreak, PageTemplate,
    Paragraph, Spacer, Table, TableStyle,
)

HERE = Path(__file__).resolve().parent
FIGS = HERE / 'figuras_tcc'
OUT_PDF = HERE / 'TCC_SAFIP_FieldOps_ABNT.pdf'
OUT_DOCX = HERE / 'TCC_SAFIP_FieldOps_ABNT.docx'

TITULO = 'PADRONIZAÇÃO E RASTREABILIDADE DE RELATÓRIOS DE CAMPO'
SUBTITULO = 'Uma aplicação web com leitura de códigos no dispositivo e revisão humana obrigatória'
AUTOR = '[NOME COMPLETO DO AUTOR]'
ORIENTADOR = '[NOME DO ORIENTADOR]'
INSTITUICAO = '[NOME DA INSTITUIÇÃO]'
CURSO = '[NOME DO CURSO]'
CIDADE = 'Belo Horizonte'
ANO = '2026'
NATUREZA = ('Trabalho de Conclusão de Curso apresentado ao curso de '
            f'{CURSO} da {INSTITUICAO}, como requisito parcial para obtenção do título de [GRAU].')
FONTE_FIG = 'Fonte: Captura de tela do sistema, elaborada pelos autores (2026).'
FONTE_TAB = 'Fonte: Elaborada pelos autores (2026).'

W, H = A4
ML, MR, MT, MB = 3 * cm, 2 * cm, 3 * cm, 2 * cm
CW = W - ML - MR
CH = H - MT - MB
INK = colors.HexColor('#111111')

# ───────────────────────── estilos ─────────────────────────
S = {}
S['capa_inst'] = ParagraphStyle('capa_inst', fontName='Times-Bold', fontSize=12, leading=16,
                                alignment=TA_CENTER, textColor=INK)
S['capa_autor'] = ParagraphStyle('capa_autor', fontName='Times-Roman', fontSize=12, leading=16,
                                 alignment=TA_CENTER, textColor=INK)
S['capa_tit'] = ParagraphStyle('capa_tit', fontName='Times-Bold', fontSize=14, leading=19,
                               alignment=TA_CENTER, textColor=INK)
S['capa_sub'] = ParagraphStyle('capa_sub', fontName='Times-Roman', fontSize=12, leading=16,
                               alignment=TA_CENTER, textColor=INK)
S['capa_local'] = ParagraphStyle('capa_local', fontName='Times-Roman', fontSize=12, leading=16,
                                 alignment=TA_CENTER, textColor=INK)
S['natureza'] = ParagraphStyle('natureza', fontName='Times-Roman', fontSize=11, leading=15,
                               alignment=TA_JUSTIFY, textColor=INK, leftIndent=8 * cm)
S['body'] = ParagraphStyle('body', fontName='Times-Roman', fontSize=12, leading=18,
                           alignment=TA_JUSTIFY, firstLineIndent=1.25 * cm, textColor=INK,
                           spaceAfter=0)
S['h1'] = ParagraphStyle('h1', fontName='Times-Bold', fontSize=12, leading=18,
                         alignment=TA_LEFT, textColor=INK, spaceBefore=14, spaceAfter=8,
                         keepWithNext=1)
S['h2'] = ParagraphStyle('h2', fontName='Times-Bold', fontSize=12, leading=18,
                         alignment=TA_LEFT, textColor=INK, spaceBefore=12, spaceAfter=6,
                         keepWithNext=1)
S['bodyk'] = ParagraphStyle('bodyk', parent=S['body'], keepWithNext=1)
S['sum_tit'] = ParagraphStyle('sum_tit', fontName='Times-Bold', fontSize=12, leading=18,
                              alignment=TA_CENTER, textColor=INK, spaceAfter=14)
S['sum1'] = ParagraphStyle('sum1', fontName='Times-Bold', fontSize=12, leading=17,
                           alignment=TA_LEFT, textColor=INK)
S['sum2'] = ParagraphStyle('sum2', fontName='Times-Roman', fontSize=12, leading=17,
                           alignment=TA_LEFT, textColor=INK, leftIndent=0.8 * cm)
S['sum_pg'] = ParagraphStyle('sum_pg', fontName='Times-Roman', fontSize=12, leading=17,
                             alignment=TA_RIGHT, textColor=INK)
S['caption'] = ParagraphStyle('caption', fontName='Times-Roman', fontSize=10, leading=12,
                              alignment=TA_CENTER, textColor=INK, spaceAfter=4, keepWithNext=1)
S['source'] = ParagraphStyle('source', fontName='Times-Roman', fontSize=10, leading=12,
                             alignment=TA_CENTER, textColor=INK, spaceBefore=3, spaceAfter=7)
S['ref'] = ParagraphStyle('ref', fontName='Times-Roman', fontSize=12, leading=14,
                          alignment=TA_LEFT, textColor=INK, spaceAfter=8)
S['cell'] = ParagraphStyle('cell', fontName='Times-Roman', fontSize=10, leading=12,
                           alignment=TA_LEFT, textColor=INK)
S['cellb'] = ParagraphStyle('cellb', parent=S['cell'], fontName='Times-Bold')


def esc(t):
    return t.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def rich(t):
    return re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', esc(t))


# ───────────────────────── conteúdo ─────────────────────────
# Texto deliberadamente curto: o argumento é carregado pelas figuras.
INTRO = (
    'Relatórios técnicos de campo são produzidos por equipes distribuídas e chegam à coordenação '
    'com redação heterogênea, códigos de equipamento transcritos manualmente e pouca rastreabilidade '
    'de aprovação. O custo desse desencontro se concentra na revisão, que reescreve e confere antes '
    'de liberar qualquer documento ao cliente.')
OBJ = (
    'Padronizar o ciclo do relatório de campo — preenchimento, revisão, aprovação e arquivamento — '
    'sem transferir a decisão técnica para o software. A automação prepara o documento; a '
    'responsabilidade permanece com uma pessoa identificável.')
METODO = (
    'Construiu-se um protótipo funcional em React e TypeScript, com processamento no próprio '
    'navegador e base inteiramente sintética. A leitura de códigos usa Tesseract em WebAssembly, '
    'sem envio de imagens a servidores. A verificação combinou **99 testes automatizados**, '
    '**49 capturas em navegador real** e **16 checagens funcionais** de ponta a ponta.')
CONCLUSAO = (
    'O protótipo mostrou que é possível reduzir o retrabalho da revisão sem automatizar a decisão: '
    'a sugestão de texto e a leitura de códigos aceleram a preparação, enquanto a liberação ao '
    'cliente continua condicionada à aprovação humana registrada. Como limites, registram-se a '
    'ausência de servidor autenticado, a simulação de envios e notificações e a não medição da '
    'acurácia do OCR em corpus de campo.')

# (nível, número, título, texto, figura, largura_cm)
SECOES = [
    (1, '1', 'INTRODUÇÃO', INTRO, None, None),
    (1, '2', 'OBJETIVO', OBJ, None, None),
    (1, '3', 'METODOLOGIA', METODO, None, None),
    (1, '4', 'A SOLUÇÃO EM TELAS',
     'As figuras a seguir são capturas do protótipo em execução, com dados sintéticos.', None, None),
    (2, '4.1', 'Acesso ao sistema',
     'Coluna única, com autenticação por e-mail corporativo. Os perfis de demonstração ficam '
     'recolhidos, fora do caminho de quem apenas entra.', '01-acesso', 7.2),
    (2, '4.2', 'Painel de indicadores',
     'Situação da carteira, prazos e pendências em uma tela. Cada cartão abre a lista correspondente.',
     '02-painel', 13),
    (2, '4.3', 'Emissão do link individual',
     'A coordenação gera um link com prazo de 48 horas. O colaborador preenche sem criar conta.',
     '04-novo-link', 10.8),
    (2, '4.4', 'Carteira de relatórios',
     'Busca por código, cliente, colaborador ou equipamento, com filtros por situação.',
     '03-relatorios', 10.3),
    (2, '4.5', 'Padronização do texto',
     'O texto original e a sugestão aparecem lado a lado, com cada transformação justificada. '
     'A conversão para terceira pessoa é sugerida, nunca imposta, e o original é preservado.',
     '06-padronizacao', 14),
    (2, '4.6', 'Leitura de códigos por OCR',
     'A imagem é analisada no navegador. Cada leitura traz confiança e candidatos, e exige '
     'confirmar, corrigir ou rejeitar — a associação ao equipamento só ocorre após a confirmação.',
     '07-ocr', 14.5),
    (2, '4.7', 'Conferência antes da aprovação',
     'A aprovação fica bloqueada enquanto houver leitura pendente ou inconsistência de dados.',
     '08-revisao-checklist', 13.5),
    (2, '4.8', 'Central de revisão',
     'Fila de trabalho da revisora, ordenada por prazo.', '11-central-revisao', 12),
    (2, '4.9', 'Histórico e rastreabilidade',
     'Toda transição registra autor, data e hora.', '09-historico', 11.8),
    (2, '4.10', 'Geração dos dois documentos',
     'Após a aprovação, o sistema gera a versão do cliente, sem fotografias internas, e a versão '
     'interna completa. As versões arquivadas guardam número, data e autor.',
     '10-documentos-pdf', 14),
    (2, '4.11', 'Arquivo de documentos',
     'Acervo pesquisável dos documentos liberados, com controle de envio ao cliente.',
     '17-arquivo', 10.3),
    (2, '4.12', 'Operações de campo',
     'Registro de instalações, substituições e retiradas por equipamento.', '12-operacoes', 9.2),
    (2, '4.13', 'Consolidado semanal',
     'Fechamento da semana por cliente e equipe.', '13-semanal', 11.5),
    (2, '4.14', 'Equipamentos e identificadores',
     'Cadastro com código, número de série e IMEI, alvo da leitura por OCR.', '14-equipamentos', 10.3),
    (2, '4.15', 'Frota',
     'Caminhões, placa e equipamentos embarcados — base do checklist do motorista.', '15-frota', 11.8),
    (2, '4.16', 'Ocorrências',
     'Fila de tratamento das falhas reportadas em campo.', '16-ocorrencias', 11.8),
    (2, '4.17', 'Cadastros',
     'Clientes, equipe e vínculos de acesso.', '18-cadastros', 10.3),
    (2, '4.18', 'Tema escuro',
     'A interface opera nos dois temas, com contraste verificado em ambos.', '19-painel-escuro', 13),
]

# portal do motorista: pares de telas de celular lado a lado
MOTORISTA_INTRO = ('O portal do motorista funciona no celular e sem conexão. Os registros ficam '
                   'no aparelho e entram na fila de envio quando há rede.')
MOTORISTA_PARES = [
    ('5.1', 'Início e ocorrências',
     'Tela inicial com o turno do dia e a lista de ocorrências do próprio motorista.',
     '21-motorista-inicio', '23-motorista-ocorrencias'),
    ('5.2', 'Histórico e ciência de treinamento',
     'Histórico de turnos e confirmação de treinamento pela digitação do nome, com data e hora.',
     '24-motorista-historico', '25-motorista-treinamento'),
]
CHECKLIST_TXT = ('Os itens são gerados dos equipamentos instalados no caminhão. O envio só é '
                 'liberado com todos os itens verificados.')
FALHA_TXT = ('Uma falha abre ocorrência e avisa a coordenação. O checklist passa a análise; a '
             'aprovação continua sendo humana.')
COLAB_TXT = ('Preenchimento pelo link individual, no celular, sem conta de acesso. O rascunho é '
             'salvo no aparelho.')

VERIFICACAO = [
    ['Testes automatizados', '13 arquivos: regras, perfis, padronização, OCR, guia, componentes', '99 aprovados'],
    ['Auditoria visual', '49 capturas; quatro resoluções; claro e escuro; pt-BR', '0 estouros, 0 colisões'],
    ['Verificações funcionais', 'Guia, checklist completo, envio e falha gerando ocorrência', '16 aprovadas'],
    ['Verificação de tipos', 'TypeScript em modo estrito, sem supressões', 'sem erros'],
]

REFERENCIAS = [
    'ASSOCIAÇÃO BRASILEIRA DE NORMAS TÉCNICAS. **NBR 14724**: informação e documentação: trabalhos acadêmicos: apresentação. Rio de Janeiro: ABNT, 2011.',
    'ASSOCIAÇÃO BRASILEIRA DE NORMAS TÉCNICAS. **NBR 6027**: informação e documentação: sumário: apresentação. Rio de Janeiro: ABNT, 2012.',
    'ASSOCIAÇÃO BRASILEIRA DE NORMAS TÉCNICAS. **NBR 6023**: informação e documentação: referências: elaboração. Rio de Janeiro: ABNT, 2018.',
    'BRASIL. **Lei nº 13.709, de 14 de agosto de 2018**. Lei Geral de Proteção de Dados Pessoais (LGPD). Brasília, DF: Presidência da República, 2018.',
    'BRASIL. **Decreto nº 12.975, de 2026**. Regulamenta a Lei Geral de Proteção de Dados Pessoais. Brasília, DF: Presidência da República, 2026.',
    'OWASP FOUNDATION. **OWASP Top 10 for Large Language Model Applications**. 2025. Disponível em: https://owasp.org. Acesso em: 4 nov. 2026.',
    'OWASP FOUNDATION. **OWASP Application Security Verification Standard (ASVS)**. 2025. Disponível em: https://owasp.org/www-project-application-security-verification-standard/. Acesso em: 4 nov. 2026.',
    'W3C. **Web Content Accessibility Guidelines (WCAG) 2.2**. World Wide Web Consortium, 2023. Disponível em: https://www.w3.org/TR/WCAG22/. Acesso em: 4 nov. 2026.',
    'SMITH, R. An Overview of the Tesseract OCR Engine. In: INTERNATIONAL CONFERENCE ON DOCUMENT ANALYSIS AND RECOGNITION, 9., 2007, Curitiba. **Proceedings**. IEEE, 2007. p. 629–633.',
    'FIELDING, R. **Architectural Styles and the Design of Network-based Software Architectures**. Tese (Doutorado) — University of California, Irvine, 2000.',
]

# ───────────────────────── numeração de figuras ─────────────────────────
_fig_n = 0


def next_fig():
    global _fig_n
    _fig_n += 1
    return _fig_n


def reset_fig():
    global _fig_n
    _fig_n = 0


# ───────────────────────── sumário: títulos na ordem ─────────────────────────
def toc_entries():
    out = [(lvl, num, tit) for lvl, num, tit, *_ in SECOES]
    out.append((1, '5', 'PORTAL DO MOTORISTA'))
    for num, tit, *_ in MOTORISTA_PARES:
        out.append((2, num, tit))
    out.append((2, '5.3', 'Checklist do turno'))
    out.append((2, '5.4', 'Falha e abertura de ocorrência'))
    out.append((1, '6', 'PREENCHIMENTO PELO COLABORADOR'))
    out.append((1, '7', 'VERIFICAÇÃO'))
    out.append((1, '8', 'CONSIDERAÇÕES FINAIS'))
    out.append((1, '', 'REFERÊNCIAS'))
    return out


# ───────────────────────── PDF ─────────────────────────
STATE = {'pages': {}, 'print_pages': {}, 'first_textual': 4}


class Doc(BaseDocTemplate):
    def afterFlowable(self, flowable):
        key = getattr(flowable, '_toc', None)
        if key:
            STATE['pages'][key] = self.page
            if key == '1' and 'first_done' not in STATE:
                STATE['first_textual'] = self.page
                STATE['first_done'] = True


def on_page(canvas, doc):
    if doc.page >= STATE['first_textual']:
        canvas.saveState()
        canvas.setFont('Times-Roman', 10)
        canvas.setFillColor(INK)
        canvas.drawRightString(W - MR, H - MT + 0.7 * cm, str(doc.page))
        canvas.restoreState()


def fig_flow(name, caption, width_cm, wrap=True):
    """wrap=False devolve a lista crua, para entrar num KeepTogether externo.
    Aninhar KeepTogether faz o ReportLab superestimar a altura e quebrar a
    página mesmo quando há espaço."""
    from PIL import Image as PILImage
    fp = FIGS / f'{name}.png'
    iw, ih = PILImage.open(fp).size
    w = width_cm * cm
    h = w * ih / iw
    items = [
        Paragraph(esc(caption), S['caption']),
        Image(str(fp), width=w, height=h),
        Paragraph(esc(FONTE_FIG), S['source']),
    ]
    return KeepTogether(items) if wrap else items


def cap_part(tit, first=True):
    part = tit.split(' e ')[0] if first else tit.split(' e ')[-1]
    return part[0].upper() + part[1:]


def fig_pair_flow(n1, n2, cap1, cap2, width_cm=6.4):
    from PIL import Image as PILImage
    cells = []
    for name, cap in ((n1, cap1), (n2, cap2)):
        fp = FIGS / f'{name}.png'
        iw, ih = PILImage.open(fp).size
        w = width_cm * cm
        h = w * ih / iw
        cells.append([Paragraph(esc(cap), S['caption']),
                      Image(str(fp), width=w, height=h),
                      Paragraph(esc(FONTE_FIG), S['source'])])
    t = Table([[cells[0], cells[1]]], colWidths=[CW / 2, CW / 2], hAlign='CENTER')
    t.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 2),
        ('RIGHTPADDING', (0, 0), (-1, -1), 2),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))
    return t


def head(text, style, key):
    p = Paragraph(esc(text), S[style])
    p._toc = key
    return p


def capa_flow():
    return [
        Paragraph(esc(INSTITUICAO), S['capa_inst']),
        Paragraph(esc(CURSO), S['capa_inst']),
        Spacer(1, 3.2 * cm),
        Paragraph(esc(AUTOR), S['capa_autor']),
        Spacer(1, 4.4 * cm),
        Paragraph(esc(TITULO), S['capa_tit']),
        Spacer(1, 0.5 * cm),
        Paragraph(esc(SUBTITULO), S['capa_sub']),
        Spacer(1, 11.2 * cm),
        Paragraph(esc(CIDADE), S['capa_local']),
        Paragraph(esc(ANO), S['capa_local']),
        PageBreak(),
    ]


def rosto_flow():
    return [
        Paragraph(esc(AUTOR), S['capa_autor']),
        Spacer(1, 4.0 * cm),
        Paragraph(esc(TITULO), S['capa_tit']),
        Spacer(1, 0.5 * cm),
        Paragraph(esc(SUBTITULO), S['capa_sub']),
        Spacer(1, 2.0 * cm),
        Paragraph(esc(NATUREZA), S['natureza']),
        Spacer(1, 0.8 * cm),
        Paragraph(esc(f'Orientador: {ORIENTADOR}'), S['natureza']),
        Spacer(1, 10.6 * cm),
        Paragraph(esc(CIDADE), S['capa_local']),
        Paragraph(esc(ANO), S['capa_local']),
        PageBreak(),
    ]


def sumario_flow():
    rows = []
    for lvl, num, tit in toc_entries():
        label = f'{num} {tit}'.strip() if num else tit
        pg = STATE['print_pages'].get(num or 'REFERÊNCIAS', 0)
        rows.append([
            Paragraph(esc(label), S['sum1'] if lvl == 1 else S['sum2']),
            Paragraph(str(pg) if pg else '—', S['sum_pg']),
        ])
    t = Table(rows, colWidths=[CW - 1.4 * cm, 1.4 * cm], hAlign='CENTER')
    t.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 1),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 1),
    ]))
    return [Paragraph('SUMÁRIO', S['sum_tit']), t, PageBreak()]


def body_flow():
    reset_fig()
    f = []
    for lvl, num, tit, txt, figure, wcm in SECOES:
        hd = head(f'{num} {tit}', 'h1' if lvl == 1 else 'h2', num)
        if not figure:
            f.append(hd)
            if txt:
                f.append(Paragraph(rich(txt), S['body']))
            continue
        # corrente keepWithNext: título e texto acompanham a figura, mas duas
        # figuras ainda podem dividir a página quando couberem
        group = [hd]
        if txt:
            group.append(Paragraph(rich(txt), S['body']))
        group.append(Spacer(1, 6))
        group.extend(fig_flow(figure, f'Figura {next_fig()} – {tit}', wcm, wrap=False))
        f.append(KeepTogether(group))

    f.append(head('5 PORTAL DO MOTORISTA', 'h1', '5'))
    f.append(Paragraph(rich(MOTORISTA_INTRO), S['body']))
    for num, tit, txt, a, b in MOTORISTA_PARES:
        n1, n2 = next_fig(), next_fig()
        f.append(KeepTogether([
            head(f'{num} {tit}', 'h2', num),
            Paragraph(rich(txt), S['body']),
            Spacer(1, 8),
            fig_pair_flow(a, b, f'Figura {n1} – {cap_part(tit)}',
                          f'Figura {n2} – {cap_part(tit, False)}'),
        ]))

    f.append(KeepTogether([
        head('5.3 Checklist do turno', 'h2', '5.3'),
        Paragraph(rich(CHECKLIST_TXT), S['body']),
        Spacer(1, 8),
        *fig_flow('22-motorista-checklist', f'Figura {next_fig()} – Checklist do turno', 6.2, wrap=False),
    ]))

    f.append(KeepTogether([
        head('5.4 Falha e abertura de ocorrência', 'h2', '5.4'),
        Paragraph(rich(FALHA_TXT), S['body']),
        Spacer(1, 8),
        *fig_flow('27-motorista-falha', f'Figura {next_fig()} – Falha registrada no turno', 7.0, wrap=False),
    ]))

    f.append(KeepTogether([
        head('6 PREENCHIMENTO PELO COLABORADOR', 'h1', '6'),
        Paragraph(rich(COLAB_TXT), S['body']),
        Spacer(1, 8),
        *fig_flow('26-preenchimento-celular', f'Figura {next_fig()} – Preenchimento pelo link individual', 7.0, wrap=False),
    ]))

    f.append(PageBreak())
    f.append(head('7 VERIFICAÇÃO', 'h1', '7'))
    data = [[Paragraph(esc(h), S['cellb']) for h in ['Instrumento', 'Escopo', 'Resultado']]]
    for r in VERIFICACAO:
        data.append([Paragraph(esc(c), S['cell']) for c in r])
    f.append(Paragraph('Tabela 1 – Instrumentos de verificação aplicados ao protótipo', S['caption']))
    t = Table(data, colWidths=[CW * 0.26, CW * 0.50, CW * 0.24], repeatRows=1, hAlign='CENTER')
    t.setStyle(TableStyle([
        ('LINEABOVE', (0, 0), (-1, 0), 0.8, INK),
        ('LINEBELOW', (0, 0), (-1, 0), 0.5, INK),
        ('LINEBELOW', (0, -1), (-1, -1), 0.8, INK),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    f.append(t)
    f.append(Paragraph(esc(FONTE_TAB), S['source']))

    f.append(head('8 CONSIDERAÇÕES FINAIS', 'h1', '8'))
    f.append(Paragraph(rich(CONCLUSAO), S['body']))

    f.append(PageBreak())
    f.append(head('REFERÊNCIAS', 'h1', 'REFERÊNCIAS'))
    for r in REFERENCIAS:
        f.append(Paragraph(rich(r), S['ref']))
    return f


def build_pdf():
    for attempt in (1, 2):
        # a 2ª passada imprime os números coletados na 1ª; como o sumário tem
        # o mesmo número de linhas nas duas, a paginação não se altera
        STATE['print_pages'] = dict(STATE['pages'])
        STATE['pages'] = {}
        STATE.pop('first_done', None)
        doc = Doc(str(OUT_PDF), pagesize=A4, leftMargin=ML, rightMargin=MR,
                  topMargin=MT, bottomMargin=MB, title=TITULO, author=AUTOR,
                  subject='Trabalho de Conclusão de Curso', creator='SAFIP FieldOps')
        frame = Frame(ML, MB, CW, CH, id='n', leftPadding=0, rightPadding=0,
                      topPadding=0, bottomPadding=0)
        doc.addPageTemplates([PageTemplate(id='all', frames=[frame], onPage=on_page)])
        doc.build(capa_flow() + rosto_flow() + sumario_flow() + body_flow())
    return STATE['print_pages']


# ───────────────────────── DOCX ─────────────────────────
def build_docx(pages):
    from docx import Document
    from docx.enum.section import WD_SECTION
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    from docx.shared import Cm, Pt
    from PIL import Image as PILImage

    d = Document()
    sec = d.sections[0]
    sec.page_width, sec.page_height = Cm(21), Cm(29.7)
    sec.left_margin, sec.right_margin = Cm(3), Cm(2)
    sec.top_margin, sec.bottom_margin = Cm(3), Cm(2)

    normal = d.styles['Normal']
    normal.font.name = 'Times New Roman'
    normal.font.size = Pt(12)
    pf = normal.paragraph_format
    pf.line_spacing = 1.5
    pf.space_after = Pt(0)
    pf.first_line_indent = Cm(1.25)

    def par(text='', bold=False, align=None, indent=True, size=12, space_after=0):
        p = d.add_paragraph()
        p.paragraph_format.first_line_indent = Cm(1.25 if indent else 0)
        p.paragraph_format.space_after = Pt(space_after)
        if align is not None:
            p.alignment = align
        # **negrito** inline
        for i, chunk in enumerate(re.split(r'\*\*(.+?)\*\*', text)):
            if not chunk:
                continue
            r = p.add_run(chunk)
            r.bold = bold or (i % 2 == 1)
            r.font.size = Pt(size)
        return p

    def heading(text, level):
        p = par(text, bold=True, indent=False, align=WD_ALIGN_PARAGRAPH.LEFT)
        p.paragraph_format.space_before = Pt(14 if level == 1 else 12)
        p.paragraph_format.space_after = Pt(8 if level == 1 else 6)
        p.paragraph_format.keep_with_next = True
        return p

    def figure(name, caption, width_cm):
        fp = FIGS / f'{name}.png'
        c = par(caption, indent=False, align=WD_ALIGN_PARAGRAPH.CENTER, size=10)
        c.paragraph_format.keep_with_next = True
        c.paragraph_format.space_after = Pt(4)
        iw, ih = PILImage.open(fp).size
        ip = d.add_paragraph()
        ip.alignment = WD_ALIGN_PARAGRAPH.CENTER
        ip.paragraph_format.first_line_indent = Cm(0)
        ip.add_run().add_picture(str(fp), width=Cm(width_cm), height=Cm(width_cm * ih / iw))
        s = par(FONTE_FIG, indent=False, align=WD_ALIGN_PARAGRAPH.CENTER, size=10)
        s.paragraph_format.space_before = Pt(4)
        s.paragraph_format.space_after = Pt(10)

    def figure_pair(n1, n2, cap1, cap2, width_cm=6.4):
        t = d.add_table(rows=2, cols=2)
        t.autofit = False
        for col, (name, cap) in enumerate(((n1, cap1), (n2, cap2))):
            c = t.cell(0, col).paragraphs[0]
            c.alignment = WD_ALIGN_PARAGRAPH.CENTER
            c.paragraph_format.first_line_indent = Cm(0)
            r = c.add_run(cap); r.font.size = Pt(10)
            fp = FIGS / f'{name}.png'
            iw, ih = PILImage.open(fp).size
            ip = t.cell(1, col).paragraphs[0]
            ip.alignment = WD_ALIGN_PARAGRAPH.CENTER
            ip.paragraph_format.first_line_indent = Cm(0)
            ip.add_run().add_picture(str(fp), width=Cm(width_cm), height=Cm(width_cm * ih / iw))
        s = par(FONTE_FIG, indent=False, align=WD_ALIGN_PARAGRAPH.CENTER, size=10)
        s.paragraph_format.space_before = Pt(4)

    # capa
    par(INSTITUICAO, bold=True, indent=False, align=WD_ALIGN_PARAGRAPH.CENTER)
    par(CURSO, bold=True, indent=False, align=WD_ALIGN_PARAGRAPH.CENTER)
    for _ in range(4):
        par('', indent=False)
    par(AUTOR, indent=False, align=WD_ALIGN_PARAGRAPH.CENTER)
    for _ in range(5):
        par('', indent=False)
    par(TITULO, bold=True, indent=False, align=WD_ALIGN_PARAGRAPH.CENTER, size=14)
    par(SUBTITULO, indent=False, align=WD_ALIGN_PARAGRAPH.CENTER)
    for _ in range(8):
        par('', indent=False)
    par(CIDADE, indent=False, align=WD_ALIGN_PARAGRAPH.CENTER)
    par(ANO, indent=False, align=WD_ALIGN_PARAGRAPH.CENTER)
    d.add_page_break()

    # folha de rosto
    par(AUTOR, indent=False, align=WD_ALIGN_PARAGRAPH.CENTER)
    for _ in range(5):
        par('', indent=False)
    par(TITULO, bold=True, indent=False, align=WD_ALIGN_PARAGRAPH.CENTER, size=14)
    par(SUBTITULO, indent=False, align=WD_ALIGN_PARAGRAPH.CENTER)
    for _ in range(2):
        par('', indent=False)
    np = par(NATUREZA, indent=False, align=WD_ALIGN_PARAGRAPH.JUSTIFY, size=11)
    np.paragraph_format.left_indent = Cm(8)
    op = par(f'Orientador: {ORIENTADOR}', indent=False, size=11)
    op.paragraph_format.left_indent = Cm(8)
    for _ in range(5):
        par('', indent=False)
    par(CIDADE, indent=False, align=WD_ALIGN_PARAGRAPH.CENTER)
    par(ANO, indent=False, align=WD_ALIGN_PARAGRAPH.CENTER)
    d.add_page_break()

    # sumário
    par('SUMÁRIO', bold=True, indent=False, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=14)
    for lvl, num, tit in toc_entries():
        label = f'{num} {tit}'.strip() if num else tit
        pg = pages.get(num or 'REFERÊNCIAS', 0)
        p = d.add_paragraph()
        p.paragraph_format.first_line_indent = Cm(0)
        p.paragraph_format.left_indent = Cm(0 if lvl == 1 else 0.8)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.tab_stops.add_tab_stop(Cm(15.6), WD_ALIGN_PARAGRAPH.RIGHT)
        r = p.add_run(label); r.bold = (lvl == 1)
        p.add_run('\t' + (str(pg) if pg else '—'))
    d.add_page_break()

    # corpo
    reset_fig()
    for lvl, num, tit, txt, fig, wcm in SECOES:
        heading(f'{num} {tit}', lvl)
        if txt:
            par(txt, align=WD_ALIGN_PARAGRAPH.JUSTIFY)
        if fig:
            figure(fig, f'Figura {next_fig()} – {tit}', wcm)

    heading('5 PORTAL DO MOTORISTA', 1)
    par(MOTORISTA_INTRO, align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    for num, tit, txt, a, b in MOTORISTA_PARES:
        heading(f'{num} {tit}', 2)
        par(txt, align=WD_ALIGN_PARAGRAPH.JUSTIFY)
        figure_pair(a, b, f'Figura {next_fig()} – {cap_part(tit)}',
                    f'Figura {next_fig()} – {cap_part(tit, False)}')

    d.add_page_break()
    heading('5.3 Checklist do turno', 2)
    par(CHECKLIST_TXT, align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    figure('22-motorista-checklist', f'Figura {next_fig()} – Checklist do turno', 5.6)

    d.add_page_break()
    heading('5.4 Falha e abertura de ocorrência', 2)
    par(FALHA_TXT, align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    figure('27-motorista-falha', f'Figura {next_fig()} – Falha registrada no turno', 7.0)

    d.add_page_break()
    heading('6 PREENCHIMENTO PELO COLABORADOR', 1)
    par(COLAB_TXT, align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    figure('26-preenchimento-celular', f'Figura {next_fig()} – Preenchimento pelo link individual', 7.0)

    d.add_page_break()
    heading('7 VERIFICAÇÃO', 1)
    c = par('Tabela 1 – Instrumentos de verificação aplicados ao protótipo',
            indent=False, align=WD_ALIGN_PARAGRAPH.CENTER, size=10)
    c.paragraph_format.keep_with_next = True
    t = d.add_table(rows=1 + len(VERIFICACAO), cols=3)
    for j, h in enumerate(['Instrumento', 'Escopo', 'Resultado']):
        cp = t.cell(0, j).paragraphs[0]
        cp.paragraph_format.first_line_indent = Cm(0)
        r = cp.add_run(h); r.bold = True; r.font.size = Pt(10)
    for i, row in enumerate(VERIFICACAO, start=1):
        for j, val in enumerate(row):
            cp = t.cell(i, j).paragraphs[0]
            cp.paragraph_format.first_line_indent = Cm(0)
            r = cp.add_run(val); r.font.size = Pt(10)
    s = par(FONTE_TAB, indent=False, align=WD_ALIGN_PARAGRAPH.CENTER, size=10)
    s.paragraph_format.space_before = Pt(4)

    heading('8 CONSIDERAÇÕES FINAIS', 1)
    par(CONCLUSAO, align=WD_ALIGN_PARAGRAPH.JUSTIFY)

    d.add_page_break()
    heading('REFERÊNCIAS', 1)
    for r in REFERENCIAS:
        p = par(r, indent=False, align=WD_ALIGN_PARAGRAPH.LEFT)
        p.paragraph_format.space_after = Pt(8)
        p.paragraph_format.line_spacing = 1.0

    d.core_properties.title = TITULO
    d.core_properties.subject = 'Trabalho de Conclusão de Curso'
    d.core_properties.author = 'SAFIP FieldOps'
    d.save(str(OUT_DOCX))


if __name__ == '__main__':
    missing = [n for *_, fig, _ in [] ]
    pages = build_pdf()
    build_docx(pages)
    import pymupdf
    with pymupdf.open(str(OUT_PDF)) as pdf:
        n = pdf.page_count
        words = sum(len(pg.get_text().split()) for pg in pdf)
    print(f'PDF: {n} páginas, {words} palavras, {OUT_PDF.stat().st_size/1024:.0f} kB')
    print(f'DOCX: {OUT_DOCX.stat().st_size/1024:.0f} kB')
    print(f'Figuras: {_fig_n}')
    print('Sumário resolvido:')
    for lvl, num, tit in toc_entries():
        print(f'  {"  " if lvl == 2 else ""}{num or "—"} {tit}: {pages.get(num or "REFERÊNCIAS", "?")}')
