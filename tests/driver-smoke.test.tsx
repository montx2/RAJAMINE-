// @vitest-environment jsdom
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '../src/App';
import { useStore } from '../src/store/useStore';

beforeAll(() => {
  globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} } as never;
  window.matchMedia = window.matchMedia ?? (() => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} })) as never;
  window.scrollTo = (() => {}) as never;
});

beforeEach(async () => {
  cleanup();
  await useStore.getState().resetDemo();
  useStore.setState({ session: null });
});

function renderAt(path: string) {
  return render(<MemoryRouter initialEntries={[path]}><AppRoutes /></MemoryRouter>);
}

describe('Portal do Motorista — smoke', () => {
  it('login mostra perfil motorista e redireciona para /motorista', () => {
    renderAt('/login');
    expect(screen.getByText('João Batista')).toBeTruthy();
    fireEvent.click(screen.getByText('João Batista'));
    expect(screen.getAllByText('Meus caminhões').length).toBeGreaterThan(0);
    expect(screen.getAllByText('C-101').length).toBeGreaterThan(0);
  });

  it('checklist automático renderiza itens e botão de envio', () => {
    useStore.setState({ session: { userId: 'u_mot_joao', role: 'motorista' } });
    renderAt('/motorista/checklist/t101');
    expect(screen.getAllByText(/Checklist automático/).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Pneus / rodas').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Marcar tudo OK').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Enviar checklist/).length).toBeGreaterThan(0);
  });

  it('nova ocorrência sugere caminhão vinculado e texto padrão', () => {
    useStore.setState({ session: { userId: 'u_mot_joao', role: 'motorista' } });
    renderAt('/motorista/ocorrencias/nova');
    expect(screen.getAllByText('Reportar problema').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Câmera obstruída / suja').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Registrar ocorrência').length).toBeGreaterThan(0);
  });

  it('treinamento exige ciência digitada', () => {
    useStore.setState({ session: { userId: 'u_mot_joao', role: 'motorista' } });
    renderAt('/motorista/treinamento');
    expect(screen.getAllByText('Treinamentos e ciência').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Registrar ciência').length).toBeGreaterThan(0);
  });

  it('coordenação acessa triagem de ocorrências de motoristas', () => {
    useStore.setState({ session: { userId: 'u_helena', role: 'admin' } });
    renderAt('/ocorrencias');
    expect(screen.getAllByText('Ocorrências de motoristas').length).toBeGreaterThan(0);
    expect(screen.getAllByText('OCO-2026-0001').length).toBeGreaterThan(0);
  });

  it('motorista não acessa triagem administrativa', () => {
    useStore.setState({ session: { userId: 'u_mot_joao', role: 'motorista' } });
    renderAt('/ocorrencias');
    expect(screen.getAllByText('Meus caminhões').length).toBeGreaterThan(0);
  });
});
