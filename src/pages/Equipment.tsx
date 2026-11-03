import { Fragment, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Cpu, Plus, Search, FileText, ChevronDown, BadgeCheck } from 'lucide-react';
import { useStore, useCurrentUser } from '../store/useStore';
import { PageHeader } from '../components/AppShell';
import { Button, Badge, Input, Select, Field, Modal, EmptyState, toast } from '../components/ui';
import { fmtDate } from '../lib/format';
import type { EquipmentType } from '../data/types';

const TIPOS: EquipmentType[] = ['Equipamento de cliente', 'Telemetria veicular', 'Tablet Pulsus', 'Câmera de fadiga', 'Galileo / rotograma', 'Rastreador GPS', 'Sensor de fadiga', 'Câmera embarcada', 'Sensor de carga'];
const CODE_RE = /^(EQ-\d{3,6}|[A-Z]{2,4}-[A-Z0-9]{2,6})$/i;

export default function EquipmentPage() {
  const user = useCurrentUser()!;
  const equipment = useStore((s) => s.equipment);
  const trucks = useStore((s) => s.trucks);
  const reports = useStore((s) => s.reports);
  const clients = useStore((s) => s.clients);
  const addEquipment = useStore((s) => s.addEquipment);
  const [params] = useSearchParams();

  const [q, setQ] = useState(params.get('q') ?? '');
  const [tipo, setTipo] = useState('');
  const [status, setStatus] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ codigo: '', tipo: 'Equipamento de cliente' as EquipmentType, serial: '', truckId: '', clienteId: '', telemetria: '', pulsus: '', cameraFadiga: '', galileo: '' });
  const [err, setErr] = useState('');

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return equipment.filter((e) => {
      if (tipo && e.tipo !== tipo) return false;
      if (status && e.status !== status) return false;
      if (term) {
        const truck = trucks.find((t) => t.id === e.truckId);
        const client = clients.find((c) => c.id === (e.clienteId ?? truck?.clienteId));
        const hay = `${e.codigo} ${e.serial} ${e.tipo} ${e.telemetria ?? ''} ${e.pulsus ?? ''} ${e.cameraFadiga ?? ''} ${e.galileo ?? ''} ${truck?.frota ?? ''} ${truck?.placa ?? ''} ${client?.nome ?? ''}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [equipment, q, tipo, status, trucks, clients]);

  const reportsFor = (eq: typeof equipment[number]) => reports.filter((r) =>
    r.equipamentosIds.includes(eq.id)
    || (r.atividades ?? []).some((a) => a.equipamentoCodigo.toUpperCase() === eq.codigo.toUpperCase()
      || (eq.telemetria && a.telemetria === eq.telemetria)
      || (eq.pulsus && a.pulsus === eq.pulsus)
      || (eq.cameraFadiga && a.cameraFadiga === eq.cameraFadiga)),
  );

  const save = () => {
    if (!CODE_RE.test(form.codigo.trim())) { setErr('Use o padrão real, ex.: CP-101, TYE-9A00, RUU-1G56 ou EQ-2041.'); return; }
    const res = addEquipment({
      codigo: form.codigo.trim(), tipo: form.tipo, serial: form.serial.trim() || '—',
      truckId: form.truckId || null, clienteId: form.clienteId || null,
      telemetria: form.telemetria || undefined, pulsus: form.pulsus || undefined,
      cameraFadiga: form.cameraFadiga || undefined, galileo: form.galileo || undefined,
    }, user.nome);
    if (!res.ok) { setErr(res.erro ?? 'Erro ao cadastrar.'); return; }
    toast(`Equipamento ${form.codigo.toUpperCase()} cadastrado.`);
    setOpen(false);
    setForm({ codigo: '', tipo: 'Equipamento de cliente', serial: '', truckId: '', clienteId: '', telemetria: '', pulsus: '', cameraFadiga: '', galileo: '' });
    setErr('');
  };

  return (
    <div>
      <PageHeader
        eyebrow="Campo"
        title="Equipamentos & identificações"
        subtitle="Equipamentos do cliente e IDs embarcados. Busque por código, telemetria, Pulsus ou IMEI."
        actions={user.role === 'admin' && <Button variant="accent" icon={<Plus size={16} />} onClick={() => setOpen(true)}>Cadastrar equipamento</Button>}
      />

      <div className="card p-4 mb-4">
        <div className="grid md:grid-cols-[1fr_220px_180px] gap-2.5">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle" aria-hidden />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Pesquisar por CP-101, 0987, 2758, IMEI 864993060408250…" className="pl-10" aria-label="Pesquisar equipamentos" />
          </div>
          <Select value={tipo} onChange={(e) => setTipo(e.target.value)} aria-label="Filtrar por tipo">
            <option value="">Tipo: todos</option>
            {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filtrar por situação">
            <option value="">Situação: todas</option>
            <option value="instalado">Instalado</option>
            <option value="estoque">Em estoque</option>
            <option value="manutencao">Em manutenção</option>
            <option value="desmobilizado">Desmobilizado</option>
          </Select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="th">Identificação</th>
                <th className="th">Tipo</th>
                <th className="th">Telemetria / Pulsus</th>
                <th className="th">Câmera / Galileo</th>
                <th className="th">Cliente</th>
                <th className="th">Situação</th>
                <th className="th">Relatórios</th>
                <th className="th"><span className="sr-only">Expandir</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {filtered.map((e) => {
                const truck = trucks.find((t) => t.id === e.truckId);
                const client = clients.find((c) => c.id === (e.clienteId ?? truck?.clienteId));
                const rels = reportsFor(e);
                const isOpen = expanded === e.id;
                return (
                  <Fragment key={e.id}>
                    <tr className="hover:bg-muted/30 transition-colors">
                      <td className="td">
                        <span className="mono font-bold text-[14px] text-primary">{e.codigo}</span>
                        {e.origemDados === 'referencia_empresa' && <Badge tone="amber" className="ml-2">referência</Badge>}
                      </td>
                      <td className="td text-secondary">{e.tipo}</td>
                      <td className="td mono text-[12.5px] text-subtle">{e.telemetria ?? '—'} / {e.pulsus ?? '—'}</td>
                      <td className="td mono text-[12px] text-subtle">
                        <div>{e.cameraFadiga ?? '—'}</div>
                        {e.galileo && <div className="text-[11px]">Galileo {e.galileo}</div>}
                      </td>
                      <td className="td text-secondary">{client?.nome ?? '—'}</td>
                      <td className="td">
                        <Badge tone={e.status === 'instalado' ? 'green' : e.status === 'desmobilizado' ? 'slate' : e.status === 'estoque' ? 'slate' : 'amber'} dot>
                          {e.status === 'instalado' ? 'Instalado' : e.status === 'desmobilizado' ? 'Desmobilizado' : e.status === 'estoque' ? 'Em estoque' : 'Manutenção'}
                        </Badge>
                      </td>
                      <td className="td"><Badge tone={rels.length ? 'blue' : 'slate'}>{rels.length}</Badge></td>
                      <td className="td">
                        <button onClick={() => setExpanded(isOpen ? null : e.id)} className="p-1.5 rounded-lg text-subtle hover:bg-muted cursor-pointer" aria-label={`Relatórios de ${e.codigo}`} aria-expanded={isOpen}>
                          <ChevronDown size={16} className={isOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />
                        </button>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="bg-muted/30">
                        <td colSpan={8} className="px-6 py-4">
                          <div className="text-[12px] font-bold uppercase tracking-wider text-subtle mb-2">Relatórios e atividades relacionados a {e.codigo}</div>
                          {rels.length === 0 ? (
                            <p className="text-[13px] text-subtle">Nenhum relatório vinculado ainda.</p>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {rels.map((r) => (
                                <Link key={r.id} to={`/relatorios/${r.id}`} className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 hover:border-accent/50 text-[13px]">
                                  <FileText size={14} className="text-accent" aria-hidden />
                                  <span className="mono font-semibold">{r.codigo}</span>
                                  <span className="text-subtle">{fmtDate(r.dataViagem + 'T12:00:00')}</span>
                                </Link>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <EmptyState icon={<Cpu size={22} />} title="Nenhum equipamento encontrado" description="Ajuste a busca ou cadastre um novo equipamento." />}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Cadastrar equipamento / dispositivo"
        footer={<>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="accent" icon={<Plus size={15} />} onClick={save}>Cadastrar</Button>
        </>}>
        <div className="space-y-4">
          {err && <p className="text-[13px] text-destructive font-medium" role="alert">{err}</p>}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Código" required htmlFor="eq-code"><Input id="eq-code" value={form.codigo} onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value }))} placeholder="CP-101 / TYE-9A00" /></Field>
            <Field label="Nº de série" htmlFor="eq-serial"><Input id="eq-serial" value={form.serial} onChange={(e) => setForm((f) => ({ ...f, serial: e.target.value }))} placeholder="opcional" /></Field>
          </div>
          <Field label="Tipo" htmlFor="eq-tipo">
            <Select id="eq-tipo" value={form.tipo} onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value as EquipmentType }))}>
              {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cliente" htmlFor="eq-cliente">
              <Select id="eq-cliente" value={form.clienteId} onChange={(e) => setForm((f) => ({ ...f, clienteId: e.target.value }))}>
                <option value="">Não vincular</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </Select>
            </Field>
            <Field label="Caminhão (opcional)" htmlFor="eq-truck">
              <Select id="eq-truck" value={form.truckId} onChange={(e) => setForm((f) => ({ ...f, truckId: e.target.value }))}>
                <option value="">Não vincular</option>
                {trucks.map((t) => <option key={t.id} value={t.id}>{t.frota} · {t.placa}</option>)}
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Telemetria" htmlFor="eq-tel"><Input id="eq-tel" value={form.telemetria} onChange={(e) => setForm((f) => ({ ...f, telemetria: e.target.value }))} placeholder="0987" /></Field>
            <Field label="Pulsus" htmlFor="eq-pul"><Input id="eq-pul" value={form.pulsus} onChange={(e) => setForm((f) => ({ ...f, pulsus: e.target.value }))} placeholder="2758" /></Field>
            <Field label="Câmera (IMEI)" htmlFor="eq-cam"><Input id="eq-cam" value={form.cameraFadiga} onChange={(e) => setForm((f) => ({ ...f, cameraFadiga: e.target.value }))} placeholder="864993060408250" /></Field>
            <Field label="Galileo" htmlFor="eq-gal"><Input id="eq-gal" value={form.galileo} onChange={(e) => setForm((f) => ({ ...f, galileo: e.target.value }))} placeholder="867782071392430" /></Field>
          </div>
          <p className="text-[12px] text-subtle flex items-start gap-2"><BadgeCheck size={14} className="shrink-0 mt-0.5" aria-hidden /> A associação também pode acontecer pelo fluxo de OCR com confirmação humana, que registra autor e data.</p>
        </div>
      </Modal>
    </div>
  );
}
