import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronDown, Eye, EyeOff, ExternalLink } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import { useStore } from '../store/useStore';
import { Avatar, Button, Field, Input } from '../components/ui';
import { LogoMark, Wordmark } from '../components/Logo';
import { ROLE_LABEL } from '../data/types';
import { cn } from '../lib/cn';

/**
 * Tela de acesso. Coluna única centrada, marca discreta e apenas os campos
 * essenciais — padrão dos produtos corporativos de referência. Os perfis de
 * demonstração ficam em divulgação progressiva, para não competir com a ação
 * principal nem dar à tela aparência de protótipo.
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
    <div className="min-h-screen flex flex-col bg-background">
      <div className="absolute top-4 right-4 z-10"><ThemeToggle /></div>

      <main className="flex-1 flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-[380px]">
          {/* Marca: presente, mas sem competir com o formulário */}
          <div className="flex flex-col items-center mb-7 animate-fade-up">
            <LogoMark size={40} />
            <Wordmark className="text-[20px] mt-3" light={false} />
            <div className="text-[9.5px] font-semibold tracking-[0.24em] text-subtle mt-1.5">FIELDOPS</div>
          </div>

          <div
            className="rounded-2xl border border-primary/8 bg-surface p-6 sm:p-7 animate-fade-up"
            style={{
              animationDelay: '60ms',
              boxShadow: '0 1px 2px rgb(24 24 27 / 0.04), 0 16px 40px -24px rgb(24 24 27 / 0.28)',
            }}
          >
            <h1 className="text-[19px] font-semibold tracking-tight text-primary">Acessar sua conta</h1>
            <p className="mt-1 text-[13px] text-subtle">Use suas credenciais corporativas.</p>

            <form onSubmit={submit} noValidate className="mt-6 space-y-4 stagger">
              <div style={{ '--i': 0 } as React.CSSProperties}>
                <Field label="E-mail" htmlFor="login-email" error={errors.email}>
                  <Input
                    id="login-email"
                    type="email"
                    inputMode="email"
                    autoComplete="username"
                    autoFocus
                    spellCheck={false}
                    placeholder="nome.sobrenome@safip.demo"
                    value={email}
                    invalid={!!errors.email}
                    aria-invalid={!!errors.email}
                    onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors((s) => ({ ...s, email: undefined })); }}
                  />
                </Field>
              </div>

              <div style={{ '--i': 1 } as React.CSSProperties}>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="label mb-0" htmlFor="login-senha">Senha</label>
                  <button
                    type="button"
                    onClick={() => setResetOpen((v) => !v)}
                    className="-my-2 -mr-1 px-1 py-2 rounded-md text-[12px] font-medium text-subtle hover:text-primary transition-colors cursor-pointer"
                    aria-expanded={resetOpen}
                  >
                    Esqueci minha senha
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="login-senha"
                    type={showPass ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Digite sua senha"
                    className="pr-11"
                    value={senha}
                    invalid={!!errors.senha}
                    aria-invalid={!!errors.senha}
                    onChange={(e) => { setSenha(e.target.value); if (errors.senha) setErrors((s) => ({ ...s, senha: undefined })); }}
                    onKeyUp={(e) => setCapsOn(e.getModifierState?.('CapsLock') ?? false)}
                    onBlur={() => setCapsOn(false)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 rounded-lg text-subtle hover:text-primary hover:bg-primary/5 transition-colors cursor-pointer"
                    aria-label={showPass ? 'Ocultar senha' : 'Mostrar senha'}
                    tabIndex={-1}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.senha && <p className="mt-1 text-[12px] text-destructive font-medium" role="alert">{errors.senha}</p>}
                {capsOn && !errors.senha && <p className="mt-1 text-[12px] text-warning font-medium">Caps Lock está ativado.</p>}
                {resetOpen && (
                  <p className="mt-2 text-[12px] text-secondary leading-relaxed rounded-lg bg-primary/[0.03] border border-primary/8 px-3 py-2 animate-fade-up">
                    A redefinição é feita pela coordenação de operações. Neste ambiente demonstrativo não há envio de e-mail.
                  </p>
                )}
              </div>

              <div style={{ '--i': 2 } as React.CSSProperties} className="pt-1">
                <Button type="submit" size="lg" className="w-full" loading={loading}>
                  {loading ? 'Entrando' : 'Entrar'}
                </Button>
              </div>
            </form>
          </div>

          {/* Divulgação progressiva: o acesso de demonstração não disputa com o login */}
          <div className="mt-4 animate-fade-up" style={{ animationDelay: '140ms' }}>
            <button
              type="button"
              onClick={() => setDemoOpen((v) => !v)}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-primary/20 py-2.5 text-[13px] font-semibold text-secondary hover:text-primary hover:border-primary/35 hover:bg-surface/60 transition-colors cursor-pointer"
              aria-expanded={demoOpen}
              aria-controls="demo-panel"
            >
              <span>Acesso de demonstração</span>
              <span className="font-normal text-subtle">· entrar sem senha</span>
              <ChevronDown size={14} className={cn('transition-transform duration-200', demoOpen && 'rotate-180')} aria-hidden />
            </button>

            <div
              id="demo-panel"
              className={cn('grid transition-[grid-template-rows,opacity] duration-300 ease-out',
                demoOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')}
            >
              {/* `inert` retira o painel recolhido da ordem de foco e da árvore
                  de acessibilidade, sem impedir a animação de altura. */}
              <div className="overflow-hidden" inert={!demoOpen}>
                <div className="rounded-2xl border border-primary/8 bg-surface p-3 mt-1">
                  <p className="text-[11.5px] text-subtle leading-relaxed px-1 pb-2">
                    Selecione um perfil para entrar. A senha não é verificada neste ambiente.
                  </p>
                  <div className="space-y-1">
                    {profiles.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => enter(u.id, u.role)}
                        tabIndex={demoOpen ? 0 : -1}
                        className="press w-full flex items-center gap-3 rounded-xl px-2.5 py-2 text-left hover:bg-primary/[0.04] transition-colors cursor-pointer group"
                      >
                        <Avatar nome={u.nome} />
                        <span className="flex-1 min-w-0">
                          <span className="block text-[13px] font-medium text-primary truncate">{u.nome}</span>
                          <span className="block text-[11.5px] text-subtle truncate">{ROLE_LABEL[u.role]}</span>
                        </span>
                        <ArrowRight size={15} className="text-subtle opacity-0 group-hover:opacity-100 transition-opacity shrink-0" aria-hidden />
                      </button>
                    ))}
                  </div>

                  {pendingLink && (
                    <button
                      type="button"
                      onClick={() => navigate(`/preencher/${pendingLink.token}`)}
                      tabIndex={demoOpen ? 0 : -1}
                      className="press mt-2 w-full flex items-start gap-2.5 rounded-xl border-t border-primary/8 px-2.5 pt-3 pb-1 text-left hover:bg-primary/[0.04] transition-colors cursor-pointer"
                    >
                      <ExternalLink size={14} className="text-subtle mt-0.5 shrink-0" aria-hidden />
                      <span>
                        <span className="block text-[12.5px] font-medium text-primary">Link individual do colaborador</span>
                        <span className="block text-[11.5px] text-subtle leading-relaxed">Preenchimento em campo, sem conta de acesso.</span>
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="px-5 pb-6 text-center animate-fade-in" style={{ animationDelay: '220ms' }}>
        <p className="text-[11px] text-subtle">
          SAFIP Inteligência em Mineração · Ambiente demonstrativo com dados sintéticos
        </p>
      </footer>
    </div>
  );
}
