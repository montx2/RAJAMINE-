import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, Camera, ScanLine, ArrowRight, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useStore, useCurrentUser } from '../store/useStore';
import { PageHeader } from '../components/AppShell';
import { Badge, Button, Avatar, EmptyState, Select, Banner } from '../components/ui';
import { fmtDateTime, timeAgo } from '../lib/format';

export default function ReviewCenter() {
  const navigate = useNavigate();
  const user = useCurrentUser()!;
  const reports = useStore((s) => s.reports);
  const users = useStore((s) => s.users);
  const clients = useStore((s) => s.clients);
  const trucks = useStore((s) => s.trucks);
  const [colabId, setColabId] = useState('');

  const queue = useMemo(() =>
    reports
      .filter((r) => r.status === 'em_revisao' && (!colabId || r.colaboradorId === colabId))
      .sort((a, b) => (a.enviadoRevisaoEm ?? '').localeCompare(b.enviadoRevisaoEm ?? '')),
  [reports, colabId]);

  const corrections = reports.filter((r) => r.status === 'correcao');
  const approvedRecent = reports
    .filter((r) => r.aprovadoEm && r.aprovadoPor === user.nome)
    .sort((a, b) => b.aprovadoEm!.localeCompare(a.aprovadoEm!))
    .slice(0, 4);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Revisão"
        title="Central de Revisão"
        subtitle="Fila da responsável. Aprovação humana obrigatória antes do cliente."
      />

      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4 text-center">
          <div className="text-[24px] font-semibold text-accent tabular-nums">{queue.length}</div>
          <div className="text-[12px] font-semibold text-subtle">na fila de revisão</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-[24px] font-semibold text-destructive tabular-nums">{corrections.length}</div>
          <div className="text-[12px] font-semibold text-subtle">correções solicitadas</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-[24px] font-semibold text-success tabular-nums">{reports.filter((r) => r.aprovadoEm).length}</div>
          <div className="text-[12px] font-semibold text-subtle">aprovados no total</div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-64">
          <Select value={colabId} onChange={(e) => setColabId(e.target.value)} aria-label="Filtrar fila por colaborador">
            <option value="">Todos os colaboradores</option>
            {users.filter((u) => u.role === 'colaborador').map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
          </Select>
        </div>
        <span className="text-[12.5px] text-subtle">Mais antigos primeiro — ordem de chegada</span>
      </div>

      {queue.length === 0 ? (
        <div className="card">
          <EmptyState icon={<CheckCircle2 size={22} />} title="Fila zerada" description="Nenhum relatório aguardando revisão com os filtros atuais." />
        </div>
      ) : (
        <div className="space-y-3">
          {queue.map((r) => {
            const colab = users.find((u) => u.id === r.colaboradorId);
            const client = clients.find((c) => c.id === r.clienteId);
            const truck = trucks.find((t) => t.id === r.caminhaoId);
            const pendingOcr = r.deteccoes.filter((d) => d.status === 'aguardando').length;
            const waitedH = r.enviadoRevisaoEm ? Math.round((Date.now() - new Date(r.enviadoRevisaoEm).getTime()) / 3600000) : 0;
            return (
              <div key={r.id} className="card p-4 sm:p-5 hover:border-accent/40 transition-colors">
                <div className="flex flex-wrap items-center gap-4">
                  <Avatar nome={colab?.nome ?? '?'} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="mono font-bold text-[15px] text-primary">{r.codigo}</span>
                      {waitedH >= 24 && <Badge tone="amber" dot><Clock size={11} aria-hidden /> aguarda há {waitedH} h</Badge>}
                      {pendingOcr > 0 && <Badge tone="amber"><ScanLine size={11} aria-hidden /> {pendingOcr} OCR pendente(s)</Badge>}
                    </div>
                    <div className="text-[12.5px] text-subtle mt-0.5">
                      {colab?.nome} · {client?.nome} · {truck?.frota && <><span className="mono">{truck.frota}</span> · </>}enviado {r.enviadoRevisaoEm ? timeAgo(r.enviadoRevisaoEm) : '—'}
                    </div>
                    <div className="flex flex-wrap gap-3 mt-2 text-[12px] text-subtle">
                      <span className="flex items-center gap-1"><Camera size={13} aria-hidden /> {r.fotos.length} foto(s)</span>
                      <span className="flex items-center gap-1"><ScanLine size={13} aria-hidden /> {r.deteccoes.length} leitura(s)</span>
                      <span className="flex items-center gap-1"><CheckCircle2 size={13} aria-hidden /> {r.equipamentosIds.length} equipamento(s) confirmado(s)</span>
                    </div>
                  </div>
                  <Button variant="primary" icon={<ClipboardCheck size={15} />} onClick={() => navigate(`/relatorios/${r.id}?tab=revisao`)}>
                    Revisar <ArrowRight size={14} aria-hidden />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {corrections.length > 0 && (
        <div className="card p-5">
          <h2 className="section-title mb-3 flex items-center gap-2"><AlertTriangle size={16} className="text-warning" aria-hidden /> Aguardando correção do colaborador</h2>
          <div className="space-y-2">
            {corrections.map((r) => {
              const colab = users.find((u) => u.id === r.colaboradorId);
              const nota = r.notasRevisao.filter((n) => n.tipo === 'correcao').at(-1);
              return (
                <button key={r.id} onClick={() => navigate(`/relatorios/${r.id}?tab=revisao`)} className="w-full text-left rounded-lg border border-border px-4 py-3 hover:border-accent/40 cursor-pointer">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="mono font-bold text-[13.5px] text-primary">{r.codigo}</span>
                    <span className="text-[12.5px] text-subtle">{colab?.nome}</span>
                    {nota && <span className="text-[11.5px] text-subtle">· solicitado {fmtDateTime(nota.criadaEm)}</span>}
                  </div>
                  {nota && <p className="text-[12.5px] text-secondary mt-1 line-clamp-2">{nota.texto}</p>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {approvedRecent.length > 0 && (
        <Banner tone="success" icon={<CheckCircle2 size={16} />}>
          Suas últimas aprovações: {approvedRecent.map((r) => r.codigo).join(', ')}. Os documentos ficam disponíveis na aba Documentos de cada relatório e no Arquivo.
        </Banner>
      )}
    </div>
  );
}
