import type { Report } from '../data/types';
import { useStore } from '../store/useStore';
import { buildReportPdf, downloadBytes, pdfBlobUrl, type DocKind, type ResolvedPhoto } from '../services/pdf';
import { resolvePhotoBytes } from '../store/photos';

export function useDocBuilder(report: Report) {
  const users = useStore((s) => s.users);
  const clients = useStore((s) => s.clients);
  const trucks = useStore((s) => s.trucks);
  const equipment = useStore((s) => s.equipment);

  const refs = {
    colaborador: users.find((u) => u.id === report.colaboradorId),
    cliente: clients.find((c) => c.id === report.clienteId),
    caminhao: trucks.find((t) => t.id === report.caminhaoId),
    equipamentos: equipment,
  };

  const build = async (kind: DocKind): Promise<Uint8Array> => {
    const photos: ResolvedPhoto[] = kind === 'interno'
      ? await Promise.all(report.fotos.map(async (photo) => ({ photo, bytes: await resolvePhotoBytes(photo) })))
      : [];
    return buildReportPdf(report, refs, kind, photos);
  };

  const filename = (kind: DocKind) =>
    `${report.codigo}_${kind === 'cliente' ? 'CLIENTE' : 'INTERNO'}.pdf`;

  const download = async (kind: DocKind) => {
    const bytes = await build(kind);
    downloadBytes(bytes, filename(kind));
  };

  const previewUrl = async (kind: DocKind): Promise<string> => {
    const bytes = await build(kind);
    return pdfBlobUrl(bytes);
  };

  return { build, download, previewUrl, filename };
}
