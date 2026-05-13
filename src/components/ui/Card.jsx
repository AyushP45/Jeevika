import { cn } from "../../lib/utils.js";

export function Card({ className, children }) {
  return <div className={cn("glass rounded-2xl p-5", className)}>{children}</div>;
}

export function Badge({ children, tone = "emerald" }) {
  const tones = {
    emerald: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
    violet: "border-violet-400/25 bg-violet-400/10 text-violet-200",
    sky: "border-sky-400/25 bg-sky-400/10 text-sky-200",
    amber: "border-amber-400/25 bg-amber-400/10 text-amber-200",
    rose: "border-rose-400/25 bg-rose-400/10 text-rose-200",
    slate: "border-white/20 bg-white/5 text-slate-300"
  };
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold", tones[tone])}>
      {children}
    </span>
  );
}
