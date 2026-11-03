import { describe, it, expect } from 'vitest';
import { padronizar, temPrimeiraPessoa } from '../src/services/padronizacao';

describe('Motor de padronização (1ª → 3ª pessoa)', () => {
  it('converte verbos e pronome de 1ª pessoa', () => {
    const r = padronizar('Eu cheguei na mina as 8h e instalei o sensor no caminhão.');
    expect(r.sugerido).toContain('O técnico chegou');
    expect(r.sugerido).toContain('instalou');
    expect(r.sugerido).not.toMatch(/\beu\b/i);
    expect(r.mudancas.length).toBeGreaterThan(0);
  });

  it('aplica crase antes de horas e registro formal', () => {
    const r = padronizar('Cheguei as 8h e entreguei o checklist pro motorista.');
    expect(r.sugerido).toContain('às 8h');
    expect(r.sugerido).toContain('para o motorista');
  });

  it('converte 1ª pessoa do plural para a equipe', () => {
    const r = padronizar('Nós instalamos o rastreador e testamos a comunicação.');
    expect(r.sugerido.toLowerCase()).toContain('a equipe');
    expect(r.sugerido).toContain('instalou');
    expect(r.sugerido).toContain('testou');
  });

  it('PRESERVA fatos: códigos, números e horários não são alterados nem inventados', () => {
    const texto = 'Instalei o EQ-3315 as 11h30 no C-102 e registrei a serie 71590.';
    const r = padronizar(texto);
    expect(r.sugerido).toContain('EQ-3315');
    expect(r.sugerido).toContain('11h30');
    expect(r.sugerido).toContain('C-102');
    expect(r.sugerido).toContain('71590');
    // Nenhum código novo pode aparecer
    const codigosOriginais = texto.match(/EQ-\d+/g) ?? [];
    const codigosSugeridos = r.sugerido.match(/EQ-\d+/g) ?? [];
    expect(codigosSugeridos).toEqual(codigosOriginais);
  });

  it('não altera texto já em 3ª pessoa e formal', () => {
    const texto = 'O técnico realizou a instalação do equipamento e validou a comunicação com a central.';
    const r = padronizar(texto);
    expect(r.sugerido).toBe(texto);
    expect(r.mudancas.length).toBe(0);
  });

  it('alerta descrição vazia como erro', () => {
    const r = padronizar('');
    expect(r.alertas.some((a) => a.nivel === 'erro')).toBe(true);
  });

  it('detecta inconsistência de hodômetro', () => {
    const r = padronizar('Realizei a instalação do equipamento e os testes de comunicação.', {
      origem: 'BH', destino: 'Itabira', dataViagem: '2026-01-10', kmInicio: 1000, kmFim: 900,
    });
    expect(r.alertas.some((a) => a.mensagem.includes('KM final'))).toBe(true);
  });

  it('detecta origem igual ao destino', () => {
    const r = padronizar('Realizei a instalação do equipamento e os testes.', {
      origem: 'Itabira/MG', destino: 'Itabira/MG', dataViagem: '2026-01-10',
    });
    expect(r.alertas.some((a) => a.mensagem.includes('idênticos'))).toBe(true);
  });

  it('aponta equipamento citado sem código', () => {
    const r = padronizar('Instalei o equipamento no caminhão e testei o funcionamento normalmente.', {
      origem: 'BH', destino: 'Itabira', dataViagem: '2026-01-10', equipamentosConfirmados: [],
    });
    expect(r.alertas.some((a) => a.mensagem.includes('sem código'))).toBe(true);
  });

  it('detecta marcas de 1ª pessoa', () => {
    expect(temPrimeiraPessoa('Eu instalei o sensor')).toBe(true);
    expect(temPrimeiraPessoa('O técnico instalou o sensor')).toBe(false);
  });

  it('texto curto gera alerta de completude', () => {
    const r = padronizar('Instalei o sensor. Deu tudo certo.');
    expect(r.alertas.some((a) => a.mensagem.includes('curta'))).toBe(true);
  });
});
