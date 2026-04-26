"use client";

import { useState, useRef, useEffect } from "react";
import QueryInput from "@/components/QueryInput";
import ChartDisplay, { ChartResponse } from "@/components/ChartDisplay";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ErrorCard from "@/components/ErrorCard";
import LogSidebar, { LogMessage } from "@/components/LogSidebar";
import { useSavedQueries } from "@/hooks/useSavedQueries";

type AppState = "idle" | "streaming" | "interrupted" | "success" | "error";

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
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const appendLog = (message: string, agent?: string) => {
    setLogs((prev) => {
      const newLogs = [
        ...prev,
        {
          id: Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toLocaleTimeString([], { hour12: false }),
          message,
          agent,
        },
      ];
      if (newLogs.length > 100) return newLogs.slice(-100);
      return newLogs;
    });
  };

  const handleQuery = (query: string) => {
    saveQuery(query);
    setLastQuery(query);
    setAppState("streaming");
    setErrorMessage("");
    setChartData(null);
    setLogs([]);
    
    const newSessionId = Math.random().toString(36).substring(2, 15);
    setSessionId(newSessionId);

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const source = new EventSource(`${apiUrl}/stream?query=${encodeURIComponent(query)}&session_id=${newSessionId}`);
    eventSourceRef.current = source;

    appendLog(`Connecting to LangGraph Multi-Agent System...`, "System");

    source.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.type === "log") {
          appendLog(parsed.message, parsed.agent);
          
          if (parsed.interrupt) {
            setAppState("interrupted");
          }
        } else if (parsed.type === "chart") {
          setChartData(parsed.data);
          setAppState("success");
          appendLog("Chart rendered.", "System");
          source.close();
        }
      } catch (err) {
        console.error("Failed to parse SSE message", err);
      }
    };

    source.onerror = (err) => {
      console.error("SSE Error:", err);
      source.close();
      setErrorMessage("Stream disconnected unexpectedly. Check if backend is running.");
      setAppState("error");
      appendLog("Connection error occurred.", "System");
    };
  };

  const handleResume = async () => {
    setAppState("streaming");
    appendLog("Resuming execution...", "System");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    
    try {
      await fetch(`${apiUrl}/resume`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId })
      });
    } catch (e) {
      setErrorMessage("Failed to resume execution.");
      setAppState("error");
    }
  };

  return (
    <div className="flex h-screen bg-[#0F172A] overflow-hidden">
      
      {/* ── Left Sidebar (Saved Queries) ────────────────────────── */}
      <div className="hidden lg:flex flex-col w-64 bg-[#0B1120] border-r border-slate-800/60 flex-shrink-0">
        <div className="p-4 border-b border-slate-800/60">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-cyan-500 to-indigo-500 flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <span className="font-bold text-sm text-slate-100 tracking-tight">
              Insight<span className="text-cyan-400">Graph</span>
            </span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Recent Queries</h3>
            <div className="space-y-2">
              {queries.length === 0 ? (
                <p className="text-xs text-slate-600 italic">No recent queries</p>
              ) : (
                queries.map(q => (
                  <button
                    key={q.id}
                    onClick={() => handleQuery(q.query)}
                    className="w-full text-left p-2.5 rounded-lg bg-slate-800/30 hover:bg-slate-800/60 border border-transparent hover:border-slate-700/50 transition-all group"
                  >
                    <p className="text-xs text-slate-300 font-medium line-clamp-2 leading-relaxed group-hover:text-cyan-400 transition-colors">{q.query}</p>
                    <p className="text-[10px] text-slate-500 mt-1">{q.timestamp}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content Area ────────────────────────────────── */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto">
        <header className="border-b border-slate-800/60 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-20 lg:hidden">
          <div className="px-6 py-4 flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-cyan-500 to-indigo-500 flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <span className="font-bold text-sm text-slate-100 tracking-tight">
              Insight<span className="text-cyan-400">Graph</span>
            </span>
          </div>
        </header>

        <main className={`flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 flex flex-col transition-all duration-700 ease-in-out py-8`}>
          
          {appState === "idle" && <div className="flex-1" />}
          
          <div className={`w-full transition-all duration-700 ease-in-out ${appState === "idle" ? "scale-105" : "mb-8 scale-100"}`}>
            <div className="bg-slate-900/50 border border-slate-700/40 rounded-2xl p-4 sm:p-6 backdrop-blur-sm shadow-xl shadow-black/20">
              <QueryInput onSubmit={handleQuery} loading={appState === "streaming"} />
            </div>
          </div>

          <div className={`flex-1 relative flex flex-col justify-center min-h-[400px] transition-all duration-700 ${appState === "idle" ? "opacity-100" : "opacity-100"}`}>
            {appState === "idle" && (
              <div className="flex flex-col items-center justify-center text-center space-y-4 w-full -mt-8">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                  LangGraph Multi-Agent System
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-100 tracking-tight leading-tight max-w-lg">
                  Ask a question, let the <span className="text-cyan-400">agents</span> do the work.
                </h1>
              </div>
            )}

            {appState === "streaming" && (
              <div className="bg-slate-900/50 border border-slate-700/40 rounded-2xl p-6 backdrop-blur-sm h-full w-full flex flex-col">
                <LoadingSkeleton />
              </div>
            )}

            {appState === "interrupted" && (
              <div className="bg-slate-900/50 border border-slate-700/40 rounded-2xl p-8 backdrop-blur-sm h-full w-full flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95">
                <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mb-4">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-100 mb-2">Approval Required</h2>
                <p className="text-slate-400 mb-8 max-w-md">
                  The Analyst agent has successfully processed the raw data. Do you want to proceed to the Visualizer node to generate the chart?
                </p>
                <button
                  onClick={handleResume}
                  className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold rounded-xl shadow-lg shadow-cyan-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                  Approve & Visualize
                </button>
              </div>
            )}

            {appState === "error" && (
              <div className="bg-slate-900/50 border border-slate-700/40 rounded-2xl p-6 backdrop-blur-sm w-full">
                <ErrorCard message={errorMessage} />
              </div>
            )}

            {appState === "success" && chartData && (
              <div className="bg-slate-900/50 border border-slate-700/40 rounded-2xl p-6 backdrop-blur-sm shadow-xl shadow-black/20 space-y-6 animate-in fade-in zoom-in-95 duration-500 h-full w-full flex flex-col">
                <div className="flex items-center gap-2 text-xs text-slate-500 border-b border-slate-800 pb-4 flex-shrink-0">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                  </svg>
                  <span className="font-medium text-slate-400">"{lastQuery}"</span>
                </div>
                <div className="flex-1 min-h-0">
                  <ChartDisplay data={chartData} sessionId={sessionId} />
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ── Right Sidebar (Thought Stream) ────────────────────── */}
      <LogSidebar logs={logs} />
    </div>
  );
}
