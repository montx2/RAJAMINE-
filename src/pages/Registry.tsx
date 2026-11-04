import { useState } from 'react';
import { Users, Building2, Plus, Mail } from 'lucide-react';
import { useStore, useCurrentUser } from '../store/useStore';
import { PageHeader } from '../components/AppShell';
import { Button, Badge, Tabs, Input, Field, Modal, Avatar, toast } from '../components/ui';
import { ROLE_LABEL } from '../data/types';

export default function Registry() {
  const user = useCurrentUser()!;
  const users = useStore((s) => s.users);
  const clients = useStore((s) => s.clients);
  const reports = useStore((s) => s.reports);
  const addCollaborator = useStore((s) => s.addCollaborator);
  const addClient = useStore((s) => s.addClient);

  const [tab, setTab] = useState('colab');
  const [openColab, setOpenColab] = useState(false);
  const [openClient, setOpenClient] = useState(false);
  const [fc, setFc] = useState({ nome: '', email: '', cargo: 'Técnico de Instalação' });
  const [fcl, setFcl] = useState({ nome: '', cnpj: '', cidade: '', uf: 'MG', contato: '', email: '' });
  const [err, setErr] = useState('');

  const saveColab = () => {
    if (fc.nome.trim().split(/\s+/).length < 2) { setErr('Informe nome e sobrenome.'); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(fc.email)) { setErr('E-mail inválido.'); return; }
    addCollaborator(fc, user.nome);
    toast(`Colaborador ${fc.nome} cadastrado.`);
    setOpenColab(false); setFc({ nome: '', email: '', cargo: 'Técnico de Instalação' }); setErr('');
  };

  const saveClient = () => {
    if (fcl.nome.trim().length < 3 || !fcl.cidade.trim()) { setErr('Informe razão social e cidade.'); return; }
    if (!/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(fcl.cnpj)) { setErr('CNPJ no formato 00.000.000/0000-00.'); return; }
    addClient(fcl, user.nome);
    toast(`Cliente ${fcl.nome} cadastrado.`);
    setOpenClient(false); setFcl({ nome: '', cnpj: '', cidade: '', uf: 'MG', contato: '', email: '' }); setErr('');
  };

  return (
    <div>
      <PageHeader
        eyebrow="Cadastros"
        title="Colaboradores & Clientes"
        subtitle="Apenas o essencial para a operação (minimização de dados)."
      />

      <Tabs
        tabs={[
          { id: 'colab', label: 'Colaboradores', icon: <Users size={15} />, count: users.length },
          { id: 'clientes', label: 'Clientes', icon: <Building2 size={15} />, count: clients.length },
        ]}
        active={tab} onChange={setTab}
      />

      {tab === 'colab' && (
        <div className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button variant="primary" icon={<Plus size={16} />} onClick={() => setOpenColab(true)}>Cadastrar colaborador</Button>
          </div>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead className="bg-muted/50 border-b border-border">
                  <tr><th className="th">Colaborador</th><th className="th">Cargo</th><th className="th">Perfil de acesso</th><th className="th">Relatórios</th><th className="th">Situação</th></tr>
                </thead>
                <tbody className="divide-y divide-border/70">
                  {users.map((u) => {
                    const count = reports.filter((r) => r.colaboradorId === u.id).length;
                    return (
                      <tr key={u.id} className="hover:bg-muted/30">
                        <td className="td">
                          <div className="flex items-center gap-3">
                            <Avatar nome={u.nome} />
                            <div>
                              <div className="font-semibold">{u.nome}</div>
                              <div className="text-[12px] text-subtle flex items-center gap-1"><Mail size={11} aria-hidden /> {u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="td text-secondary">{u.cargo}</td>
                        <td className="td"><Badge tone="slate">{ROLE_LABEL[u.role]}</Badge></td>
                        <td className="td tabular-nums">{count}</td>
                        <td className="td"><Badge tone={u.ativo ? 'green' : 'slate'} dot>{u.ativo ? 'Ativo' : 'Inativo'}</Badge></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'clientes' && (
        <div className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button variant="primary" icon={<Plus size={16} />} onClick={() => setOpenClient(true)}>Cadastrar cliente</Button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {clients.map((c) => {
              const count = reports.filter((r) => r.clienteId === c.id).length;
              return (
                <div key={c.id} className="card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent-soft text-accent flex items-center justify-center">
                      <Building2 size={18} aria-hidden />
                    </div>
                    <Badge tone="blue">{count} relatório(s)</Badge>
                  </div>
                  <h3 className="mt-3 text-[15.5px] font-bold text-primary">{c.nome}</h3>
                  <div className="text-[12.5px] text-subtle mono mt-0.5">{c.cnpj}</div>
                  <div className="mt-2 text-[13px] text-secondary space-y-0.5">
                    <div>{c.cidade}/{c.uf}</div>
                    <div>Contato: {c.contato}</div>
                    <div className="text-subtle text-[12.5px]">{c.email}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Modal open={openColab} onClose={() => setOpenColab(false)} title="Cadastrar colaborador"
        footer={<><Button variant="ghost" onClick={() => setOpenColab(false)}>Cancelar</Button><Button variant="primary" onClick={saveColab}>Cadastrar</Button></>}>
        <div className="space-y-4">
          {err && <p className="text-[13px] text-destructive font-medium" role="alert">{err}</p>}
          <Field label="Nome completo" required htmlFor="cb-nome"><Input id="cb-nome" value={fc.nome} onChange={(e) => setFc((f) => ({ ...f, nome: e.target.value }))} /></Field>
          <Field label="E-mail corporativo" required htmlFor="cb-email"><Input id="cb-email" type="email" value={fc.email} onChange={(e) => setFc((f) => ({ ...f, email: e.target.value }))} /></Field>
          <Field label="Cargo" htmlFor="cb-cargo"><Input id="cb-cargo" value={fc.cargo} onChange={(e) => setFc((f) => ({ ...f, cargo: e.target.value }))} /></Field>
          <p className="text-[12px] text-subtle">O acesso do colaborador acontece por link individual de preenchimento — sem senha, com escopo limitado ao próprio relatório.</p>
        </div>
      </Modal>

      <Modal open={openClient} onClose={() => setOpenClient(false)} title="Cadastrar cliente"
        footer={<><Button variant="ghost" onClick={() => setOpenClient(false)}>Cancelar</Button><Button variant="primary" onClick={saveClient}>Cadastrar</Button></>}>
        <div className="space-y-4">
          {err && <p className="text-[13px] text-destructive font-medium" role="alert">{err}</p>}
          <Field label="Razão social" required htmlFor="cl-nome"><Input id="cl-nome" value={fcl.nome} onChange={(e) => setFcl((f) => ({ ...f, nome: e.target.value }))} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="CNPJ" required htmlFor="cl-cnpj"><Input id="cl-cnpj" value={fcl.cnpj} onChange={(e) => setFcl((f) => ({ ...f, cnpj: e.target.value }))} placeholder="00.000.000/0000-00" /></Field>
            <Field label="Cidade" required htmlFor="cl-cidade"><Input id="cl-cidade" value={fcl.cidade} onChange={(e) => setFcl((f) => ({ ...f, cidade: e.target.value }))} /></Field>
            <Field label="UF" htmlFor="cl-uf"><Input id="cl-uf" maxLength={2} value={fcl.uf} onChange={(e) => setFcl((f) => ({ ...f, uf: e.target.value.toUpperCase() }))} /></Field>
            <Field label="Pessoa de contato" htmlFor="cl-contato"><Input id="cl-contato" value={fcl.contato} onChange={(e) => setFcl((f) => ({ ...f, contato: e.target.value }))} /></Field>
          </div>
          <Field label="E-mail de contato" htmlFor="cl-email"><Input id="cl-email" type="email" value={fcl.email} onChange={(e) => setFcl((f) => ({ ...f, email: e.target.value }))} /></Field>
        </div>
      </Modal>
    </div>
  );
}
