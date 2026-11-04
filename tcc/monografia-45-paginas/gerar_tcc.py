# -*- coding: utf-8 -*-
"""Gera TCC em PDF (ABNT) e DOCX editável a partir de tcc/conteudo.py."""
import os, re
from PIL import Image as PILImage
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT, TA_RIGHT
from reportlab.lib.colors import HexColor, black, white
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer,
                                PageBreak, NextPageTemplate, Image, Table, TableStyle, KeepTogether)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

import conteudo as C

HERE = os.path.dirname(__file__)
OUT_PDF = os.path.join(HERE, 'TCC_SAFIP_FieldOps.pdf')
OUT_DOCX = os.path.join(HERE, 'TCC_SAFIP_FieldOps.docx')

PAGE_W, PAGE_H = A4
M_L, M_R, M_T, M_B = 3*cm, 2*cm, 3*cm, 2*cm
FRAME_W = PAGE_W - M_L - M_R
FRAME_H = PAGE_H - M_T - M_B

INK = HexColor('#111111')
GRAY = HexColor('#52525B')
LINE = HexColor('#D4D4D8')
ACCENT = HexColor('#B45309')

# ── PDF styles ─────────────────────────────────────────────────────────────
S = {}
S['body'] = ParagraphStyle('body', fontName='Times-Roman', fontSize=12, leading=18,
                           alignment=TA_JUSTIFY, firstLineIndent=1.25*cm, spaceAfter=0, textColor=INK)
S['body_noindent'] = ParagraphStyle('body_noindent', parent=S['body'], firstLineIndent=0)
S['h1'] = ParagraphStyle('h1', fontName='Times-Bold', fontSize=12, leading=18,
                         alignment=TA_LEFT, spaceBefore=0, spaceAfter=18, textColor=INK)
S['h2'] = ParagraphStyle('h2', fontName='Times-Bold', fontSize=12, leading=18,
                         alignment=TA_LEFT, spaceBefore=18, spaceAfter=12, textColor=INK)
S['h3'] = ParagraphStyle('h3', fontName='Times-BoldItalic', fontSize=12, leading=18,
                         alignment=TA_LEFT, spaceBefore=12, spaceAfter=6, textColor=INK)
S['pretitle'] = ParagraphStyle('pretitle', fontName='Times-Bold', fontSize=12, leading=18,
                               alignment=TA_CENTER, spaceAfter=18, textColor=INK)
S['center'] = ParagraphStyle('center', parent=S['body'], alignment=TA_CENTER, firstLineIndent=0)
S['right'] = ParagraphStyle('right', parent=S['body'], alignment=TA_RIGHT, firstLineIndent=0)
S['quote'] = ParagraphStyle('quote', fontName='Times-Roman', fontSize=10, leading=12,
                            alignment=TA_JUSTIFY, leftIndent=4*cm, firstLineIndent=0,
                            spaceBefore=12, spaceAfter=12, textColor=INK)
S['caption'] = ParagraphStyle('caption', fontName='Times-Roman', fontSize=10, leading=12,
                              alignment=TA_LEFT, firstLineIndent=0, spaceAfter=6, textColor=INK)
S['source'] = ParagraphStyle('source', fontName='Times-Roman', fontSize=10, leading=12,
                             alignment=TA_LEFT, firstLineIndent=0, spaceBefore=6, spaceAfter=12, textColor=GRAY)
S['ref'] = ParagraphStyle('ref', fontName='Times-Roman', fontSize=12, leading=12,
                          alignment=TA_LEFT, firstLineIndent=0, spaceAfter=12, textColor=INK)
S['toc1'] = ParagraphStyle('toc1', fontName='Times-Bold', fontSize=12, leading=18, leftIndent=0, firstLineIndent=0)
S['toc2'] = ParagraphStyle('toc2', fontName='Times-Roman', fontSize=12, leading=18, leftIndent=0.6*cm, firstLineIndent=0)
S['toc3'] = ParagraphStyle('toc3', fontName='Times-Roman', fontSize=12, leading=18, leftIndent=1.2*cm, firstLineIndent=0)
S['list'] = ParagraphStyle('list', parent=S['body'], firstLineIndent=0, leftIndent=1.25*cm, spaceAfter=6)
S['small'] = ParagraphStyle('small', fontName='Times-Roman', fontSize=10, leading=12,
                            alignment=TA_JUSTIFY, firstLineIndent=0, textColor=INK)
S['natureza'] = ParagraphStyle('natureza', fontName='Times-Roman', fontSize=10, leading=12,
                               alignment=TA_JUSTIFY, leftIndent=7*cm, firstLineIndent=0, textColor=INK)

class ListOf(TableOfContents):
    def __init__(self, kind, **kw):
        super().__init__(**kw)
        self._notifyKind = kind

class TccDoc(BaseDocTemplate):
    def __init__(self, filename, **kw):
        super().__init__(filename, pagesize=A4, leftMargin=M_L, rightMargin=M_R,
                         topMargin=M_T, bottomMargin=M_B, **kw)
        frame = Frame(M_L, M_B, FRAME_W, FRAME_H, id='main',
                      leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
        self.addPageTemplates([
            PageTemplate(id='Pre', frames=[frame], onPage=self._pre_page),
            PageTemplate(id='Body', frames=[frame], onPage=self._body_page),
        ])
        self._outline_keys = set()

    def _pre_page(self, canv, doc):
        canv.saveState()
        canv.restoreState()

    def _body_page(self, canv, doc):
        canv.saveState()
        canv.setFont('Times-Roman', 10)
        canv.setFillColor(INK)
        n = canv.getPageNumber() - 1  # capa não é contada
        canv.drawRightString(PAGE_W - M_R, PAGE_H - 2*cm, str(n))
        canv.restoreState()

    def afterFlowable(self, flowable):
        if isinstance(flowable, Paragraph):
            style = flowable.style.name
            text = flowable.getPlainText()
            page = self.canv.getPageNumber() - 1
            if style in ('h1', 'posttitle'):
                self.notify('TOCEntry', (0, text, page))
                self._bookmark(text, 0)
            elif style == 'h2':
                self.notify('TOCEntry', (1, text, page))
                self._bookmark(text, 1)
            elif style == 'h3':
                self.notify('TOCEntry', (2, text, page))
            elif style == 'caption_fig':
                self.notify('FigEntry', (0, text, page))
            elif style == 'caption_tab':
                self.notify('TabEntry', (0, text, page))
            elif style == 'caption_quad':
                self.notify('QuadEntry', (0, text, page))

    def _bookmark(self, text, level):
        key = re.sub(r'[^a-zA-Z0-9]+', '_', text)[:60] + str(level)
        if key in self._outline_keys:
            return
        self._outline_keys.add(key)
        self.canv.bookmarkPage(key)
        self.canv.addOutlineEntry(text, key, level=level, closed=False)

S['posttitle'] = ParagraphStyle('posttitle', fontName='Times-Bold', fontSize=12, leading=18,
                                alignment=TA_CENTER, spaceBefore=0, spaceAfter=18, textColor=INK)
S['caption_fig'] = ParagraphStyle('caption_fig', parent=S['caption'])
S['caption_tab'] = ParagraphStyle('caption_tab', parent=S['caption'])
S['caption_quad'] = ParagraphStyle('caption_quad', parent=S['caption'])

def esc(t):
    return (t.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;'))

def rich(t):
    t = esc(t)
    t = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', t)
    t = re.sub(r'(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)', r'<i>\1</i>', t)
    t = t.replace('et al.', '<i>et al.</i>').replace('apud', '<i>apud</i>')
    return t

def P(text, style='body'):
    return Paragraph(rich(text), S[style])

def fig_flow(path, caption, source):
    full = os.path.join(HERE, path)
    iw, ih = PILImage.open(full).size
    w = min(FRAME_W, 15*cm)
    h = w * ih / iw
    img = Image(full, width=w, height=h)
    cap = Paragraph(esc(caption), S['caption_fig'])
    src = Paragraph('Fonte: ' + esc(source), S['source'])
    return KeepTogether([cap, img, src])

def tab_flow(kind, caption, headers, rows, source):
    cap_style = 'caption_quad' if kind == 'Quadro' else 'caption_tab'
    cap = Paragraph(esc(caption), S[cap_style])
    cell = ParagraphStyle('cell', fontName='Times-Roman', fontSize=10, leading=12, textColor=INK)
    cellb = ParagraphStyle('cellb', parent=cell, fontName='Times-Bold')
    data = [[Paragraph(esc(h), cellb) for h in headers]]
    for r in rows:
        data.append([Paragraph(esc(c), cell) for c in r])
    ncols = len(headers)
    colw = FRAME_W / ncols
    t = Table(data, colWidths=[colw]*ncols, repeatRows=1)
    cmds = [
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('LINEABOVE', (0,0), (-1,0), 0.8, INK),
        ('LINEBELOW', (0,0), (-1,0), 0.5, INK),
        ('LINEBELOW', (0,-1), (-1,-1), 0.8, INK),
    ]
    if kind == 'Quadro':
        cmds += [('GRID', (0,0), (-1,-1), 0.25, LINE)]
    t.setStyle(TableStyle(cmds))
    src = Paragraph('Fonte: ' + esc(source), S['source'])
    return KeepTogether([cap, t, src])

def alinea(items):
    letters = 'abcdefghijklmnopqrstuvwxyz'
    return [Paragraph(f'{letters[i]}) {esc(t)}', S['list']) for i, t in enumerate(items)]

def build_pdf():
    doc = TccDoc(OUT_PDF, title=C.TITULO, author=C.AUTOR, subject='TCC ABNT')
    story = []

    # Capa
    story += [Spacer(1, 0.5*cm), P(C.INSTITUICAO, 'center'), P(C.CURSO, 'center'),
              Spacer(1, 2.5*cm), P(C.AUTOR, 'center'), Spacer(1, 3.5*cm),
              Paragraph('<b>' + esc(C.TITULO) + '</b>', S['center']), Spacer(1, 0.4*cm),
              P(C.SUBTITULO, 'center'), Spacer(1, 5*cm), P(C.CIDADE, 'center'), P(C.ANO, 'center'),
              PageBreak()]

    # Folha de rosto
    story += [Spacer(1, 0.5*cm), P(C.AUTOR, 'center'), Spacer(1, 3*cm),
              Paragraph('<b>' + esc(C.TITULO) + '</b>', S['center']), Spacer(1, 0.3*cm),
              P(C.SUBTITULO, 'center'), Spacer(1, 1.5*cm),
              Paragraph(esc(f'Trabalho de Conclusão de Curso apresentado ao {C.CURSO} da {C.INSTITUICAO}, '
                            f'como requisito parcial para obtenção do título de {C.GRAU} em {C.AREA}. '
                            f'Área de concentração: {C.AREA}.'), S['natureza']),
              Spacer(1, 0.8*cm),
              Paragraph('Orientador: ' + esc(C.ORIENTADOR), S['natureza']),
              Paragraph('Coorientador: ' + esc(C.COORIENTADOR), S['natureza']),
              Spacer(1, 3*cm), P(C.CIDADE, 'center'), P(C.ANO, 'center'), PageBreak()]

    # Ficha catalográfica (placeholder)
    story += [Spacer(1, 6*cm)]
    ficha = Table([[Paragraph(esc('Ficha catalográfica a ser elaborada pela biblioteca da instituição, '
                                  'conforme o código de catalogação vigente. Inserir aqui os dados '
                                  'internacionais de catalogação na publicação (CIP).'), S['small'])]],
                  colWidths=[FRAME_W-1*cm], rowHeights=[3.2*cm])
    ficha.setStyle(TableStyle([('BOX', (0,0), (-1,-1), 0.5, LINE),
                               ('ALIGN', (0,0), (-1,-1), 'CENTER'),
                               ('VALIGN', (0,0), (-1,-1), 'MIDDLE')]))
    story += [ficha, PageBreak()]

    # Folha de aprovação
    story += [P(C.AUTOR, 'center'), Spacer(1, 1*cm),
              Paragraph('<b>' + esc(C.TITULO) + '</b>', S['center']), Spacer(1, 0.3*cm),
              P(C.SUBTITULO, 'center'), Spacer(1, 1*cm),
              Paragraph(esc(f'Trabalho de Conclusão de Curso apresentado ao {C.CURSO} da {C.INSTITUICAO}, '
                            f'como requisito parcial para obtenção do título de {C.GRAU} em {C.AREA}.'), S['natureza']),
              Spacer(1, 1*cm), P('Aprovado em: ____/____/________.', 'body_noindent'), Spacer(1, 1*cm),
              P('BANCA EXAMINADORA', 'center'), Spacer(1, 1*cm)]
    for _ in range(3):
        story += [P('_________________________________________', 'center'),
                  P('[Nome do membro da banca] – [Instituição]', 'center'), Spacer(1, 0.8*cm)]
    story += [PageBreak()]

    # Dedicatória
    story += [Spacer(1, 16*cm), Paragraph(esc(C.DEDICATORIA), S['right']), PageBreak()]

    # Agradecimentos
    story += [P('AGRADECIMENTOS', 'pretitle'), P(C.AGRADECIMENTOS), PageBreak()]

    # Epígrafe
    story += [Spacer(1, 16*cm), Paragraph(esc(C.EPIGRAFE), S['right']),
              Paragraph(esc(C.EPIGRAFE_AUTOR), S['right']), PageBreak()]

    # Resumo
    story += [P('RESUMO', 'pretitle'), P(C.RESUMO, 'body_noindent'), Spacer(1, 0.8*cm),
              Paragraph('<b>Palavras-chave:</b> ' + esc(C.PALAVRAS_CHAVE), S['body_noindent']), PageBreak()]

    # Abstract
    story += [P('ABSTRACT', 'pretitle'), P(C.ABSTRACT, 'body_noindent'), Spacer(1, 0.8*cm),
              Paragraph('<b>Keywords:</b> ' + esc(C.KEYWORDS), S['body_noindent']), PageBreak()]

    # Listas
    fig_toc = ListOf('FigEntry')
    fig_toc.levelStyles = [S['toc2']]
    story += [P('LISTA DE FIGURAS', 'pretitle'), fig_toc, PageBreak()]

    quad_toc = ListOf('QuadEntry')
    quad_toc.levelStyles = [S['toc2']]
    story += [P('LISTA DE QUADROS', 'pretitle'), quad_toc, PageBreak()]

    tab_toc = ListOf('TabEntry')
    tab_toc.levelStyles = [S['toc2']]
    story += [P('LISTA DE TABELAS', 'pretitle'), tab_toc, PageBreak()]

    # Siglas
    story += [P('LISTA DE ABREVIATURAS E SIGLAS', 'pretitle')]
    sig_data = [[Paragraph('<b>' + esc(s) + '</b>', S['small']), Paragraph(esc(d), S['small'])] for s, d in C.SIGLAS]
    sig = Table(sig_data, colWidths=[3*cm, FRAME_W-3*cm])
    sig.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP'),
                             ('TOPPADDING', (0,0), (-1,-1), 2),
                             ('BOTTOMPADDING', (0,0), (-1,-1), 2),
                             ('LEFTPADDING', (0,0), (-1,-1), 0)]))
    story += [sig, PageBreak()]

    # Sumário
    toc = TableOfContents()
    toc.levelStyles = [S['toc1'], S['toc2'], S['toc3']]
    toc.dotsMinLevel = 0
    story += [P('SUMÁRIO', 'pretitle'), toc, NextPageTemplate('Body'), PageBreak()]

    # Corpo
    fig_n = tab_n = quad_n = 0
    first_h1 = True
    for block in C.BODY:
        kind = block[0]
        if kind == 'h1':
            if not first_h1:
                story.append(PageBreak())
            first_h1 = False
            st = 'posttitle' if block[1].startswith(('REFERÊNCIAS', 'APÊNDICE', 'ANEXO')) else 'h1'
            story.append(P(block[1], st))
        elif kind == 'h2':
            story.append(P(block[1], 'h2'))
        elif kind == 'h3':
            story.append(P(block[1], 'h3'))
        elif kind == 'p':
            story.append(P(block[1]))
        elif kind == 'ref':
            story.append(P(block[1], 'ref'))
        elif kind == 'quote':
            story.append(P(block[1], 'quote'))
        elif kind == 'bullets':
            story += alinea(block[1])
            story.append(Spacer(1, 6))
        elif kind == 'fig':
            fig_n += 1
            cap = f'Figura {fig_n} – {block[2]}'
            story.append(fig_flow(block[1], cap, block[3]))
        elif kind == 'tab':
            k = block[1]
            if k == 'Quadro':
                quad_n += 1
                cap = f'Quadro {quad_n} – {block[2]}'
            else:
                tab_n += 1
                cap = f'Tabela {tab_n} – {block[2]}'
            story.append(tab_flow(k, cap, block[3], block[4], block[5]))

    # Referências (já está no BODY como h1, mas precisamos formatar entradas)
    # O conteúdo REFERENCIAS é inserido após o h1 'REFERÊNCIAS' no BODY; aqui tratamos via hook abaixo.
    doc.multiBuild(story)
    _add_pdf_outline(OUT_PDF)
    return OUT_PDF

def _add_pdf_outline(path):
    try:
        import pymupdf
    except Exception:
        return
    d = pymupdf.open(path)
    # locate first body page
    start = 0
    for i, pg in enumerate(d):
        t = pg.get_text()
        if '1 INTRODUÇÃO' in t and '1.1 Contextualização' in t and 'SUMÁRIO' not in t:
            start = i
            break
    toc = []
    cur = start
    for b in C.BODY:
        if b[0] not in ('h1', 'h2', 'h3'):
            continue
        title = b[1]
        level = {'h1': 1, 'h2': 2, 'h3': 3}[b[0]]
        found = None
        for i in range(cur, d.page_count):
            txt = ' '.join(d[i].get_text().split())
            if title in txt:
                found = i
                break
        if found is None:
            continue
        toc.append([level, title, found + 1])
        cur = found
    if toc:
        d.set_toc(toc)
        d.saveIncr()
    d.close()

# Inserir referências no BODY após o h1 correspondente
def inject_refs():
    new = []
    for b in C.BODY:
        new.append(b)
        if b[0] == 'h1' and b[1] == 'REFERÊNCIAS':
            for r in C.REFERENCIAS:
                new.append(('ref', r))
    C.BODY = new

# ── DOCX ───────────────────────────────────────────────────────────────────
def build_docx():
    from docx import Document
    from docx.shared import Pt, Cm, RGBColor
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    from docx.enum.section import WD_SECTION_START
    from docx.oxml.ns import qn
    from docx.oxml import OxmlElement

    doc = Document()
    doc.core_properties.title = C.TITULO
    doc.core_properties.author = C.AUTOR
    doc.core_properties.subject = 'Trabalho de Conclusão de Curso'

    normal = doc.styles['Normal']
    normal.font.name = 'Times New Roman'
    normal.font.size = Pt(12)
    normal.paragraph_format.line_spacing = 1.5
    normal.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    normal.paragraph_format.first_line_indent = Cm(1.25)
    normal.paragraph_format.space_after = Pt(0)
    rpr = normal.element.get_or_add_rPr()
    rfonts = rpr.find(qn('w:rFonts'))
    if rfonts is None:
        rfonts = OxmlElement('w:rFonts'); rpr.append(rfonts)
    rfonts.set(qn('w:eastAsia'), 'Times New Roman')

    for name, bold, italic, before, after in [
        ('Heading 1', True, False, 0, 18),
        ('Heading 2', True, False, 18, 12),
        ('Heading 3', True, True, 12, 6),
    ]:
        st = doc.styles[name]
        st.font.name = 'Times New Roman'; st.font.size = Pt(12)
        st.font.bold = bold; st.font.italic = italic
        st.font.color.rgb = RGBColor(0, 0, 0)
        st.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT
        st.paragraph_format.line_spacing = 1.5
        st.paragraph_format.space_before = Pt(before)
        st.paragraph_format.space_after = Pt(after)
        st.paragraph_format.first_line_indent = Cm(0)

    cap = doc.styles['Caption']
    cap.font.name = 'Times New Roman'; cap.font.size = Pt(10)
    cap.font.color.rgb = RGBColor(0, 0, 0)
    cap.font.italic = False
    cap.font.bold = False
    cap.paragraph_format.line_spacing = 1.0
    cap.paragraph_format.space_after = Pt(6)
    cap.paragraph_format.first_line_indent = Cm(0)

    sec = doc.sections[0]
    sec.page_width = Cm(21); sec.page_height = Cm(29.7)
    sec.top_margin = Cm(3); sec.bottom_margin = Cm(2)
    sec.left_margin = Cm(3); sec.right_margin = Cm(2)
    pg = OxmlElement('w:pgNumType'); pg.set(qn('w:start'), '0')
    sec._sectPr.append(pg)

    def add_rich(p, text, size=None, bold=False, italic=False):
        # parse **bold** and *italic*; italicize et al./apud
        text = text.replace('et al.', '*et al.*').replace('apud', '*apud*')
        tokens = re.split(r'(\*\*.+?\*\*|\*[^*]+?\*)', text)
        for tok in tokens:
            if not tok:
                continue
            b, i = bold, italic
            if tok.startswith('**') and tok.endswith('**'):
                tok = tok[2:-2]; b = True
            elif tok.startswith('*') and tok.endswith('*'):
                tok = tok[1:-1]; i = True
            r = p.add_run(tok)
            r.font.name = 'Times New Roman'
            r.font.bold = b; r.font.italic = i
            if size:
                r.font.size = Pt(size)
        return p

    def para(text='', align=None, indent=None, size=None, bold=False, italic=False, spacing=None, style=None):
        p = doc.add_paragraph(style=style)
        if align is not None:
            p.alignment = align
        if indent is not None:
            p.paragraph_format.first_line_indent = indent
        if spacing is not None:
            p.paragraph_format.line_spacing = spacing
        add_rich(p, text, size=size, bold=bold, italic=italic)
        return p

    def field(p, instr, cached=''):
        fld = OxmlElement('w:fldSimple')
        fld.set(qn('w:instr'), instr)
        r = OxmlElement('w:r')
        t = OxmlElement('w:t'); t.text = cached
        r.append(t); fld.append(r); p._p.append(fld)
        return fld

    def pagebreak():
        doc.add_page_break()

    def caption(label, num, title):
        p = doc.add_paragraph(style='Caption')
        r = p.add_run(label + ' '); r.font.name = 'Times New Roman'; r.font.size = Pt(10)
        field(p, f'SEQ {label} \\* ARABIC', str(num))
        r = p.add_run(' – ' + title); r.font.name = 'Times New Roman'; r.font.size = Pt(10)
        return p

    def set_table_borders(t, kind):
        tbl = t._tbl
        tblPr = tbl.tblPr
        borders = OxmlElement('w:tblBorders')
        if kind == 'Quadro':
            edges = {'top': 'single', 'left': 'single', 'bottom': 'single', 'right': 'single', 'insideH': 'single', 'insideV': 'single'}
        else:
            edges = {'top': 'single', 'left': 'nil', 'bottom': 'single', 'right': 'nil', 'insideH': 'nil', 'insideV': 'nil'}
        for edge, val in edges.items():
            el = OxmlElement(f'w:{edge}')
            el.set(qn('w:val'), val)
            el.set(qn('w:sz'), '8' if edge in ('top', 'bottom') else '4')
            el.set(qn('w:color'), '000000')
            borders.append(el)
        tblPr.append(borders)
        if kind != 'Quadro':
            # header bottom line
            for cell in t.rows[0].cells:
                tcPr = cell._tc.get_or_add_tcPr()
                cb = OxmlElement('w:tcBorders')
                bottom = OxmlElement('w:bottom')
                bottom.set(qn('w:val'), 'single'); bottom.set(qn('w:sz'), '4'); bottom.set(qn('w:color'), '000000')
                cb.append(bottom); tcPr.append(cb)

    # Capa
    para(C.INSTITUICAO, align=WD_ALIGN_PARAGRAPH.CENTER, indent=Cm(0))
    para(C.CURSO, align=WD_ALIGN_PARAGRAPH.CENTER, indent=Cm(0))
    para('', indent=Cm(0)); para('', indent=Cm(0))
    para(C.AUTOR, align=WD_ALIGN_PARAGRAPH.CENTER, indent=Cm(0))
    for _ in range(4): para('', indent=Cm(0))
    para(C.TITULO, align=WD_ALIGN_PARAGRAPH.CENTER, indent=Cm(0), bold=True)
    para(C.SUBTITULO, align=WD_ALIGN_PARAGRAPH.CENTER, indent=Cm(0))
    for _ in range(6): para('', indent=Cm(0))
    para(C.CIDADE, align=WD_ALIGN_PARAGRAPH.CENTER, indent=Cm(0))
    para(C.ANO, align=WD_ALIGN_PARAGRAPH.CENTER, indent=Cm(0))
    pagebreak()

    # Folha de rosto
    para(C.AUTOR, align=WD_ALIGN_PARAGRAPH.CENTER, indent=Cm(0))
    for _ in range(3): para('', indent=Cm(0))
    para(C.TITULO, align=WD_ALIGN_PARAGRAPH.CENTER, indent=Cm(0), bold=True)
    para(C.SUBTITULO, align=WD_ALIGN_PARAGRAPH.CENTER, indent=Cm(0))
    para('', indent=Cm(0))
    p = para(f'Trabalho de Conclusão de Curso apresentado ao {C.CURSO} da {C.INSTITUICAO}, '
             f'como requisito parcial para obtenção do título de {C.GRAU} em {C.AREA}.',
             indent=Cm(0), size=10, spacing=1.0)
    p.paragraph_format.left_indent = Cm(7)
    para('', indent=Cm(0))
    p = para('Orientador: ' + C.ORIENTADOR, indent=Cm(0), size=10, spacing=1.0)
    p.paragraph_format.left_indent = Cm(7)
    p = para('Coorientador: ' + C.COORIENTADOR, indent=Cm(0), size=10, spacing=1.0)
    p.paragraph_format.left_indent = Cm(7)
    for _ in range(3): para('', indent=Cm(0))
    para(C.CIDADE, align=WD_ALIGN_PARAGRAPH.CENTER, indent=Cm(0))
    para(C.ANO, align=WD_ALIGN_PARAGRAPH.CENTER, indent=Cm(0))
    pagebreak()

    # Ficha catalográfica
    para('Ficha catalográfica a ser elaborada pela biblioteca da instituição.',
         align=WD_ALIGN_PARAGRAPH.CENTER, indent=Cm(0), size=10)
    pagebreak()

    # Folha de aprovação
    para(C.AUTOR, align=WD_ALIGN_PARAGRAPH.CENTER, indent=Cm(0))
    para(C.TITULO, align=WD_ALIGN_PARAGRAPH.CENTER, indent=Cm(0), bold=True)
    para(C.SUBTITULO, align=WD_ALIGN_PARAGRAPH.CENTER, indent=Cm(0))
    para('Aprovado em: ____/____/________.', indent=Cm(0))
    para('BANCA EXAMINADORA', align=WD_ALIGN_PARAGRAPH.CENTER, indent=Cm(0), bold=True)
    for _ in range(3):
        para('_________________________________________', align=WD_ALIGN_PARAGRAPH.CENTER, indent=Cm(0))
        para('[Nome do membro da banca] – [Instituição]', align=WD_ALIGN_PARAGRAPH.CENTER, indent=Cm(0))
        para('', indent=Cm(0))
    pagebreak()

    # Dedicatória / agradecimentos / epígrafe
    for _ in range(12): para('', indent=Cm(0))
    para(C.DEDICATORIA, align=WD_ALIGN_PARAGRAPH.RIGHT, indent=Cm(0))
    pagebreak()
    para('AGRADECIMENTOS', align=WD_ALIGN_PARAGRAPH.CENTER, indent=Cm(0), bold=True)
    para(C.AGRADECIMENTOS)
    pagebreak()
    for _ in range(12): para('', indent=Cm(0))
    para(C.EPIGRAFE, align=WD_ALIGN_PARAGRAPH.RIGHT, indent=Cm(0))
    para(C.EPIGRAFE_AUTOR, align=WD_ALIGN_PARAGRAPH.RIGHT, indent=Cm(0))
    pagebreak()

    # Resumo / abstract
    para('RESUMO', align=WD_ALIGN_PARAGRAPH.CENTER, indent=Cm(0), bold=True)
    para(C.RESUMO, indent=Cm(0))
    p = para('', indent=Cm(0)); add_rich(p, '**Palavras-chave:** ' + C.PALAVRAS_CHAVE)
    pagebreak()
    para('ABSTRACT', align=WD_ALIGN_PARAGRAPH.CENTER, indent=Cm(0), bold=True)
    para(C.ABSTRACT, indent=Cm(0))
    p = para('', indent=Cm(0)); add_rich(p, '**Keywords:** ' + C.KEYWORDS)
    pagebreak()

    # Listas (campos atualizáveis no Word)
    for title, label in [('LISTA DE FIGURAS', 'Figura'), ('LISTA DE QUADROS', 'Quadro'), ('LISTA DE TABELAS', 'Tabela')]:
        para(title, align=WD_ALIGN_PARAGRAPH.CENTER, indent=Cm(0), bold=True)
        p = doc.add_paragraph()
        field(p, f'TOC \\h \\z \\c "{label}"', f'Atualize este campo no Word para gerar a lista de {label.lower()}s.')
        pagebreak()

    para('LISTA DE ABREVIATURAS E SIGLAS', align=WD_ALIGN_PARAGRAPH.CENTER, indent=Cm(0), bold=True)
    for s, d in C.SIGLAS:
        para(f'{s} – {d}', indent=Cm(0), spacing=1.0)
    pagebreak()

    # Sumário
    para('SUMÁRIO', align=WD_ALIGN_PARAGRAPH.CENTER, indent=Cm(0), bold=True)
    p = doc.add_paragraph()
    field(p, 'TOC \\o "1-3" \\h \\z \\u', 'Atualize este campo no Word (Referências > Atualizar Sumário).')

    # Seção do corpo com numeração
    new_sec = doc.add_section(WD_SECTION_START.NEW_PAGE)
    new_sec.page_width = Cm(21); new_sec.page_height = Cm(29.7)
    new_sec.top_margin = Cm(3); new_sec.bottom_margin = Cm(2)
    new_sec.left_margin = Cm(3); new_sec.right_margin = Cm(2)
    for el in new_sec._sectPr.findall(qn('w:pgNumType')):
        new_sec._sectPr.remove(el)
    header = new_sec.header
    header.is_linked_to_previous = False
    hp = header.paragraphs[0]
    hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    fld = OxmlElement('w:fldSimple'); fld.set(qn('w:instr'), 'PAGE')
    r = OxmlElement('w:r'); rpr = OxmlElement('w:rPr')
    sz = OxmlElement('w:sz'); sz.set(qn('w:val'), '20'); rpr.append(sz)
    r.append(rpr); fld.append(r); hp._p.append(fld)

    fig_n = tab_n = quad_n = 0
    first_h1 = True
    for block in C.BODY:
        kind = block[0]
        if kind == 'h1':
            post = block[1].startswith(('REFERÊNCIAS', 'APÊNDICE', 'ANEXO'))
            h = doc.add_heading(block[1], level=1)
            if post:
                h.alignment = WD_ALIGN_PARAGRAPH.CENTER
            if not first_h1:
                h.paragraph_format.page_break_before = True
            first_h1 = False
        elif kind == 'h2':
            doc.add_heading(block[1], level=2)
        elif kind == 'h3':
            doc.add_heading(block[1], level=3)
        elif kind == 'p':
            para(block[1])
        elif kind == 'ref':
            p = para(block[1], indent=Cm(0), spacing=1.0)
            p.paragraph_format.space_after = Pt(12)
        elif kind == 'quote':
            p = para(block[1], indent=Cm(0), size=10, spacing=1.0)
            p.paragraph_format.left_indent = Cm(4)
        elif kind == 'bullets':
            letters = 'abcdefghijklmnopqrstuvwxyz'
            for i, t in enumerate(block[1]):
                p = para(f'{letters[i]}) {t}', indent=Cm(0))
                p.paragraph_format.left_indent = Cm(1.25)
        elif kind == 'fig':
            fig_n += 1
            caption('Figura', fig_n, block[2])
            full = os.path.join(HERE, block[1])
            doc.add_picture(full, width=Cm(15))
            doc.paragraphs[-1].alignment = WD_ALIGN_PARAGRAPH.CENTER
            para('Fonte: ' + block[3], indent=Cm(0), size=10, spacing=1.0)
        elif kind == 'tab':
            k = block[1]
            if k == 'Quadro':
                quad_n += 1
                caption('Quadro', quad_n, block[2])
            else:
                tab_n += 1
                caption('Tabela', tab_n, block[2])
            headers, rows = block[3], block[4]
            t = doc.add_table(rows=1 + len(rows), cols=len(headers))
            set_table_borders(t, k)
            for j, h in enumerate(headers):
                cell = t.rows[0].cells[j]
                cell.text = ''
                p = cell.paragraphs[0]; p.paragraph_format.line_spacing = 1.0
                p.paragraph_format.first_line_indent = Cm(0)
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
                add_rich(p, h, size=10, bold=True)
            for i, row in enumerate(rows, start=1):
                for j, val in enumerate(row):
                    cell = t.rows[i].cells[j]
                    cell.text = ''
                    p = cell.paragraphs[0]; p.paragraph_format.line_spacing = 1.0
                    p.paragraph_format.first_line_indent = Cm(0)
                    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
                    add_rich(p, val, size=10)
            para('Fonte: ' + block[5], indent=Cm(0), size=10, spacing=1.0)

    doc.save(OUT_DOCX)
    return OUT_DOCX

if __name__ == '__main__':
    inject_refs()
    pdf = build_pdf()
    docx = build_docx()
    print('PDF:', pdf)
    print('DOCX:', docx)
