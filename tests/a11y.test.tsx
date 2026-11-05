// @vitest-environment jsdom
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '../src/App';
import { Button, Field, Input, Modal, Toaster, toast, useToasts } from '../src/components/ui';
import { createDeferredStorage } from '../src/store/deferredStorage';
import { demoThumb } from '../src/lib/demoThumb';
import { BRAND } from '../src/lib/brand';
import { useStore } from '../src/store/useStore';
import { readFileSync } from 'node:fs';

/* Garantias de acessibilidade e de marca que a revisão apontou como falhas. */

beforeAll(() => {
  globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} } as never;
  window.matchMedia = window.matchMedia ?? (() => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} })) as never;
  window.scrollTo = (() => {}) as never;
});

beforeEach(() => { cleanup(); useStore.setState({ session: null }); useToasts.setState({ toasts: [] }); });
afterEach(() => { vi.useRealTimers(); });

describe('Field liga rótulo, erro e obrigatoriedade ao controle', () => {
  it('aplica id, aria-invalid, aria-describedby e required ao input filho', () => {
    render(<Field label="Nome" error="Informe o nome." required><Input /></Field>);
    const input = screen.getByLabelText(/Nome/) as HTMLInputElement;
    expect(input.required).toBe(true);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    const described = document.getElementById(input.getAttribute('aria-describedby')!)!;
    expect(described.textContent).toBe('Informe o nome.');
    expect(described.getAttribute('role')).toBe('alert');
  });

  it('sem erro, a dica descreve o campo e não há aria-invalid', () => {
    render(<Field label="Placa" hint="Formato ABC-1234"><Input /></Field>);
    const input = screen.getByLabelText('Placa');
    expect(input.getAttribute('aria-invalid')).toBeNull();
    expect(document.getElementById(input.getAttribute('aria-describedby')!)!.textContent).toBe('Formato ABC-1234');
  });
});

describe('Button', () => {
  it('não envia formulário por padrão (type="button")', () => {
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    render(<form onSubmit={onSubmit}><Button>Ação</Button><Button type="submit">Enviar</Button></form>);
    fireEvent.click(screen.getByRole('button', { name: 'Ação' }));
    expect(onSubmit).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('anuncia o estado de carregamento', () => {
    render(<Button loading>Salvar</Button>);
    expect(screen.getByRole('button').getAttribute('aria-busy')).toBe('true');
  });
});

describe('Modal e camadas sobrepostas', () => {
  it('Esc fecha, o título nomeia o diálogo e o foco volta ao gatilho', () => {
    const onClose = vi.fn();
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();
    const { unmount } = render(<Modal open onClose={onClose} title="Confirmar envio"><p>Conteúdo</p></Modal>);
    expect(screen.getByRole('dialog', { name: 'Confirmar envio' })).toBeTruthy();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
    unmount();
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });

  it('o scroll do fundo só volta quando o último diálogo fecha', () => {
    const a = render(<Modal open onClose={() => {}} title="A"><p>a</p></Modal>);
    const b = render(<Modal open onClose={() => {}} title="B"><p>b</p></Modal>);
    expect(document.body.style.overflow).toBe('hidden');
    b.unmount();
    expect(document.body.style.overflow).toBe('hidden');
    a.unmount();
    expect(document.body.style.overflow).toBe('');
  });
});

describe('Toasts', () => {
  it('erro usa role=alert e não some sozinho; sucesso some após alguns segundos', () => {
    vi.useFakeTimers();
    render(<Toaster />);
    act(() => { toast('Falha ao gerar o PDF.', 'error'); toast('Salvo.', 'success'); });
    expect(screen.getByRole('alert').textContent).toContain('Falha ao gerar o PDF.');
    expect(screen.getByText('Salvo.')).toBeTruthy();
    act(() => { vi.advanceTimersByTime(7000); });
    expect(screen.queryByText('Salvo.')).toBeNull();
    act(() => { vi.advanceTimersByTime(60000); });
    expect(screen.getByRole('alert')).toBeTruthy();
  });

  it('passar o mouse pausa a contagem', () => {
    vi.useFakeTimers();
    render(<Toaster />);
    act(() => { toast('Salvo.', 'success'); });
    const item = screen.getByText('Salvo.').closest('[role="status"]')!;
    fireEvent.mouseEnter(item);
    act(() => { vi.advanceTimersByTime(30000); });
    expect(screen.getByText('Salvo.')).toBeTruthy();
    fireEvent.mouseLeave(item);
    act(() => { vi.advanceTimersByTime(7000); });
    expect(screen.queryByText('Salvo.')).toBeNull();
  });
});

describe('Shell de gestão', () => {
  it('o sino anuncia expandido/recolhido e Esc fecha o painel', async () => {
    useStore.setState({ session: { userId: 'u_helena', role: 'admin' } });
    render(<MemoryRouter initialEntries={['/relatorios']}><AppRoutes /></MemoryRouter>);
    await waitFor(() => expect(screen.queryByText('Carregando página')).toBeNull(), { timeout: 5000 });
    const bell = screen.getByRole('button', { name: /Notificações/ });
    expect(bell.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(bell);
    expect(bell.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('dialog', { name: 'Notificações' })).toBeTruthy();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(bell.getAttribute('aria-expanded')).toBe('false');
  });

  it('tem link para pular ao conteúdo e o main é focável por programa', async () => {
    useStore.setState({ session: { userId: 'u_helena', role: 'admin' } });
    render(<MemoryRouter initialEntries={['/relatorios']}><AppRoutes /></MemoryRouter>);
    await waitFor(() => expect(screen.queryByText('Carregando página')).toBeNull(), { timeout: 5000 });
    expect(screen.getByRole('link', { name: 'Pular para o conteúdo' }).getAttribute('href')).toBe('#main');
    expect(document.getElementById('main')!.getAttribute('tabindex')).toBe('-1');
  });

  it('o menu lateral do celular é um diálogo modal e fecha com Esc', async () => {
    useStore.setState({ session: { userId: 'u_helena', role: 'admin' } });
    render(<MemoryRouter initialEntries={['/relatorios']}><AppRoutes /></MemoryRouter>);
    await waitFor(() => expect(screen.queryByText('Carregando página')).toBeNull(), { timeout: 5000 });
    fireEvent.click(screen.getByRole('button', { name: 'Abrir menu' }));
    const drawer = screen.getByRole('dialog', { name: 'Menu' });
    expect(drawer.getAttribute('aria-modal')).toBe('true');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'Menu' })).toBeNull();
  });
});

describe('Marca', () => {
  it('a tela de acesso e o rodapé usam o nome da empresa, sem resquício do nome antigo', () => {
    render(<MemoryRouter initialEntries={['/login']}><AppRoutes /></MemoryRouter>);
    const text = document.body.textContent ?? '';
    expect(text).toContain(BRAND.razaoSocial);
    expect(text).not.toMatch(/Rajamine/i);
    expect(screen.getByLabelText('E-mail').getAttribute('placeholder')).toContain(`@${BRAND.dominioDemo}`);
  });

  it('a tela de acesso é só o formulário: sem painel institucional nem faixa listrada', () => {
    render(<MemoryRouter initialEntries={['/login']}><AppRoutes /></MemoryRouter>);
    expect(screen.queryByText('Do campo ao relatório aprovado.')).toBeNull();
    expect(document.querySelector('aside')).toBeNull();
    expect(document.querySelector('.hazard')).toBeNull();
  });

  it('a marca desenhada no componente é a mesma do favicon e dos PDFs (uma só fonte)', () => {
    const paths = ['M14 44 L24 20 L34 34 L40 26 L50 44 Z', 'M12 48 H52'];
    const fav = readFileSync('public/favicon.svg', 'utf8');
    const logo = readFileSync('src/components/Logo.tsx', 'utf8');
    const pdf = readFileSync('src/services/pdf.ts', 'utf8');
    for (const d of paths) { expect(fav).toContain(d); expect(logo).toContain(d); expect(pdf).toContain(d); }
  });

  it('o e-mail de demonstração usa o domínio da marca', () => {
    expect(useStore.getState().users.every((u) => u.email.endsWith(`@${BRAND.dominioDemo}`))).toBe(true);
  });
});

describe('Armazenamento adiado do store', () => {
  it('não grava a cada alteração, mas a leitura enxerga o estado pendente e pagehide descarrega', () => {
    localStorage.clear();
    const storage = createDeferredStorage<{ n: number }>(5000);
    storage.setItem('k', { state: { n: 1 }, version: 0 });
    storage.setItem('k', { state: { n: 2 }, version: 0 });
    expect(localStorage.getItem('k')).toBeNull();
    expect((storage.getItem('k') as { state: { n: number } }).state.n).toBe(2);
    window.dispatchEvent(new Event('pagehide'));
    expect(JSON.parse(localStorage.getItem('k')!).state.n).toBe(2);
  });
});

describe('Miniaturas de fotos demonstrativas', () => {
  it('mapeia JPEG de /demo para a miniatura WebP e não mexe em outras origens', () => {
    expect(demoThumb('/demo/foto-eq2041.jpg')).toBe('/demo/thumb/foto-eq2041.webp');
    expect(demoThumb('blob:abc')).toBe('blob:abc');
  });
});
