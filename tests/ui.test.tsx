// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeAll } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { useState } from 'react';
import { cn } from '../src/lib/cn';
import { Modal, Badge, Button } from '../src/components/ui';

/* Regressões de dois defeitos estruturais encontrados na auditoria:
   1. cn apenas concatenava classes, então overrides de display não funcionavam
      (o pill "Online" aparecia em 390px e colidia com os ícones do cabeçalho).
   2. Modal era renderizado dentro de `.page-enter`, cuja animação deixa um
      transform persistente e cria contexto de empilhamento — o diálogo ficava
      abaixo da barra de navegação fixa e os botões do rodapé eram inacessíveis. */

beforeAll(() => {
  globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} } as never;
});
afterEach(() => cleanup());

describe('cn (merge de utilitários Tailwind)', () => {
  it('override de display vence a classe base do componente', () => {
    const out = cn('inline-flex items-center', 'hidden sm:inline-flex');
    expect(out).toContain('hidden');
    expect(out).toContain('sm:inline-flex');
    // o `inline-flex` sem breakpoint não pode sobreviver, senão vence no CSS
    expect(out.split(/\s+/)).not.toContain('inline-flex');
    expect(out).toContain('items-center');
  });

  it('largura explícita vence o w-full do input', () => {
    expect(cn('input w-full', 'w-[152px]').split(/\s+/)).not.toContain('w-full');
  });

  it('Badge aceita ser ocultado por breakpoint', () => {
    render(<Badge className="hidden sm:inline-flex">Online</Badge>);
    const el = screen.getByText('Online');
    expect(el.className).toContain('hidden');
    expect(el.className.split(/\s+/)).not.toContain('inline-flex');
  });
});

describe('Modal', () => {
  function Harness() {
    const [open, setOpen] = useState(false);
    return (
      <div className="page-enter" style={{ transform: 'translateY(0)' }}>
        <button onClick={() => setOpen(true)}>abrir</button>
        <Modal open={open} onClose={() => setOpen(false)} title="Marcar todos os itens como OK?"
          footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button><Button>Confirmar</Button></>}>
          <p>Conteúdo do diálogo</p>
        </Modal>
      </div>
    );
  }

  it('é montado no body, fora do ancestral com transform', () => {
    const { container } = render(<Harness />);
    fireEvent.click(screen.getByText('abrir'));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeTruthy();
    // não pode estar dentro do wrapper que cria contexto de empilhamento
    expect(container.contains(dialog)).toBe(false);
    expect(dialog.parentElement).toBe(document.body);
  });

  it('tem nome acessível pelo título e fecha com Esc', () => {
    render(<Harness />);
    fireEvent.click(screen.getByText('abrir'));
    const dialog = screen.getByRole('dialog');
    const labelledby = dialog.getAttribute('aria-labelledby');
    expect(labelledby).toBeTruthy();
    expect(document.getElementById(labelledby!)?.textContent).toBe('Marcar todos os itens como OK?');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('mantém o foco dentro do diálogo ao tabular', () => {
    render(<Harness />);
    fireEvent.click(screen.getByText('abrir'));
    const dialog = screen.getByRole('dialog');
    const buttons = Array.from(dialog.querySelectorAll('button'));
    const last = buttons[buttons.length - 1];
    last.focus();
    expect(document.activeElement).toBe(last);
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(buttons[0]);
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last);
  });

  it('devolve o foco ao elemento que abriu o diálogo', () => {
    render(<Harness />);
    const trigger = screen.getByText('abrir');
    trigger.focus();
    fireEvent.click(trigger);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(document.activeElement).toBe(trigger);
  });
});
