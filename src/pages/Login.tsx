import { useState, type FormEvent, type InputHTMLAttributes } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronDown, Eye, EyeOff, ExternalLink } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import LoginArt from '../components/LoginArt';
import { useStore } from '../store/useStore';
import { Avatar, Button, Field, Input } from '../components/ui';
import { Logo } from '../components/Logo';
import { ROLE_LABEL } from '../data/types';
import { BRAND } from '../lib/brand';
import { cn } from '../lib/cn';

/** Campo de senha com botão de mostrar/ocultar. Recebe id e ARIA do `Field` e repassa ao input. */
function PasswordInput({ show, onToggle, className, ...rest }: InputHTMLAttributes<HTMLInputElement> & { show: boolean; onToggle: () => void; invalid?: boolean }) {
  return (
    <div className="relative">
      <Input type={show ? 'text' : 'password'} className={cn('pr-12', className)} {...rest} />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-1 top-1/2 -translate-y-1/2 grid size-10 place-items-center rounded-lg text-subtle hover:text-primary hover:bg-primary/5 transition-colors cursor-pointer"
        aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
        aria-pressed={show}
      >
        {show ? <EyeOff size={17} aria-hidden /> : <Eye size={17} aria-hidden />}
      </button>
    </div>
  );
}

/**
 * Tela de acesso. No desktop, o painel grafite à esquerda apresenta o produto
 * com a rota do relatório (campo → revisão → aprovado); à direita, só o que
 * importa para entrar. No celular o painel vira uma faixa de marca no topo.
 * O formulário vem primeiro no DOM (leitor de tela e teclado chegam nele de
 * imediato); a ordem visual no desktop é invertida com `order`.
 * Os perfis de demonstração ficam em divulgação progressiva para não competir
 * com a ação principal.
 */
export default function Login() {
  const navigate = useNavigate();
  const login = useStore((s) => s.login);
  const users = useStore((s) => s.users);
  const reports = useStore((s) => s.reports);

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; senha?: string }>({});
  const [loading, setLoading] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  const profiles = ['u_helena', 'u_marta', 'u_carlos', 'u_andre', 'u_mot_joao']
    .map((id) => users.find((u) => u.id === id))
    .filter((u): u is NonNullable<typeof u> => !!u);
  const pendingLink = reports.find((r) => r.status === 'pendente' || r.status === 'correcao');

  const homeFor = (role: string) =>
    role === 'motorista' ? '/motorista' : role === 'colaborador' ? '/relatorios' : '/';

  const enter = (userId: string, role: string) => {
    login(userId);
    navigate(homeFor(role));
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    const value = email.trim().toLowerCase();
    if (!value) next.email = 'Informe seu e-mail corporativo.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) next.email = 'Formato de e-mail inválido.';
    if (!senha) next.senha = 'Informe sua senha.';

    const user = users.find((u) => u.email.toLowerCase() === value && u.ativo);
    if (!next.email && !user) next.email = 'E-mail não encontrado neste ambiente.';

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setLoading(true);
    // Latência curta para o estado de carregamento ser perceptível, como numa
    // autenticação real. Não há servidor: a senha não é verificada.
    window.setTimeout(() => enter(user!.id, user!.role), 420);
  };

  return (
    <div className="min-h-dvh grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] bg-surface">
      {/* ── Formulário (primeiro no DOM) ── */}
      <div className="flex flex-col min-h-dvh lg:order-2">
        {/* Faixa de marca no celular/tablet: o painel grafite do desktop não cabe aqui */}
        <header className="lg:hidden glass-dark pt-safe">
          <div className="flex items-center justify-between px-5 py-4">
            <Logo />
            <ThemeToggle />
          </div>
          <div className="hazard h-1.5" aria-hidden />
        </header>

        <div className="hidden lg:flex justify-end px-8 pt-6"><ThemeToggle /></div>

        <main className="flex-1 flex items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-[400px]">
            <h1 className="font-display text-[32px] font-semibold leading-tight tracking-tight text-primary">Acessar sua conta</h1>
            <p className="mt-1.5 text-[14px] text-subtle">Use suas credenciais corporativas.</p>

            <form onSubmit={submit} noValidate className="mt-7 space-y-5">
              <Field label="E-mail" error={errors.email}>
                <Input
                  type="email"
                  inputMode="email"
                  autoComplete="username"
                  autoFocus
                  spellCheck={false}
                  placeholder={`nome.sobrenome@${BRAND.dominioDemo}`}
                  value={email}
                  invalid={!!errors.email}
                  onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors((s) => ({ ...s, email: undefined })); }}
                />
              </Field>

              <Field
                label="Senha"
                error={errors.senha}
                hint={capsOn ? 'Caps Lock está ativado.' : undefined}
                action={
                  <button
                    type="button"
                    onClick={() => setResetOpen((v) => !v)}
                    className="-my-2 -mr-1 rounded-md px-1 py-2 text-xs font-medium text-subtle hover:text-primary transition-colors cursor-pointer"
                    aria-expanded={resetOpen}
                    aria-controls="reset-info"
                  >
                    Esqueci minha senha
                  </button>
                }
              >
                <PasswordInput
                  show={showPass}
                  onToggle={() => setShowPass((v) => !v)}
                  autoComplete="current-password"
                  placeholder="Digite sua senha"
                  value={senha}
                  invalid={!!errors.senha}
                  onChange={(e) => { setSenha(e.target.value); if (errors.senha) setErrors((s) => ({ ...s, senha: undefined })); }}
                  onKeyUp={(e) => setCapsOn(e.getModifierState?.('CapsLock') ?? false)}
                  onBlur={() => setCapsOn(false)}
                />
              </Field>

              {resetOpen && (
                <p id="reset-info" className="rounded-lg border border-primary/10 bg-primary/[0.03] px-3 py-2 text-xs leading-relaxed text-secondary">
                  A redefinição é feita pela coordenação de operações. Neste ambiente demonstrativo não há envio de e-mail.
                </p>
              )}

              <Button type="submit" size="lg" className="w-full" loading={loading}>
                {loading ? 'Entrando' : 'Entrar'}
              </Button>
            </form>

            {/* Divulgação progressiva: o acesso de demonstração não disputa com o login */}
            <section className="mt-8 border-t border-primary/10 pt-5">
              <button
                type="button"
                onClick={() => setDemoOpen((v) => !v)}
                className="flex w-full items-center gap-2 rounded-lg py-1 text-left text-[13px] font-semibold text-secondary hover:text-primary transition-colors cursor-pointer"
                aria-expanded={demoOpen}
                aria-controls="demo-panel"
              >
                <span>Acesso de demonstração</span>
                <span className="font-normal text-subtle">· entrar sem senha</span>
                <ChevronDown size={15} className={cn('ml-auto transition-transform duration-200', demoOpen && 'rotate-180')} aria-hidden />
              </button>

              <div
                id="demo-panel"
                className={cn('grid transition-[grid-template-rows,opacity] duration-300 ease-out',
                  demoOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')}
              >
                {/* `inert` retira o painel recolhido da ordem de foco e da árvore
                    de acessibilidade, sem impedir a animação de altura. */}
                <div className="overflow-hidden" inert={!demoOpen}>
                  <p className="pt-3 pb-2 text-xs leading-relaxed text-subtle">
                    Selecione um perfil para entrar. A senha não é verificada neste ambiente.
                  </p>
                  <ul className="space-y-1">
                    {profiles.map((u) => (
                      <li key={u.id}>
                        <button
                          type="button"
                          onClick={() => enter(u.id, u.role)}
                          className="press group flex w-full items-center gap-3 rounded-xl border border-transparent px-2.5 py-2 text-left hover:border-primary/10 hover:bg-primary/[0.04] transition-colors cursor-pointer"
                        >
                          <Avatar nome={u.nome} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-medium text-primary">{u.nome}</span>
                            <span className="block truncate text-xs text-subtle">{ROLE_LABEL[u.role]}</span>
                          </span>
                          <ArrowRight size={15} className="shrink-0 text-subtle opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden />
                        </button>
                      </li>
                    ))}
                  </ul>

                  {pendingLink && (
                    <button
                      type="button"
                      onClick={() => navigate(`/preencher/${pendingLink.token}`)}
                      className="press mt-2 flex w-full items-start gap-2.5 rounded-xl border-t border-primary/10 px-2.5 pt-3 pb-1 text-left hover:bg-primary/[0.04] transition-colors cursor-pointer"
                    >
                      <ExternalLink size={14} className="mt-0.5 shrink-0 text-subtle" aria-hidden />
                      <span>
                        <span className="block text-[13px] font-medium text-primary">Link individual do colaborador</span>
                        <span className="block text-xs leading-relaxed text-subtle">Preenchimento em campo, sem conta de acesso.</span>
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </section>
          </div>
        </main>

        <footer className="px-5 pb-6 pb-safe text-center">
          <p className="text-xs text-subtle">{BRAND.razaoSocial} · Ambiente demonstrativo com dados sintéticos</p>
        </footer>
      </div>

      {/* ── Painel de marca (só no desktop; à esquerda por `order`) ── */}
      <aside className="relative hidden lg:flex lg:order-1 flex-col justify-between overflow-hidden bg-[#18181b] text-white p-12 xl:p-16">
        <div className="hazard absolute inset-x-0 top-0 h-1.5" aria-hidden />
        <Logo size={44} />

        <div className="max-w-[30rem]">
          <p className="font-display text-[44px] xl:text-[56px] font-semibold leading-[1.02] tracking-[-0.005em]">
            Do campo ao relatório aprovado.
          </p>
          <p className="mt-5 max-w-[26rem] text-[16px] leading-relaxed text-zinc-300">
            Cada relatório passa por revisão humana antes de chegar ao cliente.
          </p>
        </div>

        <LoginArt className="pointer-events-none -mx-4 mt-6 h-[min(34vh,22rem)] min-h-[12rem] w-[calc(100%+2rem)]" />
      </aside>
    </div>
  );
}
