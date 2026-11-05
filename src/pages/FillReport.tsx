import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  MapPin, PenLine, Camera, Send, Check, ChevronLeft, ChevronRight,
  CheckCircle2, AlertTriangle, Clock, ShieldCheck, Plus, Trash2,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { Button, Field, Input, Select, Textarea, Badge, Banner, toast, StatusBadge } from '../components/ui';
import { LogoMark, Wordmark } from '../components/Logo';
import PadronizacaoPanel from '../components/PadronizacaoPanel';
import PhotosOcrPanel from '../components/PhotosOcrPanel';
import { fmtDate, fmtDateTime, deadlineLabel, todayISO } from '../lib/format';
import { cn } from '../lib/cn';
import { uid } from '../lib/id';
import { validateActivities } from '../lib/operations';
import { ACTIVITY_KIND_LABEL, REPORT_KIND_LABEL, type ActivityEntry, type ActivityKind, type ReportKind } from '../data/types';

const STEPS = [
  { id: 0, label: 'Visita', icon: MapPin },
  { id: 1, label: 'Atividades', icon: PenLine },
  { id: 2, label: 'Fotos & equipamentos', icon: Camera },
  { id: 3, label: 'Revisar & enviar', icon: Send },
];

const emptyActivity = (data: string): ActivityEntry => ({
  id: uid('act'), data, equipamentoCodigo: '', tipo: 'manutencao', componentes: [], fotos: 'nao_informado',
});

export default function FillReport() {
  const { token } = useParams();
  const reports = useStore((s) => s.reports);
  const users = useStore((s) => s.users);
  const clients = useStore((s) => s.clients);
  const trucks = useStore((s) => s.trucks);
  const saveFillDraft = useStore((s) => s.saveFillDraft);
  const submitToReview = useStore((s) => s.submitToReview);

  const report = reports.find((r) => r.token === token);
  const colab = users.find((u) => u.id === report?.colaboradorId);
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [form, setForm] = useState({
    dataViagem: report?.dataViagem ?? todayISO(),
    origem: report?.origem ?? '',
    destino: report?.destino ?? '',
    kmInicio: report?.kmInicio != null ? String(report.kmInicio) : '',
    kmFim: report?.kmFim != null ? String(report.kmFim) : '',
    descricao: report?.descricaoAtual ?? '',
    tipo: (report?.tipo ?? 'visita_tecnica') as ReportKind,
    setor: report?.setor ?? 'Manutenção',
    cidadeBairro: report?.cidadeBairro ?? '',
    objetivo: report?.objetivo ?? '',
    periodoInicio: report?.periodoInicio ?? report?.dataViagem ?? todayISO(),
    periodoFim: report?.periodoFim ?? report?.dataViagem ?? todayISO(),
    avaliacaoTecnica: report?.avaliacaoTecnica ?? '',
    sensacaoCliente: report?.sensacaoCliente ?? '',
    pontosPositivos: report?.pontosPositivos ?? '',
    melhorias: report?.melhorias ?? '',
  });
  const [atividades, setAtividades] = useState<ActivityEntry[]>(report?.atividades ?? []);

  useEffect(() => {
    if (report) setForm((f) => ({ ...f, descricao: report.descricaoAtual || f.descricao }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report?.descricaoAtual]);

  const fillable = report && ['pendente', 'rascunho', 'correcao'].includes(report.status);
  const dl = report ? deadlineLabel(report.prazoEm) : null;
  const isViagem = form.tipo === 'viagem';
  const consistency = useMemo(() => validateActivities(atividades, { inicio: form.periodoInicio, fim: form.periodoFim }), [atividades, form.periodoInicio, form.periodoFim]);

  const persist = () => {
    if (!report || !colab) return;
    saveFillDraft(report.id, {
      dataViagem: form.dataViagem, origem: form.origem, destino: form.destino,
      kmInicio: form.kmInicio ? Number(form.kmInicio) : undefined,
      kmFim: form.kmFim ? Number(form.kmFim) : undefined,
      descricao: form.descricao, tipo: form.tipo, setor: form.setor, cidadeBairro: form.cidadeBairro,
      objetivo: form.objetivo, periodoInicio: form.periodoInicio, periodoFim: form.periodoFim,
      avaliacaoTecnica: form.avaliacaoTecnica, sensacaoCliente: form.sensacaoCliente,
      pontosPositivos: form.pontosPositivos, melhorias: form.melhorias, atividades,
    }, colab.nome);
  };

  const next = () => {
    if (step === 0) {
      const errs: string[] = [];
      if (form.periodoInicio && form.periodoFim && form.periodoFim < form.periodoInicio) errs.push('O fim do período deve ser igual ou posterior ao início.');
      if ([form.kmInicio, form.kmFim].some((km) => km !== '' && (!Number.isFinite(Number(km)) || Number(km) < 0))) errs.push('Informe uma quilometragem válida e não negativa.');
      if (!form.dataViagem) errs.push('Informe a data da viagem / visita.');
      if (isViagem && form.origem.trim().length < 3) errs.push('Informe a origem.');
      if (isViagem && form.destino.trim().length < 3) errs.push('Informe o destino.');
      if (form.kmInicio && form.kmFim && Number(form.kmFim) <= Number(form.kmInicio)) errs.push('KM final deve ser maior que o inicial.');
      if (errs.length) { setErrors(errs); return; }
    }
    if (step === 1 && form.descricao.trim().length < 20 && atividades.length === 0) {
      setErrors(['Descreva as atividades com pelo menos 20 caracteres ou registre ao menos uma atividade por equipamento.']);
      return;
    }
    setErrors([]);
    persist();
    setStep((s) => Math.min(3, s + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const back = () => { persist(); setErrors([]); setStep((s) => Math.max(0, s - 1)); window.scrollTo({ top: 0 }); };

  const submit = () => {
    if (!report || !colab) return;
    persist();
    const res = submitToReview(report.id, colab.nome);
    if (!res.ok) { setErrors(res.erros); toast('Revise as pendências antes de enviar.', 'error'); return; }
    setSubmitted(true);
    window.scrollTo({ top: 0 });
  };

  const client = clients.find((c) => c.id === report?.clienteId);
  const truck = trucks.find((t) => t.id === report?.caminhaoId);
  const lastCorrection = useMemo(() => report?.notasRevisao.filter((n) => n.tipo === 'correcao').at(-1), [report]);

  const updateActivity = (id: string, patch: Partial<ActivityEntry>) => {
    setAtividades((list) => list.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  };

  if (!report) {
    return (
      <Shell>
        <div className="card p-8 text-center">
          <AlertTriangle size={28} className="mx-auto text-warning mb-3" aria-hidden />
          <h1 className="text-[18px] font-bold text-primary">Link inválido ou expirado</h1>
          <p className="text-[13.5px] text-subtle mt-2">Este link não corresponde a nenhum relatório. Solicite um novo link à coordenação.</p>
          <Link to="/login" className="link text-[13.5px] mt-4 inline-block">Ir para a página inicial</Link>
        </div>
      </Shell>
    );
  }

  if (submitted || !fillable) {
    return (
      <Shell>
        <div className="card p-8 text-center">
          <CheckCircle2 size={34} className="mx-auto text-success mb-3" aria-hidden />
          <h1 className="text-[19px] font-bold text-primary">
            {submitted ? 'Relatório enviado para revisão.' : 'Este relatório já foi enviado'}
          </h1>
          <p className="text-[13.5px] text-subtle mt-2 max-w-md mx-auto">
            {submitted
              ? `${report.codigo} foi encaminhado para a responsável pela revisão. Você será notificado se forem necessárias correções.`
              : 'O preenchimento foi concluído. Acompanhe o andamento pelo seu gestor ou aguarde o retorno da revisão.'}
          </p>
          <div className="mt-4 flex justify-center"><StatusBadge status={report.status} /></div>
          <div className="mt-6 rounded-xl bg-muted/60 p-4 text-left max-w-md mx-auto text-[13px] text-secondary space-y-1.5">
            <div><strong>Cliente:</strong> {client?.nome ?? 'Consolidado semanal'}</div>
            {truck && <div><strong>Caminhão:</strong> {truck.frota} · {truck.placa}</div>}
            <div><strong>Atividades por equipamento:</strong> {atividades.length}</div>
            <div><strong>Fotos:</strong> {report.fotos.length} anexada(s)</div>
          </div>
          <Link to="/login" className="link text-[13.5px] mt-6 inline-block">Acessar o sistema (demonstração)</Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="card p-4 sm:p-5 mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="mono font-semibold text-[17px] text-primary">{report.codigo}</span>
              <StatusBadge status={report.status} />
            </div>
            <p className="text-[12.5px] text-subtle mt-1">
              {colab?.nome} · {client?.nome ?? 'Consolidado'} {truck ? <>· <span className="mono">{truck.frota} ({truck.placa})</span></> : null}
            </p>
          </div>
          {dl && (
            <Badge tone={dl.tom === 'late' ? 'red' : dl.tom === 'warn' ? 'amber' : 'green'} dot>
              <Clock size={11} aria-hidden /> {dl.texto} · prazo {fmtDateTime(report.prazoEm)}
            </Badge>
          )}
        </div>
        {report.status === 'correcao' && lastCorrection && (
          <Banner tone="danger" className="mt-3" icon={<AlertTriangle size={16} />}>
            <strong>Correção solicitada por {lastCorrection.autor}:</strong> {lastCorrection.texto}
          </Banner>
        )}
      </div>

      <ol className="flex items-center gap-1 mb-5" aria-label="Etapas do preenchimento">
        {STEPS.map((s, i) => (
          <li key={s.id} className="flex-1">
            <button
              onClick={() => { if (i < step) { persist(); setStep(i); } }}
              disabled={i > step}
              className={cn('w-full flex flex-col items-center gap-1.5 group', i > step ? 'cursor-default' : 'cursor-pointer')}
              aria-current={i === step ? 'step' : undefined}
            >
              <span className={cn('w-9 h-9 rounded-full flex items-center justify-center border-2 transition-colors',
                i < step ? 'bg-success border-success text-primary-foreground' : i === step ? 'border-accent bg-accent-soft text-accent' : 'border-border bg-surface text-subtle')}>
                {i < step ? <Check size={15} /> : <s.icon size={15} aria-hidden />}
              </span>
              <span className={cn('text-xs sm:text-xs font-bold text-center leading-tight', i === step ? 'text-accent' : 'text-subtle')}>
                {s.label}
              </span>
            </button>
          </li>
        ))}
      </ol>

      {errors.length > 0 && (
        <div className="mb-4 rounded-xl border border-red-200 bg-destructive-soft/60 p-4" role="alert" tabIndex={-1}>
          <h2 className="text-[13.5px] font-bold text-destructive mb-1.5">Há pendências para resolver:</h2>
          <ul className="list-disc pl-5 space-y-0.5 text-[13px] text-red-800">{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
        </div>
      )}

      {step === 0 && (
        <div className="card p-5 space-y-4 animate-fade-up">
          <h2 className="section-title">Dados da visita / atividade</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Tipo de relatório" htmlFor="fv-tipo">
              <Select id="fv-tipo" value={form.tipo} onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value as ReportKind }))}>
                {(Object.keys(REPORT_KIND_LABEL) as ReportKind[]).map((k) => <option key={k} value={k}>{REPORT_KIND_LABEL[k]}</option>)}
              </Select>
            </Field>
            <Field label="Data" required htmlFor="fv-data">
              <Input id="fv-data" type="date" max={todayISO()} value={form.dataViagem} onChange={(e) => setForm((f) => ({ ...f, dataViagem: e.target.value }))} />
            </Field>
            <Field label="Setor" htmlFor="fv-setor"><Input id="fv-setor" value={form.setor} onChange={(e) => setForm((f) => ({ ...f, setor: e.target.value }))} /></Field>
            <Field label="Cidade / Bairros" htmlFor="fv-cidade"><Input id="fv-cidade" value={form.cidadeBairro} onChange={(e) => setForm((f) => ({ ...f, cidadeBairro: e.target.value }))} placeholder="Mariana - MG" /></Field>
            <Field label="Período — início" htmlFor="fv-pi"><Input id="fv-pi" type="date" value={form.periodoInicio} onChange={(e) => setForm((f) => ({ ...f, periodoInicio: e.target.value }))} /></Field>
            <Field label="Período — fim" htmlFor="fv-pf"><Input id="fv-pf" type="date" value={form.periodoFim} onChange={(e) => setForm((f) => ({ ...f, periodoFim: e.target.value }))} /></Field>
            {isViagem && (
              <>
                <Field label="Origem" required htmlFor="fv-origem"><Input id="fv-origem" value={form.origem} onChange={(e) => setForm((f) => ({ ...f, origem: e.target.value }))} /></Field>
                <Field label="Destino" required htmlFor="fv-destino"><Input id="fv-destino" value={form.destino} onChange={(e) => setForm((f) => ({ ...f, destino: e.target.value }))} /></Field>
                <Field label="KM inicial" htmlFor="fv-kmi"><Input id="fv-kmi" type="number" inputMode="numeric" value={form.kmInicio} onChange={(e) => setForm((f) => ({ ...f, kmInicio: e.target.value }))} /></Field>
                <Field label="KM final" htmlFor="fv-kmf"><Input id="fv-kmf" type="number" inputMode="numeric" value={form.kmFim} onChange={(e) => setForm((f) => ({ ...f, kmFim: e.target.value }))} /></Field>
              </>
            )}
          </div>
          <Field label="Objetivo da visita" htmlFor="fv-objetivo">
            <Textarea id="fv-objetivo" value={form.objetivo} onChange={(e) => setForm((f) => ({ ...f, objetivo: e.target.value }))} className="min-h-[80px]" placeholder="Instalação de 1 telemetria, 1 tablet e 1 câmera de fadiga…" />
          </Field>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4 animate-fade-up">
          <div className="card p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="section-title">Atividades por equipamento</h2>
              <Button size="sm" variant="outline" icon={<Plus size={14} />} onClick={() => setAtividades((l) => [...l, emptyActivity(form.dataViagem)])}>Adicionar</Button>
            </div>
            <p className="text-[12.5px] text-subtle">Registre instalação, desmobilização, manutenção ou conferência com os IDs reais: telemetria, Pulsus, câmera (IMEI) e Galileo.</p>
            {atividades.length === 0 && <p className="text-[13px] text-subtle rounded-lg bg-muted/50 p-3">Nenhuma atividade estruturada ainda. Você pode adicionar linhas ou usar o relato livre abaixo.</p>}
            <div className="space-y-3">
              {atividades.map((a) => (
                <div key={a.id} className="rounded-xl border border-border p-3.5 space-y-3">
                  <div className="grid sm:grid-cols-[1fr_180px_auto] gap-2.5">
                    <Field label="Equipamento" htmlFor={`eq-${a.id}`}><Input id={`eq-${a.id}`} value={a.equipamentoCodigo} onChange={(e) => updateActivity(a.id, { equipamentoCodigo: e.target.value.toUpperCase() })} placeholder="SA-101 / VA-205" /></Field>
                    <Field label="Tipo" htmlFor={`tp-${a.id}`}>
                      <Select id={`tp-${a.id}`} value={a.tipo} onChange={(e) => updateActivity(a.id, { tipo: e.target.value as ActivityKind })}>
                        {(Object.keys(ACTIVITY_KIND_LABEL) as ActivityKind[]).map((k) => <option key={k} value={k}>{ACTIVITY_KIND_LABEL[k]}</option>)}
                      </Select>
                    </Field>
                    <div className="flex items-end"><Button size="sm" variant="ghost" icon={<Trash2 size={14} />} onClick={() => setAtividades((l) => l.filter((x) => x.id !== a.id))} aria-label="Remover atividade">Remover</Button></div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <Field label="Telemetria" htmlFor={`tel-${a.id}`}><Input id={`tel-${a.id}`} value={a.telemetria ?? ''} onChange={(e) => updateActivity(a.id, { telemetria: e.target.value })} placeholder="0187" inputMode="numeric" /></Field>
                    <Field label="Pulsus" htmlFor={`pul-${a.id}`}><Input id={`pul-${a.id}`} value={a.pulsus ?? ''} onChange={(e) => updateActivity(a.id, { pulsus: e.target.value })} placeholder="2741" inputMode="numeric" /></Field>
                    <Field label="Câmera (IMEI)" htmlFor={`cam-${a.id}`}><Input id={`cam-${a.id}`} value={a.cameraFadiga ?? ''} onChange={(e) => updateActivity(a.id, { cameraFadiga: e.target.value })} placeholder="864993060408250" inputMode="numeric" /></Field>
                    <Field label="Galileo" htmlFor={`gal-${a.id}`}><Input id={`gal-${a.id}`} value={a.galileo ?? ''} onChange={(e) => updateActivity(a.id, { galileo: e.target.value })} placeholder="867782071392430" inputMode="numeric" /></Field>
                  </div>
                  <Field label="Observação" htmlFor={`obs-${a.id}`}><Input id={`obs-${a.id}`} value={a.observacao ?? ''} onChange={(e) => updateActivity(a.id, { observacao: e.target.value })} placeholder="Telemetria antiga: 0995 / ID Câmera: …" /></Field>
                </div>
              ))}
            </div>
            {consistency.length > 0 && (
              <div className="space-y-1.5">
                {consistency.map((c, i) => (
                  <p key={i} className={cn('text-[12.5px] flex items-start gap-1.5', c.nivel === 'erro' ? 'text-destructive' : c.nivel === 'atencao' ? 'text-warning' : 'text-subtle')}>
                    <AlertTriangle size={13} className="shrink-0 mt-0.5" aria-hidden /> {c.mensagem}
                  </p>
                ))}
              </div>
            )}
          </div>

          <div className="card p-5 space-y-3">
            <h2 className="section-title">Relato livre</h2>
            <p className="text-[12.5px] text-subtle">Escreva no seu estilo. O sistema sugere a padronização para 3ª pessoa sem alterar os fatos — e você decide se aceita.</p>
            <Textarea value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} onBlur={persist}
              placeholder="Ex.: Foi realizado instalação do equipamento SA-101, telemetria numero 0187…" className="min-h-[150px]" aria-label="Descrição das atividades" />
            <div className="text-xs text-subtle text-right">{form.descricao.trim().length} caracteres</div>
          </div>
          {(form.descricao.trim().length >= 20 || atividades.length > 0) && (
            <PadronizacaoPanel report={{ ...report, descricaoAtual: form.descricao, atividades, objetivo: form.objetivo, periodoInicio: form.periodoInicio, periodoFim: form.periodoFim, tipo: form.tipo }} actorName={colab?.nome ?? 'Colaborador'} canEdit />
          )}
        </div>
      )}

      {step === 2 && (
        <div className="animate-fade-up"><PhotosOcrPanel report={report} actorName={colab?.nome ?? 'Colaborador'} canUpload canValidate /></div>
      )}

      {step === 3 && (
        <div className="space-y-4 animate-fade-up">
          <div className="card p-5">
            <h2 className="section-title mb-4">Confira antes de enviar</h2>
            <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-[13.5px]">
              <div><dt className="text-xs font-bold uppercase tracking-wider text-subtle">Tipo</dt><dd>{REPORT_KIND_LABEL[form.tipo]}</dd></div>
              <div><dt className="text-xs font-bold uppercase tracking-wider text-subtle">Período</dt><dd>{fmtDate(form.periodoInicio + 'T12:00:00')} → {fmtDate(form.periodoFim + 'T12:00:00')}</dd></div>
              <div><dt className="text-xs font-bold uppercase tracking-wider text-subtle">Objetivo</dt><dd>{form.objetivo || '—'}</dd></div>
              <div><dt className="text-xs font-bold uppercase tracking-wider text-subtle">Atividades / Fotos</dt><dd>{atividades.length} atividade(s) · {report.fotos.length} foto(s)</dd></div>
            </dl>
            <div className="mt-4 rounded-lg bg-muted/50 p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-subtle mb-1.5">Descrição que será enviada</div>
              <p className="text-[13.5px] text-secondary whitespace-pre-wrap">{report.descricaoAtual || form.descricao || '(sem relato livre)'}</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 mt-4">
              <Field label="Avaliação técnica" htmlFor="fv-aval"><Textarea id="fv-aval" value={form.avaliacaoTecnica} onChange={(e) => setForm((f) => ({ ...f, avaliacaoTecnica: e.target.value }))} className="min-h-[80px]" /></Field>
              <Field label="Sensação do cliente" htmlFor="fv-sens"><Textarea id="fv-sens" value={form.sensacaoCliente} onChange={(e) => setForm((f) => ({ ...f, sensacaoCliente: e.target.value }))} className="min-h-[80px]" /></Field>
              <Field label="Pontos positivos" htmlFor="fv-pos"><Textarea id="fv-pos" value={form.pontosPositivos} onChange={(e) => setForm((f) => ({ ...f, pontosPositivos: e.target.value }))} className="min-h-[70px]" /></Field>
              <Field label="Melhorias" htmlFor="fv-mel"><Textarea id="fv-mel" value={form.melhorias} onChange={(e) => setForm((f) => ({ ...f, melhorias: e.target.value }))} className="min-h-[70px]" /></Field>
            </div>
          </div>
          <Banner tone="info" icon={<ShieldCheck size={16} />}>
            Ao enviar, o texto original fica preservado e o relatório segue para a revisão humana. Nada é enviado ao cliente sem aprovação da responsável.
          </Banner>
          <Button variant="success" size="lg" icon={<Send size={17} />} onClick={submit} className="w-full">Enviar para revisão</Button>
        </div>
      )}

      {step < 3 && (
        <div className="flex justify-between mt-5">
          <Button variant="outline" icon={<ChevronLeft size={16} />} onClick={back} disabled={step === 0}>Voltar</Button>
          <Button variant="primary" onClick={next}>Continuar <ChevronRight size={16} aria-hidden /></Button>
        </div>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-background">
      <header className="glass-dark border-b border-white/10 pt-safe">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LogoMark size={32} />
            <div className="leading-none">
              <Wordmark className="text-[19px]" />
              <div className="text-xs text-zinc-400 mt-1">Preenchimento de relatório de campo</div>
            </div>
          </div>
          <Badge tone="amber" className="bg-brand/10 text-brand">link individual</Badge>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6">{children}</main>
      <footer className="max-w-2xl mx-auto px-4 pb-8 pb-safe text-center text-xs text-subtle">
        Protótipo · dados sintéticos · processamento local (OCR e padronização)
      </footer>
    </div>
  );
}
