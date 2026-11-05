import { useMemo, useState } from 'react';
import { AlignLeft, Check, X, PencilLine, ShieldCheck, AlertTriangle, Info, AlertCircle, ArrowRight, ListChecks } from 'lucide-react';
import type { Report } from '../data/types';
import { useStore } from '../store/useStore';
import { padronizar, temPrimeiraPessoa } from '../services/padronizacao';
import { Button, Badge, Banner, Textarea, toast } from './ui';
import DiffView from './DiffView';
import { cn } from '../lib/cn';

export default function PadronizacaoPanel({ report, actorName, canEdit }: { report: Report; actorName: string; canEdit: boolean }) {
  const addTextVersion = useStore((s) => s.addTextVersion);
  const users = useStore((s) => s.users);
  const trucks = useStore((s) => s.trucks);
  const equipment = useStore((s) => s.equipment);

  const baseText = report.descricaoAtual || report.descricaoOriginal;
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [editText, setEditText] = useState('');
  const [showChanges, setShowChanges] = useState(true);
  const [rejected, setRejected] = useState(false);

  const result = useMemo(() => {
    const colab = users.find((u) => u.id === report.colaboradorId);
    const truck = trucks.find((t) => t.id === report.caminhaoId);
    return padronizar(baseText, {
      colaboradorNome: colab?.nome,
      origem: report.origem,
      destino: report.destino,
      dataViagem: report.dataViagem,
      kmInicio: report.kmInicio,
      kmFim: report.kmFim,
      placaCaminhao: truck?.placa,
      frotaCaminhao: truck?.frota,
      equipamentosConfirmados: report.equipamentosIds.map((id) => equipment.find((e) => e.id === id)?.codigo ?? ''),
      atividades: report.atividades,
      periodoInicio: report.periodoInicio,
      periodoFim: report.periodoFim,
      tipo: report.tipo,
    });
  }, [baseText, report, users, trucks, equipment]);

  const changed = result.sugerido !== baseText.replace(/\s+/g, ' ').trim();
  const firstPerson = temPrimeiraPessoa(baseText);

  const accept = () => {
    addTextVersion(report.id, result.sugerido, 'ia', actorName, 'Sugestão do motor de padronização aceita; texto original preservado');
    toast('Sugestão aplicada. O texto original foi preservado no histórico.');
    setRejected(false);
  };
  const startEdit = () => { setEditText(result.sugerido); setMode('edit'); };
  const saveEdit = () => {
    if (!editText.trim()) { toast('O texto não pode ficar vazio.', 'error'); return; }
    addTextVersion(report.id, editText.trim(), 'manual', actorName, 'Versão ajustada manualmente a partir da sugestão');
    toast('Versão editada salva. Original preservado.');
    setMode('view');
  };
  const reject = () => {
    setRejected(true);
    toast('Sugestão rejeitada. O texto atual foi mantido.', 'info');
  };

  if (!baseText.trim()) {
    return <Banner tone="warn" icon={<AlertTriangle size={17} />}>A descrição das atividades ainda não foi preenchida. A análise de padronização fica disponível assim que o colaborador escrever o relato.</Banner>;
  }

  return (
    <div className="space-y-4">
      <Banner tone="info" icon={<ShieldCheck size={17} />}>
        <strong>Motor local de regras (demonstrativo).</strong> A análise roda no navegador, sem enviar dados a serviços externos.
        O texto original é preservado. A sugestão <strong>não adiciona acontecimentos</strong>: apenas reescreve o que foi relatado.
        Em produção, este contrato pode ser atendido por um LLM auditável (ver documentação).
      </Banner>

      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={firstPerson ? 'amber' : 'green'} dot>
          {firstPerson ? '1ª pessoa detectada no texto' : 'Texto em 3ª pessoa'}
        </Badge>
        <Badge tone={result.mudancas.length ? 'blue' : 'slate'}>{result.mudancas.length} transformação(ões) sugerida(s)</Badge>
        <Badge tone={result.alertas.some((a) => a.nivel === 'erro') ? 'red' : result.alertas.some((a) => a.nivel === 'atencao') ? 'amber' : 'slate'}>
          {result.alertas.length} verificação(ões) de consistência
        </Badge>
      </div>

      {rejected ? (
        <Banner tone="warn" icon={<X size={17} />}>
          Sugestão rejeitada — o texto atual foi mantido. <button className="link" onClick={() => setRejected(false)}>Reanalisar</button>
        </Banner>
      ) : (
        <>
          <div className="grid xl:grid-cols-2 gap-4 [&>*]:min-w-0">
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-bold uppercase tracking-wide text-subtle">Texto atual (preservado)</h3>
                <Badge tone="slate">Original</Badge>
              </div>
              <p className="text-[14px] leading-[1.8] text-secondary whitespace-pre-wrap">{baseText}</p>
            </div>
            <div className={cn('card p-4 border-accent/30', mode === 'edit' && 'ring-2 ring-accent/20')}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-bold uppercase tracking-wide text-accent flex items-center gap-1.5">
                  <AlignLeft size={14} aria-hidden /> Sugestão padronizada
                </h3>
                <Badge tone="blue">3ª pessoa · formal</Badge>
              </div>
              {mode === 'edit' ? (
                <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} className="min-h-[180px]" aria-label="Editar sugestão" />
              ) : (
                <DiffView original={baseText.replace(/\s+/g, ' ').trim()} sugerido={result.sugerido} />
              )}
              {mode === 'view' && changed && (
                <p className="mt-3 text-xs text-subtle flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-sm bg-destructive-soft border border-destructive/30" aria-hidden /> removido
                  <span className="inline-block w-3 h-3 rounded-sm bg-success-soft border border-success/30 ml-2" aria-hidden /> adicionado
                </p>
              )}
            </div>
          </div>

          {/* Mudanças aplicadas */}
          {result.mudancas.length > 0 && (
            <div className="card">
              <button
                className="w-full flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/40 rounded-xl"
                onClick={() => setShowChanges((v) => !v)}
                aria-expanded={showChanges}
              >
                <span className="flex items-center gap-2 text-[13.5px] font-bold text-primary">
                  <ListChecks size={16} className="text-accent" aria-hidden />
                  Transformações aplicadas ({result.mudancas.length})
                </span>
                <span className="text-[12px] text-subtle">{showChanges ? 'ocultar' : 'mostrar'}</span>
              </button>
              {showChanges && (
                <div className="px-4 pb-4 grid sm:grid-cols-2 gap-2">
                  {result.mudancas.map((m, i) => (
                    <div key={i} className="flex items-start gap-2 rounded-lg bg-muted/50 px-3 py-2">
                      <Badge tone="slate" className="mt-0.5 shrink-0">
                        {m.tipo === 'pessoa' ? 'pessoa' : m.tipo === 'gramatica' ? 'gramática' : 'estilo'}
                      </Badge>
                      <div className="min-w-0 text-[12.5px]">
                        <span className="text-destructive line-through">{m.de}</span>
                        <ArrowRight size={11} className="inline mx-1.5 text-subtle" aria-hidden />
                        <span className="text-success font-semibold">{m.para}</span>
                        <div className="text-subtle mt-0.5">{m.motivo}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Alertas de consistência */}
          {result.alertas.length > 0 && (
            <div className="space-y-2">
              {result.alertas.map((a, i) => (
                <div key={i} className={cn('flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-[13px]',
                  a.nivel === 'erro' && 'border-destructive/20 bg-destructive-soft/50 text-destructive',
                  a.nivel === 'atencao' && 'border-warning/20 bg-warning-soft/50 text-warning',
                  a.nivel === 'info' && 'border-border bg-muted/40 text-secondary')}>
                  {a.nivel === 'erro' ? <AlertCircle size={16} className="shrink-0 mt-0.5" /> : a.nivel === 'atencao' ? <AlertTriangle size={16} className="shrink-0 mt-0.5" /> : <Info size={16} className="shrink-0 mt-0.5" />}
                  {a.mensagem}
                </div>
              ))}
            </div>
          )}

          {/* Ações */}
          {canEdit && (
            <div className="flex flex-wrap gap-2 pt-1">
              {mode === 'view' ? (
                <>
                  <Button variant="success" icon={<Check size={16} />} onClick={accept} disabled={!changed}>
                    Aceitar sugestão
                  </Button>
                  <Button variant="outline" icon={<PencilLine size={16} />} onClick={startEdit}>Editar sugestão</Button>
                  <Button variant="ghost" icon={<X size={16} />} onClick={reject} disabled={!changed}>Rejeitar</Button>
                </>
              ) : (
                <>
                  <Button variant="success" icon={<Check size={16} />} onClick={saveEdit}>Salvar versão editada</Button>
                  <Button variant="ghost" onClick={() => setMode('view')}>Cancelar edição</Button>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
