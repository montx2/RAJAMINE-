import { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';
import type { Photo } from '../data/types';
import { resolvePhotoUrl } from '../store/photos';
import { cn } from '../lib/cn';
import { demoThumb } from '../lib/demoThumb';

/** `thumb`: usar a miniatura leve quando a imagem aparece pequena (listas, grades). */
export default function PhotoImg({ photo, className, alt, thumb }: { photo: Photo; className?: string; alt?: string; thumb?: boolean }) {
  const demoSrc = photo.origem === 'demo' && photo.src ? (thumb ? demoThumb(photo.src) : photo.src) : null;
  const [url, setUrl] = useState<string | null>(demoSrc);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    setFailed(false);
    setUrl(demoSrc);
    if (demoSrc) return () => { alive = false; };
    resolvePhotoUrl(photo).then((u) => {
      if (!alive) return;
      if (u) setUrl(u);
      else setFailed(true);
    }).catch(() => alive && setFailed(true));
    return () => { alive = false; };
  }, [photo, demoSrc]);

  if (failed) {
    return (
      <div className={cn('flex items-center justify-center bg-muted text-subtle', className)}>
        <ImageOff size={22} aria-label="Imagem indisponível" />
      </div>
    );
  }
  if (!url) return <div className={cn('animate-pulse bg-muted', className)} aria-hidden />;
  return <img src={url} alt={alt ?? photo.legenda ?? photo.nome} loading="lazy" decoding="async" onError={() => setFailed(true)} className={cn('object-cover', className)} />;
}
