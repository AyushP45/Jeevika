import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Camera, Clock, Upload, CheckCircle2, ArrowLeft, AlertTriangle,
  Loader2, Mic, FileText, Navigation, Shield, Image as ImageIcon, Video
} from "lucide-react";
import { Card, Badge } from "../components/ui/Card.jsx";
import { Button } from "../components/ui/Button.jsx";
import { verificationApi, jobsApi } from "../lib/api.js";
import { useJeevikaStore } from "../lib/store.js";
import { formatINR } from "../lib/utils.js";
import { toast } from "sonner";

const STEPS = [
  { key: "checkin", label: "Check In", icon: MapPin, desc: "Verify your location" },
  { key: "before", label: "Before Proof", icon: Camera, desc: "Upload before-work evidence" },
  { key: "working", label: "Working", icon: Clock, desc: "Track your session" },
  { key: "complete", label: "Complete", icon: CheckCircle2, desc: "Submit completion proof" },
];

function StepIndicator({ current, steps }) {
  const idx = steps.findIndex(s => s.key === current);
  return (
    <div className="flex items-center gap-1 w-full mb-8">
      {steps.map((step, i) => {
        const done = i < idx;
        const active = i === idx;
        const Icon = step.icon;
        return (
          <div key={step.key} className="flex-1 flex flex-col items-center gap-1.5">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${
              done ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30" :
              active ? "bg-primary text-white shadow-lg shadow-primary/40 ring-4 ring-primary/20" :
              "bg-white/5 text-muted-foreground border border-white/10"
            }`}>
              {done ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-4 w-4" />}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${active ? "text-primary" : done ? "text-emerald-400" : "text-muted-foreground"}`}>
              {step.label}
            </span>
            {i < steps.length - 1 && (
              <div className={`absolute h-0.5 w-full top-5 left-1/2 -z-10 ${done ? "bg-emerald-500" : "bg-white/10"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function CameraCapture({ onCapture, label = "Take Photo" }) {
  const videoRef = useRef(null);
  const [streaming, setStreaming] = useState(false);
  const [captured, setCaptured] = useState(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      if (videoRef.current) { videoRef.current.srcObject = stream; setStreaming(true); }
    } catch { toast.error("Camera access denied"); }
  };

  const capture = () => {
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
    setCaptured(dataUrl);
    onCapture(dataUrl);
    video.srcObject?.getTracks().forEach(t => t.stop());
    setStreaming(false);
  };

  const retake = () => { setCaptured(null); startCamera(); };

  useEffect(() => { return () => { videoRef.current?.srcObject?.getTracks().forEach(t => t.stop()); }; }, []);

  if (captured) return (
    <div className="space-y-3">
      <img src={captured} alt="Captured" className="w-full rounded-2xl border border-white/10 shadow-xl" />
      <Button variant="ghost" size="sm" onClick={retake} className="w-full">Retake Photo</Button>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/3] bg-black rounded-2xl overflow-hidden border border-white/10">
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
        {!streaming && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
            <Button onClick={startCamera}><Camera className="h-4 w-4 mr-2" />{label}</Button>
          </div>
        )}
      </div>
      {streaming && <Button onClick={capture} className="w-full"><Camera className="h-4 w-4 mr-2" />Capture</Button>}
    </div>
  );
}

function LiveTimer({ startTime }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!startTime) return;
    const start = new Date(startTime).getTime();
    const interval = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [startTime]);
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  const pad = n => String(n).padStart(2, "0");
  return (
    <div className="text-center">
      <div className="text-5xl font-black tracking-widest text-primary tabular-nums">
        {pad(h)}:{pad(m)}:{pad(s)}
      </div>
      <p className="text-muted-foreground text-xs mt-2 uppercase tracking-widest font-bold">Session Duration</p>
    </div>
  );
}

export function WorkerVerificationPage() {
  const { jobId } = useParams();
  const { user } = useJeevikaStore();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [job, setJob] = useState(null);
  const [verification, setVerification] = useState(null);
  const [step, setStep] = useState("checkin");

  // Check-in state
  const [gpsPos, setGpsPos] = useState(null);
  const [selfie, setSelfie] = useState(null);
  const [gpsResult, setGpsResult] = useState(null);

  // Before proof state
  const [beforeImages, setBeforeImages] = useState([]);
  const [taskNotes, setTaskNotes] = useState("");

  // Completion state
  const [afterImages, setAfterImages] = useState([]);
  const [completionNote, setCompletionNote] = useState("");
  const [voiceNote, setVoiceNote] = useState(null);

  // GPS ping interval
  const pingRef = useRef(null);

  const fetchState = useCallback(async () => {
    try {
      setLoading(true);
      const data = await verificationApi.get(jobId);
      setJob(data.job);
      setVerification(data.verification);
      if (data.verification) {
        const s = data.verification.status;
        if (s === "checked_in") setStep("before");
        else if (s === "before_proof_submitted" || s === "work_in_progress") setStep("working");
        else if (["client_review", "approved", "disputed", "rework_requested"].includes(s)) setStep("complete");
        else setStep("checkin");
      }
    } catch (err) { toast.error("Failed to load verification state"); }
    finally { setLoading(false); }
  }, [jobId]);

  useEffect(() => { fetchState(); }, [fetchState]);

  // Get current GPS
  const getGPS = () => new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("GPS not available"));
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      err => reject(err), { enableHighAccuracy: true, timeout: 15000 }
    );
  });

  // Start GPS pings every 2 minutes during work
  const startPings = useCallback(() => {
    if (pingRef.current) return;
    pingRef.current = setInterval(async () => {
      try {
        const pos = await getGPS();
        await verificationApi.ping(jobId, pos);
      } catch {}
    }, 120000);
  }, [jobId]);

  useEffect(() => { return () => { if (pingRef.current) clearInterval(pingRef.current); }; }, []);

  // ── STEP 1: Check In ──
  const handleCheckIn = async () => {
    try {
      setSubmitting(true);
      const pos = await getGPS();
      setGpsPos(pos);
      const result = await verificationApi.start(jobId, {
        lat: pos.lat, lng: pos.lng,
        deviceId: navigator.userAgent.slice(0, 64),
        networkInfo: { type: navigator.connection?.effectiveType || "unknown" },
        checkInSelfie: selfie
      });
      setGpsResult(result);
      setVerification(result.verification);
      toast.success(result.gpsValidated ? "Location verified! ✅" : "Checked in (location mismatch warning)");
      setStep("before");
    } catch (err) { toast.error(err.message || "Check-in failed"); }
    finally { setSubmitting(false); }
  };

  // ── STEP 2: Before Proof ──
  const handleBeforeProof = async () => {
    if (beforeImages.length === 0) return toast.error("Upload at least one before-work image");
    try {
      setSubmitting(true);
      await verificationApi.beforeProof(jobId, { images: beforeImages, taskNotes });
      toast.success("Before-work evidence saved!");
      startPings();
      setStep("working");
    } catch (err) { toast.error(err.message); }
    finally { setSubmitting(false); }
  };

  // ── STEP 4: Complete Work ──
  const handleComplete = async () => {
    if (afterImages.length === 0) return toast.error("Upload at least one after-work image");
    try {
      setSubmitting(true);
      if (pingRef.current) { clearInterval(pingRef.current); pingRef.current = null; }
      const pos = await getGPS();
      const result = await verificationApi.complete(jobId, {
        lat: pos.lat, lng: pos.lng,
        images: afterImages,
        completionNote,
        voiceNote
      });
      toast.success(`Work submitted! Trust: ${result.aiResult.trustScore}%, Hash: ${result.submissionHash}`);
      setVerification(result.verification);
      setStep("complete");
    } catch (err) { toast.error(err.message); }
    finally { setSubmitting(false); }
  };

  if (loading) return (
    <div className="grid h-[60vh] place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  );

  if (!job) return (
    <div className="text-center py-20">
      <AlertTriangle className="h-12 w-12 mx-auto text-amber-400 mb-4" />
      <p className="text-lg text-muted-foreground">Job not found</p>
      <Button as={Link} to="/active-contracts" className="mt-4"><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
    </div>
  );

  const isSubmitted = verification && ["client_review", "approved", "disputed", "completed"].includes(verification.status);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" as={Link} to="/active-contracts"><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-2xl font-black">Work Verification</h1>
          <p className="text-sm text-muted-foreground">{job.title} — {formatINR(job.budget)}</p>
        </div>
      </div>

      {/* Step indicator */}
      <StepIndicator current={step} steps={STEPS} />

      {/* Submitted state */}
      {isSubmitted ? (
        <Card className="p-8 text-center bg-gradient-to-br from-emerald-500/10 to-slate-900/50 border border-emerald-500/20">
          <CheckCircle2 className="h-16 w-16 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-2xl font-black mb-2">Work Submitted</h2>
          <p className="text-muted-foreground mb-2">Status: <Badge tone={verification.status === "approved" ? "emerald" : verification.status === "disputed" ? "rose" : "sky"}>{verification.status.replace(/_/g, " ")}</Badge></p>
          {verification.submissionHash && <p className="text-xs font-mono text-muted-foreground">Hash: {verification.submissionHash}</p>}
          {verification.aiTrustScore != null && (
            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="bg-white/5 rounded-2xl p-4"><p className="text-2xl font-black text-emerald-400">{verification.aiTrustScore}%</p><p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Trust</p></div>
              <div className="bg-white/5 rounded-2xl p-4"><p className="text-2xl font-black text-amber-400">{verification.aiFraudProbability}%</p><p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Fraud Risk</p></div>
              <div className="bg-white/5 rounded-2xl p-4"><p className="text-2xl font-black text-sky-400">{verification.aiConfidence}%</p><p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Confidence</p></div>
            </div>
          )}
        </Card>
      ) : (
        <AnimatePresence mode="wait">
          {/* ── STEP 1: Check-In ── */}
          {step === "checkin" && (
            <motion.div key="checkin" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card className="p-6 space-y-6 bg-slate-900/60 border border-white/5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center"><MapPin className="h-6 w-6 text-primary" /></div>
                  <div><h2 className="text-xl font-black">Geo Check-In</h2><p className="text-sm text-muted-foreground">Verify you're at the job site</p></div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Live Selfie / Site Photo</p>
                    <CameraCapture onCapture={setSelfie} label="Open Camera" />
                  </div>
                  {gpsPos && (
                    <div className="bg-emerald-500/10 rounded-xl p-3 flex items-center gap-3 border border-emerald-500/20">
                      <Navigation className="h-5 w-5 text-emerald-400" />
                      <span className="text-sm text-emerald-300 font-mono">{gpsPos.lat.toFixed(6)}, {gpsPos.lng.toFixed(6)}</span>
                    </div>
                  )}
                  <Button onClick={handleCheckIn} disabled={submitting || !selfie} className="w-full">
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <MapPin className="h-4 w-4 mr-2" />}
                    {submitting ? "Verifying Location..." : "Start Work — Check In"}
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* ── STEP 2: Before Proof ── */}
          {step === "before" && (
            <motion.div key="before" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card className="p-6 space-y-6 bg-slate-900/60 border border-white/5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-12 w-12 rounded-2xl bg-amber-500/20 flex items-center justify-center"><Camera className="h-6 w-6 text-amber-400" /></div>
                  <div><h2 className="text-xl font-black">Before-Work Evidence</h2><p className="text-sm text-muted-foreground">Document the current state</p></div>
                </div>
                <div className="space-y-4">
                  <CameraCapture onCapture={(img) => setBeforeImages(prev => [...prev, img])} label="Capture Before Photo" />
                  {beforeImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {beforeImages.map((img, i) => (
                        <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-white/10">
                          <img src={img} alt={`Before ${i+1}`} className="w-full h-full object-cover" />
                          <button onClick={() => setBeforeImages(prev => prev.filter((_, j) => j !== i))} className="absolute top-1 right-1 h-6 w-6 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">×</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <textarea className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm min-h-[80px] focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none" placeholder="Task notes (optional)..." value={taskNotes} onChange={e => setTaskNotes(e.target.value)} />
                  <Button onClick={handleBeforeProof} disabled={submitting || beforeImages.length === 0} className="w-full">
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                    Save & Start Working
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* ── STEP 3: Working ── */}
          {step === "working" && (
            <motion.div key="working" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card className="p-8 space-y-8 bg-gradient-to-br from-slate-900/80 to-primary/5 border border-primary/10">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center animate-pulse"><Clock className="h-6 w-6 text-primary" /></div>
                  <div><h2 className="text-xl font-black">Work In Progress</h2><p className="text-sm text-muted-foreground">GPS tracking active</p></div>
                  <Badge tone="emerald" className="ml-auto">LIVE</Badge>
                </div>
                <LiveTimer startTime={verification?.checkInTime || new Date().toISOString()} />
                <div className="bg-white/5 rounded-2xl p-4 flex items-center gap-3 border border-white/10">
                  <Shield className="h-5 w-5 text-emerald-400" />
                  <p className="text-xs text-muted-foreground">GPS pings are being recorded every 2 minutes to verify your presence.</p>
                </div>
                <Button onClick={() => setStep("complete")} className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-xl shadow-emerald-500/20">
                  <CheckCircle2 className="h-4 w-4 mr-2" />I'm Done — Submit Completion
                </Button>
              </Card>
            </motion.div>
          )}

          {/* ── STEP 4: Complete ── */}
          {step === "complete" && !isSubmitted && (
            <motion.div key="complete" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card className="p-6 space-y-6 bg-slate-900/60 border border-white/5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center"><CheckCircle2 className="h-6 w-6 text-emerald-400" /></div>
                  <div><h2 className="text-xl font-black">Completion Evidence</h2><p className="text-sm text-muted-foreground">Upload after-work proof</p></div>
                </div>
                <div className="space-y-4">
                  <CameraCapture onCapture={(img) => setAfterImages(prev => [...prev, img])} label="Capture After Photo" />
                  {afterImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {afterImages.map((img, i) => (
                        <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-white/10">
                          <img src={img} alt={`After ${i+1}`} className="w-full h-full object-cover" />
                          <button onClick={() => setAfterImages(prev => prev.filter((_, j) => j !== i))} className="absolute top-1 right-1 h-6 w-6 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">×</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <textarea className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm min-h-[80px] focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none" placeholder="Completion notes..." value={completionNote} onChange={e => setCompletionNote(e.target.value)} />
                  <Button onClick={handleComplete} disabled={submitting || afterImages.length === 0} className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-xl shadow-emerald-500/20">
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                    {submitting ? "Submitting & Analyzing..." : "Submit Work for Review"}
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </motion.div>
  );
}
