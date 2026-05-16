/**
 * Shown immediately on first navigation while the client bundle hydrates.
 * Keeps the UI from flashing a blank white screen on slow connections.
 */
export default function Loading() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b border-ink animate-pulse">
        <div className="mx-auto max-w-[1240px] px-6 md:px-10 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-ink/30" />
            <div className="h-4 w-24 bg-ink/10" />
            <div className="h-3 w-8 bg-ink/10" />
          </div>
          <div className="hidden md:block h-3 w-48 bg-ink/10" />
        </div>
      </header>
      <div className="mx-auto max-w-[1240px] px-6 md:px-10 py-12">
        <div className="h-3 w-64 max-w-full bg-ink/10 mb-4" />
        <div className="h-10 w-full max-w-xl bg-ink/10 mb-3" />
        <div className="h-10 w-full max-w-lg bg-ink/10 mb-8" />
        <div className="space-y-2 max-w-2xl mb-10">
          <div className="h-4 w-full bg-ink/10" />
          <div className="h-4 w-[88%] bg-ink/10" />
        </div>
        <div className="border border-ink">
          <div className="h-12 border-b border-ink bg-wash/50" />
          <div className="p-6 space-y-6">
            <div className="h-12 w-full bg-ink/5" />
            <div className="h-12 w-full bg-ink/5" />
            <div className="h-12 w-full bg-ink/5" />
            <div className="h-12 w-full max-w-xs bg-ink" />
          </div>
        </div>
      </div>
    </div>
  );
}
