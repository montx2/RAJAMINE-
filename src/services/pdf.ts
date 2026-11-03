/*
  Geração REAL de PDFs no navegador com pdf-lib (MIT).
  · Documento CLIENTE: sem fotografias internas; exige aprovação humana registrada.
  · Documento INTERNO: fotos originais, leituras OCR, texto original preservado,
    notas de revisão e histórico completo.
  Os PDFs são determinísticos a partir dos dados do relatório; o protótipo
  persiste metadados e regenera o arquivo sob demanda (ver docs/03-arquitetura.md).
*/
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import type { Client, Detection, Equipment, Photo, Report, Truck, User } from '../data/types';
import { fmtDate, fmtDateTime, fmtKm } from '../lib/format';
import { verifyCode } from '../lib/id';

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 48;
const CONTENT_W = PAGE_W - MARGIN * 2;

const NAVY = rgb(0.059, 0.09, 0.165);
const ACCENT = rgb(0.012, 0.412, 0.631);
const INK = rgb(0.02, 0.04, 0.09);
const MUTED = rgb(0.30, 0.36, 0.44);
const BORDER = rgb(0.85, 0.88, 0.91);
const SOFT = rgb(0.945, 0.96, 0.976);
const WHITE = rgb(1, 1, 1);
const GREEN = rgb(0.08, 0.5, 0.24);

export interface PdfRefs {
  colaborador?: User;
  cliente?: Client;
  caminhao?: Truck;
  equipamentos: Equipment[];
}

export interface ResolvedPhoto {
  photo: Photo;
  bytes: ArrayBuffer | null;
}

export type DocKind = 'cliente' | 'interno';

function wrapLines(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split('\n')) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length === 0) { lines.push(''); continue; }
    let line = '';
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        line = candidate;
      } else {
        if (line) lines.push(line);
        // palavra longa demais: quebra dura
        let w = word;
        while (font.widthOfTextAtSize(w, size) > maxWidth && w.length > 1) {
          let cut = w.length - 1;
          while (cut > 1 && font.widthOfTextAtSize(w.slice(0, cut), size) > maxWidth) cut--;
          lines.push(w.slice(0, cut));
          w = w.slice(cut);
        }
        line = w;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

class Flow {
  doc: PDFDocument;
  page!: PDFPage;
  y = 0;
  font: PDFFont;
  bold: PDFFont;
  mono: PDFFont;
  codigo: string;
  kind: DocKind;
  pageCount = 0;

  constructor(doc: PDFDocument, font: PDFFont, bold: PDFFont, mono: PDFFont, codigo: string, kind: DocKind) {
    this.doc = doc; this.font = font; this.bold = bold; this.mono = mono;
    this.codigo = codigo; this.kind = kind;
    this.addPage(true);
  }

  addPage(first = false) {
    this.page = this.doc.addPage([PAGE_W, PAGE_H]);
    this.pageCount++;
    if (first) {
      // Banda de cabeçalho
      this.page.drawRectangle({ x: 0, y: PAGE_H - 96, width: PAGE_W, height: 96, color: NAVY });
      this.page.drawRectangle({ x: 0, y: PAGE_H - 100, width: PAGE_W, height: 4, color: ACCENT });
      // Marca (hexágono simplificado)
      const cx = MARGIN + 14, cy = PAGE_H - 48;
      this.page.drawSvgPath('M 0 -16 L 14 -8 L 14 8 L 0 16 L -14 8 L -14 -8 Z', {
        x: cx, y: cy, borderColor: rgb(0.22, 0.74, 0.97), borderWidth: 2, color: undefined as never,
      });
      this.page.drawText('RAJAMINE', { x: MARGIN + 38, y: PAGE_H - 44, size: 19, font: this.bold, color: WHITE });
      this.page.drawText('INTELIGÊNCIA EM MINERAÇÃO', { x: MARGIN + 38, y: PAGE_H - 58, size: 7.5, font: this.font, color: rgb(0.62, 0.7, 0.8) });
      const tag = this.kind === 'cliente' ? 'RELATÓRIO DE VIAGEM — CLIENTE' : 'RELATÓRIO DE VIAGEM — USO INTERNO';
      const tagW = this.bold.widthOfTextAtSize(tag, 9);
      this.page.drawText(tag, { x: PAGE_W - MARGIN - tagW, y: PAGE_H - 40, size: 9, font: this.bold, color: WHITE });
      this.page.drawText(this.codigo, { x: PAGE_W - MARGIN - this.mono.widthOfTextAtSize(this.codigo, 10), y: PAGE_H - 56, size: 10, font: this.mono, color: rgb(0.55, 0.8, 0.98) });
      this.y = PAGE_H - 128;
    } else {
      this.page.drawRectangle({ x: 0, y: PAGE_H - 44, width: PAGE_W, height: 44, color: NAVY });
      this.page.drawText('RAJAMINE', { x: MARGIN, y: PAGE_H - 28, size: 10, font: this.bold, color: WHITE });
      const right = `${this.codigo} · ${this.kind === 'cliente' ? 'CLIENTE' : 'USO INTERNO'}`;
      this.page.drawText(right, { x: PAGE_W - MARGIN - this.font.widthOfTextAtSize(right, 8.5), y: PAGE_H - 28, size: 8.5, font: this.font, color: rgb(0.7, 0.77, 0.86) });
      this.y = PAGE_H - 72;
    }
  }

  ensure(h: number) {
    if (this.y - h < 64) this.addPage();
  }

  heading(num: string, title: string) {
    this.ensure(40);
    this.y -= 10;
    this.page.drawText(`${num}. ${title.toUpperCase()}`, { x: MARGIN, y: this.y, size: 10.5, font: this.bold, color: NAVY });
    this.y -= 8;
    this.page.drawLine({ start: { x: MARGIN, y: this.y }, end: { x: PAGE_W - MARGIN, y: this.y }, thickness: 1, color: BORDER });
    this.y -= 16;
  }

  paragraph(text: string, opts: { size?: number; color?: typeof INK; font?: PDFFont; gap?: number } = {}) {
    const size = opts.size ?? 10;
    const font = opts.font ?? this.font;
    const color = opts.color ?? INK;
    const lines = wrapLines(text || '—', font, size, CONTENT_W);
    for (const line of lines) {
      this.ensure(size + 5);
      this.page.drawText(line, { x: MARGIN, y: this.y, size, font, color });
      this.y -= size + 4.5;
    }
    this.y -= opts.gap ?? 6;
  }

  kv(pairs: Array<[string, string]>) {
    const colW = CONTENT_W / 2;
    for (let i = 0; i < pairs.length; i += 2) {
      const row = pairs.slice(i, i + 2);
      const heights = row.map(([, v]) => wrapLines(v || '—', this.font, 10, colW - 14).length);
      const h = Math.max(...heights) * 14 + 22;
      this.ensure(h);
      row.forEach(([label, value], j) => {
        const x = MARGIN + j * colW;
        this.page.drawText(label.toUpperCase(), { x, y: this.y, size: 7.5, font: this.bold, color: MUTED });
        const lines = wrapLines(value || '—', this.font, 10, colW - 14);
        let yy = this.y - 14;
        for (const line of lines) {
          this.page.drawText(line, { x, y: yy, size: 10, font: this.font, color: INK });
          yy -= 14;
        }
      });
      this.y -= h;
    }
    this.y -= 2;
  }

  table(headers: string[], rows: string[][], widths: number[]) {
    const size = 8.5;
    const pad = 6;
    const drawRow = (cells: string[], isHeader: boolean) => {
      const linesPerCell = cells.map((c, i) => wrapLines(c, isHeader ? this.bold : this.font, size, widths[i] - pad * 2));
      const h = Math.max(...linesPerCell.map((l) => l.length)) * (size + 3) + pad * 2;
      this.ensure(h + 4);
      if (isHeader) {
        this.page.drawRectangle({ x: MARGIN, y: this.y - h + 8, width: CONTENT_W, height: h, color: SOFT });
      }
      let x = MARGIN;
      cells.forEach((_, i) => {
        let yy = this.y - pad - size + 8;
        for (const line of linesPerCell[i]) {
          this.page.drawText(line, { x: x + pad, y: yy, size, font: isHeader ? this.bold : this.font, color: isHeader ? NAVY : INK });
          yy -= size + 3;
        }
        x += widths[i];
      });
      this.y -= h;
      this.page.drawLine({ start: { x: MARGIN, y: this.y + 8 }, end: { x: PAGE_W - MARGIN, y: this.y + 8 }, thickness: 0.6, color: BORDER });
    };
    drawRow(headers, true);
    if (rows.length === 0) {
      drawRow(['Nenhum registro.', ...headers.slice(1).map(() => '')], false);
    }
    for (const r of rows) drawRow(r, false);
    this.y -= 10;
  }

  async photos(items: ResolvedPhoto[]) {
    const boxW = (CONTENT_W - 16) / 2;
    const boxH = 150;
    for (let i = 0; i < items.length; i += 2) {
      const row = items.slice(i, i + 2);
      this.ensure(boxH + 46);
      for (let j = 0; j < row.length; j++) {
        const { photo, bytes } = row[j];
        const x = MARGIN + j * (boxW + 16);
        const top = this.y;
        this.page.drawRectangle({ x, y: top - boxH, width: boxW, height: boxH, color: SOFT, borderColor: BORDER, borderWidth: 0.8 });
        if (bytes) {
          try {
            const img = photo.mime.includes('png') ? await this.doc.embedPng(bytes) : await this.doc.embedJpg(bytes);
            const scale = Math.min(boxW / img.width, boxH / img.height);
            const w = img.width * scale, h = img.height * scale;
            this.page.drawImage(img, { x: x + (boxW - w) / 2, y: top - boxH + (boxH - h) / 2, width: w, height: h });
          } catch {
            this.page.drawText('(imagem indisponível)', { x: x + 10, y: top - boxH / 2, size: 9, font: this.font, color: MUTED });
          }
        } else {
          this.page.drawText('(imagem indisponível)', { x: x + 10, y: top - boxH / 2, size: 9, font: this.font, color: MUTED });
        }
        const caption = wrapLines(`${photo.legenda || photo.nome}${photo.origem === 'demo' ? ' [imagem demonstrativa]' : ''}`, this.font, 7.5, boxW);
        let cy = top - boxH - 11;
        for (const line of caption.slice(0, 2)) {
          this.page.drawText(line, { x, y: cy, size: 7.5, font: this.font, color: MUTED });
          cy -= 9.5;
        }
      }
      this.y -= boxH + 42;
    }
  }

  finish(verification: string) {
    const pages = this.doc.getPages();
    pages.forEach((p, i) => {
      p.drawLine({ start: { x: MARGIN, y: 50 }, end: { x: PAGE_W - MARGIN, y: 50 }, thickness: 0.6, color: BORDER });
      const left = `Rajamine FieldOps · Gerado eletronicamente · Verificação ${verification}`;
      p.drawText(left, { x: MARGIN, y: 38, size: 7, font: this.font, color: MUTED });
      const right = `Página ${i + 1} de ${pages.length}`;
      p.drawText(right, { x: PAGE_W - MARGIN - this.font.widthOfTextAtSize(right, 7), y: 38, size: 7, font: this.font, color: MUTED });
      const note = this.kind === 'cliente'
        ? 'Documento destinado ao cliente. Não contém fotografias de uso interno.'
        : 'Documento de uso interno. Contém fotografias e registros operacionais.';
      p.drawText(note, { x: MARGIN, y: 27, size: 6.5, font: this.font, color: MUTED });
    });
  }
}

export async function buildReportPdf(
  report: Report,
  refs: PdfRefs,
  kind: DocKind,
  resolvedPhotos: ResolvedPhoto[],
): Promise<Uint8Array> {
  if (kind === 'cliente' && !report.aprovadoEm) {
    throw new Error('O documento do cliente exige aprovação humana registrada. Aprove o relatório na Central de Revisão antes de gerar.');
  }

  const doc = await PDFDocument.create();
  doc.setTitle(`${report.codigo} — Relatório de viagem (${kind})`);
  doc.setAuthor('Rajamine FieldOps');
  doc.setCreator('Rajamine FieldOps — protótipo');
  doc.setProducer('pdf-lib');
  doc.setCreationDate(new Date());

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const mono = await doc.embedFont(StandardFonts.Courier);
  const f = new Flow(doc, font, bold, mono, report.codigo, kind);

  const verification = verifyCode(JSON.stringify({
    id: report.id, atual: report.descricaoAtual, aprovadoEm: report.aprovadoEm, kind,
    eq: report.equipamentosIds, fotos: report.fotos.map((p) => p.id),
  }));

  const equipados = refs.equipamentos.filter((e) => report.equipamentosIds.includes(e.id));
  const caminhaoTxt = refs.caminhao ? `${refs.caminhao.frota} · ${refs.caminhao.placa} · ${refs.caminhao.marca} ${refs.caminhao.modelo}` : '—';

  // 1. Dados da viagem
  f.heading('1', 'Dados da viagem');
  f.kv([
    ['Relatório', report.codigo],
    ['Data da viagem', fmtDate(report.dataViagem + 'T12:00:00')],
    ['Colaborador', refs.colaborador ? `${refs.colaborador.nome} — ${refs.colaborador.cargo}` : '—'],
    ['Cliente', refs.cliente ? `${refs.cliente.nome} (${refs.cliente.cidade}/${refs.cliente.uf})` : '—'],
    ['Caminhão', caminhaoTxt],
    ['Trajeto', `${report.origem || '—'} → ${report.destino || '—'}`.replace('→', '->')],
    ['Hodômetro', report.kmInicio != null ? `${fmtKm(report.kmInicio)} a ${fmtKm(report.kmFim)}` : 'Não informado'],
    ['Situação', report.status === 'arquivado' ? 'Aprovado e arquivado' : 'Aprovado'],
  ]);

  // 2. Descrição
  f.heading('2', 'Descrição das atividades');
  f.paragraph(report.descricaoAtual || report.descricaoOriginal || 'Sem descrição registrada.');

  // 3. Equipamentos
  f.heading('3', 'Equipamentos identificados');
  f.table(
    ['Código', 'Tipo', 'Nº de série', 'Validação'],
    equipados.map((e) => {
      const det = report.deteccoes.find((d) => d.equipmentId === e.id && (d.status === 'confirmado' || d.status === 'corrigido'));
      return [
        e.codigo, e.tipo, e.serial,
        det ? `Confirmado por ${det.confirmadoPor ?? '—'} em ${fmtDateTime(det.confirmadoEm)}` : 'Registro manual',
      ];
    }),
    [70, 130, 80, CONTENT_W - 280],
  );

  if (kind === 'cliente') {
    // 4. Aprovação
    f.heading('4', 'Revisão e aprovação');
    f.paragraph(
      `Este relatório foi revisado e aprovado por ${report.aprovadoPor ?? '—'} em ${fmtDateTime(report.aprovadoEm)}, ` +
      'após conferência humana das informações, dos equipamentos e das atividades registradas em campo.',
    );
    f.ensure(60);
    f.page.drawRectangle({ x: MARGIN, y: f.y - 40, width: CONTENT_W, height: 44, color: SOFT, borderColor: BORDER, borderWidth: 0.8 });
    f.page.drawText('APROVADO PARA ENVIO AO CLIENTE', { x: MARGIN + 12, y: f.y - 12, size: 9.5, font: bold, color: GREEN });
    f.page.drawText(`${report.aprovadoPor ?? '—'} · ${fmtDateTime(report.aprovadoEm)} · código de verificação ${verification}`, { x: MARGIN + 12, y: f.y - 27, size: 8.5, font, color: MUTED });
    f.y -= 58;
  } else {
    // 4. Fotos
    f.heading('4', 'Registro fotográfico');
    if (resolvedPhotos.length === 0) {
      f.paragraph('Nenhuma fotografia anexada a este relatório.', { color: MUTED });
    } else {
      await f.photos(resolvedPhotos);
    }

    // 5. OCR
    f.heading('5', 'Leituras de identificação (OCR) e validação humana');
    const detRows = report.deteccoes.map((d: Detection) => {
      const photo = report.fotos.find((p) => p.id === d.photoId);
      const cands = d.candidatos.map((c) => `${c.normalizado} (${c.confianca}%)`).join('; ') || '—';
      const status = d.status === 'confirmado' ? `Confirmado: ${d.codigoConfirmado}` :
        d.status === 'corrigido' ? `Corrigido: ${d.codigoConfirmado}` :
        d.status === 'rejeitado' ? 'Rejeitado na conferência' : 'Aguardando conferência';
      return [
        photo?.nome ?? d.photoId,
        d.motor === 'demo' ? 'Simulado (demo)' : 'Tesseract local',
        cands,
        `${d.confianca}%`,
        `${status}${d.confirmadoPor ? ` — ${d.confirmadoPor}` : ''}`,
      ];
    });
    f.table(['Fotografia', 'Motor', 'Candidatos', 'Conf.', 'Resultado da conferência'], detRows, [95, 78, 130, 36, CONTENT_W - 339]);
    f.paragraph('Resultados de OCR são sugestões. A associação ao caminhão somente é registrada após confirmação humana.', { size: 8, color: MUTED });

    // 6. Texto original
    f.heading('6', 'Texto original preservado');
    f.paragraph(report.descricaoOriginal || '—', { color: MUTED });

    // 7. Notas de revisão
    f.heading('7', 'Notas de revisão');
    if (report.notasRevisao.length === 0) {
      f.paragraph('Sem notas de revisão.', { color: MUTED });
    } else {
      for (const n of report.notasRevisao) {
        f.paragraph(`[${fmtDateTime(n.criadaEm)}] ${n.autor} (${n.tipo}): ${n.texto}`, { size: 9 });
      }
    }

    // 8. Histórico
    f.heading('8', 'Histórico de alterações');
    f.table(
      ['Data/hora', 'Responsável', 'Ação', 'Detalhe'],
      report.historico.map((h) => [fmtDateTime(h.em), h.ator, h.acao, h.detalhe ?? '—']),
      [92, 105, 130, CONTENT_W - 327],
    );
  }

  f.finish(verification);
  return doc.save();
}

export function downloadBytes(bytes: Uint8Array, filename: string, mime = 'application/pdf') {
  const ab = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(ab).set(bytes);
  const blob = new Blob([ab], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function pdfBlobUrl(bytes: Uint8Array): string {
  const ab = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(ab).set(bytes);
  return URL.createObjectURL(new Blob([ab], { type: 'application/pdf' }));
}
