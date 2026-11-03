import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  MapPin, PenLine, Camera, Send, Check, ChevronLeft, ChevronRight,
  CheckCircle2, AlertTriangle, Clock, ShieldCheck,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { Button, Field, Input, Textarea, Badge, Banner, toast, StatusBadge } from '../components/ui';
import { LogoMark } from '../components/Logo';
import PadronizacaoPanel from '../components/PadronizacaoPanel';
import PhotosOcrPanel from '../components/PhotosOcrPanel';
import { fmtDate, fmtDateTime, deadlineLabel, todayISO } from '../lib/format';
import { cn } from '../lib/cn';

const STEPS = [
  { id: 0, label: 'Viagem', icon: MapPin },
  { id: 1, label: 'Atividades', icon: PenLine },
  { id: 2, label: 'Fotos & equipamentos', icon: Camera },
  { id: 3, label: 'Revisar & enviar', icon: Send },
];

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
  });

  // Sincroniza quando o relatório muda no store (ex.: versões de texto aplicadas)
  useEffect(() => {
    if (report) setForm((f) => ({ ...f, descricao: report.descricaoAtual || f.descricao }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report?.descricaoAtual]);

  const fillable = report && ['pendente', 'rascunho', 'correcao'].includes(report.status);
  const dl = report ? deadlineLabel(report.prazoEm) : null;

  const persist = () => {
    if (!report || !colab) return;
    saveFillDraft(report.id, {
      dataViagem: form.dataViagem,
      origem: form.origem,
      destino: form.destino,
      kmInicio: form.kmInicio ? Number(form.kmInicio) : undefined,
      kmFim: form.kmFim ? Number(form.kmFim) : undefined,
      descricao: form.descricao,
    }, colab.nome);
  };

  const next = () => {
    if (step === 0) {
      const errs: string[] = [];
      if (!form.dataViagem) errs.push('Informe a data da viagem.');
      if (form.origem.trim().length < 3) errs.push('Informe a origem.');
      if (form.destino.trim().length < 3) errs.push('Informe o destino.');
      if (form.kmInicio && form.kmFim && Number(form.kmFim) <= Number(form.kmInicio)) errs.push('KM final deve ser maior que o inicial.');
      if (errs.length) { setErrors(errs); return; }
    }
    if (step === 1 && form.descricao.trim().length < 20) {
      setErrors(['Descreva as atividades com pelo menos 20 caracteres.']);
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
            {submitted ? 'Relatório enviado para revisão!' : 'Este relatório já foi enviado'}
          </h1>
          <p className="text-[13.5px] text-subtle mt-2 max-w-md mx-auto">
            {submitted
              ? `${report.codigo} foi encaminhado para a responsável pela revisão. Você será notificado se forem necessárias correções.`
              : 'O preenchimento foi concluído. Acompanhe o andamento pelo seu gestor ou aguarde o retorno da revisão.'}
          </p>
          <div className="mt-4 flex justify-center"><StatusBadge status={report.status} /></div>
          <div className="mt-6 rounded-xl bg-muted/60 p-4 text-left max-w-md mx-auto text-[13px] text-secondary space-y-1.5">
            <div><strong>Cliente:</strong> {client?.nome}</div>
            <div><strong>Caminhão:</strong> {truck?.frota} · {truck?.placa}</div>
            <div><strong>Fotos:</strong> {report.fotos.length} anexada(s)</div>
            <div><strong>Equipamentos confirmados:</strong> {report.equipamentosIds.length}</div>
          </div>
          <Link to="/login" className="link text-[13.5px] mt-6 inline-block">Acessar o sistema (demonstração)</Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      {/* Cabeçalho do relatório */}
      <div className="card p-4 sm:p-5 mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="mono font-extrabold text-[17px] text-primary">{report.codigo}</span>
              <StatusBadge status={report.status} />
            </div>
            <p className="text-[12.5px] text-subtle mt-1">
              {colab?.nome} · {client?.nome} · <span className="mono">{truck?.frota} ({truck?.placa})</span>
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

      {/* Stepper */}
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
                i < step ? 'bg-success border-success text-white' : i === step ? 'border-accent bg-accent-soft text-accent' : 'border-border bg-surface text-subtle')}>
                {i < step ? <Check size={15} /> : <s.icon size={15} aria-hidden />}
              </span>
              <span className={cn('text-[10.5px] sm:text-[11.5px] font-bold text-center leading-tight', i === step ? 'text-accent' : 'text-subtle')}>
                {s.label}
              </span>
            </button>
          </li>
        ))}
      </ol>

      {errors.length > 0 && (
        <div className="mb-4 rounded-xl border border-red-200 bg-destructive-soft/60 p-4" role="alert" tabIndex={-1}>
          <h2 className="text-[13.5px] font-bold text-red-900 mb-1.5">Há pendências para resolver:</h2>
          <ul className="list-disc pl-5 space-y-0.5 text-[13px] text-red-800">
            {errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      {/* Passo 1: Viagem */}
      {step === 0 && (
        <div className="card p-5 space-y-4 animate-fade-up">
          <h2 className="section-title">Dados da viagem</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Data da viagem" required htmlFor="fv-data">
              <Input id="fv-data" type="date" max={todayISO()} value={form.dataViagem} onChange={(e) => setForm((f) => ({ ...f, dataViagem: e.target.value }))} />
            </Field>
            <div />
            <Field label="Origem" required htmlFor="fv-origem">
              <Input id="fv-origem" value={form.origem} onChange={(e) => setForm((f) => ({ ...f, origem: e.target.value }))} placeholder="Base / cidade de partida" />
            </Field>
            <Field label="Destino" required htmlFor="fv-destino">
              <Input id="fv-destino" value={form.destino} onChange={(e) => setForm((f) => ({ ...f, destino: e.target.value }))} placeholder="Mina / planta de destino" />
            </Field>
            <Field label="KM inicial (hodômetro)" htmlFor="fv-kmi" hint="Opcional, mas recomendado">
              <Input id="fv-kmi" type="number" inputMode="numeric" value={form.kmInicio} onChange={(e) => setForm((f) => ({ ...f, kmInicio: e.target.value }))} placeholder="ex.: 84310" />
            </Field>
            <Field label="KM final (hodômetro)" htmlFor="fv-kmf">
              <Input id="fv-kmf" type="number" inputMode="numeric" value={form.kmFim} onChange={(e) => setForm((f) => ({ ...f, kmFim: e.target.value }))} placeholder="ex.: 84682" />
            </Field>
          </div>
        </div>
      )}

      {/* Passo 2: Atividades + IA */}
      {step === 1 && (
        <div className="space-y-4 animate-fade-up">
          <div className="card p-5 space-y-3">
            <h2 className="section-title">O que foi realizado nesta viagem?</h2>
            <p className="text-[12.5px] text-subtle">Escreva livremente, no seu estilo. O sistema sugere a padronização para 3ª pessoa sem alterar os fatos — e você decide se aceita.</p>
            <Textarea
              value={form.descricao}
              onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
              onBlur={persist}
              placeholder="Ex.: Cheguei na mina as 8h, instalei o sensor no caminhão C-102, testei o funcionamento…"
              className="min-h-[150px]"
              aria-label="Descrição das atividades"
            />
            <div className="text-[11.5px] text-subtle text-right">{form.descricao.trim().length} caracteres</div>
          </div>
          {form.descricao.trim().length >= 20 && (
            <PadronizacaoPanel report={{ ...report, descricaoAtual: form.descricao }} actorName={colab?.nome ?? 'Colaborador'} canEdit />
          )}
        </div>
      )}

      {/* Passo 3: Fotos & OCR */}
      {step === 2 && (
        <div className="animate-fade-up">
          <PhotosOcrPanel report={report} actorName={colab?.nome ?? 'Colaborador'} canUpload canValidate />
        </div>
      )}

      {/* Passo 4: Revisar & enviar */}
      {step === 3 && (
        <div className="space-y-4 animate-fade-up">
          <div className="card p-5">
            <h2 className="section-title mb-4">Confira antes de enviar</h2>
            <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-[13.5px]">
              <div><dt className="text-[11px] font-bold uppercase tracking-wider text-subtle">Viagem</dt><dd>{fmtDate(form.dataViagem + 'T12:00:00')} · {form.origem} → {form.destino}</dd></div>
              <div><dt className="text-[11px] font-bold uppercase tracking-wider text-subtle">Hodômetro</dt><dd>{form.kmInicio ? `${form.kmInicio} → ${form.kmFim || '—'} km` : 'não informado'}</dd></div>
              <div><dt className="text-[11px] font-bold uppercase tracking-wider text-subtle">Fotos</dt><dd>{report.fotos.length} anexada(s)</dd></div>
              <div><dt className="text-[11px] font-bold uppercase tracking-wider text-subtle">Equipamentos confirmados</dt><dd>{report.equipamentosIds.length}</dd></div>
            </dl>
            <div className="mt-4 rounded-lg bg-muted/50 p-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-subtle mb-1.5">Descrição que será enviada</div>
              <p className="text-[13.5px] text-secondary whitespace-pre-wrap">{report.descricaoAtual || form.descricao}</p>
            </div>
            {report.deteccoes.some((d) => d.status === 'aguardando') && (
              <Banner tone="warn" className="mt-3" icon={<AlertTriangle size={16} />}>
                Há leituras de equipamentos aguardando conferência. Você pode confirmá-las no passo anterior ou deixar para a revisão — a aprovação final exigirá a conferência.
              </Banner>
            )}
          </div>
          <Banner tone="info" icon={<ShieldCheck size={16} />}>
            Ao enviar, o texto original fica preservado e o relatório segue para a revisão humana. Nada é enviado ao cliente sem aprovação da responsável.
          </Banner>
          <Button variant="success" size="lg" icon={<Send size={17} />} onClick={submit} className="w-full">
            Enviar para revisão
          </Button>
        </div>
      )}

      {/* Navegação */}
      {step < 3 && (
        <div className="flex justify-between mt-5">
          <Button variant="outline" icon={<ChevronLeft size={16} />} onClick={back} disabled={step === 0}>Voltar</Button>
          <Button variant="accent" onClick={next}>
            Continuar <ChevronRight size={16} aria-hidden />
          </Button>
        </div>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LogoMark size={32} />
            <div className="leading-none">
              <div className="text-[13.5px] font-extrabold text-white tracking-tight">RAJAMINE FIELDOPS</div>
              <div className="text-[10.5px] text-sky-300/90 mt-0.5">Preenchimento de relatório de viagem</div>
            </div>
          </div>
          <Badge tone="amber" className="bg-amber-400/10 text-amber-300">link individual · demo</Badge>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6">{children}</main>
      <footer className="max-w-2xl mx-auto px-4 pb-8 text-center text-[11px] text-subtle">
        Protótipo demonstrativo · dados fictícios · processamento local (OCR e padronização)
      </footer>
    </div>
  );
}
