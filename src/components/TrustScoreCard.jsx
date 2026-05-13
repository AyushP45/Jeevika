import { Shield, AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react";
import { Badge } from "./ui/Card.jsx";

const verdictConfig = {
  clean: { tone: "emerald", icon: CheckCircle2, label: "Clean" },
  suspicious: { tone: "amber", icon: AlertTriangle, label: "Suspicious" },
  flagged: { tone: "amber", icon: AlertTriangle, label: "Flagged" },
  high_risk: { tone: "rose", icon: AlertTriangle, label: "High Risk" },
};

export function TrustScoreCard({ trustScore, fraudProbability, confidence, flags = [], verdict, compact = false }) {
  const v = verdictConfig[verdict] || verdictConfig.clean;
  const VerdictIcon = v.icon;

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
          trustScore >= 70 ? "bg-emerald-500/20 text-emerald-400" :
          trustScore >= 40 ? "bg-amber-500/20 text-amber-400" :
          "bg-rose-500/20 text-rose-400"
        }`}>
          <Shield className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-bold">{trustScore}% Trust</p>
          <p className="text-[10px] text-muted-foreground">{flags.length} flags</p>
        </div>
        <Badge tone={v.tone}>{v.label}</Badge>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/40 rounded-2xl border border-white/5 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h3 className="font-bold text-sm">AI Verification</h3>
        </div>
        <Badge tone={v.tone}><VerdictIcon className="h-3 w-3 mr-1" />{v.label}</Badge>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <p className={`text-xl font-black ${trustScore >= 70 ? "text-emerald-400" : trustScore >= 40 ? "text-amber-400" : "text-rose-400"}`}>{trustScore}%</p>
          <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Trust</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <p className={`text-xl font-black ${fraudProbability <= 20 ? "text-emerald-400" : fraudProbability <= 50 ? "text-amber-400" : "text-rose-400"}`}>{fraudProbability}%</p>
          <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Fraud</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <p className="text-xl font-black text-sky-400">{confidence}%</p>
          <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Confidence</p>
        </div>
      </div>

      {flags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {flags.slice(0, 5).map((flag, i) => (
            <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
              {flag.replace(/_/g, " ").toLowerCase()}
            </span>
          ))}
          {flags.length > 5 && <span className="text-[10px] text-muted-foreground">+{flags.length - 5} more</span>}
        </div>
      )}
    </div>
  );
}
