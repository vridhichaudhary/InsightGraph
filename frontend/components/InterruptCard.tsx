"use client";

interface Props {
  onResume: () => void;
  query: string;
}

export default function InterruptCard({ onResume, query }: Props) {
  return (
    <div className="w-full max-w-md animate-fade-up">
      <div className="glass rounded-2xl p-8 border border-amber-500/20 shadow-xl shadow-amber-500/[0.05]">

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            {/* Pulse ring */}
            <div className="absolute inset-0 rounded-2xl border border-amber-500/20 animate-ping" style={{ animationDuration: "2s" }} />
          </div>
        </div>

        <div className="text-center space-y-2 mb-6">
          <p className="text-[10px] font-mono text-amber-500/70 uppercase tracking-widest">Human-in-the-Loop</p>
          <h2 className="text-xl font-bold text-slate-100">Awaiting Approval</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            The Analyst has processed the raw data for:
          </p>
          <p className="text-xs text-slate-400 font-mono bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 line-clamp-2">
            &ldquo;{query}&rdquo;
          </p>
          <p className="text-xs text-slate-500">
            Approve to route to the Visualizer and generate your chart.
          </p>
        </div>

        {/* Agent flow preview */}
        <div className="flex items-center justify-center gap-2 mb-6 text-[10px] font-mono">
          {[
            { label: "ANA", color: "#FB923C", done: true },
            { label: "→", color: "#334155", done: false },
            { label: "VIZ", color: "#22D3EE", done: false },
          ].map((item, i) => (
            <span
              key={i}
              className="font-bold"
              style={{ color: item.done ? item.color : item.label === "→" ? "#334155" : "#334155" }}
            >
              {item.label}
            </span>
          ))}
        </div>

        <button
          onClick={onResume}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-900 text-sm font-bold hover:from-amber-400 hover:to-orange-400 transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 hover:-translate-y-px active:translate-y-0"
        >
          Approve &amp; Visualize →
        </button>
      </div>
    </div>
  );
}
