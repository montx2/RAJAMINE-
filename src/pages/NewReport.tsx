import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Link2, Copy, ExternalLink, Send, ArrowLeft } from 'lucide-react';
import { useStore, useCurrentUser } from '../store/useStore';
import { PageHeader } from '../components/AppShell';
import { Button, Field, Input, Select, Modal, Banner, toast } from '../components/ui';
import { todayISO } from '../lib/format';

const schema = z.object({
  colaboradorId: z.string().min(1, 'Selecione o colaborador.'),
  clienteId: z.string().min(1, 'Selecione o cliente.'),
  caminhaoId: z.string().min(1, 'Selecione o caminhão.'),
  dataViagem: z.string().min(1, 'Informe a data da viagem.'),
  origem: z.string().min(3, 'Informe a origem.'),
  destino: z.string().min(3, 'Informe o destino.'),
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
    dataViagem: todayISO(), origem: 'Base Rajamine — Belo Horizonte/MG', destino: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [createdId, setCreatedId] = useState<string | null>(null);

  const clientTrucks = useMemo(() => trucks.filter((t) => !form.clienteId || t.clienteId === form.clienteId), [trucks, form.clienteId]);
  const created = reports.find((r) => r.id === createdId);
  const link = created ? `${window.location.origin}/preencher/${created.token}` : '';

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
    const id = createReport(parsed.data, user.nome);
    setCreatedId(id);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast('Link copiado para a área de transferência.');
    } catch {
      toast('Não foi possível copiar automaticamente. Selecione o texto do link.', 'error');
    }
  };

  return (
    <div className="max-w-3xl">
      <button onClick={() => navigate('/relatorios')} className="flex items-center gap-1.5 text-[13px] font-semibold text-subtle hover:text-accent mb-4 cursor-pointer">
        <ArrowLeft size={15} aria-hidden /> Voltar para relatórios
      </button>
      <PageHeader
        title="Novo relatório de viagem"
        subtitle="O sistema gera um link individual de preenchimento e aplica o prazo padrão de 48 horas."
      />

      <div className="card p-5 sm:p-6 space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Colaborador" required error={errors.colaboradorId} htmlFor="f-colab">
            <Select id="f-colab" value={form.colaboradorId} onChange={(e) => set('colaboradorId', e.target.value)} invalid={!!errors.colaboradorId}>
              <option value="">Selecione…</option>
              {users.filter((u) => u.role === 'colaborador' && u.ativo).map((u) => (
                <option key={u.id} value={u.id}>{u.nome} — {u.cargo}</option>
              ))}
            </Select>
          </Field>
          <Field label="Data da viagem" required error={errors.dataViagem} htmlFor="f-data">
            <Input id="f-data" type="date" value={form.dataViagem} max={todayISO()} onChange={(e) => set('dataViagem', e.target.value)} invalid={!!errors.dataViagem} />
          </Field>
          <Field label="Cliente" required error={errors.clienteId} htmlFor="f-cliente">
            <Select id="f-cliente" value={form.clienteId} onChange={(e) => set('clienteId', e.target.value)} invalid={!!errors.clienteId}>
              <option value="">Selecione…</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.nome} — {c.cidade}/{c.uf}</option>)}
            </Select>
          </Field>
          <Field label="Caminhão" required error={errors.caminhaoId} htmlFor="f-caminhao" hint={form.clienteId ? 'Somente caminhões do cliente selecionado.' : 'Selecione o cliente para filtrar a frota.'}>
            <Select id="f-caminhao" value={form.caminhaoId} onChange={(e) => set('caminhaoId', e.target.value)} invalid={!!errors.caminhaoId} disabled={!form.clienteId}>
              <option value="">Selecione…</option>
              {clientTrucks.map((t) => <option key={t.id} value={t.id}>{t.frota} · {t.placa} · {t.marca} {t.modelo}</option>)}
            </Select>
          </Field>
          <Field label="Origem" required error={errors.origem} htmlFor="f-origem">
            <Input id="f-origem" value={form.origem} onChange={(e) => set('origem', e.target.value)} invalid={!!errors.origem} placeholder="Cidade / base de partida" />
          </Field>
          <Field label="Destino" required error={errors.destino} htmlFor="f-destino">
            <Input id="f-destino" value={form.destino} onChange={(e) => set('destino', e.target.value)} invalid={!!errors.destino} placeholder="Mina / planta de destino" />
          </Field>
        </div>
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
