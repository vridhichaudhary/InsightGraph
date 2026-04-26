"use client";

import { useState, useRef } from "react";

interface Props {
  onSubmit: (query: string) => void;
  loading: boolean;
}

const EXAMPLES = [
  "Compare Llama 3 vs GPT-4o on coding benchmarks",
  "Python vs JavaScript GitHub stars 2019–2024",
  "React vs Vue vs Svelte adoption trend",
  "Top AI frameworks by developer usage",
];

export default function QueryInput({ onSubmit, loading }: Props) {
  const [query, setQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle");
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !loading) onSubmit(query.trim());
  };

  const handleExample = (ex: string) => {
    setQuery(ex);
    inputRef.current?.focus();
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadStatus("idle");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://insightgraph-0lvs.onrender.com";
      const res = await fetch(`${apiUrl}/upload`, { method: "POST", body: formData });
      setUploadStatus(res.ok ? "success" : "error");
      setTimeout(() => setUploadStatus("idle"), 3000);
    } catch {
      setUploadStatus("error");
      setTimeout(() => setUploadStatus("idle"), 3000);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="flex items-center gap-3">

        {/* Upload button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading || uploading}
          title="Upload document (.txt, .pdf, .csv, .md)"
          className="flex-shrink-0 w-10 h-10 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.14] transition-all flex items-center justify-center text-slate-400 hover:text-slate-200 disabled:opacity-40"
        >
          {uploading ? (
            <span className="w-4 h-4 border-2 border-slate-600 border-t-cyan-400 rounded-full animate-spin" />
          ) : uploadStatus === "success" ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          ) : uploadStatus === "error" ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
          )}
        </button>
        <input ref={fileInputRef} type="file" className="hidden" accept=".txt,.md,.csv,.pdf" onChange={handleUpload} />

        {/* Text input */}
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a technical question to compare, analyze, or visualize..."
            disabled={loading}
            className="w-full h-10 px-4 rounded-xl text-sm bg-white/[0.04] border border-white/[0.08] text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 hover:border-white/[0.12] transition-all disabled:opacity-50 font-[var(--font-geist)]"
          />
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="flex-shrink-0 flex items-center gap-2 px-4 h-10 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white text-xs font-semibold hover:from-cyan-400 hover:to-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 hover:-translate-y-px active:translate-y-0 whitespace-nowrap"
        >
          {loading ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span className="hidden sm:inline">Analyzing…</span>
            </>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              <span className="hidden sm:inline">Generate</span>
            </>
          )}
        </button>
      </form>

      {/* Example chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] text-slate-600 font-mono flex-shrink-0">try →</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            onClick={() => handleExample(ex)}
            disabled={loading}
            className="text-[10px] px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/[0.06] text-slate-500 hover:text-slate-300 hover:border-white/[0.1] hover:bg-white/[0.05] transition-all disabled:opacity-40"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}
