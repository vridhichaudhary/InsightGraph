"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
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

export default function ChartDisplay({ data, sessionId }: Props) {
  // Transform schema into Recharts format
  const chartData = data.labels.map((label, index) => {
    const row: any = { name: label };
    data.datasets.forEach((ds) => {
      row[ds.name] = ds.data[index];
    });
    return row;
  });

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
    if (score >= 0.5) return "text-amber-400 bg-amber-400/10 border-amber-400/20";
    return "text-rose-400 bg-rose-400/10 border-rose-400/20";
  };

  const handleDownloadCsv = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    window.location.href = `${apiUrl}/download?session_id=${sessionId}`;
  };

  return (
    <div className="space-y-6 w-full max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">{data.title}</h2>
          {data.confidence !== undefined && (
            <div className={`mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-semibold tracking-wide uppercase ${getConfidenceColor(data.confidence)}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current shadow-[0_0_8px_currentColor]" />
              Confidence: {Math.round(data.confidence * 100)}%
            </div>
          )}
        </div>
        
        <button 
          onClick={handleDownloadCsv}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500/50 flex-shrink-0"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export CSV
        </button>
      </div>

      <div className="h-[300px] sm:h-[400px] w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          {data.chartType === "bar" ? (
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0F172A", borderColor: "#334155", borderRadius: "12px", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.5)" }}
                itemStyle={{ color: "#E2E8F0" }}
                cursor={{ fill: "#1E293B", opacity: 0.4 }}
              />
              <Legend wrapperStyle={{ paddingTop: "20px" }} />
              {data.datasets.map((ds) => (
                <Bar key={ds.name} dataKey={ds.name} fill={ds.color} radius={[4, 4, 0, 0]}>
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={ds.color} />
                  ))}
                </Bar>
              ))}
            </BarChart>
          ) : (
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0F172A", borderColor: "#334155", borderRadius: "12px", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.5)" }}
                itemStyle={{ color: "#E2E8F0" }}
              />
              <Legend wrapperStyle={{ paddingTop: "20px" }} />
              {data.datasets.map((ds) => (
                <Line
                  key={ds.name}
                  type="monotone"
                  dataKey={ds.name}
                  stroke={ds.color}
                  strokeWidth={3}
                  dot={{ fill: "#0F172A", stroke: ds.color, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              ))}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Dataset summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {data.datasets.map((ds) => {
          const avg = (ds.data.reduce((a, b) => a + b, 0) / ds.data.length).toFixed(1);
          const max = Math.max(...ds.data).toFixed(1);
          return (
            <div
              key={ds.name}
              className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-3 space-y-1 hover:bg-slate-800/60 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: ds.color }} />
                <span className="text-xs text-slate-400 truncate">{ds.name}</span>
              </div>
              <p className="text-lg font-bold text-slate-100">{max}</p>
              <p className="text-[10px] text-slate-500">Peak · avg {avg}</p>
            </div>
          );
        })}
      </div>

      {/* Sources Panel */}
      {data.sources && data.sources.length > 0 && (
        <div className="pt-2 border-t border-slate-800/60 mt-4">
          <div className="flex items-center gap-2 mb-3">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            <span className="text-xs font-semibold text-slate-400">Sources Cited</span>
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
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border flex items-center gap-1.5 transition-colors ${
                    isUrl 
                      ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/20 hover:bg-indigo-500/20" 
                      : "bg-slate-800/60 text-slate-300 border-slate-700/50 hover:bg-slate-700/60"
                  }`}
                >
                  {isUrl ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  )}
                  {src}
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
