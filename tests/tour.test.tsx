// @vitest-environment jsdom
import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '../src/App';
import { useStore } from '../src/store/useStore';
import { MANAGEMENT_STEPS, DRIVER_STEPS } from '../src/components/OnboardingTour';

/* Tutorial guiado: cobre as funções principais, sem passo de tema,
   e filtra os passos pelo perfil (colaborador não vê revisão/operações). */

beforeAll(() => {
  globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} } as never;
  window.matchMedia = window.matchMedia ?? (() => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} })) as never;
  window.scrollTo = (() => {}) as never;
  Element.prototype.scrollIntoView = function () {};
  // jsdom não tem layout: devolve um rect fictício para o tour encontrar os alvos.
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

function renderAt(path: string) {
  return render(<MemoryRouter initialEntries={[path]}><AppRoutes /></MemoryRouter>);
}
function startTour() {
  act(() => { window.dispatchEvent(new CustomEvent('rajamine-start-tour')); });
}

describe('Configuração do tutorial', () => {
  it('tour de gestão cobre as funções principais e não ensina o óbvio (tema)', () => {
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

  it('tour do motorista cobre checklist, ocorrências, treino, histórico e offline', () => {
    expect(DRIVER_STEPS.length).toBeGreaterThanOrEqual(5);
    const ids = DRIVER_STEPS.map((s) => s.id);
    for (const key of ['checklist', 'ocorrencias', 'treinamento', 'historico', 'sync']) {
      expect(ids).toContain(key);
    }
  });
});

describe('Tutorial em tela', () => {
  it('admin vê boas-vindas e avança para o painel de controle', () => {
    useStore.setState({ session: { userId: 'u_helena', role: 'admin' } });
    renderAt('/');
    startTour();
    expect(screen.getByText('Bem-vindo ao Rajamine FieldOps')).toBeTruthy();
    fireEvent.click(screen.getByText('Começar'));
    expect(screen.getByText('Painel de controle')).toBeTruthy();
    expect(screen.getByText('Passo 2 de 8')).toBeTruthy();
  });

  it('colaborador tem tour enxuto, sem revisão nem operações', () => {
    useStore.setState({ session: { userId: 'u_carlos', role: 'colaborador' } });
    renderAt('/relatorios');
    startTour();
    expect(screen.getByText('Bem-vindo ao Rajamine FieldOps')).toBeTruthy();
    fireEvent.click(screen.getByText('Começar'));
    expect(screen.getByText('Passo 2 de 3')).toBeTruthy();
    expect(screen.getByText('Relatórios: IA e leitura de fotos')).toBeTruthy();
  });

  it('motorista vê o tour do portal', () => {
    useStore.setState({ session: { userId: 'u_mot_joao', role: 'motorista' } });
    renderAt('/motorista');
    startTour();
    expect(screen.getByText('Bem-vindo ao Portal do Motorista')).toBeTruthy();
    fireEvent.click(screen.getByText('Começar'));
    expect(screen.getByText('Checklist automático')).toBeTruthy();
  });

  it('pular encerra o tutorial e marca como visto', () => {
    useStore.setState({ session: { userId: 'u_helena', role: 'admin' } });
    renderAt('/');
    startTour();
    fireEvent.click(screen.getByText('Pular tutorial'));
    expect(screen.queryByText('Bem-vindo ao Rajamine FieldOps')).toBeNull();
    expect(localStorage.getItem('rajamine-tour-v2-gestao')).toBe('done');
  });
});
