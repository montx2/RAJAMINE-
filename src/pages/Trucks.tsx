import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Truck as TruckIcon, Plus, Cpu, FileText, Search } from 'lucide-react';
import { useStore, useCurrentUser } from '../store/useStore';
import { PageHeader } from '../components/AppShell';
import { Button, Badge, Input, Select, Field, Modal, EmptyState, toast } from '../components/ui';

export default function Trucks() {
  const user = useCurrentUser()!;
  const trucks = useStore((s) => s.trucks);
  const clients = useStore((s) => s.clients);
  const equipment = useStore((s) => s.equipment);
  const reports = useStore((s) => s.reports);
  const addTruck = useStore((s) => s.addTruck);

  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ placa: '', frota: '', marca: '', modelo: '', ano: new Date().getFullYear(), clienteId: '' });
  const [err, setErr] = useState('');

  const filtered = trucks.filter((t) => {
    const term = q.trim().toLowerCase();
    if (!term) return true;
    const client = clients.find((c) => c.id === t.clienteId);
    return `${t.placa} ${t.frota} ${t.marca} ${t.modelo} ${client?.nome ?? ''}`.toLowerCase().includes(term);
  });

  const save = () => {
    if (!/^[A-Z]{3}-?\d[A-Z0-9]\d{2}$/i.test(form.placa.trim())) { setErr('Placa inválida (padrão antigo ou Mercosul).'); return; }
    if (!form.frota.trim() || !form.marca.trim() || !form.modelo.trim()) { setErr('Preencha frota, marca e modelo.'); return; }
    if (!form.clienteId) { setErr('Selecione o cliente proprietário.'); return; }
    const res = addTruck({ ...form, placa: form.placa.toUpperCase().trim() }, user.nome);
    if (!res.ok) { setErr(res.erro ?? 'Erro.'); return; }
    toast(`Caminhão ${form.frota} cadastrado.`);
    setOpen(false);
    setForm({ placa: '', frota: '', marca: '', modelo: '', ano: new Date().getFullYear(), clienteId: '' });
    setErr('');
  };

  return (
    <div>
      <PageHeader
        eyebrow="Frota"
        title="Caminhões"
        subtitle="Veículos, equipamentos instalados e relatórios vinculados."
        actions={user.role === 'admin' && <Button variant="accent" icon={<Plus size={16} />} onClick={() => setOpen(true)}>Cadastrar caminhão</Button>}
      />

      <div className="card p-4 mb-4">
        <div className="relative max-w-xl">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle" aria-hidden />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por placa, frota, modelo ou cliente…" className="pl-10" aria-label="Pesquisar caminhões" />
        </div>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((t) => {
          const client = clients.find((c) => c.id === t.clienteId);
          const eqs = equipment.filter((e) => e.truckId === t.id);
          const rels = reports.filter((r) => r.caminhaoId === t.id);
          return (
            <div key={t.id} className="card p-5 flex flex-col">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-primary text-sky-300 flex items-center justify-center">
                  <TruckIcon size={19} aria-hidden />
                </div>
                <Badge tone="slate">{rels.length} relatório(s)</Badge>
              </div>
              <div className="mt-3">
                <div className="text-[17px] font-extrabold text-primary tracking-tight">{t.frota} <span className="mono text-[13px] font-semibold text-subtle">{t.placa}</span></div>
                <div className="text-[13px] text-secondary">{t.marca} {t.modelo} · {t.ano}</div>
                <div className="text-[12px] text-subtle mt-0.5">{client?.nome} — {client?.cidade}/{client?.uf}</div>
              </div>
              <div className="mt-4 flex-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-subtle mb-2 flex items-center gap-1.5">
                  <Cpu size={12} aria-hidden /> Equipamentos instalados ({eqs.length})
                </div>
                {eqs.length === 0 ? (
                  <p className="text-[12.5px] text-subtle">Nenhum equipamento instalado.</p>
                ) : (
                  <div className="space-y-1.5">
                    {eqs.map((e) => (
                      <Link key={e.id} to={`/equipamentos?q=${e.codigo}`} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 hover:bg-accent-soft/50 transition-colors">
                        <span className="mono font-bold text-[13px] text-primary">{e.codigo}</span>
                        <span className="text-[11.5px] text-subtle">{e.tipo}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              <Link to={`/relatorios?caminhao=${t.id}`} className="mt-4 link text-[12.5px] flex items-center gap-1.5">
                <FileText size={13} aria-hidden /> Ver relatórios deste caminhão
              </Link>
            </div>
          );
        })}
      </div>
      {filtered.length === 0 && <div className="card"><EmptyState icon={<TruckIcon size={22} />} title="Nenhum caminhão encontrado" /></div>}

      <Modal open={open} onClose={() => setOpen(false)} title="Cadastrar caminhão"
        footer={<>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="accent" icon={<Plus size={15} />} onClick={save}>Cadastrar</Button>
        </>}>
        <div className="space-y-4">
          {err && <p className="text-[13px] text-destructive font-medium" role="alert">{err}</p>}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Frota" required htmlFor="tk-frota"><Input id="tk-frota" value={form.frota} onChange={(e) => setForm((f) => ({ ...f, frota: e.target.value }))} placeholder="C-107" /></Field>
            <Field label="Placa" required htmlFor="tk-placa"><Input id="tk-placa" value={form.placa} onChange={(e) => setForm((f) => ({ ...f, placa: e.target.value }))} placeholder="ABC-1D23" /></Field>
            <Field label="Marca" required htmlFor="tk-marca"><Input id="tk-marca" value={form.marca} onChange={(e) => setForm((f) => ({ ...f, marca: e.target.value }))} placeholder="Volvo" /></Field>
            <Field label="Modelo" required htmlFor="tk-modelo"><Input id="tk-modelo" value={form.modelo} onChange={(e) => setForm((f) => ({ ...f, modelo: e.target.value }))} placeholder="FMX 6x4" /></Field>
            <Field label="Ano" htmlFor="tk-ano"><Input id="tk-ano" type="number" value={form.ano} onChange={(e) => setForm((f) => ({ ...f, ano: Number(e.target.value) }))} /></Field>
            <Field label="Cliente" required htmlFor="tk-cliente">
              <Select id="tk-cliente" value={form.clienteId} onChange={(e) => setForm((f) => ({ ...f, clienteId: e.target.value }))}>
                <option value="">Selecione…</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </Select>
            </Field>
          </div>
        </div>
      </Modal>
    </div>
  );
}
