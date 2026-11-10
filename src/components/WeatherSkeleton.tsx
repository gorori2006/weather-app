// 初回読み込み中に表示する、実際のカードと同じ形の灰色の枠（スケルトン）。
// 動きが苦手な人向けに、OS で「視差効果を減らす」が有効なら点滅させない（motion-safe）。

function Bar({ className = "" }: { className?: string }) {
  return <div className={`rounded-md bg-slate-200 dark:bg-slate-700 ${className}`} />;
}

function Tile() {
  return (
    <div className="rounded-xl bg-sky-50 px-3 py-2 dark:bg-slate-700/50">
      <Bar className="h-3 w-12" />
      <Bar className="mt-2 h-5 w-16" />
    </div>
  );
}

export function WeatherSkeleton() {
  return (
    <div className="flex flex-col gap-5 motion-safe:animate-pulse" aria-hidden>
      {/* 現在の天気 */}
      <section className="card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Bar className="h-6 w-32" />
            <Bar className="mt-2 h-4 w-48" />
          </div>
          <div className="h-[72px] w-[72px] rounded-full bg-slate-200 dark:bg-slate-700" />
        </div>
        <Bar className="mt-3 h-14 w-28" />
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Tile />
          <Tile />
          <Tile />
          <Tile />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        {/* カレンダー */}
        <section className="card">
          <Bar className="mx-auto mb-4 h-5 w-28" />
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }, (_, i) => (
              <div key={i} className="h-12 rounded-lg bg-slate-100 dark:bg-slate-700/60" />
            ))}
          </div>
        </section>

        {/* 日別の予報 */}
        <section className="card">
          <Bar className="h-6 w-52" />
          <Bar className="mt-2 h-4 w-16" />
          <div className="mt-3 h-20 rounded-xl bg-sky-50 dark:bg-slate-700/50" />
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Tile />
            <Tile />
            <Tile />
            <Tile />
          </div>
          <Bar className="mt-5 h-40 w-full" />
          <Bar className="mt-3 h-28 w-full" />
        </section>
      </div>
    </div>
  );
}
