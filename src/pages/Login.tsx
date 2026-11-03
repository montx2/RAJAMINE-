import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ScanLine, Sparkles, ClipboardCheck, ArrowRight, ExternalLink } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Avatar, Badge } from '../components/ui';
import { Logo, LogoMark, Wordmark } from '../components/Logo';
import { ROLE_LABEL } from '../data/types';

export default function Login() {
  const navigate = useNavigate();
  const login = useStore((s) => s.login);
  const users = useStore((s) => s.users);
  const reports = useStore((s) => s.reports);

  const profiles = ['u_helena', 'u_marta', 'u_glauber', 'u_carlos'].map((id) => users.find((u) => u.id === id)!).filter(Boolean);
  const pendingLink = reports.find((r) => r.status === 'pendente' || r.status === 'correcao');

  const enter = (userId: string, role: string) => {
    login(userId);
    navigate(role === 'colaborador' ? '/relatorios' : '/');
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_1fr]">
      {/* Painel institucional */}
      <div className="hidden lg:flex flex-col justify-between bg-primary p-10 xl:p-14 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" aria-hidden
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)', backgroundSize: '28px 28px' }} />
        <Logo />
        <div className="relative max-w-lg">
          <Badge tone="amber" className="mb-5 bg-brand/10 text-brand">Protótipo · competição SENAI · referências reais</Badge>
          <h1 className="text-[34px] xl:text-[40px] font-extrabold tracking-tight text-white leading-[1.15]">
            Relatórios de campo,<br />do jeito que a operação merece.
          </h1>
          <p className="mt-4 text-[15px] text-slate-400 leading-relaxed">
            Coleta móvel, padronização inteligente de textos, leitura de equipamentos por foto
            e revisão humana obrigatória — em um fluxo único, auditável e seguro.
          </p>
          <div className="mt-8 space-y-4">
            {[
              { icon: Sparkles, t: 'Padronização assistida', d: '1ª → 3ª pessoa com comparação visual e original preservado' },
              { icon: ScanLine, t: 'OCR de equipamentos', d: 'Leitura local das etiquetas com confirmação humana' },
              { icon: ClipboardCheck, t: 'Revisão e aprovação', d: 'Nenhum documento sai sem validação da responsável' },
              { icon: ShieldCheck, t: 'Segurança e LGPD', d: 'Perfis de acesso, trilha de auditoria e minimização de dados' },
            ].map((f) => (
              <div key={f.t} className="flex items-start gap-3.5">
                <span className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-brand shrink-0">
                  <f.icon size={17} aria-hidden />
                </span>
                <div>
                  <div className="text-[14px] font-bold text-white">{f.t}</div>
                  <div className="text-[12.5px] text-slate-400">{f.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-[11.5px] text-slate-500">
          Rajamine Inteligência em Mineração LTDA · Referências da empresa + exemplos sintéticos · Nenhuma mensagem real é disparada
        </p>
      </div>

      {/* Seleção de perfil */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex items-center gap-3">
            <LogoMark size={38} />
            <div>
              <Wordmark className="text-[19px]" light={false} />
              <div className="text-[10px] font-semibold tracking-[0.18em] text-accent">FIELDOPS</div>
            </div>
          </div>
          <h2 className="text-[22px] font-extrabold tracking-tight text-primary">Acessar demonstração</h2>
          <p className="mt-1.5 text-[13.5px] text-subtle">
            Escolha um perfil para explorar o sistema. <strong>Acesso demonstrativo</strong> — a autenticação real
            (SSO/MFA, senhas com hash, sessões seguras) está documentada para a versão de produção.
          </p>

          <div className="mt-6 space-y-3">
            {profiles.map((u) => (
              <button
                key={u.id}
                onClick={() => enter(u.id, u.role)}
                className="w-full card p-4 flex items-center gap-4 hover:border-accent/50 hover:shadow-pop transition-all duration-150 cursor-pointer text-left group"
              >
                <Avatar nome={u.nome} size="lg" />
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-bold text-primary">{u.nome}</div>
                  <div className="text-[12.5px] text-subtle">{u.cargo}</div>
                  <Badge tone={u.role === 'admin' ? 'violet' : u.role === 'revisora' ? 'blue' : 'teal'} className="mt-1.5">
                    {ROLE_LABEL[u.role]}
                  </Badge>
                </div>
                <ArrowRight size={18} className="text-subtle group-hover:text-accent group-hover:translate-x-0.5 transition-transform" aria-hidden />
              </button>
            ))}
          </div>

          {pendingLink && (
            <button
              onClick={() => navigate(`/preencher/${pendingLink.token}`)}
              className="mt-5 w-full rounded-xl border border-dashed border-accent/40 bg-accent-soft/40 px-4 py-3.5 text-left hover:bg-accent-soft/70 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2 text-[13.5px] font-bold text-accent">
                <ExternalLink size={15} aria-hidden />
                Abrir link individual do colaborador
              </div>
              <p className="text-[12px] text-subtle mt-0.5">
                Simula o link enviado por e-mail/WhatsApp — preenche o {pendingLink.codigo} sem login.
              </p>
            </button>
          )}

          <p className="mt-6 text-[11.5px] text-subtle leading-relaxed">
            Ao continuar, você usa um ambiente de demonstração com referências reais fornecidas pela empresa e exemplos sintéticos, conforme a LGPD (Lei 13.709/2018).
            Envios, notificações e lembretes são simulados e registrados na trilha de auditoria.
          </p>
        </div>
      </div>
    </div>
  );
}
