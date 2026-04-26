"use client";

import { useState, useRef, useEffect } from "react";
import QueryInput from "@/components/QueryInput";
import ChartDisplay, { ChartResponse } from "@/components/ChartDisplay";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import LogSidebar, { LogMessage } from "@/components/LogSidebar";
import LeftSidebar from "@/components/LeftSidebar";
import InterruptCard from "@/components/InterruptCard";
import EmptyState from "@/components/EmptyState";
import { useSavedQueries } from "@/hooks/useSavedQueries";

export type AppState = "idle" | "streaming" | "interrupted" | "success" | "error";

export default function HomePage() {
  const [appState, setAppState] = useState<AppState>("idle");
  const [chartData, setChartData] = useState<ChartResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [lastQuery, setLastQuery] = useState<string>("");
  const [sessionId, setSessionId] = useState<string>("");
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);
  const { queries, saveQuery } = useSavedQueries();

  useEffect(() => {
    return () => { eventSourceRef.current?.close(); };
  }, []);

  const appendLog = (message: string, agent?: string) => {
    setLogs((prev) => {
      const newLog: LogMessage = {
        id: Math.random().toString(36).slice(2, 9),
        timestamp: new Date().toLocaleTimeString([], { hour12: false }),
        message,
        agent,
      };
      const updated = [...prev, newLog];
      return updated.length > 120 ? updated.slice(-120) : updated;
    });
  };

  const handleQuery = (query: string) => {
    saveQuery(query);
    setLastQuery(query);
    setAppState("streaming");
    setErrorMessage("");
    setChartData(null);
    setLogs([]);

    const sid = Math.random().toString(36).slice(2, 15);
    setSessionId(sid);

    eventSourceRef.current?.close();

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://insightgraph-0lvs.onrender.com";
    const url = `${apiUrl}/stream?query=${encodeURIComponent(query)}&session_id=${sid}`;
    const source = new EventSource(url);
    eventSourceRef.current = source;

    appendLog("Connecting to LangGraph Multi-Agent system...", "System");

    source.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);

        if (parsed.type === "log") {
          appendLog(parsed.message, parsed.agent);
          if (parsed.interrupt) setAppState("interrupted");

        } else if (parsed.type === "chart") {
          setChartData(parsed.data);
          setAppState("success");
          appendLog("Visualization complete.", "Visualizer");
          source.close();
        }
      } catch {
        // ignore unparseable messages
      }
    };

    source.onerror = () => {
      source.close();
      setErrorMessage("Stream disconnected. Check that the InsightGraph API is online.");
      setAppState("error");
      appendLog("Connection lost.", "System");
    };
  };

  const handleResume = async () => {
    setAppState("streaming");
    appendLog("User approved. Resuming pipeline...", "System");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://insightgraph-0lvs.onrender.com";
    try {
      await fetch(`${apiUrl}/resume`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });
    } catch {
      setErrorMessage("Failed to resume execution. Check backend connection.");
      setAppState("error");
    }
  };

  return (
    <div className="flex h-screen bg-[#080C14] overflow-hidden bg-grid">

      {/* ── Left Sidebar ─────────────────────────────────────── */}
      <LeftSidebar queries={queries} onSelect={handleQuery} />

      {/* ── Main Panel ───────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Header */}
        <header className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-white/[0.05]">
          <div className="flex items-center gap-3">
            {/* Mobile logo (hidden on lg) */}
            <div className="lg:hidden flex items-center gap-2">
              <Logo />
            </div>
            {/* Status badge */}
            <StatusBadge state={appState} />
          </div>

          {lastQuery && appState !== "idle" && (
            <p className="hidden md:block text-xs text-slate-500 font-mono truncate max-w-xs">
              &ldquo;{lastQuery}&rdquo;
            </p>
          )}
        </header>

        {/* Content area */}
        <main className="flex-1 flex flex-col overflow-y-auto p-4 md:p-6 gap-4">

          {/* Query bar */}
          <div className="flex-shrink-0 glass rounded-2xl p-4">
            <QueryInput onSubmit={handleQuery} loading={appState === "streaming"} />
          </div>

          {/* Output area */}
          <div className="flex-1 min-h-0">
            {appState === "idle" && <EmptyState onSelect={handleQuery} />}

            {appState === "streaming" && (
              <div className="glass rounded-2xl p-6 h-full animate-fade-up">
                <LoadingSkeleton />
              </div>
            )}

            {appState === "interrupted" && (
              <div className="flex items-center justify-center h-full">
                <InterruptCard onResume={handleResume} query={lastQuery} />
              </div>
            )}

            {appState === "error" && (
              <div className="glass rounded-2xl p-6 animate-fade-up">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-red-400 mb-1">Pipeline Error</p>
                    <p className="text-xs text-slate-400 leading-relaxed">{errorMessage}</p>
                  </div>
                </div>
              </div>
            )}

            {appState === "success" && chartData && (
              <div className="glass rounded-2xl p-6 animate-fade-up h-full overflow-y-auto">
                <ChartDisplay data={chartData} sessionId={sessionId} />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ── Right Sidebar — Thought Stream ───────────────────── */}
      <LogSidebar logs={logs} isActive={appState === "streaming" || appState === "interrupted"} />
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-indigo-500 flex items-center justify-center">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      </div>
      <span className="font-semibold text-sm tracking-tight">
        Insight<span className="text-cyan-400">Graph</span>
      </span>
    </div>
  );
}

function StatusBadge({ state }: { state: AppState }) {
  const config: Record<AppState, { color: string; label: string; pulse: boolean }> = {
    idle:        { color: "bg-slate-500",   label: "Idle",          pulse: false },
    streaming:   { color: "bg-cyan-400",    label: "Processing",    pulse: true  },
    interrupted: { color: "bg-amber-400",   label: "Awaiting Input",pulse: true  },
    success:     { color: "bg-emerald-400", label: "Complete",      pulse: false },
    error:       { color: "bg-red-400",     label: "Error",         pulse: false },
  };
  const c = config[state];
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06]">
      <span className={`w-1.5 h-1.5 rounded-full ${c.color} ${c.pulse ? "animate-pulse" : ""}`} />
      <span className="text-xs font-medium text-slate-400">{c.label}</span>
    </div>
  );
}
