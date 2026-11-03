import { describe, it, expect } from 'vitest';
import { realOperations, realReports, realEquipment } from '../src/data/referencias';
import { validateActivities, operationAlerts, toCsv } from '../src/lib/operations';
import { extractCandidates, matchCandidates } from '../src/services/ocr';
import { padronizar } from '../src/services/padronizacao';
import { buildWeeklyPdf } from '../src/services/pdf';
import type { Report } from '../src/data/types';

describe('Referências reais da Rajamine', () => {
  it('transcreve a planilha de operações preservando zeros à esquerda', () => {
    expect(realOperations.length).toBe(15);
    const tek = realOperations.find((r) => r.equipamento === 'TEK-9A00')!;
    expect(tek.telemetria).toBe('0035');
    const cedro = realReports.find((r) => r.id === 'r_201')!;
    expect(cedro.atividades?.[0].telemetria).toBe('0987');
    expect(toCsv(realOperations)).toContain('"0035"');
  });

  it('sinaliza possível transferência de dispositivos entre CP-5015 e CP-101', () => {
    const cedro = realReports.find((r) => r.id === 'r_201')!;
    const alerts = validateActivities(cedro.atividades ?? []);
    expect(alerts.some((a) => a.mensagem.includes('transferência legítima'))).toBe(true);
  });

  it('sinaliza atividades fora do período no consolidado semanal real', () => {
    const weekly = realReports.find((r) => r.id === 'r_204')!;
    const alerts = validateActivities(weekly.atividades ?? [], { inicio: weekly.periodoInicio, fim: weekly.periodoFim });
    expect(alerts.some((a) => a.mensagem.includes('ANTES do período'))).toBe(true);
  });

  it('alerta substituições registradas em observação (telemetria/tablet antigo)', () => {
    const alerts = operationAlerts(realOperations);
    expect(alerts.some((a) => a.mensagem.includes('Telemetria antiga: 0995'))).toBe(true);
    expect(alerts.some((a) => a.mensagem.includes('Tablet antigo: 2296'))).toBe(true);
  });

  it('OCR extrai códigos reais e IMEI, e associa ao cadastro', () => {
    const cands = extractCandidates('CP-101\n864993060408250\nTYE-9A00', 90);
    expect(cands.some((c) => c.normalizado === 'CP-101' && c.tipo === 'codigo')).toBe(true);
    expect(cands.some((c) => c.normalizado === '864993060408250' && c.tipo === 'imei')).toBe(true);
    const matches = matchCandidates(cands, realEquipment, '');
    expect(matches.find((m) => m.candidate.normalizado === 'CP-101')?.equipment?.id).toBe('eq_cp101');
    expect(matches.find((m) => m.candidate.tipo === 'imei')?.equipment?.codigo).toBe('CP-101');
  });

  it('padronização corrige concordância e acentuação sem inventar números', () => {
    const texto = 'Foi realizado instalação do equipamento CP-101, telemetria numero 0987, tablette pulsus 2758 e camera de fadiga 864993060408250.';
    const r = padronizar(texto, { tipo: 'visita_tecnica', dataViagem: '2026-09-22' });
    expect(r.sugerido).toContain('Foi realizada a instalação');
    expect(r.sugerido).toContain('câmera');
    expect(r.sugerido).toContain('tablet');
    expect(r.sugerido).toContain('0987');
    expect(r.sugerido).toContain('864993060408250');
  });

  it('consolidado semanal exige aprovação humana de todos os relatórios', async () => {
    const weekly = realReports.find((r) => r.id === 'r_204')!;
    await expect(buildWeeklyPdf([weekly], () => ({ equipamentos: [] }), { inicio: '2026-09-21', fim: '2026-09-25' }))
      .rejects.toThrow(/aprovação humana/);
    const approved: Report = { ...weekly, aprovadoEm: '2026-09-26T10:00:00Z', aprovadoPor: 'Revisora' };
    const bytes = await buildWeeklyPdf([approved], () => ({ equipamentos: [] }), { inicio: '2026-09-21', fim: '2026-09-25' });
    expect(bytes.byteLength).toBeGreaterThan(1000);
  });
});
