import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Camera, Send, Info, AlignLeft, ImagePlus, Trash2 } from 'lucide-react';
import { useStore, useCurrentUser } from '../../store/useStore';
import { Badge, Banner, Button, Field, Select, Textarea, toast } from '../../components/ui';
import PhotoImg from '../../components/PhotoImg';
import { savePhotoBytes, validateImageFile } from '../../store/photos';
import { uid } from '../../lib/id';
import { DEMO_PHOTOS } from '../../data/demoPhotos';
import { OCCURRENCE_CATEGORY_LABEL, OCCURRENCE_SEVERITY_LABEL, occurrenceTemplate, suggestSeverity } from '../../lib/driver';
import type { DriverOccurrenceCategory, DriverOccurrenceSeverity, Photo } from '../../data/types';

export default function DriverOccurrenceNew() {
  const user = useCurrentUser()!;
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const trucks = useStore((s) => s.trucks);
  const equipment = useStore((s) => s.equipment);
  const create = useStore((s) => s.createDriverOccurrence);
  const sync = useStore((s) => s.syncDriverQueue);
  const fileRef = useRef<HTMLInputElement>(null);

  const myTrucks = trucks.filter((t) => user.truckIds?.includes(t.id));
  const [caminhaoId, setCaminhaoId] = useState(params.get('truck') && myTrucks.some((t) => t.id === params.get('truck')) ? params.get('truck')! : myTrucks[0]?.id ?? '');
  const [equipmentId, setEquipmentId] = useState(params.get('equipment') ?? '');
  const [categoria, setCategoria] = useState<DriverOccurrenceCategory>((params.get('categoria') as DriverOccurrenceCategory) || 'camera_obstruida');
  const [severidade, setSeveridade] = useState<DriverOccurrenceSeverity>('alta');
  const [descricao, setDescricao] = useState('');
  const [fotos, setFotos] = useState<Photo[]>([]);
  const [saving, setSaving] = useState(false);
  const [autoDesc, setAutoDesc] = useState(true);

  const truck = trucks.find((t) => t.id === caminhaoId);
  const eqs = useMemo(() => equipment.filter((e) => e.truckId === caminhaoId && e.status === 'instalado'), [equipment, caminhaoId]);

  // Automação: sugestão de severidade e descrição padrão ao trocar categoria/caminhão.
  const applyTemplate = (cat = categoria, tid = caminhaoId) => {
    const t = trucks.find((x) => x.id === tid);
    setDescricao(occurrenceTemplate(cat, t));
    setSeveridade(suggestSeverity(cat, 'falha'));
    setAutoDesc(true);
  };

  const handleFiles = async (files: FileList | File[]) => {
    for (const file of Array.from(files)) {
      const v = await validateImageFile(file);
      if (!v.ok) { toast(`${file.name}: ${v.erro}`, 'error'); continue; }
      const id = uid('ph');
      const key = `photo_${id}`;
      await savePhotoBytes(key, file);
      setFotos((f) => [...f, { id, nome: file.name, origem: 'upload', storageKey: key, mime: v.mime!, legenda: `Foto da ocorrência — ${file.name}`, categoria: 'atividade', criadaEm: new Date().toISOString() }]);
    }
  };

  const addDemo = (src: string) => {
    const d = DEMO_PHOTOS.find((x) => x.src === src);
    if (!d) return;
    if (fotos.some((f) => f.src === src)) { toast('Esta imagem já foi anexada.', 'info'); return; }
    setFotos((f) => [...f, { id: uid('ph'), nome: src.split('/').pop()!, origem: 'demo', src, mime: 'image/jpeg', legenda: `${d.legenda} [imagem demonstrativa]`, categoria: d.categoria, criadaEm: new Date().toISOString() }]);
  };

  const submit = () => {
    setSaving(true);
    const res = create({
      motoristaId: user.id, caminhaoId, equipmentId: equipmentId || undefined,
      categoria, severidade, descricao, fotos,
    }, user.nome);
    setSaving(false);
    if (!res.ok) { toast(res.erro ?? 'Não foi possível registrar.', 'error'); return; }
    if (navigator.onLine) sync();
    toast('Ocorrência registrada. Coordenação/revisão notificadas (simulação).');
    navigate('/motorista/ocorrencias');
  };

  return (
    <div className="space-y-4">
      <Link to="/motorista/ocorrencias" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-subtle hover:text-accent">
        <ArrowLeft size={15} aria-hidden /> Voltar
      </Link>
      <div>
        <div className="eyebrow mb-1">Nova ocorrência</div>
        <h1 className="text-[20px] font-semibold text-primary">Reportar problema</h1>
        <p className="text-[12.5px] text-subtle mt-1">O motorista reporta; a coordenação decide. Não faça intervenção técnica por conta própria.</p>
      </div>

      <Banner tone="info" icon={<Info size={16} />}>
        Preenchimento assistido: caminhão vinculado, equipamentos instalados, severidade sugerida e texto padrão.
        Você pode editar tudo antes de enviar. Notificação interna é <strong>simulada</strong>.
      </Banner>

      <div className="card p-4 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Caminhão" htmlFor="oc-truck" required>
            <Select id="oc-truck" value={caminhaoId} onChange={(e) => { setCaminhaoId(e.target.value); setEquipmentId(''); if (autoDesc) applyTemplate(categoria, e.target.value); }}>
              {myTrucks.map((t) => <option key={t.id} value={t.id}>{t.frota} · {t.placa}</option>)}
            </Select>
          </Field>
          <Field label="Equipamento (opcional)" htmlFor="oc-eq" hint="Lista automática dos dispositivos instalados neste caminhão.">
            <Select id="oc-eq" value={equipmentId} onChange={(e) => setEquipmentId(e.target.value)}>
              <option value="">Não sei / não se aplica</option>
              {eqs.map((e) => <option key={e.id} value={e.id}>{e.codigo} · {e.tipo}</option>)}
            </Select>
          </Field>
        </div>

        <Field label="Tipo de ocorrência" htmlFor="oc-cat" required>
          <Select id="oc-cat" value={categoria} onChange={(e) => { const c = e.target.value as DriverOccurrenceCategory; setCategoria(c); if (autoDesc) applyTemplate(c); }}>
            {(Object.keys(OCCURRENCE_CATEGORY_LABEL) as DriverOccurrenceCategory[]).map((c) => <option key={c} value={c}>{OCCURRENCE_CATEGORY_LABEL[c]}</option>)}
          </Select>
        </Field>

        <Field label="Severidade sugerida" htmlFor="oc-sev" hint="Ajuste se necessário. A sugestão é automática, a decisão final é humana.">
          <Select id="oc-sev" value={severidade} onChange={(e) => { setSeveridade(e.target.value as DriverOccurrenceSeverity); setAutoDesc(false); }}>
            {(Object.keys(OCCURRENCE_SEVERITY_LABEL) as DriverOccurrenceSeverity[]).map((s) => <option key={s} value={s}>{OCCURRENCE_SEVERITY_LABEL[s]}</option>)}
          </Select>
        </Field>

        <Field label="Descrição" htmlFor="oc-desc" required hint="Mínimo 10 caracteres. Texto padrão gerado automaticamente — edite à vontade.">
          <Textarea id="oc-desc" value={descricao} onChange={(e) => { setDescricao(e.target.value); setAutoDesc(false); }} placeholder={occurrenceTemplate(categoria, truck)} />
        </Field>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" icon={<AlignLeft size={14} />} onClick={() => applyTemplate()}>Usar texto padrão</Button>
          {equipmentId && <Badge tone="blue">{equipment.find((e) => e.id === equipmentId)?.codigo}</Badge>}
        </div>
      </div>

      <div className="card p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="section-title flex items-center gap-2"><Camera size={16} aria-hidden /> Fotos (opcional)</h2>
          <Button type="button" size="sm" variant="outline" icon={<ImagePlus size={14} />} onClick={() => fileRef.current?.click()}>Enviar foto</Button>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" aria-label="Enviar fotos da ocorrência" onChange={(e) => { if (e.target.files?.length) handleFiles(e.target.files); e.target.value = ''; }} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {DEMO_PHOTOS.slice(0, 8).map((d) => (
            <button key={d.src} type="button" onClick={() => addDemo(d.src)} title={d.legenda} className="press rounded-lg border border-border px-2 py-1 text-xs text-secondary hover:border-accent/50 cursor-pointer">
              + {d.src.replace('/demo/foto-', '').replace('.jpg', '')}
            </button>
          ))}
        </div>
        {fotos.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {fotos.map((f) => (
              <div key={f.id} className="relative">
                <PhotoImg thumb photo={f} className="h-20 w-full rounded-lg" />
                <button type="button" onClick={() => setFotos((x) => x.filter((y) => y.id !== f.id))} className="absolute top-1 right-1 rounded-lg bg-black/60 p-1 text-white cursor-pointer" aria-label={`Remover ${f.nome}`}>
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-subtle">JPEG/PNG/WebP até 8 MB. Imagens demonstrativas são sintéticas.</p>
      </div>

      <Button variant="primary" size="lg" className="w-full" icon={<Send size={17} />} loading={saving} onClick={submit} disabled={!caminhaoId || descricao.trim().length < 10}>
        Registrar ocorrência
      </Button>
    </div>
  );
}
