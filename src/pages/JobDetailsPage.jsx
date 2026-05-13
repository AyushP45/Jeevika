import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  MapPin, 
  IndianRupee, 
  Clock, 
  HardHat, 
  ShieldCheck, 
  User, 
  Users,
  Phone, 
  MessageCircle,
  Briefcase,
  Star,
  CheckCircle2,
  Calendar,
  CreditCard
} from "lucide-react";
import { useJeevikaStore } from "../lib/store.js";
import { jobsApi } from "../lib/api.js";
import { Button } from "../components/ui/Button.jsx";
import { Card, Badge } from "../components/ui/Card.jsx";
import { formatINR } from "../lib/utils.js";
import { toast } from "sonner";
import { MapComponent } from "../components/MapComponent.jsx";

export function JobDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, jobs, applications, expressInterest } = useJeevikaStore();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [interestLoading, setInterestLoading] = useState(false);
  const [bidAmount, setBidAmount] = useState("");
  const [bidMessage, setBidMessage] = useState("");

  const applied = applications.includes(id);

  useEffect(() => {
    async function fetchJob() {
      setLoading(true);
      try {
        // Always fetch full details from API to get latest bids and worker info
        const data = await jobsApi.getById(id);
        setJob(data);
        setBidAmount(data.budget.toString());
      } catch (err) {
        console.error("Failed to load job details:", err);
        toast.error("Could not load job details");
      } finally {
        setLoading(false);
      }
    }
    fetchJob();
  }, [id, jobs]);

  const handleInterest = async () => {
    if (applied) return;
    setInterestLoading(true);
    try {
      await jobsApi.expressInterest(id, { 
        amount: parseFloat(bidAmount), 
        message: bidMessage 
      });
      expressInterest(id);
      toast.success("Bid placed successfully!");
    } catch (err) {
      toast.error(err.message || "Action failed");
    } finally {
      setInterestLoading(false);
    }
  };

  const handleHire = async (workerId, amount) => {
    if (!window.confirm(`Are you sure you want to hire this worker for ₹${amount}? This will lock the escrow amount from your wallet.`)) return;
    try {
      await jobsApi.hire(job.id, workerId, amount);
      toast.success("Worker hired and escrow locked!");
      const updated = await jobsApi.getById(id);
      setJob(updated);
    } catch (err) {
      toast.error(err.message || "Hiring failed");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        <p className="text-muted-foreground">Loading job details...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <Briefcase className="h-16 w-16 text-muted-foreground opacity-20" />
        <h2 className="text-2xl font-bold">Job not found</h2>
        <Button onClick={() => navigate("/jobs")}>Back to jobs</Button>
      </div>
    );
  }

  const imageUrl = job.images && job.images.length > 0
    ? job.images[0]
    : `https://images.unsplash.com/photo-1541888086425-d81bb19240f5?q=80&w=1200&h=600&auto=format&fit=crop`;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-5xl"
    >
      {/* ─── Navigation ─── */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* ─── Main Content ─── */}
        <div className="space-y-6">
          <Card className="p-0 overflow-hidden border-none shadow-2xl">
            <div className="relative h-64 w-full">
              <img src={imageUrl} alt={job.title} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge tone="emerald">{job.type || "Labor"}</Badge>
                  <Badge tone={job.escrow === "Locked" ? "amber" : "emerald"}>
                    <ShieldCheck className="mr-1 h-3 w-3" />
                    Escrow: {job.escrow || "Optional"}
                  </Badge>
                </div>
                <h1 className="text-3xl font-black md:text-4xl">{job.title}</h1>
              </div>
            </div>

            <div className="p-8">
              <h2 className="text-xl font-bold mb-4">Description</h2>
              <p className="text-muted-foreground leading-relaxed">
                {job.description || "No detailed description provided for this position."}
              </p>

              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                <div className="flex items-start gap-4">
                  <div className="mt-1 rounded-xl bg-primary/10 p-2 text-primary">
                    <IndianRupee className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Budget</p>
                    <p className="text-lg font-black">{formatINR(job.budget)}</p>
                    <p className="text-xs text-muted-foreground">{job.paymentType || "Total Project"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="mt-1 rounded-xl bg-violet-500/10 p-2 text-violet-400">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Location</p>
                    <p className="text-lg font-bold">{job.location}</p>
                    <p className="text-xs text-muted-foreground">Nearby Kolhapur</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="mt-1 rounded-xl bg-amber-500/10 p-2 text-amber-400">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Duration</p>
                    <p className="text-lg font-bold">{job.duration || "Short term"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="mt-1 rounded-xl bg-emerald-500/10 p-2 text-emerald-400">
                    <HardHat className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Openings</p>
                    <p className="text-lg font-bold">{job.workersNeeded || 1} Positions</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
          
          {/* Employer View: Interested Workers / Bids */}
          {user.role === 'employer' && job.employerId === user.id && !job.workerId && (
            <Card className="p-6 border-emerald-500/20 bg-emerald-500/5 shadow-xl shadow-emerald-500/5">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-black flex items-center gap-2">
                    <Users className="h-6 w-6 text-primary" />
                    Hiring Portal
                  </h2>
                  <p className="text-sm text-muted-foreground">Select a professional to begin the project.</p>
                </div>
                <Badge tone="emerald" className="h-fit">{job.bids?.length || 0} interested</Badge>
              </div>

              <div className="grid gap-4">
                {(!job.bids || job.bids.length === 0) ? (
                  <div className="text-center py-10 border border-dashed border-white/10 rounded-3xl">
                    <Briefcase className="h-10 w-10 text-muted-foreground opacity-20 mx-auto mb-3" />
                    <p className="text-muted-foreground font-medium">Waiting for workers to bid...</p>
                    <p className="text-xs text-muted-foreground mt-1">We've notified workers with matching skills.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {[...job.bids]
                      .sort((a, b) => (b.worker?.rating || 0) - (a.worker?.rating || 0))
                      .map((bid, index) => (
                        <div key={bid.id} className="relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4 p-5 rounded-3xl bg-slate-900/50 border border-white/10 hover:border-emerald-500/30 transition-all group shadow-sm">
                          {index === 0 && (
                            <div className="absolute top-0 left-0 bg-primary px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-950 rounded-br-xl">
                              Top Rated Match
                            </div>
                          )}
                          <div className="flex items-center gap-4 w-full">
                            <div className="h-16 w-16 shrink-0 rounded-2xl bg-gradient-to-br from-emerald-400 to-violet-500 flex items-center justify-center text-slate-950 text-2xl font-black shadow-lg">
                              {bid.worker?.name?.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-bold text-lg truncate">{bid.worker?.name}</p>
                                <span className="flex items-center gap-1 text-xs text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded-full">
                                  <Star className="h-3 w-3 fill-amber-400" />
                                  {bid.worker?.rating || "4.5"}
                                </span>
                                {bid.worker?.badges?.includes("Verified") && (
                                  <Badge tone="sky" className="text-[10px] py-0 px-2 h-5">Verified</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" /> {bid.worker?.location || "Nearby"}
                              </p>
                              {bid.message && (
                                <p className="mt-2 text-xs text-slate-300 bg-white/5 p-3 rounded-2xl border border-white/5 italic line-clamp-2">
                                  "{bid.message}"
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-3 w-full md:w-48 shrink-0">
                            <div className="text-right">
                              <p className="text-2xl font-black text-emerald-400">{formatINR(bid.amount)}</p>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Offer Amount</p>
                            </div>
                            <Button 
                              className="w-full h-11 px-6 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform" 
                              onClick={() => handleHire(bid.workerId, bid.amount)}
                            >
                              Hire Now
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </Card>
          )}
          
          {/* Worker Assigned View (New) */}
          {job.workerId && (
            <Card className="p-8 border-primary/20 bg-primary/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                <Badge tone="sky" className="animate-pulse">
                  <ShieldCheck className="mr-1 h-3 w-3" />
                  Work in Progress
                </Badge>
              </div>
              
              <div className="flex flex-col items-center text-center max-w-md mx-auto py-4">
                <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center text-slate-950 text-3xl font-black mb-6 shadow-2xl shadow-primary/20">
                  {job.worker?.name?.charAt(0) || <User className="h-10 w-10" />}
                </div>
                <h2 className="text-2xl font-black mb-2">Project Assigned</h2>
                <p className="text-muted-foreground mb-6">
                  This project is currently being handled by <span className="text-white font-bold">{job.worker?.name || "a verified professional"}</span>.
                </p>
                
                <div className="grid grid-cols-2 gap-4 w-full">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Contractor</p>
                    <p className="font-bold">{job.worker?.name}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Budget</p>
                    <p className="font-bold text-emerald-400">{formatINR(job.budget)}</p>
                  </div>
                </div>

                <div className="mt-8 flex gap-3 w-full">
                  <Button as={Link} to={`/chat/${job.id}`} className="flex-1 h-12">
                    <MessageCircle className="mr-2 h-4 w-4" /> Message
                  </Button>
                  <Button as={Link} to="/active-contracts" variant="outline" className="flex-1 h-12 border-white/10">
                    View Contract
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Map Preview */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Location Preview</h2>
              <Badge tone="sky">Exact location provided after hire</Badge>
            </div>
            <div className="h-64 rounded-2xl overflow-hidden border border-white/5">
              <MapComponent jobs={[job]} />
            </div>
          </Card>
        </div>

        {/* ─── Sidebar / Actions ─── */}
        <div className="space-y-6">
          <Card className="p-6 sticky top-24">
            <h2 className="text-xl font-bold mb-6">{job.workerId ? "Status" : "Take Action"}</h2>
            <div className="space-y-4">
              {job.workerId ? (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
                  <p className="font-black text-lg">Assigned & Secured</p>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    The escrow for this project is locked. The budget will be released once work is confirmed.
                  </p>
                  <Button as={Link} to="/active-contracts" className="mt-4 w-full" variant="ghost">Manage Project</Button>
                </div>
              ) : (
                <>
                  {!applied && (
                    <div className="grid gap-3 p-4 bg-white/5 rounded-2xl border border-white/5 mb-4">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Your Bid (₹)</label>
                      <input 
                        type="number" 
                        value={bidAmount} 
                        onChange={(e) => setBidAmount(e.target.value)}
                        className="field bg-slate-900 border-white/10"
                        placeholder="Enter amount"
                      />
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-2">Optional Message</label>
                      <textarea 
                        value={bidMessage}
                        onChange={(e) => setBidMessage(e.target.value)}
                        className="field bg-slate-900 border-white/10 min-h-[80px]"
                        placeholder="Why are you the best fit?"
                      />
                    </div>
                  )}
                  
                  <Button 
                    onClick={handleInterest} 
                    disabled={applied || interestLoading} 
                    className="w-full h-14 text-lg font-black shadow-lg shadow-primary/20"
                    variant={applied ? "secondary" : "primary"}
                  >
                    {interestLoading ? "Placing Bid..." : applied ? "Bid Submitted" : "Place Bid Now"}
                  </Button>
                  <Button as={Link} to={`/chat/${id}`} variant="outline" className="w-full h-12 gap-2 border-white/10 hover:bg-white/5">
                    <MessageCircle className="h-5 w-5" /> Chat with Employer
                  </Button>
                </>
              )}
            </div>

            <div className="mt-8 border-t border-white/10 pt-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 rounded-full bg-slate-800 grid place-items-center border border-white/10 overflow-hidden">
                  <User className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-bold text-lg">{job.employer || "Private Employer"}</p>
                  <div className="flex items-center gap-1 text-sm text-amber-400">
                    <Star className="h-3 w-3 fill-amber-400" />
                    <span>{job.rating || "4.8"} Employer Rating</span>
                  </div>
                </div>
              </div>

              {applied && job.employerPhone && (
                <div className="mt-4 rounded-2xl bg-emerald-500/10 p-4 border border-emerald-500/20">
                  <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-2">Direct Contact</p>
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-emerald-400" />
                    <p className="text-lg font-mono font-bold">{job.employerPhone}</p>
                  </div>
                </div>
              )}

              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Verified Jeevika Employer</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 text-violet-400" />
                  <span>Posted {job.postedAt || "2 days ago"}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <CreditCard className="h-4 w-4 text-sky-400" />
                  <span>Payment via Escrow Guaranteed</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
