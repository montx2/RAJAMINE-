// @vitest-environment jsdom
/// <reference types="node" />
import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { AppRoutes } from '../src/App';
import { useStore } from '../src/store/useStore';
import { MANAGEMENT_STEPS, DRIVER_STEPS } from '../src/components/OnboardingTour';

/* Guia de introdução: cobre as áreas principais, filtra por perfil, ancora no
   alvo certo, devolve o usuário à página de origem e mantém tom neutro. */

beforeAll(() => {
  globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} } as never;
  window.matchMedia = window.matchMedia ?? (() => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} })) as never;
  window.scrollTo = (() => {}) as never;
  Element.prototype.scrollIntoView = function () {};
  // jsdom não tem layout: devolve um rect fictício para o guia encontrar os alvos.
  Element.prototype.getBoundingClientRect = function () {
    return { width: 200, height: 48, top: 120, left: 120, bottom: 168, right: 320, x: 120, y: 120, toJSON() {} } as DOMRect;
  };
});

beforeEach(() => {
  cleanup();
  localStorage.clear();
  useStore.setState({ session: null });
});

afterEach(() => cleanup());

function RouteProbe() {
  const { pathname } = useLocation();
  return <span data-testid="rota">{pathname}</span>;
}
function renderAt(path: string) {
  return render(<MemoryRouter initialEntries={[path]}><AppRoutes /><RouteProbe /></MemoryRouter>);
}
function startTour() {
  act(() => { window.dispatchEvent(new CustomEvent('rajamine-start-tour')); });
}
function walkToEnd() {
  for (let i = 0; i < 20; i++) {
    const concluir = screen.queryByText('Concluir');
    if (concluir) { fireEvent.click(concluir); return; }
    fireEvent.click(screen.getByText('Próximo'));
  }
}

describe('Configuração do guia', () => {
  it('guia de gestão cobre as áreas principais e não ensina o óbvio (tema)', () => {
    expect(MANAGEMENT_STEPS.length).toBeGreaterThanOrEqual(7);
    const ids = MANAGEMENT_STEPS.map((s) => s.id);
    for (const key of ['dashboard', 'novo', 'relatorios', 'revisao', 'operacoes', 'documentos', 'notificacoes']) {
      expect(ids).toContain(key);
    }
    for (const s of MANAGEMENT_STEPS) {
      expect(s.title.length).toBeGreaterThan(3);
      expect(s.body.length).toBeGreaterThanOrEqual(60);
      expect(`${s.title} ${s.body}`.toLowerCase()).not.toMatch(/\btema\b|claro\/escuro/);
    }
  });

  it('guia do motorista cobre checklist, ocorrências, treino, histórico e offline', () => {
    expect(DRIVER_STEPS.length).toBeGreaterThanOrEqual(5);
    const ids = DRIVER_STEPS.map((s) => s.id);
    for (const key of ['checklist', 'ocorrencias', 'treinamento', 'historico', 'sync']) {
      expect(ids).toContain(key);
    }
  });

  it('textos são factuais: sem jargão de IA, exclamação ou elogio', () => {
    for (const s of [...MANAGEMENT_STEPS, ...DRIVER_STEPS]) {
      const txt = `${s.title} ${s.body}`;
      expect(txt).not.toMatch(/\bIA\b|intelig[êe]ncia artificial|sparkle|✨|🎉|🚀/i);
      expect(txt).not.toMatch(/!|incr[íi]vel|poderos|m[áa]gic|autom[áa]ticamente mágic|bom trabalho|boa estrada|parab[ée]ns/i);
      // frases curtas o suficiente para caber no cartão sem rolagem
      expect(s.body.length).toBeLessThanOrEqual(240);
    }
  });
});

describe('Guia em tela', () => {
  it('admin vê a abertura e avança para os indicadores', () => {
    useStore.setState({ session: { userId: 'u_helena', role: 'admin' } });
    renderAt('/');
    startTour();
    expect(screen.getByText('Como o FieldOps funciona')).toBeTruthy();
    fireEvent.click(screen.getByText('Iniciar'));
    expect(screen.getByText('Indicadores')).toBeTruthy();
    expect(screen.getByText('2 / 8')).toBeTruthy();
  });

  it('colaborador tem guia enxuto, sem revisão nem operações', () => {
    useStore.setState({ session: { userId: 'u_carlos', role: 'colaborador' } });
    renderAt('/relatorios');
    startTour();
    fireEvent.click(screen.getByText('Iniciar'));
    expect(screen.getByText('2 / 3')).toBeTruthy();
    expect(screen.getByText('Texto e fotos')).toBeTruthy();
  });

  it('motorista vê o guia do portal', () => {
    useStore.setState({ session: { userId: 'u_mot_joao', role: 'motorista' } });
    renderAt('/motorista');
    startTour();
    expect(screen.getByText('Como o portal funciona')).toBeTruthy();
    fireEvent.click(screen.getByText('Iniciar'));
    expect(screen.getByText('Checklist do turno')).toBeTruthy();
  });

  it('encerrar marca como visto e não reabre automaticamente', () => {
    useStore.setState({ session: { userId: 'u_helena', role: 'admin' } });
    renderAt('/');
    startTour();
    fireEvent.click(screen.getByText('Encerrar'));
    expect(screen.queryByText('Como o FieldOps funciona')).toBeNull();
    expect(localStorage.getItem('rajamine-tour-v2-gestao')).toBe('done');
  });

  it('o destaque fica exatamente sobre o alvo e congela as animações da página', async () => {
    useStore.setState({ session: { userId: 'u_helena', role: 'admin' } });
    renderAt('/');
    startTour();
    fireEvent.click(screen.getByText('Iniciar'));
    await waitFor(() => expect(document.querySelector('[data-tour-spotlight]')).toBeTruthy());
    const spot = document.querySelector('[data-tour-spotlight]') as HTMLElement;
    // rect fictício do jsdom: top 120, left 120, width 200, height 48; padding 5
    expect(spot.style.top).toBe('115px');
    expect(spot.style.left).toBe('115px');
    expect(spot.style.width).toBe('210px');
    expect(spot.style.height).toBe('58px');
    expect(document.documentElement.classList.contains('tour-active')).toBe(true);
    fireEvent.click(screen.getByText('Encerrar'));
    expect(document.documentElement.classList.contains('tour-active')).toBe(false);
  });

  it('ao concluir mostra o fechamento, marca como visto e volta à página de origem', () => {
    useStore.setState({ session: { userId: 'u_helena', role: 'admin' } });
    renderAt('/relatorios');
    startTour();
    fireEvent.click(screen.getByText('Iniciar'));
    walkToEnd();
    expect(screen.getByText('Guia concluído')).toBeTruthy();
    fireEvent.click(screen.getByText('Fechar'));
    expect(screen.queryByText('Guia concluído')).toBeNull();
    expect(localStorage.getItem('rajamine-tour-v2-gestao')).toBe('done');
    // o guia navegou por várias páginas; ao fechar, volta para onde o usuário estava
    expect(screen.getByTestId('rota').textContent).toBe('/relatorios');
  });
});
