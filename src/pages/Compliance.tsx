import { useState } from 'react';
import { ShieldCheck, Check, AlertTriangle, Download, RotateCcw, ExternalLink, Lock, FileJson } from 'lucide-react';
import { useStore, useCurrentUser } from '../store/useStore';
import { PageHeader } from '../components/AppShell';
import { Button, Badge, Banner, Modal, toast } from '../components/ui';
import { downloadBytes } from '../services/pdf';

const IMPLEMENTADO = [
  ['Perfis de acesso (RBAC demonstrativo)', 'Admin, revisão e colaborador com escopos distintos; colaborador só acessa os próprios relatórios; link individual com token não sequencial.'],
  ['Validação de entradas', 'Esquemas Zod nos formulários + validação server-side equivalente documentada para produção.'],
  ['Validação de uploads', 'Tipo MIME + assinatura mágica (magic bytes) + limite de 8 MB; imagens nunca são executáveis.'],
  ['Processamento local (minimização)', 'OCR (Tesseract WASM) e padronização rodam no navegador: fotos e textos não saem do dispositivo nesta demonstração.'],
  ['Aprovação humana obrigatória', 'Documento do cliente bloqueado até aprovação registrada com autor e data; OCR pendente bloqueia aprovação.'],
  ['Preservação de originais', 'Texto original e fotos nunca são sobrescritos silenciosamente; versões e trilha de auditoria por evento.'],
  ['Trilha de auditoria', 'Criação, edição, revisão, aprovação, geração e envio registrados com autor, data/hora e detalhe.'],
  ['Simulações rotuladas', 'Envios, lembretes e resultados de OCR simulados são explicitamente identificados na interface e na auditoria.'],
  ['Proveniência de dados', 'Base mista: exemplos sintéticos + referências reais fornecidas pela empresa, marcadas como origemDados. Imagens originais não são commitadas; campos ausentes não são inventados.'],
];

const PRODUCAO = [
  ['Autenticação real', 'OIDC/SSO corporativo + MFA; senhas com Argon2id quando aplicável; cookies httpOnly/SameSite; expiração e rotação de sessão (OWASP ASVS v5.0 V2/V3).'],
  ['Autorização no servidor', 'Toda checagem de perfil e escopo repetida na API (o RBAC do frontend é apenas UX); testes contra IDOR/BOLA (OWASP API Top 10).'],
  ['Criptografia', 'TLS 1.2+ em trânsito; criptografia em repouso no banco e no storage de fotos; gestão de chaves em cofre (KMS).'],
  ['Proteção de API', 'Rate limiting, limites de payload, CSRF token para sessões cookie, cabeçalhos de segurança (CSP, HSTS, X-Content-Type-Options).'],
  ['Links individuais seguros', 'Token de uso único com expiração curta, revogação e registro de acesso (IP/porta lógica conforme Marco Civil).'],
  ['Backups e recuperação', 'Rotina 3-2-1, testes de restauração periódicos e plano de continuidade validado.'],
  ['Logs imutáveis e monitoramento', 'Trilha de auditoria append-only, alertas de anomalias e retenção definida em política.'],
  ['Testes de segurança', 'OWASP ZAP (baseline + API scan) no CI; verificação ASVS nível 2; revisão de dependências (SCA).'],
  ['Governança LGPD', 'Bases legais documentadas (art. 7º), RIPD para o tratamento com IA/OCR, encarregado (DPO) indicado, política de retenção e eliminação, contratos com operadores.'],
  ['Resposta a incidentes', 'Fluxo conforme Resolução CD/ANPD nº 15/2024: registro, avaliação de risco e comunicação à ANPD e aos titulares em até 3 dias úteis quando houver risco ou dano relevante.'],
];

const LGPD_MAP = [
  ['Art. 6º (princípios)', 'Finalidade e necessidade: coleta mínima (viagem, atividades, equipamentos); transparência nos banners e documentação.'],
  ['Art. 7º (bases legais)', 'Produção: execução de contrato e obrigações trabalhistas/regulatórias para dados de colaboradores; documento de bases legais pendente de validação jurídica.'],
  ['Art. 18 (direitos do titular)', 'Exportação de dados implementada na demonstração (JSON); atendimento completo depende de processo interno da empresa.'],
  ['Arts. 46–49 (segurança)', 'Medidas técnicas do protótipo + plano de produção (lista acima); conformidade plena depende de implantação e auditoria.'],
  ['Art. 38 (RIPD)', 'Recomendado para o uso de OCR/IA sobre dados de colaboradores; a elaborar com o encarregado.'],
  ['Res. CD/ANPD 2/2022', 'Enquadramento como agente de pequeno porte NÃO presumido: depende de receita e critérios de alto risco (a verificar com a empresa).'],
];

export default function Compliance() {
  const user = useCurrentUser()!;
  const state = useStore();
  const resetDemo = useStore((s) => s.resetDemo);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const exportData = () => {
    const payload = {
      aviso: 'Exportação demonstrativa do Rajamine FieldOps — inclui exemplos sintéticos e referências reais fornecidas pela empresa (origemDados). Não é base de produção.',
      exportadoEm: new Date().toISOString(),
      users: state.users, clients: state.clients, trucks: state.trucks,
      equipment: state.equipment, reports: state.reports, notifications: state.notifications,
    };
    const bytes = new TextEncoder().encode(JSON.stringify(payload, null, 2));
    downloadBytes(bytes, 'rajamine-fieldops-dados-demo.json', 'application/json');
    toast('Dados da demonstração exportados em JSON.');
  };

  const doReset = async () => {
    setResetting(true);
    await resetDemo();
    setResetting(false);
    setResetOpen(false);
    toast('Base de demonstração restaurada.', 'info');
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Segurança & Conformidade (LGPD)"
        subtitle="O que este protótipo implementa, o que depende da versão de produção e o que exige validação jurídica da empresa."
      />

      <Banner tone="warn" icon={<AlertTriangle size={17} />}>
        <strong>Transparência:</strong> este ambiente é um protótipo com autenticação demonstrativa e base mista (exemplos sintéticos + referências reais fornecidas pela Rajamine, devidamente marcadas).
        Ele <strong>não declara conformidade plena</strong> com a LGPD — várias medidas dependem de implantação em produção
        e de orientação jurídica especializada, conforme detalhado abaixo.
      </Banner>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h2 className="section-title mb-4 flex items-center gap-2"><ShieldCheck size={17} className="text-success" aria-hidden /> Implementado no protótipo</h2>
          <ul className="space-y-3">
            {IMPLEMENTADO.map(([t, d]) => (
              <li key={t} className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-success-soft text-success flex items-center justify-center shrink-0 mt-0.5"><Check size={12} /></span>
                <div>
                  <div className="text-[13.5px] font-bold text-foreground">{t}</div>
                  <div className="text-[12.5px] text-subtle leading-relaxed">{d}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="card p-5">
          <h2 className="section-title mb-4 flex items-center gap-2"><Lock size={17} className="text-accent" aria-hidden /> Obrigatório na versão de produção</h2>
          <ul className="space-y-3">
            {PRODUCAO.map(([t, d]) => (
              <li key={t} className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-accent-soft text-accent flex items-center justify-center shrink-0 mt-0.5"><AlertTriangle size={11} /></span>
                <div>
                  <div className="text-[13.5px] font-bold text-foreground">{t}</div>
                  <div className="text-[12.5px] text-subtle leading-relaxed">{d}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="section-title mb-4">Mapa LGPD — dispositivos × aplicação</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-muted/50 border-b border-border">
              <tr><th className="th">Dispositivo</th><th className="th">Aplicação ao sistema</th></tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {LGPD_MAP.map(([a, b]) => (
                <tr key={a}><td className="td font-semibold whitespace-nowrap">{a}</td><td className="td text-secondary text-[13px]">{b}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[12px] text-subtle">
          Análise completa com fontes oficiais (LGPD, Marco Civil, Decreto 8.771/2016 com alterações do Decreto 12.975/2026,
          Resoluções ANPD 15/2024 e 2/2022) em <span className="mono">docs/06-legal.md</span>.
        </p>
      </div>

      <div className="card p-5">
        <h2 className="section-title mb-2">Dados da demonstração</h2>
        <p className="text-[13px] text-subtle mb-4">
          Direito de acesso/portabilidade (LGPD art. 18) demonstrado na prática: exporte a base demonstrativa em JSON
          (com proveniência por registro) ou restaure o cenário inicial para uma nova apresentação.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" icon={<FileJson size={16} />} onClick={exportData}>Exportar dados (JSON)</Button>
          {user.role === 'admin' && (
            <Button variant="danger" icon={<RotateCcw size={16} />} onClick={() => setResetOpen(true)}>Restaurar demonstração</Button>
          )}
        </div>
      </div>

      <div className="card p-5">
        <h2 className="section-title mb-3">Referências utilizadas</h2>
        <div className="grid sm:grid-cols-2 gap-2 text-[13px]">
          {[
            ['OWASP ASVS v5.0', 'https://github.com/OWASP/ASVS'],
            ['OWASP Top 10', 'https://github.com/OWASP/Top10'],
            ['OWASP Cheat Sheet Series', 'https://github.com/OWASP/CheatSheetSeries'],
            ['OWASP API Security', 'https://github.com/OWASP/API-Security'],
            ['OWASP ZAP', 'https://github.com/zaproxy/zaproxy'],
            ['LGPD — Lei 13.709/2018 (texto atualizado)', 'https://www2.camara.leg.br/legin/fed/lei/2018/lei-13709-14-agosto-2018-787077-normaatualizada-pl.html'],
            ['Marco Civil — Lei 12.965/2014', 'https://www2.camara.leg.br/legin/fed/lei/2014/lei-12965-23-abril-2014-778630-norma-pl.html'],
            ['Decreto 12.975/2026', 'https://www2.camara.leg.br/legin/fed/decret/2026/decreto-12975-20-maio-2026-799136-publicacaooriginal-179396-pe.html'],
            ['Res. CD/ANPD 15/2024 (incidentes)', 'https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd/'],
            ['Res. CD/ANPD 2/2022 (pequeno porte)', 'https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd/resolucao-cd-anpd-no-2-de-27-de-janeiro-de-2022'],
          ].map(([label, href]) => (
            <a key={href} href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 hover:border-accent/50 text-secondary hover:text-accent transition-colors">
              <ExternalLink size={13} className="shrink-0" aria-hidden /> {label}
            </a>
          ))}
        </div>
      </div>

      <Modal open={resetOpen} onClose={() => setResetOpen(false)} title="Restaurar base de demonstração"
        footer={<>
          <Button variant="ghost" onClick={() => setResetOpen(false)}>Cancelar</Button>
          <Button variant="danger" icon={<RotateCcw size={15} />} loading={resetting} onClick={doReset}>Restaurar tudo</Button>
        </>}>
        <p className="text-[13.5px] text-secondary">
          Todos os relatórios, fotos enviadas, equipamentos e notificações voltarão ao cenário inicial da demonstração
          (sintéticos + referências transcritas). Útil para reiniciar a apresentação. <strong>A ação não afeta sistemas reais da empresa.</strong>
        </p>
      </Modal>
    </div>
  );
}
