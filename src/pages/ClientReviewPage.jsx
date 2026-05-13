import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, CheckCircle2, AlertTriangle, Loader2, MapPin, Clock,
  Shield, ThumbsUp, RotateCcw, Flag, Eye, User as UserIcon
} from "lucide-react";
import { Card, Badge } from "../components/ui/Card.jsx";
import { Button } from "../components/ui/Button.jsx";
import { verificationApi } from "../lib/api.js";
import { useJeevikaStore } from "../lib/store.js";
import { formatINR } from "../lib/utils.js";
import { toast } from "sonner";

function ScoreGauge({ value, label, color = "emerald" }) {
  const colors = {
    emerald: { ring: "stroke-emerald-500", text: "text-emerald-400", bg: "bg-emerald-500/10" },
    amber: { ring: "stroke-amber-500", text: "text-amber-400", bg: "bg-amber-500/10" },
    sky: { ring: "stroke-sky-500", text: "text-sky-400", bg: "bg-sky-500/10" },
    rose: { ring: "stroke-rose-500", text: "text-rose-400", bg: "bg-rose-500/10" },
  };
  const c = colors[color] || colors.emerald;
  const radius = 36, circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className={`flex flex-col items-center p-4 rounded-2xl ${c.bg} border border-white/5`}>
      <svg width="90" height="90" className="-rotate-90">
        <circle cx="45" cy="45" r={radius} fill="none" stroke="currentColor" strokeWidth="6" className="text-white/5" />
        <circle cx="45" cy="45" r={radius} fill="none" strokeWidth="6" strokeLinecap="round"
          className={`${c.ring} transition-all duration-1000`}
          strokeDasharray={circumference} strokeDashoffset={offset} />
      </svg>
      <p className={`-mt-[62px] mb-[30px] text-2xl font-black ${c.text}`}>{value}%</p>
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

function ImageCompare({ beforeImages = [], afterImages = [] }) {
  const [tab, setTab] = useState("split");
  const before = beforeImages[0];
  const after = afterImages[0];

  if (!before && !after) return null;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {["split", "before", "after"].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
              tab === t ? "bg-primary text-white" : "bg-white/5 text-muted-foreground hover:bg-white/10"
            }`}>{t}</button>
        ))}
      </div>
      {tab === "split" ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400">Before</p>
            {before ? <img src={before} alt="Before" className="w-full aspect-square object-cover rounded-xl border border-white/10" /> :
              <div className="w-full aspect-square bg-white/5 rounded-xl flex items-center justify-center text-muted-foreground text-xs">No image</div>}
          </div>
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">After</p>
            {after ? <img src={after} alt="After" className="w-full aspect-square object-cover rounded-xl border border-white/10" /> :
              <div className="w-full aspect-square bg-white/5 rounded-xl flex items-center justify-center text-muted-foreground text-xs">No image</div>}
          </div>
        </div>
      ) : (
        <div>
          {tab === "before" && before && <img src={before} alt="Before" className="w-full rounded-xl border border-white/10" />}
          {tab === "after" && after && <img src={after} alt="After" className="w-full rounded-xl border border-white/10" />}
          {((tab === "before" && !before) || (tab === "after" && !after)) &&
            <div className="w-full aspect-video bg-white/5 rounded-xl flex items-center justify-center text-muted-foreground">No {tab} images uploaded</div>}
        </div>
      )}
      {/* Show remaining images */}
      {(tab === "before" ? beforeImages : afterImages).length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {(tab === "before" ? beforeImages : afterImages).slice(1).map((img, i) => (
            <img key={i} src={img} alt={`${tab} ${i+2}`} className="aspect-square object-cover rounded-lg border border-white/10" />
          ))}
        </div>
      )}
    </div>
  );
}

export function ClientReviewPage() {
  const { jobId } = useParams();
  const { user } = useJeevikaStore();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState(null);
  const [reviewNote, setReviewNote] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await verificationApi.get(jobId);
      setData(result);
    } catch (err) { toast.error("Failed to load verification"); }
    finally { setLoading(false); }
  }, [jobId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleReview = async (action) => {
    const labels = { approved: "Approve", rework_requested: "Request Rework", disputed: "Raise Dispute" };
    if (action === "disputed" && !window.confirm("Are you sure? This will freeze the escrow payment.")) return;
    try {
      setSubmitting(true);
      await verificationApi.review(jobId, { action, note: reviewNote });
      toast.success(action === "approved" ? "Work approved! Payment released. 💰" : `${labels[action]} submitted.`);
      fetchData();
    } catch (err) { toast.error(err.message); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="grid h-[60vh] place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const { verification: v, job, worker } = data || {};

  if (!v) return (
    <div className="text-center py-20">
      <Eye className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-4" />
      <p className="text-lg text-muted-foreground">No verification data submitted yet.</p>
      <Button as={Link} to="/active-contracts" className="mt-4"><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
    </div>
  );

  const verdictColors = { clean: "emerald", suspicious: "amber", flagged: "amber", high_risk: "rose" };
  const isReviewed = v.clientAction !== "pending";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" as={Link} to="/active-contracts"><ArrowLeft className="h-4 w-4" /></Button>
        <div className="flex-1">
          <h1 className="text-2xl font-black">Review Work</h1>
          <p className="text-sm text-muted-foreground">{job?.title} — {formatINR(job?.budget)}</p>
        </div>
        <Badge tone={verdictColors[v.aiVerdict] || "sky"}>{(v.aiVerdict || "pending").replace(/_/g, " ")}</Badge>
      </div>

      {/* Worker Info */}
      {worker && (
        <Card className="p-4 flex items-center gap-4 bg-slate-900/40 border border-white/5">
          <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
            {worker.profilePhoto ? <img src={worker.profilePhoto} alt="" className="h-12 w-12 rounded-full object-cover" /> :
              <UserIcon className="h-6 w-6 text-primary" />}
          </div>
          <div className="flex-1">
            <p className="font-bold">{worker.name}</p>
            <p className="text-xs text-muted-foreground">{worker.completedJobs || 0} jobs completed • ★ {worker.rating}</p>
          </div>
          <Badge tone="emerald">{v.status.replace(/_/g, " ")}</Badge>
        </Card>
      )}

      {/* AI Analysis Scores */}
      {v.aiTrustScore != null && (
        <div className="grid grid-cols-3 gap-4">
          <ScoreGauge value={v.aiTrustScore} label="Trust Score" color={v.aiTrustScore >= 70 ? "emerald" : v.aiTrustScore >= 40 ? "amber" : "rose"} />
          <ScoreGauge value={v.aiFraudProbability} label="Fraud Risk" color={v.aiFraudProbability <= 20 ? "emerald" : v.aiFraudProbability <= 50 ? "amber" : "rose"} />
          <ScoreGauge value={v.aiConfidence} label="Confidence" color="sky" />
        </div>
      )}

      {/* AI Flags */}
      {v.aiFlags?.length > 0 && (
        <Card className="p-4 bg-amber-500/5 border border-amber-500/20">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />AI Flags ({v.aiFlags.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {v.aiFlags.map((flag, i) => (
              <Badge key={i} tone="amber">{flag.replace(/_/g, " ").toLowerCase()}</Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Location & Timing Proof */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-4 bg-slate-900/40 border border-white/5 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Location Proof</p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              <span className="text-muted-foreground">Check-in: </span>
              <span className="font-mono text-xs">{v.checkInLat?.toFixed(4)}, {v.checkInLng?.toFixed(4)}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="text-muted-foreground">Check-out: </span>
              <span className="font-mono text-xs">{v.checkOutLat?.toFixed(4) || "—"}, {v.checkOutLng?.toFixed(4) || "—"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-sky-400 shrink-0" />
              <span className="text-muted-foreground">GPS Valid: </span>
              <Badge tone={v.gpsValidated ? "emerald" : "rose"}>{v.gpsValidated ? "Yes" : "No"}</Badge>
            </div>
            {v.distanceFromJobMeters != null && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground ml-6">Distance: {v.distanceFromJobMeters}m</span>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-4 bg-slate-900/40 border border-white/5 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Timing</p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary shrink-0" />
              <span className="text-muted-foreground">Check-in: </span>
              <span>{v.checkInTime ? new Date(v.checkInTime).toLocaleString() : "—"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="text-muted-foreground">Check-out: </span>
              <span>{v.checkOutTime ? new Date(v.checkOutTime).toLocaleString() : "—"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-sky-400 shrink-0" />
              <span className="text-muted-foreground">Duration: </span>
              <span className="font-bold">{v.sessionDurationMinutes ? `${Math.round(v.sessionDurationMinutes)} min` : "—"}</span>
            </div>
            {v.gpsPings?.length > 0 && <p className="text-xs text-muted-foreground ml-6">{v.gpsPings.length} GPS pings recorded</p>}
          </div>
        </Card>
      </div>

      {/* Check-in Selfie */}
      {v.checkInSelfie && (
        <Card className="p-4 bg-slate-900/40 border border-white/5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Check-In Selfie</p>
          <img src={v.checkInSelfie} alt="Check-in" className="w-48 rounded-xl border border-white/10" />
        </Card>
      )}

      {/* Before vs After */}
      <Card className="p-4 bg-slate-900/40 border border-white/5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Before vs After Comparison</p>
        <ImageCompare beforeImages={v.beforeImages || []} afterImages={v.afterImages || []} />
      </Card>

      {/* Notes */}
      {(v.taskNotes || v.completionNote) && (
        <Card className="p-4 bg-slate-900/40 border border-white/5 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Worker Notes</p>
          {v.taskNotes && <div><p className="text-xs text-muted-foreground mb-1">Task Notes:</p><p className="text-sm">{v.taskNotes}</p></div>}
          {v.completionNote && <div><p className="text-xs text-muted-foreground mb-1">Completion Notes:</p><p className="text-sm">{v.completionNote}</p></div>}
        </Card>
      )}

      {/* Hash */}
      {v.submissionHash && (
        <div className="text-center text-xs font-mono text-muted-foreground bg-white/5 rounded-xl p-2 border border-white/5">
          Submission Hash: {v.submissionHash}
        </div>
      )}

      {/* Review Actions */}
      {!isReviewed && v.status === "client_review" && (
        <Card className="p-6 bg-gradient-to-br from-slate-900/80 to-primary/5 border border-primary/10 space-y-4">
          <h3 className="text-lg font-black">Your Decision</h3>
          <textarea className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm min-h-[80px] focus:ring-2 focus:ring-primary/50 outline-none" placeholder="Add a note for the worker (optional)..." value={reviewNote} onChange={e => setReviewNote(e.target.value)} />
          <div className="grid grid-cols-3 gap-3">
            <Button onClick={() => handleReview("approved")} disabled={submitting} className="bg-gradient-to-r from-emerald-500 to-emerald-600">
              <ThumbsUp className="h-4 w-4 mr-1" />Approve
            </Button>
            <Button variant="outline" onClick={() => handleReview("rework_requested")} disabled={submitting}>
              <RotateCcw className="h-4 w-4 mr-1" />Rework
            </Button>
            <Button variant="ghost" onClick={() => handleReview("disputed")} disabled={submitting} className="text-rose-400 hover:text-rose-300">
              <Flag className="h-4 w-4 mr-1" />Dispute
            </Button>
          </div>
        </Card>
      )}

      {/* Already reviewed */}
      {isReviewed && (
        <Card className={`p-6 text-center border ${
          v.clientAction === "approved" ? "bg-emerald-500/10 border-emerald-500/20" :
          v.clientAction === "disputed" ? "bg-rose-500/10 border-rose-500/20" :
          "bg-amber-500/10 border-amber-500/20"
        }`}>
          <CheckCircle2 className={`h-12 w-12 mx-auto mb-3 ${
            v.clientAction === "approved" ? "text-emerald-400" :
            v.clientAction === "disputed" ? "text-rose-400" : "text-amber-400"
          }`} />
          <p className="text-lg font-black">
            {v.clientAction === "approved" ? "Work Approved — Payment Released" :
             v.clientAction === "disputed" ? "Dispute Raised — Under Review" :
             "Rework Requested"}
          </p>
          {v.clientNote && <p className="text-sm text-muted-foreground mt-2">"{v.clientNote}"</p>}
          <p className="text-xs text-muted-foreground mt-2">{v.clientReviewedAt ? new Date(v.clientReviewedAt).toLocaleString() : ""}</p>
        </Card>
      )}
    </motion.div>
  );
}
