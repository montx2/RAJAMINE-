import { useRef, useState } from 'react';
import { Upload, Camera, ScanLine, Trash2, FlaskConical, ImagePlus, Loader2, ShieldCheck } from 'lucide-react';
import type { Photo, Report } from '../data/types';
import { useStore } from '../store/useStore';
import { savePhotoBytes, validateImageFile } from '../store/photos';
import { runOcr, demoOcrResult, generateSyntheticPhoto, newDetectionId, type OcrProgress } from '../services/ocr';
import { uid } from '../lib/id';
import { Button, Badge, Banner, Select, Input, toast, Modal } from './ui';
import PhotoImg from './PhotoImg';
import DetectionCard from './DetectionCard';

const DEMO_PHOTOS: Array<{ src: string; legenda: string; categoria: Photo['categoria'] }> = [
  { src: '/demo/foto-eq2041.jpg', legenda: 'Telemetria no painel — etiqueta EQ-2041 (nítida)', categoria: 'equipamento' },
  { src: '/demo/foto-eq1087.jpg', legenda: 'Rastreador no chassi — etiqueta EQ-1087 (poeira leve)', categoria: 'equipamento' },
  { src: '/demo/foto-eq3315.jpg', legenda: 'Sensor de fadiga — etiqueta EQ-3315 (suja, com reflexo)', categoria: 'equipamento' },
  { src: '/demo/foto-atividade.jpg', legenda: 'Registro da instalação em campo (atividade)', categoria: 'atividade' },
];

export default function PhotosOcrPanel({ report, actorName, canUpload, canValidate }: {
  report: Report; actorName: string; canUpload: boolean; canValidate: boolean;
}) {
  const addPhoto = useStore((s) => s.addPhoto);
  const removePhoto = useStore((s) => s.removePhoto);
  const addDetection = useStore((s) => s.addDetection);
  const equipment = useStore((s) => s.equipment);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<Record<string, OcrProgress | null>>({});
  const [demoPick, setDemoPick] = useState(DEMO_PHOTOS[0].src);
  const [synthOpen, setSynthOpen] = useState(false);
  const [synthCode, setSynthCode] = useState('CP-101');
  const [synthSerial, setSynthSerial] = useState('0987');
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = async (files: FileList | File[]) => {
    for (const file of Array.from(files)) {
      const v = await validateImageFile(file);
      if (!v.ok) { toast(`${file.name}: ${v.erro}`, 'error'); continue; }
      const id = uid('ph');
      const key = `photo_${id}`;
      await savePhotoBytes(key, file);
      const photo: Photo = {
        id, nome: file.name, origem: 'upload', storageKey: key, mime: v.mime!,
        legenda: `Upload do colaborador — ${file.name}`, categoria: 'equipamento', criadaEm: new Date().toISOString(),
      };
      addPhoto(report.id, photo, actorName);
      toast(`Foto "${file.name}" anexada.`);
    }
  };

  const addDemo = () => {
    const d = DEMO_PHOTOS.find((x) => x.src === demoPick)!;
    const photo: Photo = {
      id: uid('ph'), nome: d.src.split('/').pop()!, origem: 'demo', src: d.src, mime: 'image/jpeg',
      legenda: `${d.legenda} [imagem demonstrativa]`, categoria: d.categoria, criadaEm: new Date().toISOString(),
    };
    addPhoto(report.id, photo, actorName);
    toast('Foto demonstrativa anexada.');
  };

  const addSynthetic = async () => {
    const code = synthCode.toUpperCase().trim();
    if (!/^(EQ-\d{3,6}|[A-Z]{2,4}-[A-Z0-9]{2,6})$/i.test(code)) { toast('Use um código real, ex.: CP-101, TYE-9A00 ou EQ-2041.', 'error'); return; }
    const dataUrl = await generateSyntheticPhoto(code, synthSerial || '00000');
    const blob = await (await fetch(dataUrl)).blob();
    const id = uid('ph');
    const key = `photo_${id}`;
    await savePhotoBytes(key, blob);
    addPhoto(report.id, {
      id, nome: `sintetica-${code}.jpg`, origem: 'upload', storageKey: key, mime: 'image/jpeg',
      legenda: `Imagem SINTÉTICA de teste — etiqueta ${code}`, categoria: 'equipamento', criadaEm: new Date().toISOString(),
    }, actorName);
    setSynthOpen(false);
    toast('Foto sintética gerada. Execute o OCR para reconhecer a etiqueta.');
  };

  const execOcr = async (photo: Photo, fallbackDemo = false) => {
    setBusy((b) => ({ ...b, [photo.id]: { status: 'iniciando', progress: 0 } }));
    try {
      let result;
      if (fallbackDemo) {
        await new Promise((r) => setTimeout(r, 900));
        result = demoOcrResult(photo.src ?? photo.nome);
      } else {
        const url = photo.origem === 'demo' ? photo.src! : await (async () => {
          const { resolvePhotoUrl } = await import('../store/photos');
          return (await resolvePhotoUrl(photo))!;
        })();
        result = await runOcr(url, (p) => setBusy((b) => ({ ...b, [photo.id]: p })));
      }
      addDetection(report.id, {
        id: newDetectionId(), photoId: photo.id, motor: fallbackDemo ? 'demo' : 'tesseract-local',
        status: 'aguardando', candidatos: result.candidatos, textoBruto: result.textoBruto,
        confianca: result.confianca, criadoEm: new Date().toISOString(),
      }, actorName);
      toast(fallbackDemo
        ? 'Resultado SIMULADO gerado (demonstração). Confirmação humana continua obrigatória.'
        : `OCR concluído em ${(result.duracaoMs / 1000).toFixed(1)} s — ${result.candidatos.length} candidato(s). Confira antes de confirmar.`,
        'info');
    } catch (err) {
      console.error(err);
      toast('OCR real indisponível neste dispositivo. Você pode usar o resultado simulado (rotulado) para demonstrar o fluxo.', 'error');
    } finally {
      setBusy((b) => ({ ...b, [photo.id]: null }));
    }
  };

  const doRemove = (photoId: string) => {
    const res = removePhoto(report.id, photoId, actorName);
    if (!res.ok) toast(res.erro ?? 'Não foi possível remover.', 'error');
    else toast('Foto removida (antes do envio para revisão).', 'info');
  };

  return (
    <div className="space-y-4">
      <Banner tone="info" icon={<ShieldCheck size={17} />}>
        <strong>OCR real, processado localmente.</strong> As imagens são analisadas no próprio navegador (Tesseract WASM) — nenhuma foto é enviada a servidores.
        Resultados são <strong>sugestões</strong>: a associação ao equipamento/caminhão só acontece após confirmação humana.
      </Banner>

      {canUpload && (
        <div className="card p-4 space-y-3">
          <div
            className={`rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors ${dragOver ? 'border-accent bg-accent-soft/40' : 'border-border'}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
          >
            <Upload size={22} className="mx-auto text-subtle mb-2" aria-hidden />
            <p className="text-[13.5px] font-semibold text-secondary">Arraste fotos aqui ou</p>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              <Button size="sm" variant="outline" icon={<ImagePlus size={15} />} onClick={() => fileRef.current?.click()}>
                Selecionar arquivos
              </Button>
              <Button size="sm" variant="ghost" icon={<FlaskConical size={15} />} onClick={() => setSynthOpen(true)}>
                Gerar foto sintética de teste
              </Button>
            </div>
            <p className="mt-2 text-[11.5px] text-subtle">JPEG, PNG ou WebP · até 8 MB · validação de tipo e conteúdo</p>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" aria-label="Enviar fotografias"
              onChange={(e) => { if (e.target.files?.length) handleFiles(e.target.files); e.target.value = ''; }} />
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex-1 min-w-[220px]">
              <label className="label" htmlFor="demo-photo">Adicionar foto de exemplo (demonstrativa)</label>
              <Select id="demo-photo" value={demoPick} onChange={(e) => setDemoPick(e.target.value)}>
                {DEMO_PHOTOS.map((d) => <option key={d.src} value={d.src}>{d.legenda}</option>)}
              </Select>
            </div>
            <Button variant="outline" icon={<Camera size={16} />} onClick={addDemo}>Anexar exemplo</Button>
          </div>
        </div>
      )}

      {report.fotos.length === 0 && (
        <div className="card p-8 text-center text-[13.5px] text-subtle">
          Nenhuma fotografia anexada ainda. As fotos dos equipamentos permitem identificar os números automaticamente.
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {report.fotos.map((photo) => {
          const det = report.deteccoes.find((d) => d.photoId === photo.id);
          const b = busy[photo.id];
          return (
            <div key={photo.id} className="card overflow-hidden flex flex-col">
              <div className="relative">
                <PhotoImg photo={photo} className="w-full h-48" />
                <div className="absolute top-2 left-2 flex gap-1.5">
                  <Badge tone={photo.categoria === 'equipamento' ? 'blue' : 'teal'}>{photo.categoria}</Badge>
                  {photo.origem === 'demo' && <Badge tone="violet">demo</Badge>}
                </div>
                {b && (
                  <div className="absolute inset-0 bg-primary/70 flex flex-col items-center justify-center gap-2 text-white">
                    <Loader2 size={22} className="animate-spin" aria-hidden />
                    <span className="text-[12.5px] font-semibold">{b.status === 'recognizing text' ? 'Reconhecendo texto…' : 'Preparando OCR…'}</span>
                    <div className="w-40 h-1.5 rounded-full bg-white/20 overflow-hidden">
                      <div className="h-full bg-brand rounded-full transition-all" style={{ width: `${Math.round((b.progress ?? 0) * 100)}%` }} />
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4 space-y-3 flex-1 flex flex-col">
                <p className="text-[13px] text-secondary flex-1">{photo.legenda}</p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="accent" icon={<ScanLine size={14} />} loading={!!b} onClick={() => execOcr(photo)} disabled={!canValidate && !canUpload}>
                    {det ? 'Reexecutar OCR' : 'Executar OCR'}
                  </Button>
                  <Button size="sm" variant="ghost" icon={<FlaskConical size={14} />} onClick={() => execOcr(photo, true)} disabled={(!canValidate && !canUpload) || !!b} title="Resultado simulado, claramente rotulado">
                    Simular leitura
                  </Button>
                  {canUpload && (
                    <Button size="sm" variant="ghost" icon={<Trash2 size={14} />} onClick={() => doRemove(photo.id)} aria-label={`Remover ${photo.nome}`}>
                      Remover
                    </Button>
                  )}
                </div>
                {det && <DetectionCard report={report} detection={det} actorName={actorName} canValidate={canValidate || canUpload} />}
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={synthOpen} onClose={() => setSynthOpen(false)} title="Gerar foto sintética de teste"
        footer={<>
          <Button variant="ghost" onClick={() => setSynthOpen(false)}>Cancelar</Button>
          <Button variant="accent" icon={<FlaskConical size={15} />} onClick={addSynthetic}>Gerar e anexar</Button>
        </>}>
        <p className="text-[13.5px] text-subtle mb-4">
          Cria uma imagem de etiqueta gerada por canvas (identificada como sintética) para demonstrar o OCR real de ponta a ponta.
          Use um código cadastrado para ver a associação sugerida, ou um código novo para ver o cadastro na confirmação.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="synth-code">Código na etiqueta</label>
            <Input id="synth-code" value={synthCode} onChange={(e) => setSynthCode(e.target.value)} placeholder="CP-101 / EQ-2988" />
          </div>
          <div>
            <label className="label" htmlFor="synth-serial">Nº de série</label>
            <Input id="synth-serial" value={synthSerial} onChange={(e) => setSynthSerial(e.target.value)} placeholder="33078" />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {[...equipment].sort((a, b) => (a.origemDados === 'referencia_empresa' ? -1 : 1) - (b.origemDados === 'referencia_empresa' ? -1 : 1)).slice(0, 6).map((e) => (
            <button key={e.id} className="rounded-full border border-border px-2.5 py-1 text-[12px] mono hover:border-accent hover:text-accent cursor-pointer"
              onClick={() => { setSynthCode(e.codigo); setSynthSerial(e.serial); }}>
              {e.codigo}
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
