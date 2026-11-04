import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ScanLine, ClipboardCheck, ArrowRight, ExternalLink } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import { useStore } from '../store/useStore';
import { Avatar, Badge } from '../components/ui';
import { Logo, LogoMark, Wordmark } from '../components/Logo';
import { ROLE_LABEL } from '../data/types';

export default function Login() {
  const navigate = useNavigate();
  const login = useStore((s) => s.login);
  const users = useStore((s) => s.users);
  const reports = useStore((s) => s.reports);

  const profiles = ['u_helena', 'u_marta', 'u_carlos', 'u_andre', 'u_mot_joao'].map((id) => users.find((u) => u.id === id)!).filter(Boolean);
  const pendingLink = reports.find((r) => r.status === 'pendente' || r.status === 'correcao');

  const enter = (userId: string, role: string) => {
    login(userId);
    navigate(role === 'motorista' ? '/motorista' : role === 'colaborador' ? '/relatorios' : '/');
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] relative">
      <div className="absolute top-4 right-4 z-10"><ThemeToggle /></div>
      {/* Painel institucional — vidro escuro sobre ambiente */}
      <div className="hidden lg:flex flex-col justify-between glass-dark p-10 xl:p-14 relative overflow-hidden border-r border-white/10">
        <Logo />
        <div className="relative max-w-md">
          <Badge tone="amber" className="mb-5 bg-brand/10 text-brand border-brand/20">Protótipo funcional</Badge>
          <h1 className="text-[34px] xl:text-[40px] font-semibold tracking-tight text-white leading-[1.12] text-balance">
            Relatórios de campo,<br />claros do início ao fim.
          </h1>
          <p className="mt-4 text-[14.5px] text-zinc-400 leading-relaxed">
            Coleta em campo, padronização assistida, leitura local de fotos e revisão humana obrigatória, com histórico auditável.
          </p>
          <div className="mt-8 grid gap-3">
            {[
              { icon: ScanLine, t: 'OCR local de equipamentos', d: 'Etiquetas e IMEI lidos no navegador, com confirmação humana.' },
              { icon: ClipboardCheck, t: 'Revisão antes do cliente', d: 'Nenhum documento é liberado sem aprovação da responsável.' },
              { icon: ShieldCheck, t: 'Auditoria e permissões', d: 'Perfis, trilha de alterações e minimização de dados.' },
            ].map((f) => (
              <div key={f.t} className="flex items-start gap-3 rounded-2xl bg-white/5 border border-white/10 px-4 py-3">
                <span className="w-8 h-8 rounded-xl bg-brand/15 flex items-center justify-center text-brand shrink-0">
                  <f.icon size={16} aria-hidden />
                </span>
                <div>
                  <div className="text-[13.5px] font-bold text-white">{f.t}</div>
                  <div className="text-[12px] text-zinc-400">{f.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-[11px] text-zinc-500">
          Rajamine Inteligência em Mineração LTDA · Base demonstrativa sintética · Envios simulados
        </p>
      </div>

      {/* Seleção de perfil */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md animate-fade-up">
          <div className="lg:hidden mb-8 flex items-center gap-3">
            <LogoMark size={38} />
            <div>
              <Wordmark className="text-[19px]" light={false} />
              <div className="text-[10px] font-semibold tracking-[0.18em] text-accent">FIELDOPS</div>
            </div>
          </div>

          <div className="card p-6 sm:p-7">
            <h2 className="text-[22px] font-semibold tracking-tight text-primary">Acessar demonstração</h2>
            <p className="mt-1.5 text-[13px] text-subtle">
              Escolha um perfil para explorar. Acesso demonstrativo — autenticação real está documentada para produção.
            </p>

            <div className="mt-6 space-y-2.5 stagger">
              {profiles.map((u, i) => (
                <button
                  key={u.id}
                  onClick={() => enter(u.id, u.role)}
                  style={{ '--i': i } as React.CSSProperties}
                  className="press w-full rounded-2xl border border-primary/8 bg-surface/60 p-3.5 flex items-center gap-3.5 hover:border-accent/30 hover:bg-surface hover:shadow-[0_10px_30px_-16px_rgb(24_24_27/0.25)] transition-[background-color,border-color,box-shadow,transform] duration-150 cursor-pointer text-left group"
                >
                  <Avatar nome={u.nome} size="lg" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[14.5px] font-semibold text-primary">{u.nome}</div>
                    <div className="text-[12px] text-subtle truncate">{u.cargo}</div>
                    <Badge tone="slate" className="mt-1.5">
                      {ROLE_LABEL[u.role]}
                    </Badge>
                  </div>
                  <ArrowRight size={17} className="text-subtle group-hover:text-accent group-hover:translate-x-0.5 transition-transform" aria-hidden />
                </button>
              ))}
            </div>

            {pendingLink && (
              <button
                onClick={() => navigate(`/preencher/${pendingLink.token}`)}
                className="press mt-4 w-full rounded-2xl border border-dashed border-accent/35 bg-accent-soft/40 px-4 py-3 text-left hover:bg-accent-soft/70 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 text-[13px] font-semibold text-accent">
                  <ExternalLink size={14} aria-hidden /> Abrir link individual do colaborador
                </div>
                <p className="text-[11.5px] text-subtle mt-0.5">Simula o link enviado por e-mail/WhatsApp — preenche sem login.</p>
              </button>
            )}
          </div>

          <p className="mt-4 text-[11px] text-subtle leading-relaxed px-1">
            Ambiente de demonstração com dados sintéticos realistas. Envios e notificações são simulados e auditados.
          </p>
        </div>
      </div>
    </div>
  );
}
