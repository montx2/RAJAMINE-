#!/usr/bin/env python3
"""
build-demo-video.py (v2) — Vídeo de demonstração profissional do SAFIP FieldOps.

Aplica as técnicas de edição profissional de demos de produto:
  * takes em tela cheia da interface (clara, igual ao app), sem moldura falsa;
  * cursor animado com ease que se move até o ponto de interesse, pausa e
    gera ripple (guia o olhar antes da "ação", como em gravações profissionais);
  * zoom/pan suaves no ponto que importa, com dissolvências e transições;
  * legendas inferiores com motion (entrada por baixo) e callouts limpos;
  * cartões de capítulo entre cenas, abertura e encerramento da marca;
  * trilha sonora: pad ambiente quente + cliques de UI + whooshes nas
    transições (a narração pode ser adicionada depois).

Uso:
    python3 scripts/build-demo-video.py [--out SAFIP-FieldOps-Demo.mp4]

Requer: Pillow, numpy, imageio-ffmpeg. Python 3.10+.
"""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
import wave

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

# ---------------------------------------------------------------------------
# Configuração global
# ---------------------------------------------------------------------------
W, H = 1920, 1080
FPS = 60
CROSSFADE = 0.35
FADE_IN = 0.6
FADE_OUT = 0.9

BG = (247, 247, 248)          # fundo claro do app (Clean Glass light)
INK = (24, 24, 27)            # grafite #18181B
YELLOW = (255, 196, 0)        # #FFC400
WHITE = (255, 255, 255)
GRAY = (120, 120, 128)
GRAY_L = (214, 214, 220)
CARD_LINE = (228, 228, 232)

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


def clamp(v, lo, hi):
    return max(lo, min(hi, v))


def cover_fit(img: Image.Image, w: int, h: int) -> Image.Image:
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


# ---------------------------------------------------------------------------
# Cursor (seta realista) e ripple
# ---------------------------------------------------------------------------
CURSOR_POLY = [(0, 0), (20, 8), (12, 8), (26, 20), (20, 20),
               (10, 38), (6, 22), (0, 22)]


def draw_cursor(d: ImageDraw.ImageDraw, x: float, y: float, alpha: float,
                scale: float = 1.0):
    if alpha <= 0.01:
        return
    pts = [(int(x + px * scale), int(y + py * scale)) for px, py in CURSOR_POLY]
    s = int(6 * scale)
    shadow = [(x + px * scale + s, y + py * scale + s) for px, py in CURSOR_POLY]
    d.polygon(shadow, fill=(120, 120, 130, int(70 * alpha)))
    d.polygon(pts, fill=WHITE + (int(255 * alpha),),
              outline=INK + (int(200 * alpha),))


def draw_ripple(d: ImageDraw.ImageDraw, x: float, y: float, p: float):
    """p: 0→1 expansão do ripple de clique."""
    r = lerp(10, 64, smoothstep(p))
    a = int(190 * (1 - p))
    d.ellipse((x - r, y - r, x + r, y + r), outline=INK + (a,), width=3)
    d.ellipse((x - r * 0.5, y - r * 0.5, x + r * 0.5, y + r * 0.5),
              fill=YELLOW + (int(60 * (1 - p)),))


# ---------------------------------------------------------------------------
# Elementos de UI do vídeo
# ---------------------------------------------------------------------------
def caption_pill(title: str, sub: str) -> Image.Image:
    """Pilula de legenda inferior (escura, legível sobre UI clara)."""
    ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    bar_y1, bar_y2 = H - 190, H - 78
    d.rounded_rectangle((64, bar_y1, 1180, bar_y2), radius=14, fill=(20, 20, 26, 240))
    d.rectangle((64, bar_y1 + 20, 70, bar_y2 - 20), fill=YELLOW + (255,))
    d.text((104, bar_y1 + 18), title, font=font(600, 40), fill=WHITE + (255,))
    d.text((104, bar_y1 + 74), sub, font=font(400, 26), fill=(206, 206, 212, 255))
    return ov, bar_y1


def brand_mark() -> Image.Image:
    ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    d.ellipse((48, 30, 58, 40), fill=YELLOW + (235,))
    d.text((72, 24), "SAFIP FieldOps", font=font(600, 22), fill=(150, 150, 158, 235))
    return ov


def chrome_done():
    return None  # v2: sem barra de navegador falsa — tela cheia do app


# ---------------------------------------------------------------------------
# Cartões (clara, identidade da marca)
# ---------------------------------------------------------------------------
class LightCard:
    def __init__(self, glow_xy=(1560, 220), glow_r=700):
        self.glow_xy = glow_xy
        self.glow_r = glow_r
        glow = Image.new("RGBA", (glow_r * 2, glow_r * 2), (0, 0, 0, 0))
        gd = ImageDraw.Draw(glow)
        for r in range(glow_r, 0, -12):
            a = int(55 * (1 - r / glow_r) ** 2)
            gd.ellipse((glow_r - r, glow_r - r, glow_r + r, glow_r + r),
                       fill=(255, 196, 0, a))
        self.glow = glow.filter(ImageFilter.GaussianBlur(60))

    def background(self, shift: float = 0.0) -> Image.Image:
        canvas = Image.new("RGBA", (W, H), BG + (255,))
        dx, dy = int(shift * 36), int(shift * 20)
        canvas.alpha_composite(self.glow,
                               (self.glow_xy[0] + dx - self.glow_r,
                                self.glow_xy[1] + dy - self.glow_r))
        return canvas


class IntroCard(LightCard):
    def render(self, t: float, dur: float) -> Image.Image:
        c = self.background(shift=smoothstep(t / dur))
        d = ImageDraw.Draw(c)
        a = smoothstep(t / 0.7)
        d.text((W // 2, 340), "S A F I P", font=font(600, 34),
               fill=tuple(int(v * a) for v in (160, 120, 0)) + (255,), anchor="mm")
        d.text((W // 2, 440), "FIELDOPTS", font=font(700, 128),
               fill=INK + (int(255 * a),), anchor="mm")
        if a > 0.5:
            a2 = smoothstep((t - 0.6) / 0.6)
            d.rounded_rectangle((W // 2 - 70, 548, W // 2 + 70, 560),
                                radius=6, fill=YELLOW + (int(255 * a2),))
            if a2 > 0.5:
                a3 = smoothstep((t - 1.0) / 0.7)
                d.text((W // 2, 640), "Gestão e Padronização de Relatórios de Campo",
                       font=font(400, 42),
                       fill=tuple(int(v * a3) for v in (90, 90, 96)) + (255,), anchor="mm")
                if a3 > 0.5:
                    a4 = smoothstep((t - 1.5) / 0.8)
                    d.rounded_rectangle((W // 2 - 360, 720, W // 2 + 360, 790),
                                        radius=35, outline=INK + (int(90 * a4),), width=2)
                    d.text((W // 2, 755),
                           "OCR  ·  Padronização  ·  Aprovação  ·  Auditoria",
                           font=font(600, 28),
                           fill=tuple(int(v * a4) for v in (110, 110, 118)) + (255,), anchor="mm")
        return c.convert("RGB")


class OutroCard(LightCard):
    def render(self, t: float, dur: float) -> Image.Image:
        c = self.background(shift=1 - smoothstep(t / dur))
        d = ImageDraw.Draw(c)
        a1 = smoothstep(t / 0.7)
        d.text((W // 2, 420), "SAFIP FieldOps", font=font(700, 104),
               fill=INK + (int(255 * a1),), anchor="mm")
        a2 = smoothstep((t - 0.4) / 0.7)
        d.text((W // 2, 550), "rajamine.netlify.app", font=font(600, 50),
               fill=tuple(int(v * a2) for v in (150, 110, 0)) + (255,), anchor="mm")
        a3 = smoothstep((t - 0.9) / 0.7)
        d.text((W // 2, 640), "Relatórios de campo com rastreabilidade e segurança",
               font=font(400, 32),
               fill=tuple(int(v * a3) for v in (120, 120, 128)) + (255,), anchor="mm")
        return c.convert("RGB")


class HeaderCard(LightCard):
    def __init__(self, numero: str, titulo: str, sub: str, dots: int):
        super().__init__(glow_xy=(340, 220), glow_r=650)
        self.numero, self.titulo, self.sub, self.dots = numero, titulo, sub, dots

    def render(self, t: float, dur: float) -> Image.Image:
        c = self.background(shift=smoothstep(t / dur))
        d = ImageDraw.Draw(c)
        a = smoothstep(t / 0.5)
        d.text((W - 250, 420), self.numero, font=font(700, 300),
               fill=tuple(int(v * a * 0.10) for v in INK) + (255,), anchor="mm")
        d.rectangle((96, 400, 106, 560), fill=YELLOW + (int(255 * a),))
        d.text((156, 415), self.titulo, font=font(700, 92),
               fill=INK + (int(255 * a),))
        d.text((158, 530), self.sub, font=font(400, 40),
               fill=tuple(int(v * a) for v in (120, 120, 128)) + (255,))
        n = self.dots
        total_w = n * 44
        x0 = W // 2 - total_w // 2 + 22
        for i in range(n):
            cx = x0 + i * 44
            if i == 0:
                d.ellipse((cx - 9, 620, cx + 9, 638), fill=YELLOW + (255,))
            else:
                d.ellipse((cx - 8, 621, cx + 8, 637), outline=(200, 200, 206, 255), width=2)
        return c.convert("RGB")


class SecurityCard(LightCard):
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
        d.text((110, 120), "Segurança para produção", font=font(700, 56),
               fill=INK + (int(255 * a),))
        d.rounded_rectangle((110, 198, 330, 205), radius=4,
                            fill=YELLOW + (int(255 * a),))
        sa = smoothstep((t - 0.3) / 0.6)
        if sa > 0:
            cx, cy = 188, 420
            w2, h2 = 70 * sa, 88 * sa
            pts = [(cx, cy - h2), (cx + w2, cy - h2 * 0.62), (cx + w2, cy + h2 * 0.1),
                   (cx, cy + h2), (cx - w2, cy + h2 * 0.1), (cx - w2, cy - h2 * 0.62)]
            d.polygon(pts, fill=tuple(int(v * sa * 0.12) for v in YELLOW) + (255,),
                      outline=tuple(int(v * sa) for v in (140, 100, 0)) + (255,), width=4)
            if sa > 0.5:
                ca = smoothstep((t - 0.7) / 0.5)
                d.line([(cx - 34, cy + 4), (cx - 6, cy + 34), (cx + 42, cy - 38)],
                       fill=YELLOW + (int(255 * ca),), width=12, joint="curve")
        for i, (title, sub) in enumerate(self.ROWS):
            ra = smoothstep((t - 0.6 - i * 0.35) / 0.5)
            if ra <= 0:
                continue
            y = 300 + i * 68
            cx = 360
            d.ellipse((cx, y, cx + 28, y + 28), fill=YELLOW + (int(255 * ra),))
            d.line((cx + 7, y + 14, cx + 11, y + 19), fill=INK + (int(255 * ra),), width=3)
            d.line((cx + 11, y + 19, cx + 20, y + 8), fill=INK + (int(255 * ra),), width=3)
            d.text((cx + 50, y + 2), title, font=font(600, 32),
                   fill=INK + (int(255 * ra),))
            tw = d.textlength(title, font=font(600, 32))
            d.text((cx + 50 + tw + 24, y + 7), sub, font=font(400, 27),
                   fill=tuple(int(v * ra) for v in (120, 120, 128)) + (255,))
        ba = smoothstep((t - 2.2) / 0.6)
        if ba > 0:
            d.text((110, 660),
                   "Redução do trabalho manual  ·  eficiência  ·  organização  ·  segurança",
                   font=font(600, 28),
                   fill=tuple(int(v * ba) for v in (130, 95, 0)) + (255,))
        return c.convert("RGB")


# ---------------------------------------------------------------------------
# Take de tela (tela cheia + cursor + zoom/pan)
# ---------------------------------------------------------------------------
class Shot:
    """Take de uma tela do sistema: tela cheia, cursor e zoom no ponto certo."""

    def __init__(self, img_path: str, title: str, sub: str, *,
                 zoom_target=(0.5, 0.5), zoom_zoom=1.5, pan: bool = False,
                 portrait: bool = False, cursor: bool = True,
                 cursor_from=(0.05, 0.92)):
        self.img = Image.open(img_path).convert("RGB")
        self.title, self.sub = title, sub
        self.zoom_target = zoom_target      # normalizado na screenshot
        self.zoom_zoom = zoom_zoom
        self.pan = pan
        self.portrait = portrait
        self.use_cursor = cursor
        self.cursor_from = cursor_from
        w, h = self.img.size
        # base de exibição
        if portrait:
            self.fg_h = 860
            scale = self.fg_h / h
            self.fg = self.img.resize((round(w * scale), self.fg_h), Image.LANCZOS)
            fw, fh = self.fg.size
            self.card = (W // 2 - fw // 2, 150, W // 2 + fw // 2, 150 + fh)
        else:
            if pan:
                self.base = cover_fit(self.img, W, int(H * 1.36))
            else:
                self.base = cover_fit(self.img, W, H)
            self.card = (0, 0, W, H)
        self.caption, self.cap_y1 = caption_pill(title, sub)
        self.brand = brand_mark()
        # posição do alvo do zoom em coordenadas da base
        if portrait:
            tzx = W // 2 + self.zoom_target[0] * self.card[2] - self.card[0] - self.fg.width / 2
            tzy = 150 + self.zoom_target[1] * self.fg_h
            self.target = (W // 2, tzy)
        else:
            # coordenadas normalizadas → base (cover-fit)
            self.target = self._norm_to_base(zoom_target[0], zoom_target[1])

    def _norm_to_base(self, nx: float, ny: float):
        w, h = self.img.size
        # cover-fit: scale e offset
        scale = max(W / w, H / h)
        nw, nh = w * scale, h * scale
        ox, oy = (nw - W) / 2, (nh - H) / 2
        x = clamp(nx * nw - ox, 0, W)
        y = clamp(ny * nh - oy, 0, H)
        return (x, y)

    def render(self, t: float, dur: float) -> Image.Image:
        tn = clamp(t / dur, 0, 1)
        canvas = Image.new("RGBA", (W, H), BG + (255,))
        cx0, cy0, cx1, cy1 = self.card
        cw, ch = cx1 - cx0, cy1 - cy0
        # fase do cursor (antes do zoom)
        cursor_dur = 1.2
        move_t = clamp(t / cursor_dur, 0, 1)
        ease = smoothstep(move_t)
        fx = lerp(self.cursor_from[0] * W, self.target[0], ease)
        fy = lerp(self.cursor_from[1] * H, self.target[1], ease)
        pause = 0.35
        ripple_p = clamp((t - cursor_dur) / 0.35, 0, 1)
        cursor_alpha = 1.0
        if t > cursor_dur + pause:
            cursor_alpha = 1 - smoothstep((t - cursor_dur - pause) / 0.25)
        # fase de zoom/pan
        z_start = cursor_dur + pause + 0.3
        z_p = clamp((t - z_start) / (dur - z_start), 0, 1)
        z_ease = smoothstep(z_p)
        # imagem base (crop)
        if self.portrait:
            card_img = self.fg
            k = 1.0 + 0.04 * z_ease
            fw, fh = round(self.fg.width / k), round(self.fg.height / k)
            piece = self.fg.resize((fw, fh), Image.LANCZOS)
            canvas.paste(piece, (cx0 + (cw - fw) // 2, cy0 + (ch - fh) // 2),
                         rounded_mask(fw, fh, 14))
            shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            sd = ImageDraw.Draw(shadow)
            sd.rounded_rectangle((cx0 + 10, cy0 + 26, cx1 + 10, cy1 + 26),
                                 radius=16, fill=(0, 0, 0, 60))
            canvas.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(20)), (0, 0))
        else:
            if self.pan:
                y = lerp(0, self.base.height - H, z_ease)
                crop = self.base.crop((0, int(y), W, int(y + H)))
                card_img = crop
            else:
                k = 1.0 + (self.zoom_zoom - 1.0) * z_ease
                tw, th = W / k, H / k
                tx, ty = self.target
                x = clamp(tx - tw / 2, 0, W - tw)
                y = clamp(ty - th / 2, 0, H - th)
                crop = self.base.crop((int(x), int(y), int(x + tw), int(y + th)))
                card_img = crop.resize((W, H), Image.LANCZOS)
                if z_ease > 0.05:
                    card_img = card_img.filter(
                        ImageFilter.UnsharpMask(radius=1.1, percent=55))
            canvas.paste(card_img, (cx0, cy0))
        d = ImageDraw.Draw(canvas)
        if self.portrait:
            d.rounded_rectangle(self.card, radius=14, outline=CARD_LINE + (255,), width=2)
        # cursor + ripple (sobre a imagem, antes da legenda)
        if self.use_cursor and t < z_start + 0.15:
            draw_cursor(d, fx, fy, cursor_alpha, scale=1.15)
            if ripple_p > 0 and ripple_p < 1:
                draw_ripple(d, fx, fy, ripple_p)
        # marca + legenda com motion
        canvas.alpha_composite(self.brand, (0, 0))
        ca = smoothstep((t - (cursor_dur + pause + 0.4)) / 0.4)
        if ca > 0:
            ov = self.caption.copy()
            off = int(24 * (1 - ca))
            ov.putalpha(ov.getchannel("A").point(lambda v: int(v * ca)))
            canvas.alpha_composite(ov, (0, off))
        return canvas.convert("RGB")


# ---------------------------------------------------------------------------
# Linha do tempo
# ---------------------------------------------------------------------------
def build_timeline():
    segs = []
    segs.append(("intro", 3.5, IntroCard().render))
    segs.append(("header4", 1.8,
                 HeaderCard("04", "CENA 4", "Demonstração das funcionalidades", 7).render))
    segs.append(("shot:acesso", 3.4, Shot(
        os.path.join(FIG, "01-acesso.png"),
        "Acesso com perfis de permissão",
        "Administrador · revisão · colaborador · motorista",
        zoom_target=(0.5, 0.62), portrait=True,
        cursor_from=(0.1, 0.88)).render))
    segs.append(("shot:painel", 4.0, Shot(
        os.path.join(FIG, "02-painel.png"),
        "Painel de controle",
        "KPIs, prazos, produtividade e atalhos",
        zoom_target=(0.19, 0.29),
        cursor_from=(0.04, 0.95)).render))
    segs.append(("shot:relatorios", 3.6, Shot(
        os.path.join(FIG, "03-relatorios.png"),
        "Relatórios em trâmite",
        "Status, etapas e prazos visíveis",
        zoom_target=(0.36, 0.62),
        cursor_from=(0.95, 0.95)).render))
    segs.append(("shot:ocr", 5.0, Shot(
        os.path.join(FIG, "07-ocr.png"),
        "OCR de séries e IMEI",
        "Leitura por foto no navegador — com confirmação humana",
        zoom_target=(0.73, 0.43), zoom_zoom=1.6,
        cursor_from=(0.06, 0.9)).render))
    segs.append(("shot:padronizacao", 4.0, Shot(
        os.path.join(FIG, "06-padronizacao.png"),
        "Padronização de textos",
        "1ª pessoa → 3ª pessoa, com diff e preservação do original",
        zoom_target=(0.4, 0.36), pan=True,
        cursor_from=(0.95, 0.9)).render))
    segs.append(("shot:revisao", 3.8, Shot(
        os.path.join(FIG, "08-revisao-checklist.png"),
        "Revisão e aprovação",
        "Aprovação humana obrigatória — responsável, data e horário",
        zoom_target=(0.31, 0.43),
        cursor_from=(0.05, 0.92)).render))
    segs.append(("shot:documentos", 3.8, Shot(
        os.path.join(FIG, "10-documentos-pdf.png"),
        "Duas versões automáticas",
        "Cliente (sem fotos) e interna (com fotos) em PDF",
        zoom_target=(0.17, 0.69),
        cursor_from=(0.95, 0.92)).render))
    segs.append(("header5", 1.8,
                 HeaderCard("05", "CENA 5", "Segurança e benefícios", 2).render))
    segs.append(("shot:historico", 3.8, Shot(
        os.path.join(FIG, "09-historico.png"),
        "Busca e histórico",
        "Auditoria rastreável de cada documento e alteração",
        zoom_target=(0.18, 0.23),
        cursor_from=(0.05, 0.92)).render))
    segs.append(("security", 5.0, SecurityCard().render))
    segs.append(("outro", 3.5, OutroCard().render))
    return segs


def render_frame(t: float, segs, starts, ends, total_dur: float):
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
        img = segs[i][2](t - starts[i], ends[i] - starts[i]).convert("RGB")
        out = img if out is None else Image.blend(out, img, a)
    if t < FADE_IN:
        out = Image.blend(Image.new("RGB", (W, H), WHITE), out, t / FADE_IN)
    if t > total_dur - FADE_OUT:
        out = Image.blend(out, Image.new("RGB", (W, H), WHITE),
                          (t - (total_dur - FADE_OUT)) / FADE_OUT)
    return out


# ---------------------------------------------------------------------------
# Áudio: pad ambiente + cliques de UI + whooshes
# ---------------------------------------------------------------------------
SR = 44100


def synth_music(path: str, dur: float):
    ff = get_ffmpeg()
    cmd = [ff, "-hide_banner", "-loglevel", "error", "-y"]
    for f in (130.81, 164.81, 196.00, 246.94, 261.63):
        cmd += ["-f", "lavfi", "-i",
                f"sine=frequency={f}:duration={dur}:sample_rate={SR}"]
    fc = ("[0:a]tremolo=f=0.10:d=0.35,volume=0.9[a];"
          "[1:a]tremolo=f=0.14:d=0.30,volume=0.8[b];"
          "[2:a]tremolo=f=0.12:d=0.25,volume=0.7[c];"
          "[3:a]tremolo=f=0.17:d=0.20,volume=0.5[d];"
          "[4:a]tremolo=f=0.11:d=0.22,volume=0.45[e];"
          "[a][b][c][d][e]amix=inputs=5:duration=longest:normalize=0,"
          "volume=0.5,lowpass=f=2200,"
          "aecho=0.7:0.6:90|180:0.22|0.16,"
          f"afade=t=in:d=2.5,afade=t=out:st={dur-2.5:.1f}:d=2.5,"
          "aformat=sample_fmts=fltp:sample_rates=%d:channel_layouts=stereo" % SR)
    cmd += ["-filter_complex", fc, path]
    subprocess.run(cmd, check=True)


def read_wav_stereo(path: str) -> np.ndarray:
    with wave.open(path, "rb") as wf:
        n = wf.getnframes()
        data = wf.readframes(n)
    return np.frombuffer(data, dtype=np.int16).reshape(-1, 2).astype(np.float32) / 32768.0


def write_wav_stereo(path: str, x: np.ndarray):
    x = np.clip(x, -1, 1)
    with wave.open(path, "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        wf.writeframes((x * 32767).astype(np.int16).tobytes())


def click_burst(dur: float = 0.06) -> np.ndarray:
    n = int(SR * dur)
    t = np.arange(n) / SR
    env = np.exp(-t * 90)
    tone = np.sin(2 * np.pi * 1300 * t) * 0.6 + np.sin(2 * np.pi * 650 * t) * 0.4
    noise = np.random.RandomState(7).randn(n) * 0.25
    x = (tone * 0.8 + noise) * env
    return np.stack([x, x], axis=1)


def whoosh(dur: float = 0.55) -> np.ndarray:
    n = int(SR * dur)
    t = np.arange(n) / SR
    env = np.minimum(1, np.minimum(t * 6, (dur - t) * 6)) ** 1.5
    x = np.random.RandomState(11).randn(n) * env
    # sweep filtragem simples: atenuação de baixas
    k = np.hanning(n)
    x = np.convolve(x, np.ones(6) / 6, mode="same")
    x = x - np.convolve(x, np.ones(40) / 40, mode="same") * 0.6
    return np.stack([x, x], axis=1) * 0.7


def build_audio(path: str, total_dur: float, events: list):
    """events: (t, 'click'|'whoosh')"""
    synth_music(path + ".music.wav", total_dur)
    music = read_wav_stereo(path + ".music.wav")
    n = music.shape[0]
    out = music * 0.85
    for t, kind in events:
        i0 = int(t * SR)
        if kind == "click":
            c = click_burst()
        else:
            c = whoosh()
        if i0 + c.shape[0] <= n:
            out[i0:i0 + c.shape[0]] += c * (0.35 if kind == "click" else 0.25)
        else:
            out[i0:] += c[:n - i0] * (0.35 if kind == "click" else 0.25)
    write_wav_stereo(path, out)
    os.remove(path + ".music.wav")


def get_ffmpeg() -> str:
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return os.environ.get("FFMPEG", "ffmpeg")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=os.path.join(ROOT, "SAFIP-FieldOps-Demo.mp4"))
    ap.add_argument("--no-audio", action="store_true")
    args = ap.parse_args()

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

    audio = None
    if not args.no_audio:
        audio = "/tmp/demo-audio.wav"
        events = []
        # cliques sincronizados com a pausa do cursor em cada take
        for tt in (6.9, 10.3, 14.3, 17.9, 22.9, 26.9, 30.7, 36.3):
            events.append((tt, "click"))
        # whooshes nas transições de cena
        for tt in (5.3, 8.7, 12.7, 16.3, 21.3, 25.3, 29.1, 32.9, 34.7, 38.5, 43.5):
            events.append((tt, "whoosh"))
        build_audio(audio, total, events)
        print("[video] áudio gerado")

    ff = get_ffmpeg()
    cmd = [ff, "-hide_banner", "-loglevel", "error", "-y",
           "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
           "-r", str(FPS), "-i", "-"]
    if audio:
        cmd += ["-i", audio]
    cmd += ["-c:v", "libx264", "-preset", "slow", "-crf", "19",
            "-profile:v", "high", "-level", "4.2", "-pix_fmt", "yuv420p",
            "-movflags", "+faststart"]
    if audio:
        cmd += ["-c:a", "aac", "-b:a", "192k", "-shortest"]
    cmd += [args.out]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    try:
        for fi in range(nframes):
            img = render_frame(fi / FPS, segs, starts, ends, total)
            proc.stdin.write(img.tobytes())
            if fi % 300 == 0:
                print(f"[video] quadro {fi}/{nframes}  ({fi/FPS:.1f}s)", flush=True)
    finally:
        proc.stdin.close()
        rc = proc.wait()
    print(f"[video] pronto → {args.out} (rc={rc})")
    return rc


if __name__ == "__main__":
    sys.exit(main())
