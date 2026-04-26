interface Props {
  message?: string;
}

export default function ErrorCard({ message }: Props) {
  return (
    <div
      role="alert"
      className="
        w-full flex items-start gap-4 p-6 rounded-2xl
        bg-red-950/30 border border-red-500/30
        backdrop-blur-sm
      "
    >
      {/* Icon */}
      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#F87171"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      <div className="space-y-1">
        <p className="text-sm font-semibold text-red-400">Failed to generate insights</p>
        <p className="text-xs text-slate-400 leading-relaxed">
          {message ?? "Something went wrong. Please try again or check that the backend is running."}
        </p>
      </div>
    </div>
  );
}
