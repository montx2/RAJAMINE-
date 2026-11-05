/*
  Geração REAL de PDFs no navegador com pdf-lib (MIT).
  Layout alinhado aos documentos reais da operação: título em preto, faixa amarela,
  marca Rajamine, seções de visita técnica / atividade externa / semanal.
  · Documento CLIENTE: sem fotografias internas; exige aprovação humana registrada.
  · Documento INTERNO: fotos, OCR, texto original, sensação do cliente, melhorias e histórico.
*/
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import type { ActivityEntry, Client, Detection, Equipment, Photo, Report, Truck, User } from '../data/types';
import { ACTIVITY_KIND_LABEL } from '../data/types';
import { fmtDate, fmtDateTime, fmtKm } from '../lib/format';
import { BRAND as MARCA } from '../lib/brand';
import { verifyCode } from '../lib/id';

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 48;
const CONTENT_W = PAGE_W - MARGIN * 2;

const INK = rgb(0.09, 0.09, 0.11);
const BRAND = rgb(1, 0.769, 0);
const MUTED = rgb(0.35, 0.35, 0.4);
const BORDER = rgb(0.85, 0.85, 0.87);
const SOFT = rgb(0.965, 0.965, 0.96);
const WHITE = rgb(1, 1, 1);
const GREEN = rgb(0.08, 0.5, 0.24);

export interface PdfRefs {
  colaborador?: User;
  cliente?: Client;
  caminhao?: Truck;
  equipamentos: Equipment[];
}

export interface ResolvedPhoto { photo: Photo; bytes: ArrayBuffer | null; }
export type DocKind = 'cliente' | 'interno';

function sanitize(text: string): string {
  return text.replace(/→/g, '->').replace(/—/g, '-').replace(/–/g, '-').replace(/…/g, '...');
}

function wrapLines(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of sanitize(text).split('\n')) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length === 0) { lines.push(''); continue; }
    let line = '';
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) line = candidate;
      else {
        if (line) lines.push(line);
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
  doc: PDFDocument; page!: PDFPage; y = 0;
  font: PDFFont; bold: PDFFont; mono: PDFFont;
  codigo: string; kind: DocKind; title: string; pageCount = 0;

  constructor(doc: PDFDocument, font: PDFFont, bold: PDFFont, mono: PDFFont, codigo: string, kind: DocKind, title: string) {
    this.doc = doc; this.font = font; this.bold = bold; this.mono = mono;
    this.codigo = codigo; this.kind = kind; this.title = title;
    this.addPage(true);
  }

  /** Marca Rajamine: ladrilho grafite com o "R" em estratos amarelos + nome em negrito. */
  private wordmark(x: number, y: number, size: number) {
    const tile = size * 1.45;
    const bottom = y - size * 0.3;
    const k = tile / 64;
    const top = bottom + tile;
    this.page.drawSvgPath('M14 0H50A14 14 0 0 1 64 14V50A14 14 0 0 1 50 64H14A14 14 0 0 1 0 50V14A14 14 0 0 1 14 0Z', { x, y: top, scale: k, color: INK, borderWidth: 0 });
    for (const d of ['M15 13H24V51H15Z', 'M27 13H40L47 20V23H27Z', 'M27 26H47V29L40 36H27Z', 'M31 39H42L50 51H39Z']) {
      this.page.drawSvgPath(d, { x, y: top, scale: k, color: BRAND, borderWidth: 0 });
    }
    this.page.drawText(MARCA.empresa, { x: x + tile + size * 0.45, y, size, font: this.bold, color: INK });
  }

  /** Largura total da marca (ladrilho + espaço + nome). */
  private wordmarkWidth(size: number) {
    return size * 1.45 + size * 0.45 + this.bold.widthOfTextAtSize(MARCA.empresa, size);
  }

  addPage(first = false) {
    this.page = this.doc.addPage([PAGE_W, PAGE_H]);
    this.pageCount++;
    if (first) {
      const titleLines = wrapLines(this.title, this.bold, 15, CONTENT_W - 140);
      let ty = PAGE_H - 58;
      for (const line of titleLines.slice(0, 2)) {
        this.page.drawText(line, { x: MARGIN, y: ty, size: 15, font: this.bold, color: INK });
        ty -= 18;
      }
      const wmSize = 18;
      const wmW = this.wordmarkWidth(wmSize);
      this.wordmark(PAGE_W - MARGIN - wmW, PAGE_H - 56, wmSize);
      this.page.drawRectangle({ x: MARGIN, y: PAGE_H - 92, width: CONTENT_W, height: 6, color: BRAND });
      this.y = PAGE_H - 122;
    } else {
      this.page.drawRectangle({ x: 0, y: PAGE_H - 40, width: PAGE_W, height: 4, color: BRAND });
      this.wordmark(MARGIN, PAGE_H - 28, 10);
      const right = `${this.codigo} · ${this.kind === 'cliente' ? 'CLIENTE' : 'USO INTERNO'}`;
      this.page.drawText(right, { x: PAGE_W - MARGIN - this.font.widthOfTextAtSize(right, 8.5), y: PAGE_H - 28, size: 8.5, font: this.font, color: MUTED });
      this.y = PAGE_H - 66;
    }
  }

  ensure(h: number) { if (this.y - h < 64) this.addPage(); }

  heading(num: string, title: string) {
    this.ensure(40);
    this.y -= 10;
    this.page.drawText(`${num}. ${sanitize(title).toUpperCase()}`, { x: MARGIN, y: this.y, size: 10.5, font: this.bold, color: INK });
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
        this.page.drawText(sanitize(label).toUpperCase(), { x, y: this.y, size: 7.5, font: this.bold, color: MUTED });
        const lines = wrapLines(value || '—', this.font, 10, colW - 14);
        let yy = this.y - 14;
        for (const line of lines) { this.page.drawText(line, { x, y: yy, size: 10, font: this.font, color: INK }); yy -= 14; }
      });
      this.y -= h;
    }
    this.y -= 2;
  }

  table(headers: string[], rows: string[][], widths: number[]) {
    const size = 8.5; const pad = 6;
    const drawRow = (cells: string[], isHeader: boolean) => {
      const linesPerCell = cells.map((c, i) => wrapLines(c, isHeader ? this.bold : this.font, size, widths[i] - pad * 2));
      const h = Math.max(...linesPerCell.map((l) => l.length)) * (size + 3) + pad * 2;
      this.ensure(h + 4);
      if (isHeader) this.page.drawRectangle({ x: MARGIN, y: this.y - h + 8, width: CONTENT_W, height: h, color: SOFT });
      let x = MARGIN;
      cells.forEach((_, i) => {
        let yy = this.y - pad - size + 8;
        for (const line of linesPerCell[i]) {
          this.page.drawText(line, { x: x + pad, y: yy, size, font: isHeader ? this.bold : this.font, color: isHeader ? INK : MUTED });
          yy -= size + 3;
        }
        x += widths[i];
      });
      this.y -= h;
      this.page.drawLine({ start: { x: MARGIN, y: this.y + 8 }, end: { x: PAGE_W - MARGIN, y: this.y + 8 }, thickness: 0.6, color: BORDER });
    };
    drawRow(headers, true);
    if (rows.length === 0) drawRow(['Nenhum registro.', ...headers.slice(1).map(() => '')], false);
    for (const r of rows) drawRow(r, false);
    this.y -= 10;
  }

  async photos(items: ResolvedPhoto[]) {
    const boxW = (CONTENT_W - 16) / 2; const boxH = 150;
    for (let i = 0; i < items.length; i += 2) {
      const row = items.slice(i, i + 2);
      this.ensure(boxH + 46);
      for (let j = 0; j < row.length; j++) {
        const { photo, bytes } = row[j];
        const x = MARGIN + j * (boxW + 16); const top = this.y;
        this.page.drawRectangle({ x, y: top - boxH, width: boxW, height: boxH, color: SOFT, borderColor: BORDER, borderWidth: 0.8 });
        if (bytes) {
          try {
            const img = photo.mime.includes('png') ? await this.doc.embedPng(bytes) : await this.doc.embedJpg(bytes);
            const scale = Math.min(boxW / img.width, boxH / img.height);
            const w = img.width * scale, h = img.height * scale;
            this.page.drawImage(img, { x: x + (boxW - w) / 2, y: top - boxH + (boxH - h) / 2, width: w, height: h });
          } catch { this.page.drawText('(imagem indisponível)', { x: x + 10, y: top - boxH / 2, size: 9, font: this.font, color: MUTED }); }
        } else this.page.drawText('(imagem indisponível)', { x: x + 10, y: top - boxH / 2, size: 9, font: this.font, color: MUTED });
        const caption = wrapLines(`${photo.legenda || photo.nome}${photo.origem === 'demo' ? ' [imagem demonstrativa]' : ''}`, this.font, 7.5, boxW);
        let cy = top - boxH - 11;
        for (const line of caption.slice(0, 2)) { this.page.drawText(line, { x, y: cy, size: 7.5, font: this.font, color: MUTED }); cy -= 9.5; }
      }
      this.y -= boxH + 42;
    }
  }

  finish(verification: string) {
    const pages = this.doc.getPages();
    pages.forEach((p, i) => {
      p.drawLine({ start: { x: MARGIN, y: 50 }, end: { x: PAGE_W - MARGIN, y: 50 }, thickness: 0.6, color: BORDER });
      const left = `${MARCA.nomeCompleto} · Gerado eletronicamente · Verificação ${verification}`;
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

function activityRow(a: ActivityEntry): string[] {
  const ids = [a.cameraFadiga ? `Câmera ${a.cameraFadiga}` : '', a.galileo ? `Galileo ${a.galileo}` : ''].filter(Boolean).join(' / ') || '—';
  const ativ = `${ACTIVITY_KIND_LABEL[a.tipo]}${a.componentes?.length ? `: ${a.componentes.join(', ')}` : ''}`;
  return [a.equipamentoCodigo || '—', ativ, a.telemetria ?? '—', a.pulsus ?? '—', ids, a.observacao || a.descricao || '—'];
}

function clientTitle(report: Report, kind: DocKind): string {
  if (kind === 'interno') return 'RELATÓRIO DE ATIVIDADE EXTERNA - USO INTERNO';
  switch (report.tipo) {
    case 'visita_tecnica': return 'RELATÓRIO DE VISITA TÉCNICA';
    case 'atividade_externa': return 'RELATÓRIO DE ATIVIDADE EXTERNA';
    case 'semanal_viagens': return 'RELATÓRIO SEMANAL - VIAGENS';
    default: return 'RELATÓRIO DE VIAGEM - CLIENTE';
  }
}

export async function buildReportPdf(report: Report, refs: PdfRefs, kind: DocKind, resolvedPhotos: ResolvedPhoto[]): Promise<Uint8Array> {
  if (kind === 'cliente' && !report.aprovadoEm) {
    throw new Error('O documento do cliente exige aprovação humana registrada. Aprove o relatório na Central de Revisão antes de gerar.');
  }
  const doc = await PDFDocument.create();
  doc.setTitle(`${report.codigo} — ${clientTitle(report, kind)}`);
  doc.setAuthor(MARCA.nomeCompleto);
  doc.setCreator(`${MARCA.nomeCompleto} — protótipo`);
  doc.setProducer('pdf-lib');
  doc.setCreationDate(new Date());

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const mono = await doc.embedFont(StandardFonts.Courier);
  const f = new Flow(doc, font, bold, mono, report.codigo, kind, clientTitle(report, kind));

  const verification = verifyCode(JSON.stringify({
    id: report.id, atual: report.descricaoAtual, aprovadoEm: report.aprovadoEm, kind,
    eq: report.equipamentosIds, fotos: report.fotos.map((p) => p.id), atividades: report.atividades?.length ?? 0,
  }));

  const periodo = report.periodoInicio && report.periodoFim && report.periodoInicio !== report.periodoFim
    ? `${fmtDate(report.periodoInicio + 'T12:00:00')} a ${fmtDate(report.periodoFim + 'T12:00:00')}`
    : fmtDate(report.dataViagem + 'T12:00:00');

  f.heading('1', 'Dados da visita / atividade');
  f.kv([
    ['Empresa', refs.cliente?.nome ?? 'Consolidado semanal'],
    ['Consultor(a)', refs.colaborador ? `${refs.colaborador.nome} — ${refs.colaborador.cargo}` : '—'],
    ['Setor', report.setor || '—'],
    ['Cidade / Bairros', report.cidadeBairro || (refs.cliente?.cidade ? `${refs.cliente.cidade}/${refs.cliente.uf}` : '—')],
    ['Período', periodo],
    ['Objetivo', report.objetivo || '—'],
    ...(report.caminhaoId && refs.caminhao ? [['Caminhão', `${refs.caminhao.frota} · ${refs.caminhao.placa}`] as [string, string]] : []),
    ['Relatório', report.codigo],
  ]);

  f.heading('2', 'Atividades desempenhadas');
  if (report.atividades?.length) {
    f.table(['Equipamento', 'Atividade', 'Telemetria', 'Pulsus', 'Câmera / Galileo', 'Observação'],
      report.atividades.map(activityRow), [70, 130, 55, 50, 110, CONTENT_W - 415]);
  } else {
    f.paragraph(report.descricaoAtual || report.descricaoOriginal || 'Sem descrição registrada.');
  }
  if (report.descricaoAtual && report.atividades?.length) {
    f.paragraph(report.descricaoAtual, { size: 9.5, color: MUTED });
  }

  if (kind === 'cliente') {
    f.heading('3', 'Avaliação técnica');
    f.paragraph(report.avaliacaoTecnica || report.descricaoAtual || '—');
    f.heading('4', 'Revisão e aprovação');
    f.paragraph(`Este relatório foi revisado e aprovado por ${report.aprovadoPor ?? '—'} em ${fmtDateTime(report.aprovadoEm)}, após conferência humana das informações, dos equipamentos e das atividades registradas em campo.`);
    f.ensure(60);
    f.page.drawRectangle({ x: MARGIN, y: f.y - 40, width: CONTENT_W, height: 44, color: SOFT, borderColor: BORDER, borderWidth: 0.8 });
    f.page.drawText('APROVADO PARA ENVIO AO CLIENTE', { x: MARGIN + 12, y: f.y - 12, size: 9.5, font: bold, color: GREEN });
    f.page.drawText(`${report.aprovadoPor ?? '—'} · ${fmtDateTime(report.aprovadoEm)} · verificação ${verification}`, { x: MARGIN + 12, y: f.y - 27, size: 8.5, font, color: MUTED });
    f.y -= 58;
  } else {
    f.heading('3', 'Registro fotográfico');
    if (resolvedPhotos.length === 0) f.paragraph('Nenhuma fotografia anexada a este relatório.', { color: MUTED });
    else await f.photos(resolvedPhotos);

    f.heading('4', 'Leituras de identificação (OCR) e validação humana');
    const detRows = report.deteccoes.map((d: Detection) => {
      const photo = report.fotos.find((p) => p.id === d.photoId);
      const cands = d.candidatos.map((c) => `${c.normalizado} (${c.confianca}%)`).join('; ') || '—';
      const status = d.status === 'confirmado' ? `Confirmado: ${d.codigoConfirmado}` : d.status === 'corrigido' ? `Corrigido: ${d.codigoConfirmado}` : d.status === 'rejeitado' ? 'Rejeitado na conferência' : 'Aguardando conferência';
      return [photo?.nome ?? d.photoId, d.motor === 'demo' ? 'Simulado (demo)' : 'Tesseract local', cands, `${d.confianca}%`, `${status}${d.confirmadoPor ? ` — ${d.confirmadoPor}` : ''}`];
    });
    f.table(['Fotografia', 'Motor', 'Candidatos', 'Conf.', 'Resultado da conferência'], detRows, [95, 78, 130, 36, CONTENT_W - 339]);
    f.paragraph('Resultados de OCR são sugestões. A associação ao equipamento/caminhão somente é registrada após confirmação humana.', { size: 8, color: MUTED });

    f.heading('5', 'Texto original preservado');
    f.paragraph(report.descricaoOriginal || '—', { color: MUTED });

    f.heading('6', 'Percepção do cliente e melhorias');
    f.kv([
      ['Sensação do cliente', report.sensacaoCliente || 'Não informada'],
      ['Pontos positivos', report.pontosPositivos || 'Não informado'],
      ['Melhorias', report.melhorias || 'Não informado'],
      ['Hodômetro', report.kmInicio != null ? `${fmtKm(report.kmInicio)} a ${fmtKm(report.kmFim)}` : 'Não informado'],
    ]);

    f.heading('7', 'Notas de revisão');
    if (report.notasRevisao.length === 0) f.paragraph('Sem notas de revisão.', { color: MUTED });
    else for (const n of report.notasRevisao) f.paragraph(`[${fmtDateTime(n.criadaEm)}] ${n.autor} (${n.tipo}): ${n.texto}`, { size: 9 });

    f.heading('8', 'Histórico de alterações');
    f.table(['Data/hora', 'Responsável', 'Ação', 'Detalhe'], report.historico.map((h) => [fmtDateTime(h.em), h.ator, h.acao, h.detalhe ?? '—']), [92, 105, 130, CONTENT_W - 327]);
  }

  f.finish(verification);
  return doc.save();
}

/** Consolidado semanal real: agrupa relatórios aprovados por cliente/período. */
export async function buildWeeklyPdf(
  reports: Report[],
  refsFor: (r: Report) => PdfRefs,
  periodo: { inicio: string; fim: string; emissao?: string },
): Promise<Uint8Array> {
  const notApproved = reports.filter((r) => !r.aprovadoEm);
  if (notApproved.length) throw new Error(`O consolidado semanal exige aprovação humana de todos os relatórios selecionados. Pendentes: ${notApproved.map((r) => r.codigo).join(', ')}.`);

  const doc = await PDFDocument.create();
  doc.setTitle(`${MARCA.empresa} — Relatório semanal de viagens ${periodo.inicio} a ${periodo.fim}`);
  doc.setAuthor(MARCA.nomeCompleto);
  doc.setCreator(`${MARCA.nomeCompleto} — protótipo`);
  doc.setProducer('pdf-lib');
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const mono = await doc.embedFont(StandardFonts.Courier);
  const f = new Flow(doc, font, bold, mono, `SEM-${periodo.inicio}`, 'cliente', 'RELATÓRIO SEMANAL - VIAGENS');

  f.paragraph(`Data: ${fmtDate((periodo.emissao ?? periodo.fim) + 'T12:00:00')}`, { font: bold });
  f.paragraph(`O presente relatório tem como finalidade documentar as atividades de instalações, manutenções, reuniões e treinamentos realizados pela Equipe ${MARCA.empresa}, no período de ${fmtDate(periodo.inicio + 'T12:00:00')} a ${fmtDate(periodo.fim + 'T12:00:00')}, de forma presencial em empresas clientes, com o intuito de organizar e aprimorar nossos processos.`);

  const byClient = new Map<string, Report[]>();
  for (const r of reports) {
    const key = refsFor(r).cliente?.nome ?? 'Sem cliente';
    byClient.set(key, [...(byClient.get(key) ?? []), r]);
  }
  let idx = 1;
  for (const [clientName, list] of byClient) {
    f.heading(String(idx++), clientName);
    for (const r of list) {
      const refs = refsFor(r);
      f.kv([
        ['Data', fmtDate(r.dataViagem + 'T12:00:00')],
        ['Colaborador', refs.colaborador?.nome ?? '—'],
        ['Objetivo', r.objetivo || '—'],
        ['Relatório', r.codigo],
      ]);
      if (r.atividades?.length) {
        f.table(['Equipamento', 'Atividade', 'Telemetria', 'Pulsus', 'Câmera / Galileo', 'Observação'],
          r.atividades.map(activityRow), [70, 130, 55, 50, 110, CONTENT_W - 415]);
      } else {
        f.paragraph(r.descricaoAtual || r.descricaoOriginal || '—', { size: 9.5 });
      }
    }
  }
  const verification = verifyCode(JSON.stringify({ periodo, reports: reports.map((r) => r.id) }));
  f.finish(verification);
  return doc.save();
}

export function downloadBytes(bytes: Uint8Array, filename: string, mime = 'application/pdf') {
  const ab = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(ab).set(bytes);
  const blob = new Blob([ab], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function pdfBlobUrl(bytes: Uint8Array): string {
  const ab = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(ab).set(bytes);
  return URL.createObjectURL(new Blob([ab], { type: 'application/pdf' }));
}
