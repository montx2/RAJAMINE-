import { describe, it, expect } from 'vitest';
import { buildReportPdf } from '../src/services/pdf';
import { seedReports, seedUsers, seedClients, seedTrucks, seedEquipment } from '../src/data/seed';

const refs = {
  colaborador: seedUsers.find((u) => u.id === 'u_andre'),
  cliente: seedClients.find((c) => c.id === 'c_aco'),
  caminhao: seedTrucks.find((t) => t.id === 't103'),
  equipamentos: seedEquipment,
};

describe('Geração real de PDFs (pdf-lib)', () => {
  it('bloqueia documento do cliente sem aprovação humana', async () => {
    const report = seedReports.find((r) => r.id === 'r_145')!; // em_revisao, sem aprovação
    await expect(buildReportPdf(report, refs, 'cliente', [])).rejects.toThrow(/aprovação humana/);
  });

  it('gera PDF do cliente aprovado com cabeçalho %PDF', async () => {
    const report = seedReports.find((r) => r.id === 'r_141')!; // aprovado
    const bytes = await buildReportPdf(report, refs, 'cliente', []);
    expect(bytes.length).toBeGreaterThan(2000);
    const header = new TextDecoder().decode(bytes.slice(0, 5));
    expect(header).toBe('%PDF-');
  });

  it('gera PDF interno com seções de auditoria', async () => {
    const report = seedReports.find((r) => r.id === 'r_141')!;
    const bytes = await buildReportPdf(report, refs, 'interno', []);
    expect(bytes.length).toBeGreaterThan(2000);
    const header = new TextDecoder().decode(bytes.slice(0, 5));
    expect(header).toBe('%PDF-');
  });
});
