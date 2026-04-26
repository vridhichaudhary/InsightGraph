"use client";

import { useEffect, useRef } from "react";

export interface LogMessage {
  id: string;
  timestamp: string;
  message: string;
  agent?: string;
}

interface Props {
  logs: LogMessage[];
  isOpen?: boolean;
}

export default function LogSidebar({ logs, isOpen = true }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new logs
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [logs]);

  if (!isOpen) return null;

  const getAgentColor = (agent?: string) => {
    if (!agent) return "text-indigo-400";
    const lower = agent.toLowerCase();
    if (lower === "supervisor") return "text-fuchsia-400";
    if (lower === "researcher") return "text-emerald-400";
    if (lower === "analyst") return "text-orange-400";
    if (lower === "visualizer") return "text-cyan-400";
    return "text-indigo-400";
  };

  return (
    <div className="flex flex-col h-full bg-[#0B1120] border-l border-slate-800/60 w-full sm:w-80 md:w-96 flex-shrink-0">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800/60 bg-slate-900/50">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" strokeWidth="2">
          <polyline points="4 17 10 11 4 5" />
          <line x1="12" y1="19" x2="20" y2="19" />
        </svg>
        <span className="text-xs font-semibold text-slate-300 uppercase tracking-widest">
          Thought Stream
        </span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs">
        {logs.length === 0 ? (
          <div className="text-slate-600 italic">Waiting for queries...</div>
        ) : (
          logs.map((log, index) => (
            <div
              key={log.id}
              className={`flex gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                index === logs.length - 1 ? "text-cyan-400" : "text-slate-400"
              }`}
            >
              <span className="text-slate-600 flex-shrink-0">[{log.timestamp}]</span>
              <span className={`${getAgentColor(log.agent)} flex-shrink-0 font-semibold`}>
                [{log.agent || "System"}]
              </span>
              <span className="break-words">{log.message}</span>
            </div>
          ))
        )}
        
        {/* Pulsing cursor if waiting for more */}
        {logs.length > 0 && logs[logs.length - 1].message !== "Chart rendered." && (
          <div className="flex gap-2 text-cyan-400">
            <span className="w-2 h-4 bg-cyan-400 animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
}
