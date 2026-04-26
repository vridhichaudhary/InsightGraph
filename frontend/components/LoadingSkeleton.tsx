export default function LoadingSkeleton() {
  return (
    <div className="w-full h-full flex flex-col gap-5" aria-label="Loading" role="status">

      {/* Title row */}
      <div className="flex items-center justify-between">
        <div className="h-4 w-48 rounded-lg bg-white/[0.05] animate-shimmer" />
        <div className="h-6 w-20 rounded-full bg-white/[0.04] animate-shimmer" />
      </div>

      {/* Fake chart */}
      <div className="relative flex-1 min-h-[280px] rounded-xl border border-white/[0.05] bg-white/[0.02] p-5 overflow-hidden">
        {/* Shimmer overlay */}
        <div className="absolute inset-0 animate-shimmer opacity-50" />

        {/* Grid lines */}
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="absolute left-12 right-4 border-t border-white/[0.04]"
            style={{ top: `${20 + i * 20}%` }}
          />
        ))}

        {/* Y-axis labels */}
        <div className="absolute left-2 top-4 bottom-8 flex flex-col justify-between">
          {[3, 2, 1, 0].map((i) => (
            <div key={i} className="h-2 w-6 rounded bg-white/[0.05]" />
          ))}
        </div>

        {/* Bars */}
        <div className="absolute bottom-8 left-12 right-4 flex items-end justify-around gap-3">
          {[62, 85, 48, 91, 55, 78].map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <div
                className="w-full rounded-t-lg animate-shimmer"
                style={{
                  height: `${h * 1.7}px`,
                  background: `rgba(${i % 2 === 0 ? "34,211,238" : "129,140,248"},0.15)`,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
              <div className="h-1.5 w-full rounded bg-white/[0.04]" />
            </div>
          ))}
        </div>
      </div>

      {/* Stat cards row */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-14 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3 space-y-1.5 animate-shimmer" style={{ animationDelay: `${i * 0.08}s` }}>
            <div className="h-2 w-12 rounded bg-white/[0.06]" />
            <div className="h-4 w-8 rounded bg-white/[0.08]" />
          </div>
        ))}
      </div>

      {/* Agent status row */}
      <div className="flex items-center gap-3">
        {["Supervisor", "Researcher", "Analyst", "Visualizer"].map((name, i) => (
          <div key={name} className="flex items-center gap-1.5 animate-shimmer" style={{ animationDelay: `${i * 0.12}s` }}>
            <span className="w-1.5 h-1.5 rounded-full bg-white/10 animate-pulse" style={{ animationDelay: `${i * 0.3}s` }} />
            <span className="text-[10px] text-slate-700 font-mono">{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
