import { describe, it, expect } from 'vitest';
import { diffWords } from '../src/lib/diff';

describe('Diff palavra a palavra', () => {
  it('reconstrói original e sugerido a partir dos segmentos', () => {
    const a = 'Eu cheguei na mina as 8h';
    const b = 'O técnico chegou na mina às 8h';
    const segs = diffWords(a, b);
    const original = segs.filter((s) => s.type !== 'add').map((s) => s.text).join('');
    const sugerido = segs.filter((s) => s.type !== 'del').map((s) => s.text).join('');
    expect(original).toBe(a);
    expect(sugerido).toBe(b);
  });

  it('marca remoções e adições', () => {
    const segs = diffWords('eu fui', 'o técnico foi');
    expect(segs.some((s) => s.type === 'del')).toBe(true);
    expect(segs.some((s) => s.type === 'add')).toBe(true);
  });

  it('textos idênticos não têm diferenças', () => {
    const segs = diffWords('texto igual', 'texto igual');
    expect(segs.every((s) => s.type === 'same')).toBe(true);
  });
});
