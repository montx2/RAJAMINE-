// @vitest-environment jsdom
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '../src/App';
import { useStore } from '../src/store/useStore';

/* Smoke tests de renderização das telas principais (jsdom).
   Complementam os E2E Playwright, que exigem browser real. */

beforeAll(() => {
  // Polyfills exigidos pelo Recharts/jsdom
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as never;
  window.matchMedia = window.matchMedia ?? (() => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} })) as never;
  window.scrollTo = (() => {}) as never;
});

beforeEach(() => {
  cleanup();
  useStore.setState({ session: null });
});

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

describe('Renderização das telas', () => {
  it('login mostra os três perfis demonstrativos', () => {
    renderAt('/login');
    expect(screen.getByText('Acessar demonstração')).toBeTruthy();
    expect(screen.getByText('Helena Duarte')).toBeTruthy();
    expect(screen.getByText('Marta Fonseca')).toBeTruthy();
    expect(screen.getByText('Carlos Menezes')).toBeTruthy();
  });

  it('login como admin navega para o dashboard com KPIs', () => {
    renderAt('/login');
    fireEvent.click(screen.getByText('Helena Duarte'));
    expect(screen.getByText('Relatórios registrados')).toBeTruthy();
    expect(screen.getByText('Prazos e pendências')).toBeTruthy();
    expect(screen.getByText('Indicadores de produtividade')).toBeTruthy();
  });

  it('dashboard exige autenticação (redireciona para login)', () => {
    renderAt('/');
    expect(screen.getByText('Acessar demonstração')).toBeTruthy();
  });

  it('listagem de relatórios renderiza tabela com dados seed', () => {
    useStore.setState({ session: { userId: 'u_helena', role: 'admin' } });
    renderAt('/relatorios');
    expect(screen.getByText('Gestão de relatórios')).toBeTruthy();
    expect(screen.getAllByText('REL-2026-0145').length).toBeGreaterThan(0);
  });

  it('detalhe do relatório mostra abas e painel de IA', () => {
    useStore.setState({ session: { userId: 'u_marta', role: 'revisora' } });
    renderAt('/relatorios/r_145?tab=texto');
    expect(screen.getByText('Sugestão padronizada')).toBeTruthy();
    expect(screen.getByText('1ª pessoa detectada no texto')).toBeTruthy();
  });

  it('central de revisão lista a fila', () => {
    useStore.setState({ session: { userId: 'u_marta', role: 'revisora' } });
    renderAt('/revisao');
    expect(screen.getAllByText('Central de Revisão').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Revisar').length).toBeGreaterThan(0);
  });

  it('documentos bloqueados antes da aprovação', () => {
    useStore.setState({ session: { userId: 'u_marta', role: 'revisora' } });
    renderAt('/relatorios/r_145?tab=documentos');
    expect(screen.getByText('Documentos bloqueados.')).toBeTruthy();
  });

  it('link individual abre o preenchimento sem sessão', () => {
    const token = useStore.getState().reports.find((r) => r.id === 'r_148')!.token;
    renderAt(`/preencher/${token}`);
    expect(screen.getByText('Dados da viagem')).toBeTruthy();
    expect(screen.getByText('REL-2026-0148')).toBeTruthy();
  });

  it('colaborador não acessa relatório de outro (menor privilégio)', () => {
    useStore.setState({ session: { userId: 'u_carlos', role: 'colaborador' } });
    renderAt('/relatorios/r_144'); // r_144 é do André
    expect(screen.getByText('Acesso restrito')).toBeTruthy();
  });

  it('equipamentos renderiza busca e cadastro seed', () => {
    useStore.setState({ session: { userId: 'u_helena', role: 'admin' } });
    renderAt('/equipamentos');
    expect(screen.getAllByText('EQ-2041').length).toBeGreaterThan(0);
  });

  it('página de conformidade lista medidas e limitações', () => {
    useStore.setState({ session: { userId: 'u_helena', role: 'admin' } });
    renderAt('/conformidade');
    expect(screen.getByText('Implementado no protótipo')).toBeTruthy();
    expect(screen.getByText('Obrigatório na versão de produção')).toBeTruthy();
  });
});

void vi;
