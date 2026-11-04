import { useState } from 'react';
import { GraduationCap, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useStore, useCurrentUser } from '../../store/useStore';
import { Badge, Banner, Button, Field, Input, Modal, toast } from '../../components/ui';
import { DRIVER_TRAININGS } from '../../lib/driver';
import { fmtDateTime } from '../../lib/format';

export default function DriverTraining() {
  const user = useCurrentUser()!;
  const trainings = useStore((s) => s.driverTrainings);
  const confirm = useStore((s) => s.confirmDriverTraining);
  const sync = useStore((s) => s.syncDriverQueue);
  const [openId, setOpenId] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [ciencia, setCiencia] = useState(false);
  const [saving, setSaving] = useState(false);

  const current = DRIVER_TRAININGS.find((t) => t.id === openId);
  const done = (id: string) => trainings.find((t) => t.motoristaId === user.id && t.treinamentoId === id);

  const doConfirm = () => {
    if (!current) return;
    if (!ciencia) { toast('Marque a caixa de ciência antes de confirmar.', 'error'); return; }
    setSaving(true);
    const res = confirm(user.id, current.id, current.titulo, nome, user.nome);
    setSaving(false);
    if (!res.ok) { toast(res.erro ?? 'Não foi possível confirmar.', 'error'); return; }
    if (navigator.onLine) sync();
    toast('Ciência registrada.');
    setOpenId(null);
    setNome('');
    setCiencia(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="eyebrow mb-1">Portal do motorista</div>
        <h1 data-tour="driver-treinamento-title" className="text-[20px] font-semibold text-primary">Treinamentos e ciência</h1>
        <p className="text-[12.5px] text-subtle mt-1">Confirmação simples, digitada e auditada. Sem biometria, sem reconhecimento facial.</p>
      </div>

      <Banner tone="info" icon={<ShieldCheck size={16} />}>
        A ciência registra que você recebeu a orientação. Ela <strong>não substitui</strong> treinamento presencial obrigatório nem libera operação de equipamento.
      </Banner>

      <div className="space-y-3">
        {DRIVER_TRAININGS.map((t) => {
          const d = done(t.id);
          return (
            <div key={t.id} className="card p-4">
              <div className="flex items-start gap-3">
                <span className="w-10 h-10 rounded-xl bg-accent-soft text-accent flex items-center justify-center shrink-0">
                  {d ? <CheckCircle2 size={18} aria-hidden /> : <GraduationCap size={18} aria-hidden />}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-[14px] font-bold text-primary">{t.titulo}</h2>
                    {d ? <Badge tone="green">ciência registrada</Badge> : <Badge tone="amber">pendente</Badge>}
                  </div>
                  <p className="text-[12.5px] text-subtle mt-1 leading-relaxed">{t.descricao}</p>
                  {d && <p className="text-[11.5px] text-subtle mt-1">Confirmado por {d.nomeConfirmado} em {fmtDateTime(d.confirmadoEm)}</p>}
                </div>
              </div>
              {!d && (
                <Button className="mt-3 w-full sm:w-auto" variant="outline" size="sm" onClick={() => { setOpenId(t.id); setNome(''); setCiencia(false); }}>
                  Registrar ciência
                </Button>
              )}
            </div>
          );
        })}
      </div>

      <Modal open={!!current} onClose={() => setOpenId(null)} title={current ? `Ciência — ${current.titulo}` : ''}
        footer={<>
          <Button variant="ghost" onClick={() => setOpenId(null)}>Cancelar</Button>
          <Button variant="primary" loading={saving} onClick={doConfirm} disabled={!ciencia || nome.trim().length < 3}>Confirmar ciência</Button>
        </>}>
        {current && (
          <div className="space-y-4">
            <p className="text-[13.5px] text-secondary leading-relaxed">{current.descricao}</p>
            <Field label="Digite seu nome completo" htmlFor="tr-nome" required hint={`Como cadastrado: ${user.nome}`}>
              <Input id="tr-nome" value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="name" placeholder={user.nome} />
            </Field>
            <label className="flex items-start gap-2.5 text-[13px] text-secondary cursor-pointer">
              <input type="checkbox" checked={ciencia} onChange={(e) => setCiencia(e.target.checked)} className="mt-1 h-4 w-4 accent-[#B45309]" />
              Declaro que recebi esta orientação e me comprometo a comunicar falhas à coordenação, sem realizar intervenção técnica por conta própria.
            </label>
          </div>
        )}
      </Modal>
    </div>
  );
}
