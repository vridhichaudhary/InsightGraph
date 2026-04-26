"use client";

import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell,
} from "recharts";

export interface Dataset {
  name: string;
  data: number[];
  color: string;
}

export interface ChartResponse {
  chartType: "bar" | "line";
  title: string;
  labels: string[];
  datasets: Dataset[];
  sources?: string[];
  confidence?: number;
}

interface Props {
  data: ChartResponse;
  sessionId: string;
}

const tooltipStyle = {
  contentStyle: {
    backgroundColor: "#0F1623",
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: "12px",
    boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
    fontSize: "12px",
    fontFamily: "var(--font-mono)",
  },
  itemStyle: { color: "#CBD5E1" },
  labelStyle: { color: "#94A3B8", fontWeight: 600 },
  cursor: { fill: "rgba(255,255,255,0.03)" },
};

function ConfidenceBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const { label, cls } =
    pct >= 80 ? { label: "High confidence",   cls: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" } :
    pct >= 50 ? { label: "Medium confidence", cls: "text-amber-400  bg-amber-400/10  border-amber-400/20"  } :
                { label: "Low confidence",    cls: "text-red-400    bg-red-400/10    border-red-400/20"    };

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-semibold font-mono uppercase tracking-wide ${cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current shadow-[0_0_6px_currentColor]" />
      {pct}% · {label}
    </div>
  );
}

export default function ChartDisplay({ data, sessionId }: Props) {
  // Transform to Recharts format
  const chartData = data.labels.map((label, i) => {
    const row: Record<string, string | number> = { name: label };
    data.datasets.forEach((ds) => { row[ds.name] = ds.data[i]; });
    return row;
  });

  const handleDownload = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    window.location.href = `${apiUrl}/download?session_id=${sessionId}`;
  };

  return (
    <div className="space-y-5 w-full animate-fade-up">

      {/* ── Header row ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 justify-between">
        <div className="space-y-1.5">
          <h2 className="text-lg font-bold text-slate-100 leading-tight">{data.title}</h2>
          <div className="flex items-center gap-2 flex-wrap">
            {data.confidence !== undefined && <ConfidenceBadge score={data.confidence} />}
            <span className="text-[10px] font-mono text-slate-600 px-2 py-1 rounded-full border border-white/[0.05] bg-white/[0.02]">
              {data.chartType === "bar" ? "bar chart" : "line chart"}
            </span>
          </div>
        </div>

        <button
          onClick={handleDownload}
          className="flex-shrink-0 inline-flex items-center gap-2 px-3 py-2 text-[11px] font-medium rounded-lg border border-white/[0.08] bg-white/[0.03] text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] hover:border-white/[0.12] transition-all"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* ── Chart ─────────────────────────────────────────────── */}
      <div className="h-[300px] sm:h-[360px] w-full rounded-xl border border-white/[0.05] bg-white/[0.01] p-4">
        <ResponsiveContainer width="100%" height="100%">
          {data.chartType === "bar" ? (
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="name" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} fontFamily="var(--font-mono)" />
              <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} fontFamily="var(--font-mono)" />
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ paddingTop: "16px", fontSize: "11px", fontFamily: "var(--font-mono)" }} />
              {data.datasets.map((ds) => (
                <Bar key={ds.name} dataKey={ds.name} fill={ds.color} radius={[4, 4, 0, 0]} maxBarSize={52}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={ds.color} fillOpacity={0.85} />
                  ))}
                </Bar>
              ))}
            </BarChart>
          ) : (
            <LineChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="name" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} fontFamily="var(--font-mono)" />
              <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} fontFamily="var(--font-mono)" />
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ paddingTop: "16px", fontSize: "11px", fontFamily: "var(--font-mono)" }} />
              {data.datasets.map((ds) => (
                <Line
                  key={ds.name}
                  type="monotone"
                  dataKey={ds.name}
                  stroke={ds.color}
                  strokeWidth={2.5}
                  dot={{ fill: "#080C14", stroke: ds.color, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 0, fill: ds.color }}
                />
              ))}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* ── Dataset stat cards ─────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {data.datasets.map((ds) => {
          const avg  = (ds.data.reduce((a, b) => a + b, 0) / ds.data.length).toFixed(1);
          const peak = Math.max(...ds.data).toFixed(1);
          const low  = Math.min(...ds.data).toFixed(1);
          return (
            <div
              key={ds.name}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 space-y-2 hover:bg-white/[0.04] transition-colors"
              style={{ borderLeftColor: ds.color, borderLeftWidth: "2px" }}
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: ds.color }} />
                <span className="text-[10px] text-slate-500 truncate font-mono">{ds.name}</span>
              </div>
              <div>
                <p className="text-xl font-bold text-slate-100 font-mono leading-none">{peak}</p>
                <p className="text-[10px] text-slate-600 mt-1">peak · avg {avg} · low {low}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Sources ────────────────────────────────────────────── */}
      {data.sources && data.sources.length > 0 && (
        <div className="pt-4 border-t border-white/[0.05]">
          <div className="flex items-center gap-2 mb-3">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Sources</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.sources.map((src) => {
              const isUrl = src.startsWith("http");
              return (
                <a
                  key={src}
                  href={isUrl ? src : "#"}
                  target={isUrl ? "_blank" : undefined}
                  rel={isUrl ? "noopener noreferrer" : undefined}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono rounded-lg border transition-colors border-white/[0.06] bg-white/[0.02] text-slate-500 hover:text-slate-300 hover:border-white/[0.1] hover:bg-white/[0.04]"
                >
                  {isUrl ? (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  ) : (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  )}
                  {src.length > 40 ? src.slice(0, 40) + "…" : src}
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
