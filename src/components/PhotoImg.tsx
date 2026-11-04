import { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';
import type { Photo } from '../data/types';
import { resolvePhotoUrl } from '../store/photos';
import { cn } from '../lib/cn';

export default function PhotoImg({ photo, className, alt }: { photo: Photo; className?: string; alt?: string }) {
  const [url, setUrl] = useState<string | null>(photo.origem === 'demo' ? photo.src ?? null : null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    setFailed(false);
    setUrl(photo.origem === 'demo' ? photo.src ?? null : null);
    resolvePhotoUrl(photo).then((u) => {
      if (!alive) return;
      if (u) setUrl(u);
      else setFailed(true);
    }).catch(() => alive && setFailed(true));
    return () => { alive = false; };
  }, [photo]);

  if (failed) {
    return (
      <div className={cn('flex items-center justify-center bg-muted text-subtle', className)}>
        <ImageOff size={22} aria-label="Imagem indisponível" />
      </div>
    );
  }
  if (!url) return <div className={cn('animate-pulse bg-muted', className)} aria-hidden />;
  return <img src={url} alt={alt ?? photo.legenda ?? photo.nome} loading="lazy" onError={() => setFailed(true)} className={cn('object-cover', className)} />;
}
