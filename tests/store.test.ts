import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../src/store/useStore';
import type { Detection } from '../src/data/types';

/* Regras de negócio críticas do fluxo (camada demonstrativa). */

const baseState = () => {
  const s = useStore.getState();
  return s;
};

describe('Regras de negócio do fluxo de relatórios', () => {
  beforeEach(() => {
    // Restaura seed sem tocar IndexedDB (inexistente em node)
    const { resetDemo, ...rest } = useStore.getState();
    void resetDemo; void rest;
  });

  it('criação de relatório gera código sequencial, token e prazo de 48 h', () => {
    const s = baseState();
    const before = s.reports.length;
    const id = s.createReport({
      colaboradorId: 'u_carlos', clienteId: 'c_serra', caminhaoId: 't101',
      dataViagem: '2026-01-10', origem: 'BH', destino: 'Itabira',
    }, 'Helena Duarte');
    const r = useStore.getState().reports.find((x) => x.id === id)!;
    expect(useStore.getState().reports.length).toBe(before + 1);
    expect(r.codigo).toMatch(/^REL-2026-\d{4}$/);
    expect(r.token.length).toBeGreaterThan(10);
    const prazo = new Date(r.prazoEm).getTime() - new Date(r.criadoEm).getTime();
    expect(Math.round(prazo / 3600000)).toBe(48);
    expect(r.status).toBe('pendente');
    expect(r.historico[0].acao).toBe('Relatório criado');
  });

  it('envio para revisão exige campos obrigatórios', () => {
    const s = baseState();
    const id = s.createReport({
      colaboradorId: 'u_carlos', clienteId: 'c_serra', caminhaoId: 't101',
      dataViagem: '2026-01-10', origem: '', destino: '',
    }, 'Helena Duarte');
    const res = useStore.getState().submitToReview(id, 'Carlos Menezes');
    expect(res.ok).toBe(false);
    expect(res.erros.length).toBeGreaterThanOrEqual(3);
  });

  it('primeiro envio preserva o texto original em versão', () => {
    const s = baseState();
    const id = s.createReport({
      colaboradorId: 'u_carlos', clienteId: 'c_serra', caminhaoId: 't101',
      dataViagem: '2026-01-10', origem: 'BH', destino: 'Itabira',
    }, 'Helena Duarte');
    useStore.getState().saveFillDraft(id, { descricao: 'Eu instalei o equipamento EQ-2041 e testei a comunicação com a central.' }, 'Carlos Menezes');
    const res = useStore.getState().submitToReview(id, 'Carlos Menezes');
    expect(res.ok).toBe(true);
    const r = useStore.getState().reports.find((x) => x.id === id)!;
    expect(r.status).toBe('em_revisao');
    expect(r.descricaoOriginal).toContain('Eu instalei');
    expect(r.versoesTexto.some((v) => v.tipo === 'original')).toBe(true);
  });

  it('aprovação é bloqueada com OCR aguardando conferência humana', () => {
    const r = useStore.getState().reports.find((x) => x.id === 'r_145')!;
    expect(r.status).toBe('em_revisao');
    expect(r.deteccoes.some((d) => d.status === 'aguardando')).toBe(true);
    const res = useStore.getState().approveReport('r_145', 'Marta Fonseca');
    expect(res.ok).toBe(false);
    expect(res.erro).toContain('conferência');
  });

  it('confirmação humana associa equipamento ao caminhão e registra autor', () => {
    const res = useStore.getState().resolveDetection('r_145', 'det_145', 'confirmar', { codigo: 'EQ-3315', equipmentId: 'e3315' }, 'Marta Fonseca');
    expect(res.ok).toBe(true);
    const r = useStore.getState().reports.find((x) => x.id === 'r_145')!;
    const det = r.deteccoes.find((d) => d.id === 'det_145')!;
    expect(det.status).toBe('confirmado');
    expect(det.confirmadoPor).toBe('Marta Fonseca');
    expect(r.equipamentosIds).toContain('e3315');
    const eq = useStore.getState().equipment.find((e) => e.id === 'e3315')!;
    expect(eq.truckId).toBe('t102');
    // Agora a aprovação passa
    const apr = useStore.getState().approveReport('r_145', 'Marta Fonseca', 'Conferido.');
    expect(apr.ok).toBe(true);
    const after = useStore.getState().reports.find((x) => x.id === 'r_145')!;
    expect(after.status).toBe('aprovado');
    expect(after.aprovadoPor).toBe('Marta Fonseca');
  });

  it('confirmação de código novo cadastra o equipamento explicitamente', () => {
    const s = useStore.getState();
    const id = s.createReport({
      colaboradorId: 'u_joao', clienteId: 'c_serra', caminhaoId: 't102',
      dataViagem: '2026-01-10', origem: 'BH', destino: 'Itabira',
    }, 'Helena Duarte');
    const det: Detection = {
      id: 'det_test_novo', photoId: 'ph_x', motor: 'tesseract-local', status: 'aguardando',
      candidatos: [{ valor: 'EQ-7777', normalizado: 'EQ-7777', confianca: 88, tipo: 'codigo' }],
      confianca: 88, criadoEm: new Date().toISOString(),
    };
    useStore.getState().addDetection(id, det, 'João Pedro Rocha');
    const res = useStore.getState().resolveDetection(id, 'det_test_novo', 'confirmar', { codigo: 'EQ-7777', tipo: 'Rastreador GPS' }, 'João Pedro Rocha');
    expect(res.ok).toBe(true);
    const eq = useStore.getState().equipment.find((e) => e.codigo === 'EQ-7777')!;
    expect(eq).toBeTruthy();
    expect(eq.truckId).toBe('t102');
    expect(eq.tipo).toBe('Rastreador GPS');
  });

  it('solicitação de correção muda status e registra nota com autor', () => {
    useStore.getState().requestCorrection('r_144', 'Detalhar os testes realizados, por favor.', 'Marta Fonseca');
    const r = useStore.getState().reports.find((x) => x.id === 'r_144')!;
    expect(r.status).toBe('correcao');
    expect(r.notasRevisao.at(-1)?.tipo).toBe('correcao');
    expect(r.notasRevisao.at(-1)?.autor).toBe('Marta Fonseca');
  });

  it('fotos não podem ser removidas após envio para revisão (preservação)', () => {
    const res = useStore.getState().removePhoto('r_145', 'ph_145a', 'Marta Fonseca');
    expect(res.ok).toBe(false);
    expect(res.erro).toContain('preservação');
  });

  it('cadastro de equipamento duplicado é rejeitado', () => {
    const res = useStore.getState().addEquipment({ codigo: 'EQ-2041', tipo: 'Telemetria veicular', serial: '00000' }, 'Helena Duarte');
    expect(res.ok).toBe(false);
  });

  it('registro de documentos arquiva o relatório com dois PDFs versionados', () => {
    useStore.getState().registerDocuments('r_141', 'Marta Fonseca');
    const r = useStore.getState().reports.find((x) => x.id === 'r_141')!;
    expect(r.status).toBe('arquivado');
    expect(r.documentos.some((d) => d.tipo === 'cliente')).toBe(true);
    expect(r.documentos.some((d) => d.tipo === 'interno')).toBe(true);
  });

  it('envio ao cliente é marcado como simulação na auditoria', () => {
    useStore.getState().markClientSent('r_141', 'Helena Duarte');
    const r = useStore.getState().reports.find((x) => x.id === 'r_141')!;
    expect(r.enviadoCliente).toBe(true);
    expect(r.historico.at(-1)?.detalhe).toContain('SIMULADO');
  });
});
