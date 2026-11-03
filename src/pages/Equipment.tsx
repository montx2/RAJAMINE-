import { Fragment, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Cpu, Plus, Search, Truck as TruckIcon, FileText, ChevronDown } from 'lucide-react';
import { useStore, useCurrentUser } from '../store/useStore';
import { PageHeader } from '../components/AppShell';
import { Button, Badge, Input, Select, Field, Modal, EmptyState, toast } from '../components/ui';
import { fmtDate } from '../lib/format';
import type { EquipmentType } from '../data/types';

const TIPOS: EquipmentType[] = ['Telemetria veicular', 'Rastreador GPS', 'Sensor de fadiga', 'Câmera embarcada', 'Sensor de carga'];

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
  const [form, setForm] = useState({ codigo: '', tipo: TIPOS[0] as EquipmentType, serial: '', truckId: '' });
  const [err, setErr] = useState('');

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return equipment.filter((e) => {
      if (tipo && e.tipo !== tipo) return false;
      if (status && e.status !== status) return false;
      if (term) {
        const truck = trucks.find((t) => t.id === e.truckId);
        const hay = `${e.codigo} ${e.serial} ${e.tipo} ${truck?.frota ?? ''} ${truck?.placa ?? ''}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [equipment, q, tipo, status, trucks]);

  const reportsFor = (eqId: string) => reports.filter((r) => r.equipamentosIds.includes(eqId));

  const save = () => {
    if (!/^EQ-\d{3,6}$/i.test(form.codigo.trim())) { setErr('Use o padrão EQ-0000.'); return; }
    if (!form.serial.trim()) { setErr('Informe o número de série.'); return; }
    const res = addEquipment({ codigo: form.codigo.trim(), tipo: form.tipo, serial: form.serial.trim(), truckId: form.truckId || null }, user.nome);
    if (!res.ok) { setErr(res.erro ?? 'Erro ao cadastrar.'); return; }
    toast(`Equipamento ${form.codigo.toUpperCase()} cadastrado.`);
    setOpen(false);
    setForm({ codigo: '', tipo: TIPOS[0], serial: '', truckId: '' });
    setErr('');
  };

  return (
    <div>
      <PageHeader
        title="Equipamentos"
        subtitle="Consulta rápida por número de identificação, série, tipo ou caminhão — alimentada pelas confirmações humanas do OCR."
        actions={user.role === 'admin' && <Button variant="accent" icon={<Plus size={16} />} onClick={() => setOpen(true)}>Cadastrar equipamento</Button>}
      />

      <div className="card p-4 mb-4">
        <div className="grid md:grid-cols-[1fr_200px_180px] gap-2.5">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle" aria-hidden />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Pesquisar por código (ex.: EQ-2041), série ou caminhão…" className="pl-10" aria-label="Pesquisar equipamentos" />
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
          </Select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="th">Identificação</th>
                <th className="th">Tipo</th>
                <th className="th">Nº de série</th>
                <th className="th">Situação</th>
                <th className="th">Caminhão</th>
                <th className="th">Instalado em</th>
                <th className="th">Relatórios</th>
                <th className="th"><span className="sr-only">Expandir</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {filtered.map((e) => {
                const truck = trucks.find((t) => t.id === e.truckId);
                const client = clients.find((c) => c.id === truck?.clienteId);
                const rels = reportsFor(e.id);
                const isOpen = expanded === e.id;
                return (
                  <Fragment key={e.id}>
                    <tr className="hover:bg-muted/30 transition-colors">
                      <td className="td"><span className="mono font-bold text-[14px] text-primary">{e.codigo}</span></td>
                      <td className="td text-secondary">{e.tipo}</td>
                      <td className="td mono text-subtle">{e.serial}</td>
                      <td className="td">
                        <Badge tone={e.status === 'instalado' ? 'green' : e.status === 'estoque' ? 'slate' : 'amber'} dot>
                          {e.status === 'instalado' ? 'Instalado' : e.status === 'estoque' ? 'Em estoque' : 'Manutenção'}
                        </Badge>
                      </td>
                      <td className="td">
                        {truck ? (
                          <div>
                            <span className="mono font-semibold">{truck.frota}</span> <span className="text-subtle text-[12px]">{truck.placa}</span>
                            <div className="text-[11.5px] text-subtle">{client?.nome}</div>
                          </div>
                        ) : <span className="text-subtle">—</span>}
                      </td>
                      <td className="td whitespace-nowrap">{e.instaladoEm ? fmtDate(e.instaladoEm) : '—'}</td>
                      <td className="td">
                        <Badge tone={rels.length ? 'blue' : 'slate'}>{rels.length}</Badge>
                      </td>
                      <td className="td">
                        <button onClick={() => setExpanded(isOpen ? null : e.id)} className="p-1.5 rounded-lg text-subtle hover:bg-muted cursor-pointer" aria-label={`Relatórios de ${e.codigo}`} aria-expanded={isOpen}>
                          <ChevronDown size={16} className={isOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />
                        </button>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="bg-muted/30">
                        <td colSpan={8} className="px-6 py-4">
                          <div className="text-[12px] font-bold uppercase tracking-wider text-subtle mb-2">Relatórios relacionados a {e.codigo}</div>
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
        {filtered.length === 0 && (
          <EmptyState icon={<Cpu size={22} />} title="Nenhum equipamento encontrado" description="Ajuste a busca ou cadastre um novo equipamento." />
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Cadastrar equipamento"
        footer={<>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="accent" icon={<Plus size={15} />} onClick={save}>Cadastrar</Button>
        </>}>
        <div className="space-y-4">
          {err && <p className="text-[13px] text-destructive font-medium" role="alert">{err}</p>}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Código" required htmlFor="eq-code">
              <Input id="eq-code" value={form.codigo} onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value }))} placeholder="EQ-0000" />
            </Field>
            <Field label="Nº de série" required htmlFor="eq-serial">
              <Input id="eq-serial" value={form.serial} onChange={(e) => setForm((f) => ({ ...f, serial: e.target.value }))} placeholder="ex.: 88231" />
            </Field>
          </div>
          <Field label="Tipo" htmlFor="eq-tipo">
            <Select id="eq-tipo" value={form.tipo} onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value as EquipmentType }))}>
              {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Instalar em (opcional)" htmlFor="eq-truck">
            <Select id="eq-truck" value={form.truckId} onChange={(e) => setForm((f) => ({ ...f, truckId: e.target.value }))}>
              <option value="">Deixar em estoque</option>
              {trucks.map((t) => <option key={t.id} value={t.id}>{t.frota} · {t.placa}</option>)}
            </Select>
          </Field>
          <p className="text-[12px] text-subtle flex items-start gap-2"><TruckIcon size={14} className="shrink-0 mt-0.5" aria-hidden /> A associação também pode acontecer pelo fluxo de OCR com confirmação humana, que registra autor e data.</p>
        </div>
      </Modal>
    </div>
  );
}
