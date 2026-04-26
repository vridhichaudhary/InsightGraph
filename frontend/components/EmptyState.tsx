"use client";

const EXAMPLE_CARDS = [
  {
    icon: "⬡",
    title: "Model benchmarks",
    example: "Compare Llama 3 vs GPT-4o on MMLU, HumanEval, and GSM8K",
    color: "#C084FC",
  },
  {
    icon: "◎",
    title: "Trend over time",
    example: "LLM parameter count growth from GPT-2 to GPT-4 (2019–2024)",
    color: "#34D399",
  },
  {
    icon: "⬢",
    title: "Framework comparison",
    example: "Compare LangChain vs LlamaIndex vs Haystack on speed and ease of use",
    color: "#FB923C",
  },
  {
    icon: "◈",
    title: "Market analysis",
    example: "Top AI coding assistants by developer adoption rate in 2024",
    color: "#22D3EE",
  },
];

interface Props {
  onSelect: (query: string) => void;
}

export default function EmptyState({ onSelect }: Props) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-8 py-8 animate-fade-up">

      {/* Hero */}
      <div className="text-center space-y-3 max-w-lg">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/[0.08] border border-indigo-500/20 text-indigo-400 text-[11px] font-medium font-mono mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          4-agent pipeline · RAG · LangGraph
        </div>
        <h1 className="text-3xl font-bold text-slate-100 tracking-tight leading-tight">
          Ask. Research. <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">Visualize.</span>
        </h1>
        <p className="text-sm text-slate-500 leading-relaxed">
          Type a technical question about AI models, frameworks, or trends.
          Agents research, extract numbers, and generate a chart — automatically.
        </p>
      </div>

      {/* Example cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
        {EXAMPLE_CARDS.map((card) => (
          <button
            key={card.title}
            onClick={() => onSelect(card.example)}
            className="text-left p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all group"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base" style={{ color: card.color }}>{card.icon}</span>
              <span className="text-xs font-semibold text-slate-400 group-hover:text-slate-200 transition-colors">{card.title}</span>
            </div>
            <p className="text-xs text-slate-600 group-hover:text-slate-400 transition-colors leading-relaxed line-clamp-2">
              {card.example}
            </p>
          </button>
        ))}
      </div>

      {/* How it works strip */}
      <div className="flex items-center gap-2 text-[10px] text-slate-700 font-mono">
        {["Supervisor decomposes", "→", "Researcher retrieves", "→", "Analyst extracts", "→", "Visualizer charts"].map((step, i) => (
          <span key={i} className={step === "→" ? "text-slate-800" : ""}>{step}</span>
        ))}
      </div>
    </div>
  );
}
