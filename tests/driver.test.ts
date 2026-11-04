import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../src/store/useStore';
import { buildChecklistItems, checklistProgress, itemToOccurrenceCategory, suggestSeverity, occurrenceTemplate } from '../src/lib/driver';
import { seedTrucks, seedEquipment } from '../src/data/seed';

/* Portal do Motorista — automações permitidas e bloqueios de aprovação/envio. */

beforeEach(async () => {
  await useStore.getState().resetDemo();
  useStore.setState({ session: { userId: 'u_mot_joao', role: 'motorista' } });
});

describe('Geração automática de checklist', () => {
  it('gera itens do veículo + equipamentos instalados no caminhão', () => {
    const items = buildChecklistItems(seedTrucks.find((t) => t.id === 't101'), seedEquipment);
    const keys = items.map((i) => i.key);
    expect(keys).toContain('pneus');
    expect(keys).toContain('freios');
    expect(keys).toContain('telemetria');
    expect(items.every((i) => i.status === 'nao_verificado')).toBe(true);
    expect(checklistProgress(items)).toBe(0);
  });

  it('ensureDriverChecklist não duplica para mesmo motorista/caminhão/data/turno', () => {
    const s = useStore.getState();
    const a = s.ensureDriverChecklist('u_mot_joao', 't101', { data: '2030-01-01', turno: 'dia' });
    const b = useStore.getState().ensureDriverChecklist('u_mot_joao', 't101', { data: '2030-01-01', turno: 'dia' });
    expect(a).toBe(b);
    const c = useStore.getState().ensureDriverChecklist('u_mot_joao', 't101', { data: '2030-01-01', turno: 'noite' });
    expect(c).not.toBe(a);
  });

  it('bloqueia envio com itens não verificados', () => {
    const id = useStore.getState().ensureDriverChecklist('u_mot_joao', 't101', { data: '2030-01-01', turno: 'dia' });
    const res = useStore.getState().submitDriverChecklist(id, 'João Batista');
    expect(res.ok).toBe(false);
    expect(res.erros.join(' ')).toMatch(/pendente/i);
  });

  it('marcar tudo OK + enviar conclui automaticamente sem ocorrência', () => {
    const id = useStore.getState().ensureDriverChecklist('u_mot_joao', 't101', { data: '2030-01-01', turno: 'dia' });
    useStore.getState().markAllChecklistOk(id, 'João Batista');
    const before = useStore.getState().driverOccurrences.length;
    const res = useStore.getState().submitDriverChecklist(id, 'João Batista');
    expect(res.ok).toBe(true);
    expect(res.ocorrenciasIds).toHaveLength(0);
    const c = useStore.getState().driverChecklists.find((x) => x.id === id)!;
    expect(c.status).toBe('concluido');
    expect(useStore.getState().driverOccurrences.length).toBe(before);
    expect(useStore.getState().driverSyncQueue.some((q) => q.refId === id && q.status === 'pendente')).toBe(true);
  });

  it('falha em item abre ocorrência automática e notifica coordenação (simulação)', () => {
    const id = useStore.getState().ensureDriverChecklist('u_mot_joao', 't101', { data: '2030-01-01', turno: 'dia' });
    useStore.getState().markAllChecklistOk(id, 'João Batista');
    const c0 = useStore.getState().driverChecklists.find((x) => x.id === id)!;
    const cam = c0.items.find((i) => i.key === 'camera') ?? c0.items.find((i) => i.categoria === 'equipamento')!;
    useStore.getState().updateDriverChecklistItem(id, cam.id, { status: 'falha', observacao: 'Lente obstruída por poeira.' }, 'João Batista');
    const res = useStore.getState().submitDriverChecklist(id, 'João Batista');
    expect(res.ok).toBe(true);
    expect(res.ocorrenciasIds.length).toBe(1);
    const occ = useStore.getState().driverOccurrences.find((o) => o.id === res.ocorrenciasIds[0])!;
    expect(occ.codigo).toMatch(/^OCO-2026-\d{4}$/);
    expect(occ.origem).toBe('checklist');
    expect(occ.status).toBe('aberta');
    expect(occ.descricao).toContain('Lente obstruída');
    const c = useStore.getState().driverChecklists.find((x) => x.id === id)!;
    expect(c.status).toBe('em_analise');
    expect(useStore.getState().notifications.some((n) => n.para === 'admin' && n.occurrenceId === occ.id)).toBe(true);
    expect(useStore.getState().notifications.some((n) => n.para === 'revisora' && n.occurrenceId === occ.id)).toBe(true);
  });
});

describe('Ocorrências e triagem humana', () => {
  it('motorista não abre ocorrência em caminhão de outro motorista', () => {
    const res = useStore.getState().createDriverOccurrence({
      motoristaId: 'u_mot_joao', caminhaoId: 't103', categoria: 'outro', severidade: 'baixa',
      descricao: 'Teste de ocorrência em caminhão não vinculado.',
    }, 'João Batista');
    expect(res.ok).toBe(false);
  });

  it('coordenação resolve ocorrência e motorista recebe notificação direcionada', () => {
    useStore.setState({ session: { userId: 'u_helena', role: 'admin' } });
    const res = useStore.getState().setDriverOccurrenceStatus('oco_1', 'resolvida', 'Helena Duarte', 'Equipe acionada; telemetria restabelecida.');
    expect(res.ok).toBe(true);
    const occ = useStore.getState().driverOccurrences.find((o) => o.id === 'oco_1')!;
    expect(occ.status).toBe('resolvida');
    expect(occ.resolvidaPor).toBe('Helena Duarte');
    const n = useStore.getState().notifications.find((x) => x.occurrenceId === 'oco_1' && x.userId === 'u_mot_joao');
    expect(n).toBeTruthy();
    expect(n!.para).toBe('motorista');
  });

  it('motorista não pode alterar status de ocorrência (aprovação/triagem é humana da coordenação)', () => {
    const res = useStore.getState().setDriverOccurrenceStatus('oco_1', 'resolvida', 'João Batista', 'auto');
    expect(res.ok).toBe(false);
  });
});

describe('Treinamento e sincronização simulada', () => {
  it('ciência exige nome digitado igual ao cadastro e não duplica', () => {
    const bad = useStore.getState().confirmDriverTraining('u_mot_joao', 'trein_tablet', 'Uso do tablet Pulsus', 'Joao', 'João Batista');
    expect(bad.ok).toBe(false);
    const ok = useStore.getState().confirmDriverTraining('u_mot_joao', 'trein_tablet', 'Uso do tablet Pulsus', 'João Batista', 'João Batista');
    expect(ok.ok).toBe(true);
    const dup = useStore.getState().confirmDriverTraining('u_mot_joao', 'trein_tablet', 'Uso do tablet Pulsus', 'João Batista', 'João Batista');
    expect(dup.ok).toBe(false);
  });

  it('syncDriverQueue marca pendentes como sincronizados (simulação)', () => {
    const id = useStore.getState().ensureDriverChecklist('u_mot_joao', 't101', { data: '2030-01-01', turno: 'dia' });
    useStore.getState().markAllChecklistOk(id, 'João Batista');
    useStore.getState().submitDriverChecklist(id, 'João Batista');
    expect(useStore.getState().driverSyncQueue.some((q) => q.status === 'pendente')).toBe(true);
    const n = useStore.getState().syncDriverQueue();
    expect(n).toBeGreaterThan(0);
    expect(useStore.getState().driverSyncQueue.every((q) => q.status === 'sincronizado')).toBe(true);
    expect(useStore.getState().driverChecklists.find((c) => c.id === id)!.syncedAt).toBeTruthy();
    expect(useStore.getState().syncDriverQueue()).toBe(0);
  });
});

describe('Regras determinísticas de ocorrência', () => {
  it('mapeia item para categoria e sugere severidade', () => {
    expect(itemToOccurrenceCategory('camera')).toBe('camera_obstruida');
    expect(itemToOccurrenceCategory('freios')).toBe('avaria_veiculo');
    expect(suggestSeverity('avaria_veiculo', 'falha')).toBe('critica');
    expect(suggestSeverity('camera_obstruida', 'atencao')).toBe('media');
    expect(occurrenceTemplate('tablet_nao_liga', seedTrucks.find((t) => t.id === 't101'))).toContain('C-101');
  });
});
