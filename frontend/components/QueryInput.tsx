"use client";

import { useState, useRef } from "react";

interface Props {
  onSubmit: (query: string) => void;
  loading: boolean;
}

const EXAMPLE_QUERIES = [
  "Compare Llama 3 vs GPT-4o benchmarks",
  "Python vs JavaScript GitHub stars growth 2019–2024",
  "React vs Vue vs Svelte popularity trend",
  "Top AI frameworks by adoption rate",
];

export default function QueryInput({ onSubmit, loading }: Props) {
  const [query, setQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !loading) onSubmit(query.trim());
  };

  const handleExample = (example: string) => {
    setQuery(example);
    inputRef.current?.focus();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/upload`, {
        method: "POST",
        body: formData,
      });
      
      if (response.ok) {
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setUploading(false);
      // Reset input so the same file can be uploaded again if needed
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full space-y-4">
      <form onSubmit={handleSubmit} className="relative flex gap-3 items-center">
        {/* Glow behind input */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/10 via-indigo-500/10 to-cyan-500/10 blur-xl pointer-events-none" />

        <div className="relative flex-1 group">
          {/* Left icon (Attachment) */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading || uploading}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-400 transition-colors duration-200 z-10 p-1 rounded-full hover:bg-slate-700/50 focus:outline-none"
            title="Upload Document"
          >
            {uploading ? (
              <span className="w-4 h-4 border-2 border-slate-500 border-t-cyan-400 rounded-full animate-spin block" />
            ) : uploadSuccess ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            )}
          </button>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            accept=".txt,.md,.csv,.pdf" 
          />

          <input
            ref={inputRef}
            id="query-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={uploading ? "Uploading document..." : "Ask a technical question..."}
            disabled={loading || uploading}
            className="
              w-full pl-12 pr-4 py-4 rounded-2xl text-sm
              bg-slate-800/60 border border-slate-700/60
              text-slate-100 placeholder-slate-500
              focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50
              hover:border-slate-600
              transition-all duration-200 backdrop-blur-sm
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          />
        </div>

        <button
          id="generate-btn"
          type="submit"
          disabled={loading || !query.trim()}
          className="
            relative flex items-center gap-2 px-6 py-4 rounded-2xl
            bg-gradient-to-r from-cyan-500 to-indigo-500
            text-white text-sm font-semibold
            hover:from-cyan-400 hover:to-indigo-400
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-all duration-200 shadow-lg shadow-cyan-500/20
            hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98]
            whitespace-nowrap overflow-hidden
          "
        >
          {/* Shimmer on hover */}
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-700" />

          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Analyzing…
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              Generate Insights
            </>
          )}
        </button>
      </form>

      {/* Example chips */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-slate-500 self-center">Try:</span>
        {EXAMPLE_QUERIES.map((ex) => (
          <button
            key={ex}
            onClick={() => handleExample(ex)}
            disabled={loading}
            className="
              text-xs px-3 py-1.5 rounded-full
              bg-slate-800/50 border border-slate-700/50
              text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40
              transition-all duration-150 disabled:opacity-40
            "
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}
