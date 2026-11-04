import { describe, it, expect } from 'vitest';
import { demoOperations, demoClientEquipment } from '../src/data/demoOperations';
import { demoStructuredReports } from '../src/data/demoReports';
import { validateActivities, operationAlerts, toCsv } from '../src/lib/operations';
import { extractCandidates, matchCandidates } from '../src/services/ocr';
import { padronizar } from '../src/services/padronizacao';
import { buildWeeklyPdf } from '../src/services/pdf';
import type { Report } from '../src/data/types';

describe('Base demonstrativa sintética', () => {
  it('operações preservam zeros à esquerda e formato de IDs', () => {
    expect(demoOperations.length).toBeGreaterThanOrEqual(12);
    const sr = demoOperations.find((r) => r.equipamento === 'SR-310')!;
    expect(sr.telemetria).toBe('0035');
    expect(toCsv(demoOperations)).toContain('"0035"');
    for (const op of demoOperations) {
      if (op.cameraFadiga) expect(op.cameraFadiga).toMatch(/^\d{15}$/);
      if (op.galileo) expect(op.galileo).toMatch(/^\d{15}$/);
    }
  });

  it('alerta substituições registradas em observação', () => {
    const alerts = operationAlerts(demoOperations);
    expect(alerts.some((a) => a.mensagem.includes('Telemetria antiga: 0995'))).toBe(true);
    expect(alerts.some((a) => a.mensagem.includes('Tablet antigo: 2296'))).toBe(true);
  });

  it('valida atividades fora do período sem corrigir silenciosamente', () => {
    const weekly = demoStructuredReports.find((r) => r.id === 'r_204')!;
    const alerts = validateActivities(weekly.atividades ?? [], { inicio: '2030-01-01', fim: '2030-01-02' });
    expect(alerts.some((a) => a.mensagem.includes('ANTES do período'))).toBe(true);
  });

  it('OCR extrai códigos e IMEI, e associa ao cadastro sintético', () => {
    const cands = extractCandidates('SA-101\n864993060408250\nVA-205', 90);
    expect(cands.some((c) => c.normalizado === 'SA-101' && c.tipo === 'codigo')).toBe(true);
    expect(cands.some((c) => c.normalizado === '864993060408250' && c.tipo === 'imei')).toBe(true);
    const matches = matchCandidates(cands, demoClientEquipment, '');
    expect(matches.find((m) => m.candidate.normalizado === 'SA-101')?.equipment?.id).toBe('eq_sa101');
    expect(matches.find((m) => m.candidate.tipo === 'imei')?.equipment?.codigo).toBe('SA-101');
  });

  it('padronização corrige concordância e acentuação sem inventar números', () => {
    const texto = 'Foi realizado instalação do equipamento SA-101, telemetria numero 0187, tablette pulsus 2741 e camera de fadiga 864993060408250.';
    const r = padronizar(texto, { tipo: 'visita_tecnica', dataViagem: '2026-11-03' });
    expect(r.sugerido).toContain('Foi realizada a instalação');
    expect(r.sugerido).toContain('câmera');
    expect(r.sugerido).toContain('tablet');
    expect(r.sugerido).toContain('0187');
    expect(r.sugerido).toContain('864993060408250');
  });

  it('consolidado semanal exige aprovação humana de todos os relatórios', async () => {
    const weekly = demoStructuredReports.find((r) => r.id === 'r_204')!;
    await expect(buildWeeklyPdf([weekly], () => ({ equipamentos: [] }), { inicio: weekly.periodoInicio!, fim: weekly.periodoFim! }))
      .rejects.toThrow(/aprovação humana/);
    const approved: Report = { ...weekly, aprovadoEm: new Date().toISOString(), aprovadoPor: 'Revisora' };
    const bytes = await buildWeeklyPdf([approved], () => ({ equipamentos: [] }), { inicio: weekly.periodoInicio!, fim: weekly.periodoFim! });
    expect(bytes.byteLength).toBeGreaterThan(1000);
  });
});
