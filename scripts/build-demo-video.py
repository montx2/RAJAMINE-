#!/usr/bin/env python3
"""
build-demo-video.py — Gera um vídeo de demonstração profissional (MP4, 1920x1080,
30 fps, ≤ 60 s, sem áudio) para o SAFIP FieldOps.

Monta a linha do tempo com:
  * cartão de abertura e de encerramento (gráficos animados);
  * cabeçalhos de cena ("CENA 4 — Demonstração das funcionalidades",
    "CENA 5 — Segurança e benefícios");
  * takes das telas do sistema (screenshots em alta resolução) com motion
    (zoom/pan discretos), moldura de navegador e legendas inferiores;
  * cartão animado de segurança (criptografia, backups, LGPD, OWASP).

As legendas acompanham o roteiro de voz do cliente. Não há narração nem
trilha sonora — o vídeo é entregue sem áudio para a locução ser adicionada
depois.

Uso:
    python3 scripts/build-demo-video.py [--out SAFIP-FieldOps-Demo.mp4]

Requer: Pillow, imageio-ffmpeg (ou ffmpeg no PATH). Python 3.10+.
"""

from __future__ import annotations

import argparse
import subprocess
import sys
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

# ---------------------------------------------------------------------------
# Configuração global
# ---------------------------------------------------------------------------
W, H = 1920, 1080
FPS = 30
CROSSFADE = 0.45          # segundos de transição entre segmentos
FADE_IN = 0.6             # fade de abertura (de preto)
FADE_OUT = 0.9            # fade de encerramento (para preto)

BG = (14, 14, 20)          # grafite escuro (próximo de #18181B)
YELLOW = (255, 196, 0)     # #FFC400
WHITE = (244, 244, 248)
GRAY = (168, 168, 178)
GRAY_D = (110, 110, 120)
CARD_BORDER = (58, 58, 66)
CHROME = (23, 23, 30)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FIG = os.path.join(ROOT, "tcc", "figuras_tcc")
FONT_DIR = os.path.join(ROOT, "scripts", "assets", "fonts")


def font(weight: int, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(
        os.path.join(FONT_DIR, f"IBMPlexSans-{weight}.ttf"), size)


def smoothstep(x: float) -> float:
    x = max(0.0, min(1.0, x))
    return x * x * (3 - 2 * x)


def lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * t


def cover_fit(img: Image.Image, w: int, h: int) -> Image.Image:
    """Cobre a área w×h preservando proporção (crop central)."""
    scale = max(w / img.width, h / img.height)
    nw, nh = round(img.width * scale), round(img.height * scale)
    img = img.resize((nw, nh), Image.LANCZOS)
    x, y = (nw - w) // 2, (nh - h) // 2
    return img.crop((x, y, x + w, y + h))


def rounded_mask(w: int, h: int, r: int) -> Image.Image:
    m = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(m)
    d.rounded_rectangle((0, 0, w - 1, h - 1), radius=r, fill=255)
    return m


def chrome_bar(url_path: str) -> Image.Image:
    """Barra de navegador slim (canto superior arredondado)."""
    bar = Image.new("RGBA", (W, 76), (0, 0, 0, 0))
    d = ImageDraw.Draw(bar)
    d.rounded_rectangle((0, 0, W - 1, 75), radius=16, fill=CHROME + (255,))
    d.rectangle((0, 40, W, 75), fill=CHROME + (255,))
    for i, c in enumerate(((192, 70, 64), (206, 168, 48), (70, 180, 84))):
        d.ellipse((30 + i * 26, 27, 48 + i * 26, 45), fill=c + (255,))
    d.text((130, 26), "SAFIP FieldOps", font=font(600, 22), fill=(148, 148, 158, 255))
    pill_w = 460
    pill_x = W - 56 - pill_w
    d.rounded_rectangle((pill_x, 18, pill_x + pill_w, 58), radius=20, fill=(35, 35, 44, 255))
    d.text((pill_x + 26, 25), "app.safip.fieldops", font=font(400, 21), fill=(185, 185, 196, 255))
    d.text((pill_x + 210, 25), url_path, font=font(400, 21), fill=(120, 120, 130, 255))
    return bar


def caption_overlay(title: str, sub: str) -> Image.Image:
    """Legenda inferior (barras opacas — legível em qualquer tema)."""
    ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    bar_y1, bar_y2 = H - 176, H - 74
    d.rounded_rectangle((56, bar_y1, 1060, bar_y2), radius=12, fill=(10, 10, 14, 235))
    d.rectangle((56, bar_y1 + 18, 62, bar_y2 - 18), fill=YELLOW + (255,))
    d.text((92, bar_y1 + 16), title, font=font(600, 38), fill=WHITE + (255,))
    d.text((92, bar_y1 + 64), sub, font=font(400, 25), fill=(196, 196, 204, 255))
    # chip de cena (canto direito)
    chip_txt = "CENA 4 · FUNCIONALIDADES"
    f = font(600, 22)
    tw = d.textlength(chip_txt, font=f)
    cw = int(tw + 44)
    cx2 = W - 56
    cx1 = cx2 - cw
    d.rounded_rectangle((cx1, bar_y1 + 22, cx2, bar_y2 - 22), radius=10, fill=YELLOW + (255,))
    d.text((cx1 + 22, bar_y1 + 31), chip_txt, font=f, fill=(20, 20, 24, 255))
    return ov


def tag_chip(text: str) -> Image.Image:
    """Chip amarelo pequeno (útil para marcadores extras)."""
    ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    f = font(600, 20)
    tw = d.textlength(text, font=f)
    cw = int(tw + 40)
    x1 = W - 56 - cw
    d.rounded_rectangle((x1, 118, x1 + cw, 162), radius=10, fill=YELLOW + (255,))
    d.text((x1 + 20, 127), text, font=f, fill=(20, 20, 24, 255))
    return ov


# ---------------------------------------------------------------------------
# Cartões (gráficos animados)
# ---------------------------------------------------------------------------
class Card:
    """Base para cartões: fundo escuro + vinheta + glow animado."""

    def __init__(self, glow_xy=(560, 430), glow_r=760):
        self.glow_xy = glow_xy
        self.glow_r = glow_r
        glow = Image.new("RGBA", (glow_r * 2, glow_r * 2), (0, 0, 0, 0))
        gd = ImageDraw.Draw(glow)
        for r in range(glow_r, 0, -12):
            a = int(90 * (1 - r / glow_r) ** 2)
            gd.ellipse((glow_r - r, glow_r - r, glow_r + r, glow_r + r),
                       fill=(255, 196, 0, a))
        self.glow = glow.filter(ImageFilter.GaussianBlur(40))

    def background(self, shift: float = 0.0) -> Image.Image:
        canvas = Image.new("RGBA", (W, H), BG + (255,))
        dx = int(shift * 40)
        dy = int(shift * 22)
        gx = self.glow_xy[0] + dx - self.glow_r
        gy = self.glow_xy[1] + dy - self.glow_r
        canvas.alpha_composite(self.glow, (gx, gy))
        return canvas


class IntroCard(Card):
    def render(self, t: float, dur: float) -> Image.Image:
        c = self.background(shift=smoothstep(t / dur))
        d = ImageDraw.Draw(c)
        in_a = smoothstep(t / 0.6)
        # marca SAFIP em caixa alta
        d.text((W // 2, 300), "S A F I P", font=font(600, 36),
               fill=tuple(int(v * in_a) for v in YELLOW) + (255,), anchor="mm")
        d.text((W // 2, 400), "FIELDOPTS", font=font(700, 128),
               fill=tuple(int(v * in_a) for v in WHITE) + (255,), anchor="mm")
        if in_a > 0.4:
            a = smoothstep((t - 0.5) / 0.6)
            d.rounded_rectangle((W // 2 - 70, 512, W // 2 + 70, 522),
                                radius=5, fill=tuple(int(v * a) for v in YELLOW) + (255,))
            if a > 0.5:
                a2 = smoothstep((t - 0.8) / 0.6)
                d.text((W // 2, 590), "Gestão e Padronização de Relatórios de Campo",
                       font=font(400, 40),
                       fill=tuple(int(v * a2) for v in (200, 200, 208)) + (255,), anchor="mm")
                if a2 > 0.5:
                    a3 = smoothstep((t - 1.2) / 0.7)
                    d.rounded_rectangle((W // 2 - 330, 660, W // 2 + 330, 726),
                                        radius=33, outline=tuple(int(v * a3) for v in YELLOW) + (255,),
                                        width=2)
                    d.text((W // 2, 693), "OCR  ·  Padronização  ·  Aprovação  ·  Auditoria",
                           font=font(400, 26),
                           fill=tuple(int(v * a3) for v in GRAY) + (255,), anchor="mm")
        return c.convert("RGB")


class OutroCard(Card):
    def render(self, t: float, dur: float) -> Image.Image:
        c = self.background(shift=1 - smoothstep(t / dur))
        d = ImageDraw.Draw(c)
        a1 = smoothstep(t / 0.7)
        d.text((W // 2, 420), "SAFIP FieldOps", font=font(700, 100),
               fill=tuple(int(v * a1) for v in WHITE) + (255,), anchor="mm")
        a2 = smoothstep((t - 0.4) / 0.7)
        d.text((W // 2, 540), "rajamine.netlify.app", font=font(600, 48),
               fill=tuple(int(v * a2) for v in YELLOW) + (255,), anchor="mm")
        a3 = smoothstep((t - 0.9) / 0.7)
        d.text((W // 2, 630), "Relatórios de campo com rastreabilidade e segurança",
               font=font(400, 30),
               fill=tuple(int(v * a3) for v in GRAY) + (255,), anchor="mm")
        return c.convert("RGB")


class HeaderCard(Card):
    """Cabeçalho de cena: número, título, subtítulo e marcadores de take."""

    def __init__(self, numero: str, titulo: str, sub: str, dots: int):
        super().__init__(glow_xy=(1560, 240), glow_r=700)
        self.numero, self.titulo, self.sub, self.dots = numero, titulo, sub, dots

    def render(self, t: float, dur: float) -> Image.Image:
        c = self.background(shift=smoothstep(t / dur))
        d = ImageDraw.Draw(c)
        a = smoothstep(t / 0.5)
        # número fantasma
        d.text((W - 240, 430), self.numero, font=font(700, 300),
               fill=tuple(int(v * a * 0.16) for v in YELLOW) + (255,), anchor="mm")
        d.rectangle((90, 400, 98, 560), fill=tuple(int(v * a) for v in YELLOW) + (255,))
        d.text((150, 420), self.titulo, font=font(700, 84),
               fill=tuple(int(v * a) for v in WHITE) + (255,))
        d.text((152, 530), self.sub, font=font(400, 38),
               fill=tuple(int(v * a) for v in GRAY) + (255,))
        # marcadores de take
        n = self.dots
        total_w = n * 44
        x0 = W // 2 - total_w // 2 + 22
        for i in range(n):
            cx = x0 + i * 44
            if i == 0:
                d.ellipse((cx - 9, 620, cx + 9, 638), fill=YELLOW + (255,))
            else:
                d.ellipse((cx - 8, 621, cx + 8, 637), outline=(70, 70, 80, 255), width=2)
        return c.convert("RGB")


class SecurityCard(Card):
    """Cartão animado: tópicos de segurança + escudo + linha de varredura."""

    ROWS = (
        ("Criptografia", "Dados em trânsito e repouso"),
        ("Backups", "Estratégicos e continuidade do negócio"),
        ("LGPD", "Conformidade no tratamento de dados"),
        ("OWASP", "Práticas e testes de segurança"),
    )

    def render(self, t: float, dur: float) -> Image.Image:
        c = self.background(shift=smoothstep(t / dur))
        d = ImageDraw.Draw(c)
        a = smoothstep(t / 0.5)
        d.text((110, 120), "Segurança para produção", font=font(700, 54),
               fill=tuple(int(v * a) for v in WHITE) + (255,))
        d.rounded_rectangle((110, 196, 330, 202), radius=3,
                            fill=tuple(int(v * a) for v in YELLOW) + (255,))
        # escudo com check (aparece primeiro)
        sa = smoothstep((t - 0.3) / 0.6)
        if sa > 0:
            sx0, sy0, sx1, sy1 = 118, 300, 258, 560
            scale = 0.6 + 0.4 * sa
            cx, cy = (sx0 + sx1) / 2, (sy0 + sy1) / 2
            w2, h2 = (sx1 - sx0) / 2 * scale, (sy1 - sy0) / 2 * scale
            pts = [(cx, cy - h2), (cx + w2, cy - h2 * 0.62), (cx + w2, cy + h2 * 0.1),
                   (cx, cy + h2), (cx - w2, cy + h2 * 0.1), (cx - w2, cy - h2 * 0.62)]
            fill = tuple(int(v * sa) for v in YELLOW) + (int(255 * sa),)
            d.polygon(pts, fill=fill, outline=tuple(int(v * sa) for v in (30, 30, 34)) + (255,))
            if sa > 0.5:
                ca = smoothstep((t - 0.7) / 0.5)
                pts2 = [(cx - 42 * scale, cy + 4 * scale), (cx - 8 * scale, cy + 42 * scale),
                        (cx + 52 * scale, cy - 46 * scale)]
                d.line(pts2, fill=tuple(int(v * ca) for v in (20, 20, 24)) + (int(255 * ca),),
                       width=int(14 * scale), joint="curve")
        # linhas de varredura
        sweep = (t * 0.35) % 1.0
        sy = int(lerp(300, 560, sweep))
        sweep_a = int(120 * (1 - abs(sweep - 0.5) * 2))
        d.line((118, sy, 258, sy), fill=YELLOW + (sweep_a,), width=3)
        # tópicos
        y0 = 300
        for i, (title, sub) in enumerate(self.ROWS):
            ra = smoothstep((t - 0.6 - i * 0.35) / 0.5)
            if ra <= 0:
                continue
            y = y0 + i * 66
            cx = 340
            d.ellipse((cx, y, cx + 26, y + 26), fill=tuple(int(v * ra) for v in YELLOW) + (255,))
            d.line((cx + 7, y + 13, cx + 11, y + 18),
                   fill=(20, 20, 24, 255), width=3)
            d.line((cx + 11, y + 18, cx + 19, y + 8),
                   fill=(20, 20, 24, 255), width=3)
            d.text((cx + 46, y + 1), title, font=font(600, 30),
                   fill=tuple(int(v * ra) for v in WHITE) + (255,))
            tw = d.textlength(title, font=font(600, 30))
            d.text((cx + 46 + tw + 22, y + 6), sub, font=font(400, 26),
                   fill=tuple(int(v * ra) for v in GRAY) + (255,))
        # benefits
        ba = smoothstep((t - 2.2) / 0.6)
        if ba > 0:
            d.text((110, 640),
                   "Redução do trabalho manual  ·  eficiência  ·  organização  ·  segurança",
                   font=font(600, 27),
                   fill=tuple(int(v * ba) for v in (226, 196, 90)) + (255,))
        return c.convert("RGB")


# ---------------------------------------------------------------------------
# Segmento: take de tela
# ---------------------------------------------------------------------------
class Shot:
    """Take de uma tela do sistema com motion, moldura e legenda."""

    def __init__(self, img_path: str, url_path: str, title: str, sub: str,
                 tag: str, mode: str = "zoom", bias: float = 0.0):
        self.img = Image.open(img_path).convert("RGB")
        self.url_path, self.title, self.sub, self.tag = url_path, title, sub, tag
        self.mode, self.bias = mode, bias
        # área do cartão (janela)
        self.card = (56, 102, W - 56, H - 176)
        cw, ch = self.card[2] - self.card[0], self.card[3] - self.card[1]
        if mode == "portrait":
            self.fg_h = 820
            scale = self.fg_h / self.img.height
            fg_w = round(self.img.width * scale)
            self.fg = self.img.resize((fg_w, self.fg_h), Image.LANCZOS)
            self.bg = cover_fit(self.img, W, H).filter(ImageFilter.GaussianBlur(42))
            self.bg = self.bg.point(lambda v: int(v * 0.48)).convert("RGB")
        else:
            if mode == "pan":
                base_h = int(ch * 1.36)
                base_w = cw
            else:  # zoom
                base_w, base_h = int(cw * 1.18), int(ch * 1.18)
            self.base = cover_fit(self.img, base_w, base_h)
            self.base_w, self.base_h = base_w, base_h
        # elementos imutáveis
        self.shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        sd = ImageDraw.Draw(self.shadow)
        sd.rounded_rectangle((self.card[0] + 8, self.card[1] + 22,
                              self.card[2] + 8, self.card[3] + 22),
                             radius=16, fill=(0, 0, 0, 180))
        self.shadow = self.shadow.filter(ImageFilter.GaussianBlur(24))
        self.mask = rounded_mask(cw, ch, 16)
        self.chrome = chrome_bar(url_path)
        self.caption = caption_overlay(title, sub)
        self.tagchip = tag_chip(tag)

    def render(self, t: float, dur: float) -> Image.Image:
        tn = smoothstep(t / dur)
        canvas = Image.new("RGBA", (W, H), BG + (255,))
        cx0, cy0, cx1, cy1 = self.card
        cw, ch = cx1 - cx0, cy1 - cy0
        if self.mode == "portrait":
            k = 1.0 + 0.06 * tn
            fw, fh = round(self.fg.width / k), round(self.fg.height / k)
            piece = self.fg.resize((fw, fh), Image.LANCZOS)
            card_img = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
            card_img.paste(self.bg.crop((0, 0, cw, ch)), (0, 0))
            card_img.paste(piece, ((cw - fw) // 2, (ch - fh) // 2),
                           rounded_mask(fw, fh, 14))
        else:
            if self.mode == "pan":
                y = lerp((self.base_h - ch) / 2, (self.base_h - ch), tn)
                x = (self.base_w - cw) / 2
                crop = self.base.crop((int(x), int(y), int(x + cw), int(y + ch)))
                card_img = crop.convert("RGBA")
            else:
                k = 1.0 + 0.12 * tn
                cw_k, ch_k = cw / k, ch / k
                x = (self.base_w - cw_k) / 2
                y = (self.base_h - ch_k) / 2 - self.bias * ch
                crop = self.base.crop((int(x), int(y), int(x + cw_k), int(y + ch_k)))
                card_img = crop.resize((cw, ch), Image.LANCZOS).convert("RGBA")
        canvas.alpha_composite(self.shadow, (0, 0))
        canvas.paste(card_img, (cx0, cy0), self.mask)
        d = ImageDraw.Draw(canvas)
        d.rounded_rectangle(self.card, radius=16, outline=CARD_BORDER + (255,), width=2)
        canvas.alpha_composite(self.chrome, (0, 0))
        # legendas com fade suave
        ca = smoothstep((t - 0.25) / 0.3)
        if ca > 0:
            ov = self.caption.copy()
            ov.putalpha(ov.getchannel("A").point(lambda v: int(v * ca)))
            canvas.alpha_composite(ov, (0, 0))
            canvas.alpha_composite(self.tagchip, (0, 0))
        return canvas.convert("RGB")


# ---------------------------------------------------------------------------
# Linha do tempo
# ---------------------------------------------------------------------------
def build_timeline():
    segs = []
    segs.append(("intro", 3.8, IntroCard().render))
    segs.append(("header4", 1.8,
                 HeaderCard("04", "CENA 4", "Demonstração das funcionalidades", 7).render))
    segs.append(("shot:acesso", 3.4, Shot(
        os.path.join(FIG, "01-acesso.png"), "/login",
        "Acesso e perfis",
        "Login com perfis: administrador, revisão, colaborador e motorista",
        "CENA 4 · TAKE 1", "portrait").render))
    segs.append(("shot:painel", 4.0, Shot(
        os.path.join(FIG, "02-painel.png"), "/",
        "Painel de controle",
        "KPIs, prazos, produtividade e atalhos das operações",
        "CENA 4 · TAKE 2").render))
    segs.append(("shot:relatorios", 3.8, Shot(
        os.path.join(FIG, "03-relatorios.png"), "/relatorios",
        "Relatórios em trâmite",
        "Status, etapas e prazos visíveis em tempo real",
        "CENA 4 · TAKE 3").render))
    segs.append(("shot:ocr", 5.2, Shot(
        os.path.join(FIG, "07-ocr.png"), "/preencher/fotos",
        "OCR de séries e IMEI",
        "Leitura por foto no navegador — com confirmação humana",
        "CENA 4 · TAKE 4", bias=0.04).render))
    segs.append(("shot:padronizacao", 4.4, Shot(
        os.path.join(FIG, "06-padronizacao.png"), "/preencher/padronizar",
        "Padronização de textos",
        "1ª pessoa → 3ª pessoa, com diff e preservação do original",
        "CENA 4 · TAKE 5", "pan").render))
    segs.append(("shot:revisao", 4.2, Shot(
        os.path.join(FIG, "08-revisao-checklist.png"), "/revisao",
        "Revisão e aprovação",
        "Aprovação humana obrigatória — responsável, data e horário registrados",
        "CENA 4 · TAKE 6").render))
    segs.append(("shot:documentos", 4.2, Shot(
        os.path.join(FIG, "10-documentos-pdf.png"), "/documentos",
        "Duas versões automáticas",
        "Cliente (sem fotos) e interna (com fotos) em PDF",
        "CENA 4 · TAKE 7").render))
    segs.append(("header5", 1.8,
                 HeaderCard("05", "CENA 5", "Segurança e benefícios", 2).render))
    segs.append(("shot:historico", 4.0, Shot(
        os.path.join(FIG, "09-historico.png"), "/auditoria",
        "Busca e histórico",
        "Auditoria rastreável de cada documento e alteração",
        "CENA 5 · TAKE 1").render))
    segs.append(("security", 5.2, SecurityCard().render))
    segs.append(("outro", 3.6, OutroCard().render))
    return segs


def render_frame(t: float, segs, starts, ends, total_dur: float):
    """Monta o quadro em t, aplicando cruzamentos de desfoque entre segmentos."""
    active = []
    for i in range(len(segs) - 1):
        s0, s1 = starts[i], ends[i]
        if s0 <= t < s1 - CROSSFADE:
            active.append((i, 1.0))
        elif s1 - CROSSFADE <= t <= s1:
            k = (t - (s1 - CROSSFADE)) / CROSSFADE
            active.append((i, 1 - k))
            active.append((i + 1, k))
    last = len(segs) - 1
    if t >= starts[last] and not any(a[0] == last for a in active):
        active.append((last, 1.0))
    if not active:
        return Image.new("RGB", (W, H), BG)
    out = None
    for i, a in active:
        img = segs[i][2](t - starts[i], ends[i] - starts[i])
        img = img.convert("RGB")
        out = img if out is None else Image.blend(out, img, a)
    # fades gerais
    if t < FADE_IN:
        out = Image.blend(Image.new("RGB", (W, H), (0, 0, 0)), out, t / FADE_IN)
    if t > total_dur - FADE_OUT:
        out = Image.blend(out, Image.new("RGB", (W, H), (0, 0, 0)),
                          (t - (total_dur - FADE_OUT)) / FADE_OUT)
    # vinheta
    out = out.convert("RGBA")
    out.alpha_composite(VIGNETTE, (0, 0))
    return out.convert("RGB")


def build_vignette() -> Image.Image:
    """Vinheta suave: preto acumulado em elipses preenchidas (sem listras)."""
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    cx, cy = W / 2, H / 2
    maxd = ((W / 2) ** 2 + (H / 2) ** 2) ** 0.5
    for r in range(int(maxd), 0, -8):
        a = int(200 * (r / maxd) ** 3)
        d.ellipse((cx - r, cy - r * 0.62, cx + r, cy + r * 0.62),
                  fill=(0, 0, 0, a))
    return layer


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=os.path.join(ROOT, "SAFIP-FieldOps-Demo.mp4"))
    args = ap.parse_args()

    ffmpeg = None
    try:
        import imageio_ffmpeg
        ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        pass
    ffmpeg = ffmpeg or os.environ.get("FFMPEG", "ffmpeg")

    segs = build_timeline()
    starts, ends = [], []
    t = 0.0
    for _, dur, _ in segs:
        starts.append(t)
        ends.append(t + dur)
        t += dur
    total = t
    nframes = int(round(total * FPS))
    print(f"[video] {total:.1f}s · {nframes} quadros · {len(segs)} segmentos")

    cmd = [ffmpeg, "-hide_banner", "-loglevel", "error", "-y",
           "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
           "-r", str(FPS), "-i", "-",
           "-c:v", "libx264", "-preset", "slow", "-crf", "19",
           "-profile:v", "high", "-level", "4.2",
           "-pix_fmt", "yuv420p", "-movflags", "+faststart", args.out]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    black = Image.new("RGB", (W, H), (0, 0, 0))
    try:
        for fi in range(nframes):
            t = fi / FPS
            img = render_frame(t, segs, starts, ends, total)
            proc.stdin.write(img.tobytes())
            if fi % 60 == 0:
                print(f"[video] quadro {fi}/{nframes}  ({t:.1f}s)", flush=True)
    finally:
        proc.stdin.close()
        rc = proc.wait()
    print(f"[video] pronto → {args.out} (rc={rc})")
    return rc


VIGNETTE = build_vignette()

if __name__ == "__main__":
    sys.exit(main())
