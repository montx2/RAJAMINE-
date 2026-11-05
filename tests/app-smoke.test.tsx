// @vitest-environment jsdom
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
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

/** As páginas são carregadas sob demanda (lazy): espera o esqueleto de carregamento sumir. */
async function settled() {
  await waitFor(() => expect(screen.queryByText('Carregando página')).toBeNull(), { timeout: 5000 });
}

async function renderAt(path: string) {
  const view = render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  );
  await settled();
  return view;
}

describe('Renderização das telas', () => {
  it('login é um formulário de acesso; perfis ficam em divulgação progressiva', async () => {
    await renderAt('/login');
    expect(screen.getByText('Acessar sua conta')).toBeTruthy();
    expect(screen.getByLabelText('E-mail')).toBeTruthy();
    expect(screen.getByLabelText('Senha')).toBeTruthy();
    // recolhido: painel fora da ordem de foco e da árvore de acessibilidade
    const panel = document.getElementById('demo-panel')!;
    expect(panel.querySelector('[inert]')).toBeTruthy();
    fireEvent.click(screen.getByText('Acesso de demonstração'));
    expect(panel.querySelector('[inert]')).toBeNull();
    expect(screen.getByText('Helena Duarte')).toBeTruthy();
    expect(screen.getByText('Marta Fonseca')).toBeTruthy();
    expect(screen.getByText('Carlos Menezes')).toBeTruthy();
  });

  it('login valida e-mail e senha antes de autenticar', async () => {
    await renderAt('/login');
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(screen.getByText('Informe seu e-mail corporativo.')).toBeTruthy();
    expect(screen.getByText('Informe sua senha.')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'nao-e-um-email' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'x' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(screen.getByText('Formato de e-mail inválido.')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'desconhecido@rajamine.demo' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(screen.getByText('E-mail não encontrado neste ambiente.')).toBeTruthy();
    expect(useStore.getState().session).toBeNull();
  });

  it('login por e-mail corporativo autentica e leva ao destino do perfil', async () => {
    await renderAt('/login');
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'HELENA.DUARTE@rajamine.demo' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'qualquer' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    await waitFor(() => expect(useStore.getState().session?.userId).toBe('u_helena'), { timeout: 2000 });
  });

  it('alternador de senha muda o tipo do campo', async () => {
    await renderAt('/login');
    const input = screen.getByLabelText('Senha') as HTMLInputElement;
    expect(input.type).toBe('password');
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar senha' }));
    expect(input.type).toBe('text');
    fireEvent.click(screen.getByRole('button', { name: 'Ocultar senha' }));
    expect(input.type).toBe('password');
  });

  it('login como admin navega para o dashboard com KPIs', async () => {
    await renderAt('/login');
    fireEvent.click(screen.getByText('Acesso de demonstração'));
    fireEvent.click(screen.getByText('Helena Duarte'));
    await settled();
    expect(screen.getByText('Relatórios registrados')).toBeTruthy();
    expect(screen.getByText('Prazos e pendências')).toBeTruthy();
    expect(screen.getByText('Indicadores de produtividade')).toBeTruthy();
  });

  it('dashboard exige autenticação (redireciona para login)', async () => {
    await renderAt('/');
    expect(screen.getByText('Acessar sua conta')).toBeTruthy();
  });

  it('listagem de relatórios renderiza tabela com dados seed', async () => {
    useStore.setState({ session: { userId: 'u_helena', role: 'admin' } });
    await renderAt('/relatorios');
    expect(screen.getByText('Gestão de relatórios')).toBeTruthy();
    expect(screen.getAllByText('REL-2026-0145').length).toBeGreaterThan(0);
  });

  it('detalhe do relatório mostra abas e painel de IA', async () => {
    useStore.setState({ session: { userId: 'u_marta', role: 'revisora' } });
    await renderAt('/relatorios/r_145?tab=texto');
    expect(screen.getByText('Sugestão padronizada')).toBeTruthy();
    expect(screen.getByText('1ª pessoa detectada no texto')).toBeTruthy();
  });

  it('central de revisão lista a fila', async () => {
    useStore.setState({ session: { userId: 'u_marta', role: 'revisora' } });
    await renderAt('/revisao');
    expect(screen.getAllByText('Central de Revisão').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Revisar').length).toBeGreaterThan(0);
  });

  it('documentos bloqueados antes da aprovação', async () => {
    useStore.setState({ session: { userId: 'u_marta', role: 'revisora' } });
    await renderAt('/relatorios/r_145?tab=documentos');
    expect(screen.getByText('Documentos bloqueados.')).toBeTruthy();
  });

  it('link individual abre o preenchimento sem sessão', async () => {
    const token = useStore.getState().reports.find((r) => r.id === 'r_148')!.token;
    await renderAt(`/preencher/${token}`);
    expect(screen.getByText('Dados da visita / atividade')).toBeTruthy();
    expect(screen.getByText('REL-2026-0148')).toBeTruthy();
  });

  it('colaborador não acessa relatório de outro (menor privilégio)', async () => {
    useStore.setState({ session: { userId: 'u_carlos', role: 'colaborador' } });
    await renderAt('/relatorios/r_144'); // r_144 é do André
    expect(screen.getByText('Acesso restrito')).toBeTruthy();
  });

  it('equipamentos renderiza busca e cadastro seed', async () => {
    useStore.setState({ session: { userId: 'u_helena', role: 'admin' } });
    await renderAt('/equipamentos');
    expect(screen.getAllByText('EQ-2041').length).toBeGreaterThan(0);
  });

  it('operações de campo lista a base sintética', async () => {
    useStore.setState({ session: { userId: 'u_helena', role: 'admin' } });
    await renderAt('/operacoes');
    expect(screen.getAllByText('Operações de campo').length).toBeGreaterThan(0);
    expect(screen.getAllByText('SA-101').length).toBeGreaterThan(0);
  });

  it('consolidado semanal mostra o gerador', async () => {
    useStore.setState({ session: { userId: 'u_helena', role: 'admin' } });
    await renderAt('/semanal');
    expect(screen.getByText('Consolidado semanal de viagens')).toBeTruthy();
    expect(screen.getByText('Gerar consolidado a partir de relatórios aprovados')).toBeTruthy();
  });

  it('relatório de visita técnica mostra atividades por equipamento', async () => {
    useStore.setState({ session: { userId: 'u_marta', role: 'revisora' } });
    await renderAt('/relatorios/r_201');
    expect(screen.getAllByText('SA-101').length).toBeGreaterThan(0);
    expect(screen.getAllByText('0187').length).toBeGreaterThan(0);
  });

});

void vi;
