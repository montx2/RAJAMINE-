import { useMemo, useState } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  ArrowLeft, FileText, AlignLeft, Camera, ClipboardCheck, Archive, History,
  Check, AlertTriangle, Lock, Download, Eye, Send, Copy, BellRing, FileCheck2, Loader2, ShieldCheck,
} from 'lucide-react';
import { useStore, useCurrentUser } from '../store/useStore';
import { Badge, Button, StatusBadge, Tabs, Avatar, Banner, Modal, Textarea, toast, EmptyState } from '../components/ui';
import Timeline from '../components/Timeline';
import PadronizacaoPanel from '../components/PadronizacaoPanel';
import PhotosOcrPanel from '../components/PhotosOcrPanel';
import { useDocBuilder } from '../lib/docs';
import { fmtDate, fmtDateTime, fmtKm, deadlineLabel } from '../lib/format';
import type { DocKind } from '../services/pdf';
import { cn } from '../lib/cn';
import { ACTIVITY_KIND_LABEL, REPORT_KIND_LABEL } from '../data/types';
import { validateActivities } from '../lib/operations';

export default function ReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const user = useCurrentUser()!;
  const reports = useStore((s) => s.reports);
  const users = useStore((s) => s.users);
  const clients = useStore((s) => s.clients);
  const trucks = useStore((s) => s.trucks);
  const equipment = useStore((s) => s.equipment);
  const approveReport = useStore((s) => s.approveReport);
  const requestCorrection = useStore((s) => s.requestCorrection);
  const registerDocuments = useStore((s) => s.registerDocuments);
  const markClientSent = useStore((s) => s.markClientSent);
  const sendReminder = useStore((s) => s.sendReminder);

  const report = reports.find((r) => r.id === id);
  const [tab, setTab] = useState(params.get('tab') ?? 'dados');
  const [reviewNote, setReviewNote] = useState('');
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [correctionText, setCorrectionText] = useState('');
  const [approveOpen, setApproveOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState<{ url: string; kind: DocKind } | null>(null);
  const [previewLoading, setPreviewLoading] = useState<DocKind | null>(null);

  const docs = useDocBuilder(report ?? ({ id: '', fotos: [], colaboradorId: '', clienteId: '', caminhaoId: '' } as never));

  const checklist = useMemo(() => {
    if (!report) return [];
    const detsPending = report.deteccoes.filter((d) => d.status === 'aguardando').length;
    return [
      { ok: !!report.dataViagem && ((report.tipo ?? 'viagem') !== 'viagem' || (!!report.origem && !!report.destino)), label: 'Dados da visita/viagem completos' },
      { ok: report.descricaoAtual.trim().length >= 20 || !!(report.atividades?.length), label: 'Atividades registradas (texto ou estrutura por equipamento)' },
      { ok: validateActivities(report.atividades ?? [], { inicio: report.periodoInicio, fim: report.periodoFim }).filter((a) => a.nivel === 'erro').length === 0, label: 'IDs e período consistentes (quando informados)' },
      { ok: report.kmInicio == null || report.kmFim == null || report.kmFim > report.kmInicio, label: 'Hodômetro consistente (quando informado)' },
      { ok: detsPending === 0, label: detsPending ? `${detsPending} leitura(s) OCR aguardando conferência` : 'Leituras OCR conferidas (ou inexistentes)' },
      { ok: report.fotos.length > 0, label: report.fotos.length ? `${report.fotos.length} fotografia(s) anexada(s)` : 'Sem fotografias (verificar se eram esperadas)', optional: true },
    ];
  }, [report]);

  if (!report) {
    return <EmptyState title="Relatório não encontrado" description="O relatório pode ter sido removido ou o link é inválido." action={<Button onClick={() => navigate('/relatorios')}>Ver relatórios</Button>} />;
  }
  if (user.role === 'colaborador' && report.colaboradorId !== user.id) {
    return <EmptyState icon={<Lock size={22} />} title="Acesso restrito" description="Colaboradores acessam apenas os próprios relatórios (princípio do menor privilégio)." action={<Button onClick={() => navigate('/relatorios')}>Meus relatórios</Button>} />;
  }

  const colab = users.find((u) => u.id === report.colaboradorId);
  const client = clients.find((c) => c.id === report.clienteId);
  const truck = trucks.find((t) => t.id === report.caminhaoId);
  const isReviewer = user.role === 'admin' || user.role === 'revisora';
  const canFill = ['pendente', 'rascunho', 'correcao'].includes(report.status);
  const canEditTexto = canFill || (isReviewer && report.status === 'em_revisao');
  const canUpload = canFill;
  const canValidate = canFill || (isReviewer && report.status === 'em_revisao');
  const eqs = equipment.filter((e) => report.equipamentosIds.includes(e.id));
  const dl = canFill ? deadlineLabel(report.prazoEm) : null;

  const changeTab = (t: string) => { setTab(t); setParams({ tab: t }, { replace: true }); };

  const doApprove = () => {
    const res = approveReport(report.id, user.nome, reviewNote.trim() || undefined);
    if (!res.ok) { toast(res.erro ?? 'Não foi possível aprovar.', 'error'); return; }
    toast('Relatório aprovado. Documento do cliente liberado para geração.');
    setApproveOpen(false);
    setReviewNote('');
  };

  const doCorrection = () => {
    if (correctionText.trim().length < 10) { toast('Descreva o que precisa ser corrigido (mín. 10 caracteres).', 'error'); return; }
    requestCorrection(report.id, correctionText.trim(), user.nome);
    toast('Correção solicitada ao colaborador (notificação simulada).', 'info');
    setCorrectionOpen(false);
    setCorrectionText('');
  };

  const generateDocs = async () => {
    setGenerating(true);
    try {
      // Gera os dois PDFs reais antes de registrar o arquivamento
      await docs.build('cliente');
      await docs.build('interno');
      registerDocuments(report.id, user.nome);
      toast('Os dois PDFs foram gerados e arquivados. Veja a aba Documentos.');
      changeTab('documentos');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Falha ao gerar documentos.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const openPreview = async (kind: DocKind) => {
    setPreviewLoading(kind);
    try {
      const url = await docs.previewUrl(kind);
      setPreview({ url, kind });
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Falha ao gerar pré-visualização.', 'error');
    } finally {
      setPreviewLoading(null);
    }
  };

  const copyLink = async () => {
    const link = `${window.location.origin}/preencher/${report.token}`;
    try { await navigator.clipboard.writeText(link); toast('Link individual copiado.'); }
    catch { toast('Não foi possível copiar o link.', 'error'); }
  };

  const tabs = [
    { id: 'dados', label: 'Dados', icon: <FileText size={15} /> },
    { id: 'texto', label: 'Texto', icon: <AlignLeft size={15} /> },
    { id: 'fotos', label: 'Fotos & OCR', icon: <Camera size={15} />, count: report.deteccoes.filter((d) => d.status === 'aguardando').length },
    { id: 'revisao', label: 'Revisão', icon: <ClipboardCheck size={15} /> },
    { id: 'documentos', label: 'Documentos', icon: <Archive size={15} />, count: report.documentos.length },
    { id: 'historico', label: 'Histórico', icon: <History size={15} /> },
  ];

  return (
    <div className="space-y-5">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-[13px] font-semibold text-subtle hover:text-accent cursor-pointer">
        <ArrowLeft size={15} aria-hidden /> Voltar
      </button>

      {/* Cabeçalho */}
      <div className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-[22px] font-semibold tracking-tight text-primary mono">{report.codigo}</h1>
              <StatusBadge status={report.status} />
              {dl && <Badge tone={dl.tom === 'late' ? 'red' : dl.tom === 'warn' ? 'amber' : 'slate'} dot>{dl.texto}</Badge>}
              {report.enviadoCliente && <Badge tone="green">enviado ao cliente (simulação)</Badge>}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-subtle">
              <span className="flex items-center gap-2"><Avatar nome={colab?.nome ?? '?'} size="sm" /> {colab?.nome}</span>
              <span>{client?.nome ?? 'Consolidado semanal'}</span>
              {truck && <span className="mono">{truck.frota} · {truck.placa}</span>}
              <span>{REPORT_KIND_LABEL[report.tipo ?? 'viagem']}</span>
              <span>{fmtDate(report.dataViagem + 'T12:00:00')}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {canFill && isReviewer && (
              <>
                <Button size="sm" variant="outline" icon={<Copy size={14} />} onClick={copyLink}>Copiar link</Button>
                <Button size="sm" variant="outline" icon={<BellRing size={14} />} onClick={() => { sendReminder(report.id, user.nome); toast('Lembrete enviado (simulação).', 'info'); }}>Lembrar</Button>
              </>
            )}
            {canFill && user.role === 'colaborador' && (
              <Button size="sm" variant="primary" onClick={() => navigate(`/preencher/${report.token}`)}>Preencher relatório</Button>
            )}
            {report.status === 'em_revisao' && isReviewer && (
              <Button size="sm" variant="primary" icon={<ClipboardCheck size={14} />} onClick={() => changeTab('revisao')}>Revisar agora</Button>
            )}
            {report.status === 'aprovado' && isReviewer && (
              <Button size="sm" variant="success" icon={<FileCheck2 size={14} />} loading={generating} onClick={generateDocs}>Gerar os 2 PDFs</Button>
            )}
          </div>
        </div>
      </div>

      <Tabs tabs={tabs} active={tab} onChange={changeTab} />

      {/* ── DADOS ── */}
      {tab === 'dados' && (
        <div className="grid lg:grid-cols-[1.5fr_1fr] gap-4">
          <div className="card p-5">
            <h2 className="section-title mb-4">Dados da visita / atividade</h2>
            <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
              {[
                ['Colaborador', `${colab?.nome} — ${colab?.cargo}`],
                ['Cliente / Empresa', client ? `${client.nome}${client.cidade ? ` (${client.cidade}/${client.uf})` : ''}` : 'Consolidado semanal'],
                ['Setor', report.setor || '—'],
                ['Cidade / Bairros', report.cidadeBairro || '—'],
                ['Objetivo', report.objetivo || '—'],
                ['Período', report.periodoInicio ? `${fmtDate(report.periodoInicio + 'T12:00:00')} → ${fmtDate((report.periodoFim ?? report.periodoInicio) + 'T12:00:00')}` : fmtDate(report.dataViagem + 'T12:00:00')],
                ...(truck ? [['Caminhão', `${truck.frota} · ${truck.placa} · ${truck.marca} ${truck.modelo}`] as [string, string]] : []),
                ['Data da viagem', fmtDate(report.dataViagem + 'T12:00:00')],
                ['Origem', report.origem || '—'],
                ['Destino', report.destino || '—'],
                ['Hodômetro', report.kmInicio != null ? `${fmtKm(report.kmInicio)} → ${fmtKm(report.kmFim)}` : 'Não informado'],
                ['Prazo de preenchimento', fmtDateTime(report.prazoEm)],
                ['Criado em', fmtDateTime(report.criadoEm)],
                ['Enviado para revisão', report.enviadoRevisaoEm ? fmtDateTime(report.enviadoRevisaoEm) : '—'],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-subtle">{k}</dt>
                  <dd className="text-[14px] text-foreground mt-0.5">{v}</dd>
                </div>
              ))}
            </dl>
            {(report.atividades?.length ?? 0) > 0 && (
              <div className="mt-6">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-subtle mb-2">Atividades por equipamento</h3>
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full min-w-[640px]">
                    <thead className="bg-muted/50"><tr><th className="th">Equipamento</th><th className="th">Atividade</th><th className="th">Telemetria</th><th className="th">Pulsus</th><th className="th">Câmera / Galileo</th><th className="th">Observação</th></tr></thead>
                    <tbody className="divide-y divide-border/70">
                      {report.atividades!.map((a) => (
                        <tr key={a.id}>
                          <td className="td mono font-bold">{a.equipamentoCodigo || '—'}</td>
                          <td className="td text-[13px]">{ACTIVITY_KIND_LABEL[a.tipo]}{a.componentes?.length ? ` · ${a.componentes.join(', ')}` : ''}</td>
                          <td className="td mono">{a.telemetria ?? '—'}</td>
                          <td className="td mono">{a.pulsus ?? '—'}</td>
                          <td className="td mono text-[12px]">{a.cameraFadiga ?? '—'}{a.galileo ? <div className="text-[11px] text-subtle">Galileo {a.galileo}</div> : null}</td>
                          <td className="td text-[12.5px] text-subtle">{a.observacao || a.descricao || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            <div className="mt-6">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-subtle mb-2">Descrição vigente</h3>
              <p className="text-[14px] leading-relaxed text-secondary whitespace-pre-wrap rounded-lg bg-muted/50 p-4">
                {report.descricaoAtual || 'Ainda não preenchida pelo colaborador.'}
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="card p-5">
              <h2 className="section-title mb-3">Equipamentos do relatório</h2>
              {eqs.length === 0 ? (
                <p className="text-[13px] text-subtle">Nenhum equipamento confirmado ainda. Use a aba Fotos & OCR ou registre manualmente na confirmação.</p>
              ) : (
                <div className="space-y-2.5">
                  {eqs.map((e) => (
                    <Link to={`/equipamentos?q=${e.codigo}`} key={e.id} className="flex items-center justify-between rounded-lg border border-border px-3.5 py-2.5 hover:border-accent/50 transition-colors">
                      <div>
                        <div className="mono font-bold text-[14px] text-primary">{e.codigo}</div>
                        <div className="text-[12px] text-subtle">{e.tipo} · série {e.serial}</div>
                      </div>
                      <Badge tone="green" dot>confirmado</Badge>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <div className="card p-5">
              <h2 className="section-title mb-3">Resumo do fluxo</h2>
              <ol className="space-y-2 text-[13px]">
                {[
                  ['Link gerado', true, fmtDateTime(report.criadoEm)],
                  ['Preenchido', !!report.enviadoRevisaoEm, report.enviadoRevisaoEm ? fmtDateTime(report.enviadoRevisaoEm) : 'pendente'],
                  ['Aprovado (humano)', !!report.aprovadoEm, report.aprovadoEm ? `${fmtDateTime(report.aprovadoEm)} · ${report.aprovadoPor}` : 'pendente'],
                  ['Documentos gerados', report.documentos.length > 0, report.documentos.length ? `${report.documentos.length} arquivo(s)` : 'pendente'],
                  ['Enviado ao cliente', report.enviadoCliente, report.enviadoCliente ? 'simulação registrada' : 'pendente'],
                ].map(([label, ok, detail]) => (
                  <li key={label as string} className="flex items-start gap-2.5">
                    <span className={cn('w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5', ok ? 'bg-success-soft text-success' : 'bg-muted text-subtle')}>
                      {ok ? <Check size={12} /> : <span className="w-1.5 h-1.5 rounded-full bg-current" />}
                    </span>
                    <div>
                      <span className={cn('font-semibold', ok ? 'text-foreground' : 'text-subtle')}>{label as string}</span>
                      <div className="text-[11.5px] text-subtle">{detail as string}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* ── TEXTO ── */}
      {tab === 'texto' && (
        <div className="space-y-4">
          <PadronizacaoPanel report={report} actorName={user.nome} canEdit={canEditTexto} />
          {report.versoesTexto.length > 0 && (
            <div className="card p-5">
              <h2 className="section-title mb-3">Versões do texto (originais preservados)</h2>
              <div className="space-y-3">
                {[...report.versoesTexto].reverse().map((v) => (
                  <details key={v.id} className="rounded-lg border border-border">
                    <summary className="flex flex-wrap items-center gap-2 px-4 py-2.5 cursor-pointer hover:bg-muted/40">
                      <Badge tone={v.tipo === 'ia' ? 'blue' : 'slate'}>
                        {v.tipo === 'original' ? 'original' : v.tipo === 'ia' ? 'padronização' : 'edição manual'}
                      </Badge>
                      <span className="text-[12.5px] text-subtle">{fmtDateTime(v.criadaEm)} · {v.autor}</span>
                      {v.nota && <span className="text-[12px] text-subtle italic">— {v.nota}</span>}
                    </summary>
                    <p className="px-4 pb-3 text-[13.5px] text-secondary whitespace-pre-wrap">{v.texto}</p>
                  </details>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── FOTOS & OCR ── */}
      {tab === 'fotos' && (
        <PhotosOcrPanel report={report} actorName={user.nome} canUpload={canUpload} canValidate={canValidate} />
      )}

      {/* ── REVISÃO ── */}
      {tab === 'revisao' && (
        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-4">
          <div className="space-y-4">
            <div className="card p-5">
              <h2 className="section-title mb-4 flex items-center gap-2"><ShieldCheck size={17} className="text-accent" aria-hidden /> Checklist de revisão</h2>
              <ul className="space-y-2.5">
                {checklist.map((c, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[13.5px]">
                    <span className={cn('w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                      c.ok ? 'bg-success-soft text-success' : c.optional ? 'bg-warning-soft text-warning' : 'bg-destructive-soft text-destructive')}>
                      {c.ok ? <Check size={12} /> : <AlertTriangle size={11} />}
                    </span>
                    <span className={c.ok ? 'text-secondary' : 'text-foreground font-medium'}>{c.label}</span>
                  </li>
                ))}
              </ul>
              {report.status === 'em_revisao' && isReviewer && (
                <div className="mt-5 space-y-3">
                  <div>
                    <label className="label" htmlFor="review-note">Observações da revisão (opcional na aprovação)</label>
                    <Textarea id="review-note" value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} placeholder="Registre observações que ficarão no histórico e no relatório interno…" className="min-h-[90px]" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="success" icon={<Check size={16} />} onClick={() => setApproveOpen(true)}>Aprovar relatório</Button>
                    <Button variant="outline" icon={<AlertTriangle size={16} />} onClick={() => setCorrectionOpen(true)}>Solicitar correções</Button>
                  </div>
                  <p className="text-[12px] text-subtle">A aprovação humana é obrigatória antes de gerar o documento do cliente. Leituras OCR pendentes bloqueiam a aprovação.</p>
                </div>
              )}
              {report.aprovadoEm && (
                <Banner tone="success" className="mt-4" icon={<Check size={16} />}>
                  Aprovado por <strong>{report.aprovadoPor}</strong> em {fmtDateTime(report.aprovadoEm)}.
                </Banner>
              )}
              {!isReviewer && <Banner tone="info" className="mt-4">Somente os perfis de revisão e administração podem aprovar relatórios.</Banner>}
            </div>

            <div className="card p-5">
              <h2 className="section-title mb-3">Comparação de textos</h2>
              {report.descricaoOriginal ? (
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="rounded-lg bg-muted/50 p-3.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-subtle mb-2">Original do colaborador</div>
                    <p className="text-[13px] text-secondary whitespace-pre-wrap">{report.descricaoOriginal}</p>
                  </div>
                  <div className="rounded-lg bg-accent-soft/40 border border-accent/20 p-3.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-accent mb-2">Versão vigente</div>
                    <p className="text-[13px] text-secondary whitespace-pre-wrap">{report.descricaoAtual}</p>
                  </div>
                </div>
              ) : <p className="text-[13px] text-subtle">O texto original aparece aqui após o primeiro envio.</p>}
            </div>
          </div>

          <div className="card p-5">
            <h2 className="section-title mb-3">Notas de revisão</h2>
            {report.notasRevisao.length === 0 ? (
              <p className="text-[13px] text-subtle">Nenhuma nota registrada.</p>
            ) : (
              <div className="space-y-3">
                {[...report.notasRevisao].reverse().map((n) => (
                  <div key={n.id} className={cn('rounded-lg border p-3.5', n.tipo === 'correcao' ? 'border-red-200 bg-destructive-soft/40' : n.tipo === 'aprovacao' ? 'border-green-200 bg-success-soft/40' : 'border-border')}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Badge tone={n.tipo === 'correcao' ? 'red' : n.tipo === 'aprovacao' ? 'green' : 'slate'}>{n.tipo === 'correcao' ? 'correção' : n.tipo === 'aprovacao' ? 'aprovação' : 'observação'}</Badge>
                      <span className="text-[11.5px] text-subtle">{fmtDateTime(n.criadaEm)}</span>
                    </div>
                    <p className="text-[13px] text-secondary">{n.texto}</p>
                    <p className="text-[11.5px] text-subtle mt-1.5">— {n.autor}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── DOCUMENTOS ── */}
      {tab === 'documentos' && (
        <div className="space-y-4">
          {!report.aprovadoEm ? (
            <Banner tone="warn" icon={<Lock size={17} />}>
              <strong>Documentos bloqueados.</strong> O PDF do cliente só pode ser gerado após a aprovação humana na Central de Revisão.
              Status atual: <StatusBadge status={report.status} className="ml-1" />
            </Banner>
          ) : (
            <>
              <div className="grid md:grid-cols-2 gap-4">
                {(['cliente', 'interno'] as DocKind[]).map((kind) => (
                  <div key={kind} className="card p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', kind === 'cliente' ? 'bg-accent-soft text-accent' : 'bg-primary text-primary-foreground')}>
                        <FileText size={20} aria-hidden />
                      </div>
                      <Badge tone={kind === 'cliente' ? 'blue' : 'slate'}>{kind === 'cliente' ? 'sem fotos internas' : 'completo'}</Badge>
                    </div>
                    <h3 className="mt-3 text-[16px] font-bold text-primary">
                      {kind === 'cliente' ? 'Relatório para o cliente' : 'Relatório interno'}
                    </h3>
                    <p className="text-[12.5px] text-subtle mt-1 leading-relaxed">
                      {kind === 'cliente'
                        ? 'Dados da viagem, descrição padronizada, equipamentos validados e bloco de aprovação. Sem fotografias internas.'
                        : 'Tudo do cliente + fotografias originais, leituras OCR com confiança, texto original, notas e histórico completo.'}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" icon={previewLoading === kind ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />} onClick={() => openPreview(kind)} disabled={!!previewLoading}>
                        Visualizar
                      </Button>
                      <Button size="sm" variant="primary" icon={<Download size={14} />} onClick={() => docs.download(kind).then(() => toast('PDF baixado.')).catch((e) => toast(e.message ?? 'Falha ao baixar.', 'error'))}>
                        Baixar PDF
                      </Button>
                      {kind === 'cliente' && report.status === 'arquivado' && !report.enviadoCliente && isReviewer && (
                        <Button size="sm" variant="success" icon={<Send size={14} />} onClick={() => { markClientSent(report.id, user.nome); toast('Envio ao cliente registrado (SIMULAÇÃO — nenhum e-mail real disparado).', 'info'); }}>
                          Enviar ao cliente
                        </Button>
                      )}
                    </div>
                    {kind === 'cliente' && report.enviadoCliente && (
                      <p className="mt-3 text-[12px] text-success font-semibold flex items-center gap-1.5"><Check size={13} aria-hidden /> Enviado (simulação) — registrado na auditoria</p>
                    )}
                  </div>
                ))}
              </div>

              {report.documentos.length > 0 ? (
                <div className="card p-5">
                  <h2 className="section-title mb-3">Versões arquivadas</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px]">
                      <thead className="bg-muted/50 border-b border-border">
                        <tr><th className="th">Documento</th><th className="th">Versão</th><th className="th">Gerado em</th><th className="th">Por</th><th className="th">Envio ao cliente</th></tr>
                      </thead>
                      <tbody className="divide-y divide-border/70">
                        {[...report.documentos].reverse().map((d) => (
                          <tr key={d.id}>
                            <td className="td"><Badge tone={d.tipo === 'cliente' ? 'blue' : 'slate'}>{d.tipo}</Badge></td>
                            <td className="td mono">v{d.versao}</td>
                            <td className="td">{fmtDateTime(d.geradoEm)}</td>
                            <td className="td">{d.geradoPor}</td>
                            <td className="td">{d.tipo === 'cliente' ? (d.enviadoEm ? `${fmtDateTime(d.enviadoEm)} (simulado)` : 'não enviado') : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-3 text-[12px] text-subtle">Os PDFs são regerados sob demanda a partir dos dados versionados; os metadados de geração ficam persistidos.</p>
                </div>
              ) : (
                <Banner tone="info">Relatório aprovado, mas os documentos ainda não foram gerados. Use o botão <strong>“Gerar os 2 PDFs”</strong> no topo da página.</Banner>
              )}
            </>
          )}
        </div>
      )}

      {/* ── HISTÓRICO ── */}
      {tab === 'historico' && (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="card p-5">
            <h2 className="section-title mb-4">Trilha de auditoria</h2>
            <Timeline events={report.historico} />
          </div>
          <div className="card p-5">
            <h2 className="section-title mb-4">Quem fez o quê</h2>
            <p className="text-[13px] text-subtle mb-4">Cada evento registra autor, data/hora e detalhe. Originais (texto e fotos) nunca são sobrescritos silenciosamente.</p>
            <div className="space-y-2">
              {Array.from(new Set(report.historico.map((h) => h.ator))).map((ator) => (
                <div key={ator} className="flex items-center justify-between rounded-lg border border-border px-3.5 py-2.5">
                  <div className="flex items-center gap-2.5"><Avatar nome={ator} size="sm" /><span className="text-[13.5px] font-semibold">{ator}</span></div>
                  <span className="text-[12.5px] text-subtle tabular-nums">{report.historico.filter((h) => h.ator === ator).length} evento(s)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal aprovação */}
      <Modal open={approveOpen} onClose={() => setApproveOpen(false)} title="Confirmar aprovação humana"
        footer={<>
          <Button variant="ghost" onClick={() => setApproveOpen(false)}>Cancelar</Button>
          <Button variant="success" icon={<Check size={15} />} onClick={doApprove}>Confirmar aprovação</Button>
        </>}>
        <p className="text-[13.5px] text-secondary">
          Ao aprovar, você declara que conferiu as informações, as fotografias e os números de equipamentos.
          A aprovação libera a geração do documento destinado ao cliente e fica registrada com seu nome.
        </p>
        {reviewNote.trim() && <div className="mt-3 rounded-lg bg-muted/60 p-3 text-[13px] text-secondary"><strong>Observação:</strong> {reviewNote}</div>}
      </Modal>

      {/* Modal correção */}
      <Modal open={correctionOpen} onClose={() => setCorrectionOpen(false)} title="Solicitar correções ao colaborador"
        footer={<>
          <Button variant="ghost" onClick={() => setCorrectionOpen(false)}>Cancelar</Button>
          <Button variant="danger" icon={<AlertTriangle size={15} />} onClick={doCorrection}>Solicitar correção</Button>
        </>}>
        <label className="label" htmlFor="corr-text">O que precisa ser corrigido ou complementado?</label>
        <Textarea id="corr-text" value={correctionText} onChange={(e) => setCorrectionText(e.target.value)} placeholder="Ex.: informar o código do equipamento, detalhar os testes, anexar foto da etiqueta…" />
        <p className="mt-2 text-[12px] text-subtle">O colaborador recebe uma notificação (simulada) e o relatório volta para o status “Correção solicitada”.</p>
      </Modal>

      {/* Preview PDF */}
      {preview && (
        <Modal open onClose={() => { URL.revokeObjectURL(preview.url); setPreview(null); }} title={`Pré-visualização — ${preview.kind === 'cliente' ? 'Cliente' : 'Interno'}`} wide
          footer={<>
            <Button variant="outline" icon={<Download size={15} />} onClick={() => docs.download(preview.kind)}>Baixar PDF</Button>
            <Button variant="ghost" onClick={() => { URL.revokeObjectURL(preview.url); setPreview(null); }}>Fechar</Button>
          </>}>
          <iframe src={preview.url} title="Pré-visualização do PDF" className="w-full h-[65vh] rounded-lg border border-border bg-muted" />
        </Modal>
      )}
    </div>
  );
}
