// @vitest-environment jsdom
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
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

/** As páginas são carregadas sob demanda (lazy): espera o esqueleto de carregamento sumir. */
async function settled() {
  await waitFor(() => expect(screen.queryByText('Carregando página')).toBeNull(), { timeout: 5000 });
}

async function renderAt(path: string) {
  const view = render(<MemoryRouter initialEntries={[path]}><AppRoutes /></MemoryRouter>);
  await settled();
  return view;
}

describe('Portal do Motorista — smoke', () => {
  it('login mostra perfil motorista e redireciona para /motorista', async () => {
    await renderAt('/login');
    expect(screen.getByText('João Batista')).toBeTruthy();
    fireEvent.click(screen.getByText('João Batista'));
    await settled();
    expect(screen.getAllByText('Meus caminhões').length).toBeGreaterThan(0);
    expect(screen.getAllByText('C-101').length).toBeGreaterThan(0);
  });

  it('checklist automático renderiza itens e botão de envio', async () => {
    useStore.setState({ session: { userId: 'u_mot_joao', role: 'motorista' } });
    await renderAt('/motorista/checklist/t101');
    expect(screen.getAllByText(/Checklist automático/).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Pneus / rodas').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Marcar tudo OK').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Enviar checklist/).length).toBeGreaterThan(0);
  });

  it('nova ocorrência sugere caminhão vinculado e texto padrão', async () => {
    useStore.setState({ session: { userId: 'u_mot_joao', role: 'motorista' } });
    await renderAt('/motorista/ocorrencias/nova');
    expect(screen.getAllByText('Reportar problema').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Câmera obstruída / suja').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Registrar ocorrência').length).toBeGreaterThan(0);
  });

  it('treinamento exige ciência digitada', async () => {
    useStore.setState({ session: { userId: 'u_mot_joao', role: 'motorista' } });
    await renderAt('/motorista/treinamento');
    expect(screen.getAllByText('Treinamentos e ciência').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Registrar ciência').length).toBeGreaterThan(0);
  });

  it('coordenação acessa triagem de ocorrências de motoristas', async () => {
    useStore.setState({ session: { userId: 'u_helena', role: 'admin' } });
    await renderAt('/ocorrencias');
    expect(screen.getAllByText('Ocorrências de motoristas').length).toBeGreaterThan(0);
    expect(screen.getAllByText('OCO-2026-0001').length).toBeGreaterThan(0);
  });

  it('motorista não acessa triagem administrativa', async () => {
    useStore.setState({ session: { userId: 'u_mot_joao', role: 'motorista' } });
    await renderAt('/ocorrencias');
    expect(screen.getAllByText('Meus caminhões').length).toBeGreaterThan(0);
  });
});
