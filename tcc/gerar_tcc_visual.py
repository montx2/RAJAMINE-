#!/usr/bin/env python3
"""TCC em formato ABNT — versão compacta, orientada a figuras.

Gera PDF e DOCX a partir desta única fonte. Estrutura NBR 14724: capa, folha de
rosto, sumário, parte textual e referências. Numeração no canto superior direito
a partir da primeira página textual (capa/folha/sumário contam, não numeram).

O texto é deliberadamente mínimo: o argumento é carregado pelas figuras, que
são agrupadas várias por página para reduzir o total de páginas sem cortar
nenhuma tela. As capturas em `figuras_tcc/` já têm a barra superior recomposta
(sem corte no topo).

Uso:  python3 tcc/gerar_tcc_visual.py
Requer: reportlab, python-docx, Pillow.
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
JPG = HERE / 'figuras_tcc_jpg'
OUT_PDF = HERE / 'TCC_SAFIP_FieldOps_ABNT.pdf'
OUT_DOCX = HERE / 'TCC_SAFIP_FieldOps_ABNT.docx'


def fig_path(name):
    """JPEG leve para embutir no PDF/DOCX (PNG fonte permanece em figuras_tcc/)."""
    JPG.mkdir(exist_ok=True)
    fp = JPG / f'{name}.jpg'
    if not fp.exists():
        from PIL import Image as PILImage
        PILImage.open(FIGS / f'{name}.png').convert('RGB').save(fp, quality=88, optimize=True)
    return fp

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

W, H = A4
ML, MR, MT, MB = 3 * cm, 2 * cm, 3 * cm, 2 * cm
CW = W - ML - MR
CH = H - MT - MB
INK = colors.HexColor('#111111')

# Larguras de figura: telas de desktop agrupadas por altura (2–3 por página);
# celulares em trios. O agrupamento minimiza páginas sem cortar nenhuma tela.
DESK_W = 10.5 * cm
CELL_W = 5.0 * cm
CELL_SOLO_W = 6.0 * cm
PAGE_CAP = 24.7  # cm úteis de mancha A4
FIG_OVERHEAD = 1.23  # cm de legenda + fonte por figura

S = {}
S['capa_inst'] = ParagraphStyle('capa_inst', fontName='Times-Bold', fontSize=12, leading=16, alignment=TA_CENTER, textColor=INK)
S['capa_autor'] = ParagraphStyle('capa_autor', fontName='Times-Roman', fontSize=12, leading=16, alignment=TA_CENTER, textColor=INK)
S['capa_tit'] = ParagraphStyle('capa_tit', fontName='Times-Bold', fontSize=14, leading=19, alignment=TA_CENTER, textColor=INK)
S['capa_sub'] = ParagraphStyle('capa_sub', fontName='Times-Roman', fontSize=12, leading=16, alignment=TA_CENTER, textColor=INK)
S['capa_local'] = ParagraphStyle('capa_local', fontName='Times-Roman', fontSize=12, leading=16, alignment=TA_CENTER, textColor=INK)
S['natureza'] = ParagraphStyle('natureza', fontName='Times-Roman', fontSize=11, leading=15, alignment=TA_JUSTIFY, textColor=INK, leftIndent=8 * cm)
S['body'] = ParagraphStyle('body', fontName='Times-Roman', fontSize=12, leading=18, alignment=TA_JUSTIFY, firstLineIndent=1.25 * cm, textColor=INK, spaceAfter=0)
S['h1'] = ParagraphStyle('h1', fontName='Times-Bold', fontSize=12, leading=18, alignment=TA_LEFT, textColor=INK, spaceBefore=12, spaceAfter=6, keepWithNext=1)
S['sum_tit'] = ParagraphStyle('sum_tit', fontName='Times-Bold', fontSize=12, leading=18, alignment=TA_CENTER, textColor=INK, spaceAfter=14)
S['sum1'] = ParagraphStyle('sum1', fontName='Times-Bold', fontSize=12, leading=17, alignment=TA_LEFT, textColor=INK)
S['sum_pg'] = ParagraphStyle('sum_pg', fontName='Times-Roman', fontSize=12, leading=17, alignment=TA_RIGHT, textColor=INK)
S['caption'] = ParagraphStyle('caption', fontName='Times-Roman', fontSize=10, leading=12, alignment=TA_CENTER, textColor=INK, spaceAfter=3, keepWithNext=1)
S['source'] = ParagraphStyle('source', fontName='Times-Roman', fontSize=10, leading=12, alignment=TA_CENTER, textColor=INK, spaceBefore=2, spaceAfter=6)
S['ref'] = ParagraphStyle('ref', fontName='Times-Roman', fontSize=12, leading=14, alignment=TA_LEFT, textColor=INK, spaceAfter=8)


def esc(t):
    return t.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def rich(t):
    return re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', esc(t))


# ───────────────────────── conteúdo mínimo ─────────────────────────
INTRO = ('Relatórios de campo chegam à coordenação com redação heterogênea e códigos transcritos '
         'manualmente, concentrando custo na revisão. O sistema padroniza esse ciclo sem transferir '
         'a decisão técnica para o software.')
OBJ = ('Padronizar preenchimento, revisão, aprovação e arquivamento do relatório de campo, mantendo '
       'a liberação ao cliente condicionada à aprovação humana registrada.')
METODO = ('Protótipo funcional em React e TypeScript, com processamento no navegador e base sintética; '
          'leitura de códigos por Tesseract em WebAssembly, sem envio de imagens a servidores. '
          'Verificação com **123 testes automatizados** e capturas em navegador real.')
CONCLUSAO = ('A automação acelera a preparação do documento, enquanto a responsabilidade permanece com '
             'uma pessoa identificável. Limites: ausência de servidor autenticado, envios simulados e '
             'acurácia do OCR não medida em corpus de campo.')

# (arquivo, legenda, tipo)  tipo: desk | cell
FIGURAS = [
    ('01-acesso', 'Acesso ao sistema', 'cell'),
    ('02-painel', 'Painel de indicadores', 'desk'),
    ('03-relatorios', 'Carteira de relatórios', 'desk'),
    ('04-novo-link', 'Geração de link individual', 'desk'),
    ('05-dados', 'Dados da visita / atividade', 'desk'),
    ('06-padronizacao', 'Padronização do texto lado a lado', 'desk'),
    ('07-ocr', 'Leitura de códigos por OCR', 'desk'),
    ('08-revisao-checklist', 'Conferência antes da aprovação', 'desk'),
    ('09-historico', 'Histórico e rastreabilidade', 'desk'),
    ('10-documentos-pdf', 'Geração dos dois documentos', 'desk'),
    ('11-central-revisao', 'Central de revisão', 'desk'),
    ('12-operacoes', 'Operações de campo', 'desk'),
    ('13-semanal', 'Consolidado semanal', 'desk'),
    ('14-equipamentos', 'Equipamentos e identificadores', 'desk'),
    ('15-frota', 'Frota de caminhões', 'desk'),
    ('16-ocorrencias', 'Ocorrências de campo', 'desk'),
    ('17-arquivo', 'Arquivo de documentos', 'desk'),
    ('18-cadastros', 'Cadastros e clientes', 'desk'),
    ('19-painel-escuro', 'Tema escuro — painel', 'desk'),
    ('20-ocr-escuro', 'Tema escuro — OCR', 'desk'),
    ('21-motorista-inicio', 'Motorista — início', 'cell'),
    ('22-motorista-checklist', 'Motorista — checklist do turno', 'celltall'),
    ('23-motorista-ocorrencias', 'Motorista — ocorrências', 'cell'),
    ('24-motorista-historico', 'Motorista — histórico', 'cell'),
    ('25-motorista-treinamento', 'Motorista — treinamento', 'cell'),
    ('26-preenchimento-celular', 'Preenchimento pelo colaborador', 'cell'),
    ('27-motorista-falha', 'Falha e abertura de ocorrência', 'cell'),
]

SECOES = [
    ('1', 'INTRODUÇÃO', INTRO),
    ('2', 'OBJETIVO', OBJ),
    ('3', 'METODOLOGIA', METODO),
    ('4', 'A SOLUÇÃO EM TELAS', 'Capturas do protótipo em execução, com dados sintéticos.'),
    ('5', 'PORTAL DO MOTORISTA', 'Acesso móvel do motorista: checklist, ocorrências, histórico e treinamento.'),
    ('6', 'CONSIDERAÇÕES FINAIS', CONCLUSAO),
]

REFERENCIAS = [
    'ASSOCIAÇÃO BRASILEIRA DE NORMAS TÉCNICAS. **NBR 14724**: informação e documentação — trabalhos acadêmicos — apresentação. Rio de Janeiro: ABNT, 2011.',
    'ASSOCIAÇÃO BRASILEIRA DE NORMAS TÉCNICAS. **NBR 6027**: informação e documentação — sumário — apresentação. Rio de Janeiro: ABNT, 2012.',
    'META PLATFORMS, INC. **React**: a JavaScript library for building user interfaces. 2024. Disponível em: https://react.dev. Acesso em: 05 nov. 2026.',
    'MICROSOFT CORPORATION. **TypeScript**: JavaScript with syntax for types. 2024. Disponível em: https://www.typescriptlang.org. Acesso em: 05 nov. 2026.',
    'TESSERACT OCR. **Tesseract.js**: pure Javascript OCR for more than 100 languages. 2024. Disponível em: https://tesseract.projectnaptha.com. Acesso em: 05 nov. 2026.',
]

STATE = {'pages': {}, 'print_pages': {}, 'fig': 0}


def next_fig():
    STATE['fig'] += 1
    return STATE['fig']


def reset_fig():
    STATE['fig'] = 0


class Doc(BaseDocTemplate):
    def afterFlowable(self, flowable):
        key = getattr(flowable, '_toc', None)
        if key:
            STATE['pages'][key] = self.page


def on_page(canvas, doc):
    if doc.page >= 4:  # capa, folha de rosto e sumário não recebem número
        canvas.saveState()
        canvas.setFont('Times-Roman', 10)
        canvas.drawRightString(W - MR, H - 1.5 * cm, str(doc.page))
        canvas.restoreState()


def img_size(name, width):
    from PIL import Image as PILImage
    iw, ih = PILImage.open(FIGS / f'{name}.png').size
    return width, width * ih / iw


def fig_block(name, caption, width):
    w, h = img_size(name, width)
    return [Paragraph(esc(caption), S['caption']),
            Image(str(fig_path(name)), width=w, height=h),
            Paragraph(esc(FONTE_FIG), S['source'])]


def cell_row(items):
    """items: list of (name, caption). Up to 3 side by side."""
    cells = []
    for name, cap in items:
        w, h = img_size(name, CELL_W)
        cells.append([Paragraph(esc(cap), S['caption']),
                      Image(str(fig_path(name)), width=w, height=h),
                      Paragraph(esc(FONTE_FIG), S['source'])])
    n = len(cells)
    t = Table([cells], colWidths=[CW / n] * n, hAlign='CENTER')
    t.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 2),
        ('RIGHTPADDING', (0, 0), (-1, -1), 2),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))
    return t


def head(text, key):
    p = Paragraph(esc(text), S['h1'])
    p._toc = key
    return p


def capa_flow():
    return [Paragraph(esc(INSTITUICAO), S['capa_inst']), Paragraph(esc(CURSO), S['capa_inst']),
            Spacer(1, 3.2 * cm), Paragraph(esc(AUTOR), S['capa_autor']), Spacer(1, 4.4 * cm),
            Paragraph(esc(TITULO), S['capa_tit']), Spacer(1, 0.5 * cm),
            Paragraph(esc(SUBTITULO), S['capa_sub']), Spacer(1, 11.2 * cm),
            Paragraph(esc(CIDADE), S['capa_local']), Paragraph(esc(ANO), S['capa_local']), PageBreak()]


def rosto_flow():
    return [Paragraph(esc(AUTOR), S['capa_autor']), Spacer(1, 4.0 * cm),
            Paragraph(esc(TITULO), S['capa_tit']), Spacer(1, 0.5 * cm),
            Paragraph(esc(SUBTITULO), S['capa_sub']), Spacer(1, 2.0 * cm),
            Paragraph(esc(NATUREZA), S['natureza']), Spacer(1, 0.8 * cm),
            Paragraph(esc(f'Orientador: {ORIENTADOR}'), S['natureza']), Spacer(1, 10.6 * cm),
            Paragraph(esc(CIDADE), S['capa_local']), Paragraph(esc(ANO), S['capa_local']), PageBreak()]


def sumario_flow():
    rows = []
    for num, tit, _ in SECOES:
        pg = STATE['print_pages'].get(num, 0)
        rows.append([Paragraph(esc(f'{num} {tit}'), S['sum1']), Paragraph(str(pg) if pg else '—', S['sum_pg'])])
    pg = STATE['print_pages'].get('REFERÊNCIAS', 0)
    rows.append([Paragraph(esc('REFERÊNCIAS'), S['sum1']), Paragraph(str(pg) if pg else '—', S['sum_pg'])])
    t = Table(rows, colWidths=[CW - 1.4 * cm, 1.4 * cm], hAlign='CENTER')
    t.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'TOP'),
                           ('LEFTPADDING', (0, 0), (-1, -1), 0), ('RIGHTPADDING', (0, 0), (-1, -1), 0),
                           ('TOPPADDING', (0, 0), (-1, -1), 1), ('BOTTOMPADDING', (0, 0), (-1, -1), 1)]))
    return [Paragraph('SUMÁRIO', S['sum_tit']), t, PageBreak()]


def fig_height_cm(name, width_cm):
    from PIL import Image as PILImage
    iw, ih = PILImage.open(FIGS / f'{name}.png').size
    return width_cm * ih / iw


def pack_desktop(items):
    """First-fit decreasing: agrupa telas por altura para encher cada página."""
    costs = sorted(((fig_height_cm(n, DESK_W / cm) + FIG_OVERHEAD, n, c) for n, c in items),
                   reverse=True)
    bins = []
    for cost, n, c in costs:
        for b in bins:
            if sum(x[0] for x in b) + cost <= PAGE_CAP:
                b.append((cost, n, c))
                break
        else:
            bins.append([(cost, n, c)])
    return [[(n, c) for _, n, c in b] for b in bins]


def body_flow():
    reset_fig()
    f = []
    # seções 1-3 (texto mínimo)
    for num, tit, txt in SECOES[:3]:
        f.append(head(f'{num} {tit}', num))
        f.append(Paragraph(rich(txt), S['body']))
    # seção 4: acesso + telas de gestão
    f.append(head('4 A SOLUÇÃO EM TELAS', '4'))
    f.append(Paragraph(rich(SECOES[3][2]), S['body']))
    f.append(Spacer(1, 6))

    login = [(n, c) for n, c, k in FIGURAS if k == 'cell' and n == '01-acesso']
    desk = [(n, c) for n, c, k in FIGURAS if k == 'desk']
    cells = [(n, c) for n, c, k in FIGURAS if k == 'cell' and n != '01-acesso']
    tall = [(n, c) for n, c, k in FIGURAS if k == 'celltall']

    for n, c in login:
        f.append(KeepTogether(fig_block(n, f'Figura {next_fig()} – {c}', CELL_SOLO_W)))

    for group in pack_desktop(desk):
        block = []
        for n, c in group:
            block.extend(fig_block(n, f'Figura {next_fig()} – {c}', DESK_W))
        f.append(KeepTogether(block))

    # seção 5: portal do motorista (celulares em trios)
    f.append(head('5 PORTAL DO MOTORISTA', '5'))
    f.append(Paragraph(rich(SECOES[4][2]), S['body']))
    f.append(Spacer(1, 6))
    while cells:
        chunk, cells = cells[:3], cells[3:]
        caps = [(n, f'Figura {next_fig()} – {c}') for n, c in chunk]
        f.append(KeepTogether([cell_row(caps)]))
    for n, c in tall:
        f.append(KeepTogether(fig_block(n, f'Figura {next_fig()} – {c}', CELL_SOLO_W)))

    f.append(head('6 CONSIDERAÇÕES FINAIS', '6'))
    f.append(Paragraph(rich(CONCLUSAO), S['body']))
    f.append(PageBreak())
    f.append(head('REFERÊNCIAS', 'REFERÊNCIAS'))
    for r in REFERENCIAS:
        f.append(Paragraph(rich(r), S['ref']))
    return f


def build_pdf():
    for attempt in (1, 2):
        STATE['print_pages'] = dict(STATE['pages'])
        STATE['pages'] = {}
        doc = Doc(str(OUT_PDF), pagesize=A4,
                  leftMargin=ML, rightMargin=MR, topMargin=MT, bottomMargin=MB,
                  title=TITULO, author=AUTOR)
        frame = Frame(ML, MB, CW, CH, id='n', leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
        doc.addPageTemplates([PageTemplate(id='all', frames=[frame], onPage=on_page)])
        doc.build(capa_flow() + rosto_flow() + sumario_flow() + body_flow())
    return STATE['print_pages']


def build_docx(pages):
    import docx
    from docx.shared import Cm, Pt
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    d = docx.Document()
    sec = d.sections[0]
    sec.page_width, sec.page_height = Cm(21.0), Cm(29.7)
    sec.left_margin, sec.right_margin = Cm(3), Cm(2)
    sec.top_margin, sec.bottom_margin = Cm(3), Cm(2)
    st = d.styles['Normal']
    st.font.name = 'Times New Roman'
    st.font.size = Pt(12)
    st.paragraph_format.line_spacing = 1.5

    def par(text='', bold=False, align=None, indent=False, size=12, after=0):
        p = d.add_paragraph()
        r = p.add_run(text)
        r.bold = bold
        r.font.size = Pt(size)
        if align is not None:
            p.alignment = align
        if indent:
            p.paragraph_format.first_line_indent = Cm(1.25)
        p.paragraph_format.space_after = Pt(after)
        return p

    C = WD_ALIGN_PARAGRAPH.CENTER
    # capa
    par(INSTITUICAO, True, C); par(CURSO, True, C)
    for _ in range(3): par()
    par(AUTOR, False, C)
    for _ in range(4): par()
    par(TITULO, True, C, size=14); par(SUBTITULO, False, C)
    for _ in range(8): par()
    par(CIDADE, False, C); par(ANO, False, C)
    d.add_page_break()
    # rosto
    par(AUTOR, False, C)
    for _ in range(4): par()
    par(TITULO, True, C, size=14); par(SUBTITULO, False, C)
    for _ in range(2): par()
    par(NATUREZA, False, WD_ALIGN_PARAGRAPH.JUSTIFY)
    par(f'Orientador: {ORIENTADOR}', False)
    for _ in range(8): par()
    par(CIDADE, False, C); par(ANO, False, C)
    d.add_page_break()
    # sumário
    par('SUMÁRIO', True, C, after=12)
    for num, tit, _ in SECOES:
        par(f'{num} {tit} .... {pages.get(num, "")}', False)
    par(f'REFERÊNCIAS .... {pages.get("REFERÊNCIAS", "")}', False)
    d.add_page_break()
    # corpo
    reset_fig()
    for num, tit, txt in SECOES[:3]:
        par(f'{num} {tit}', True, after=6)
        par(txt, False, WD_ALIGN_PARAGRAPH.JUSTIFY, indent=True)
    par('4 A SOLUÇÃO EM TELAS', True, after=6)
    par(SECOES[3][2], False, WD_ALIGN_PARAGRAPH.JUSTIFY, indent=True)
    for name, cap, kind in FIGURAS:
        if name == '21-motorista-inicio':
            par('5 PORTAL DO MOTORISTA', True, after=6)
            par(SECOES[4][2], False, WD_ALIGN_PARAGRAPH.JUSTIFY, indent=True)
        w = CELL_SOLO_W if kind == 'celltall' else (CELL_W if kind == 'cell' else DESK_W)
        par(f'Figura {next_fig()} – {cap}', False, C, size=10, after=3)
        p = d.add_paragraph()
        p.alignment = C
        p.add_run().add_picture(str(fig_path(name)), width=w)
        par(FONTE_FIG, False, C, size=10, after=6)
    par('6 CONSIDERAÇÕES FINAIS', True, after=6)
    par(CONCLUSAO, False, WD_ALIGN_PARAGRAPH.JUSTIFY, indent=True)
    d.add_page_break()
    par('REFERÊNCIAS', True, after=6)
    for r in REFERENCIAS:
        par(r.replace('**', ''), False, after=8)
    d.save(str(OUT_DOCX))


if __name__ == '__main__':
    pages = build_pdf()
    build_docx(pages)
    import pymupdf
    n = pymupdf.open(str(OUT_PDF)).page_count
    print(f'PDF gerado: {OUT_PDF.name} — {n} páginas')
    print(f'DOCX gerado: {OUT_DOCX.name}')
    print('sumário:', pages)
