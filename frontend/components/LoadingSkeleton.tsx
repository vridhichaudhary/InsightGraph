export default function LoadingSkeleton() {
  return (
    <div className="w-full space-y-4 animate-pulse" role="status" aria-label="Loading insights">
      {/* Chart title skeleton */}
      <div className="h-5 w-64 bg-slate-700/60 rounded-lg" />

      {/* Chart area skeleton */}
      <div className="relative w-full h-80 rounded-2xl bg-slate-800/50 border border-slate-700/40 overflow-hidden p-6">
        {/* Shimmer overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-700/20 to-transparent animate-[shimmer_1.5s_infinite] bg-[length:200%_100%]" />

        {/* Fake bars */}
        <div className="flex items-end justify-around h-full gap-4 pt-4">
          {[65, 80, 45, 90, 55, 70].map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div
                className="w-full rounded-t-lg bg-slate-700/70"
                style={{ height: `${h}%` }}
              />
              <div className="h-2 w-10 bg-slate-700/50 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Legend skeleton */}
      <div className="flex gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-slate-700/60" />
            <div className="h-3 w-20 bg-slate-700/50 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
