import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Link2, Copy, ExternalLink, Send, ArrowLeft } from 'lucide-react';
import { useStore, useCurrentUser } from '../store/useStore';
import { PageHeader } from '../components/AppShell';
import { Button, Field, Input, Select, Textarea, Modal, Banner, toast } from '../components/ui';
import { todayISO } from '../lib/format';
import { REPORT_KIND_LABEL, type ReportKind } from '../data/types';

const schema = z.object({
  colaboradorId: z.string().min(1, 'Selecione o colaborador.'),
  clienteId: z.string().min(1, 'Selecione o cliente.'),
  caminhaoId: z.string().optional(),
  dataViagem: z.string().min(1, 'Informe a data da viagem / visita.'),
  origem: z.string().optional(),
  destino: z.string().optional(),
  tipo: z.enum(['viagem', 'visita_tecnica', 'atividade_externa', 'semanal_viagens']),
  objetivo: z.string().optional(),
  setor: z.string().optional(),
  cidadeBairro: z.string().optional(),
});

export default function NewReport() {
  const navigate = useNavigate();
  const user = useCurrentUser()!;
  const users = useStore((s) => s.users);
  const clients = useStore((s) => s.clients);
  const trucks = useStore((s) => s.trucks);
  const reports = useStore((s) => s.reports);
  const createReport = useStore((s) => s.createReport);

  const [form, setForm] = useState({
    colaboradorId: '', clienteId: '', caminhaoId: '',
    dataViagem: todayISO(), origem: '', destino: '',
    tipo: 'visita_tecnica' as ReportKind, objetivo: '', setor: 'Manutenção', cidadeBairro: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [createdId, setCreatedId] = useState<string | null>(null);

  const clientTrucks = useMemo(() => trucks.filter((t) => !form.clienteId || t.clienteId === form.clienteId), [trucks, form.clienteId]);
  const created = reports.find((r) => r.id === createdId);
  const link = created ? `${window.location.origin}/preencher/${created.token}` : '';
  const isViagem = form.tipo === 'viagem';

  const set = (k: string, v: string) => {
    setForm((f) => ({ ...f, [k]: v, ...(k === 'clienteId' ? { caminhaoId: '' } : {}) }));
    setErrors((e) => ({ ...e, [k]: '' }));
  };

  const submit = () => {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) errs[issue.path[0] as string] = issue.message;
      setErrors(errs);
      toast('Revise os campos destacados.', 'error');
      return;
    }
    if (isViagem && (!form.origem?.trim() || !form.destino?.trim())) {
      setErrors({ origem: !form.origem?.trim() ? 'Informe a origem.' : '', destino: !form.destino?.trim() ? 'Informe o destino.' : '' });
      toast('Para relatório de viagem, origem e destino são obrigatórios.', 'error');
      return;
    }
    const id = createReport({ ...parsed.data, periodoInicio: form.dataViagem, periodoFim: form.dataViagem }, user.nome);
    setCreatedId(id);
  };

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(link); toast('Link copiado para a área de transferência.'); }
    catch { toast('Não foi possível copiar automaticamente. Selecione o texto do link.', 'error'); }
  };

  return (
    <div className="max-w-3xl">
      <button onClick={() => navigate('/relatorios')} className="flex items-center gap-1.5 text-[13px] font-semibold text-subtle hover:text-accent mb-4 cursor-pointer">
        <ArrowLeft size={15} aria-hidden /> Voltar para relatórios
      </button>
      <PageHeader
        title="Novo relatório de campo"
        subtitle="Gera um link individual de preenchimento com prazo padrão de 48 h. O caminhão é opcional: a operação pode ser centrada no equipamento do cliente."
      />

      <div className="card p-5 sm:p-6 space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Tipo de relatório" required htmlFor="f-tipo">
            <Select id="f-tipo" value={form.tipo} onChange={(e) => set('tipo', e.target.value)}>
              {(Object.keys(REPORT_KIND_LABEL) as ReportKind[]).map((k) => <option key={k} value={k}>{REPORT_KIND_LABEL[k]}</option>)}
            </Select>
          </Field>
          <Field label="Data da viagem / visita" required error={errors.dataViagem} htmlFor="f-data">
            <Input id="f-data" type="date" value={form.dataViagem} max={todayISO()} onChange={(e) => set('dataViagem', e.target.value)} invalid={!!errors.dataViagem} />
          </Field>
          <Field label="Colaborador" required error={errors.colaboradorId} htmlFor="f-colab">
            <Select id="f-colab" value={form.colaboradorId} onChange={(e) => set('colaboradorId', e.target.value)} invalid={!!errors.colaboradorId}>
              <option value="">Selecione…</option>
              {users.filter((u) => u.role === 'colaborador' && u.ativo).map((u) => (
                <option key={u.id} value={u.id}>{u.nome} — {u.cargo}</option>
              ))}
            </Select>
          </Field>
          <Field label="Cliente / Empresa" required error={errors.clienteId} htmlFor="f-cliente">
            <Select id="f-cliente" value={form.clienteId} onChange={(e) => set('clienteId', e.target.value)} invalid={!!errors.clienteId}>
              <option value="">Selecione…</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.nome}{c.cidade ? ` — ${c.cidade}/${c.uf}` : ''}</option>)}
            </Select>
          </Field>
          <Field label="Setor" htmlFor="f-setor">
            <Input id="f-setor" value={form.setor} onChange={(e) => set('setor', e.target.value)} placeholder="Manutenção" />
          </Field>
          <Field label="Cidade / Bairros" htmlFor="f-cidade">
            <Input id="f-cidade" value={form.cidadeBairro} onChange={(e) => set('cidadeBairro', e.target.value)} placeholder="Mariana - MG" />
          </Field>
          <Field label="Caminhão (opcional)" error={errors.caminhaoId} htmlFor="f-caminhao" hint="Use quando a operação for vinculada a um veículo específico.">
            <Select id="f-caminhao" value={form.caminhaoId} onChange={(e) => set('caminhaoId', e.target.value)} disabled={!form.clienteId}>
              <option value="">Não vincular caminhão</option>
              {clientTrucks.map((t) => <option key={t.id} value={t.id}>{t.frota} · {t.placa} · {t.marca} {t.modelo}</option>)}
            </Select>
          </Field>
          {isViagem && (
            <>
              <Field label="Origem" required error={errors.origem} htmlFor="f-origem">
                <Input id="f-origem" value={form.origem} onChange={(e) => set('origem', e.target.value)} invalid={!!errors.origem} placeholder="Cidade / base de partida" />
              </Field>
              <Field label="Destino" required error={errors.destino} htmlFor="f-destino">
                <Input id="f-destino" value={form.destino} onChange={(e) => set('destino', e.target.value)} invalid={!!errors.destino} placeholder="Mina / planta de destino" />
              </Field>
            </>
          )}
        </div>
        <Field label="Objetivo da visita / atividade" htmlFor="f-objetivo" hint="Ex.: Instalação de 1 telemetria, 1 tablet e 1 câmera de fadiga; desmobilização de equipamentos.">
          <Textarea id="f-objetivo" value={form.objetivo} onChange={(e) => set('objetivo', e.target.value)} className="min-h-[80px]" placeholder="Descreva o objetivo planejado…" />
        </Field>
        <Banner tone="info" icon={<Send size={16} />}>
          No fluxo de produção, o link seria enviado por e-mail/WhatsApp ao colaborador. <strong>Neste protótipo o envio é simulado</strong> e registrado na auditoria — nenhum disparo real acontece.
        </Banner>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => navigate('/relatorios')}>Cancelar</Button>
          <Button variant="accent" icon={<Link2 size={16} />} onClick={submit}>Criar e gerar link individual</Button>
        </div>
      </div>

      <Modal open={!!created} onClose={() => navigate(`/relatorios/${createdId}`)} title="Relatório criado — link individual gerado"
        footer={<>
          <Button variant="outline" icon={<Copy size={15} />} onClick={copyLink}>Copiar link</Button>
          <Button variant="accent" icon={<ExternalLink size={15} />} onClick={() => navigate(`/preencher/${created?.token}`)}>Abrir como colaborador</Button>
        </>}>
        <div className="space-y-4">
          <p className="text-[13.5px] text-secondary">
            <strong>{created?.codigo}</strong> foi criado com prazo de 48 h. O link abaixo é individual e dá acesso
            somente a este relatório — o colaborador não precisa de conta no sistema.
          </p>
          <div className="rounded-lg bg-muted px-3.5 py-3 mono text-[12px] break-all text-secondary select-all">{link}</div>
          <Banner tone="warn">Envio simulado: em produção, este link seria entregue por canal oficial com token de uso único e expiração.</Banner>
        </div>
      </Modal>
    </div>
  );
}
