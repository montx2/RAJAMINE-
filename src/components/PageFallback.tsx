/** Esqueleto mostrado enquanto o código de uma página é baixado sob demanda. */
export default function PageFallback() {
  return (
    <div role="status" aria-live="polite" className="space-y-4">
      <span className="sr-only">Carregando página</span>
      <div className="skeleton h-9 w-56 rounded-xl" />
      <div className="skeleton h-28 rounded-2xl" />
      <div className="skeleton h-64 rounded-2xl" />
    </div>
  );
}
