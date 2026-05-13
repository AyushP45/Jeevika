import { useEffect, useState } from "react";
import { Briefcase, Clock, ShieldCheck, CheckCircle2, MessageSquare, Loader2, ArrowLeft, AlertTriangle, Shield, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { Card, Badge } from "../components/ui/Card.jsx";
import { Button } from "../components/ui/Button.jsx";
import { jobsApi, walletApi, reviewsApi } from "../lib/api.js";
import { useJeevikaStore } from "../lib/store.js";
import { formatINR } from "../lib/utils.js";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";

export function ActiveContractsPage() {
  const { user } = useJeevikaStore();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewingJob, setReviewingJob] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const fetchMyJobs = async () => {
    try {
      setLoading(true);
      const [allJobs, txns] = await Promise.all([
        jobsApi.list(),
        walletApi.transactions()
      ]);
      
      // Filter jobs where user is either employer OR the assigned worker
      // Filter jobs where user is involved
      const myActiveJobs = allJobs.filter(j => 
        (j.employerId === user?.id || j.workerId === user?.id) && 
        (
          (j.workerId && (j.status === "In Progress" || j.status === "Completed")) ||
          (user?.role === 'employer' && j.status === "Open")
        )
      ).map(job => {
        // Attach the active transaction ID if it exists
        const activeTxn = txns.find(t => t.jobId === job.id && t.status === "Locked");
        return { ...job, transactionId: activeTxn?.id };
      });
      
      // Sort: In Progress first, then Completed
      setJobs(myActiveJobs.sort((a, b) => (a.status === "Completed" ? 1 : -1)));
    } catch (err) {
      console.error(err);
      toast.error("Failed to load active contracts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyJobs();
  }, []);

  const handleRelease = async (job) => {
    if (!job.transactionId) {
      toast.error("No active escrow found for this job");
      return;
    }

    try {
      await walletApi.releaseEscrow(job.transactionId);
      toast.success(`Payment of ${formatINR(job.budget)} released to worker!`);
      // Open review modal
      setReviewingJob(job);
      fetchMyJobs(); // Refresh list
    } catch (err) {
      toast.error(err.message || "Failed to release payment");
    }
  };

  const submitReview = async () => {
    if (!reviewingJob) return;
    setIsSubmittingReview(true);
    try {
      await reviewsApi.create({
        jobId: reviewingJob.id,
        revieweeId: reviewingJob.workerId || reviewingJob.employerId, // Placeholder logic
        rating,
        comment,
        type: user?.role === 'employer' ? 'EmployerToWorker' : 'WorkerToEmployer'
      });
      toast.success("Review submitted! Thank you.");
      setReviewingJob(null);
      setRating(5);
      setComment("");
    } catch (err) {
      toast.error("Failed to submit review");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleDispute = async (jobId) => {
    if (!window.confirm("Are you sure you want to flag this job for dispute? Escrow will be paused.")) return;
    try {
      await jobsApi.dispute(jobId);
      toast.success("Job flagged for dispute. Admin will review.");
      fetchMyJobs();
    } catch (err) {
      toast.error("Failed to flag job");
    }
  };
  
  const handleMarkComplete = async (jobId) => {
    try {
      await jobsApi.updateStatus(jobId, "Completed");
      toast.success("Job marked as completed! Employer has been notified.");
      fetchMyJobs();
    } catch (err) {
      toast.error("Failed to update job status");
    }
  };

  return (
    <>
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" as={Link} to="/dashboard">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <h1 className="text-3xl font-black">Active Contracts</h1>
      </div>

      {loading ? (
        <div className="grid h-64 place-items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-6">
          {jobs.length === 0 ? (
            <div className="text-center py-20 bg-white/5 rounded-[2.5rem] border border-dashed border-white/10">
              <Briefcase className="h-12 w-12 text-muted-foreground opacity-20 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">No active contracts found.</p>
              <Button as={Link} to="/jobs" className="mt-4">Browse projects</Button>
            </div>
          ) : (
            jobs.map((job) => (
              <Card key={job.id} className="p-0 overflow-hidden border-none shadow-2xl bg-slate-900/40 backdrop-blur-md">
                {/* Contract Header */}
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 border-b border-white/5 flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Contract #{job.id.slice(0, 8).toUpperCase()}</span>
                      <Badge tone={job.isDisputed ? "rose" : job.status === "Completed" ? "emerald" : "sky"}>
                        {job.isDisputed ? "Under Dispute" : job.status === "Completed" ? "Work Completed" : "In Progress"}
                      </Badge>
                    </div>
                    <h2 className="text-2xl font-black tracking-tight">{job.title}</h2>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-emerald-400">{formatINR(job.budget)}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Locked in Escrow</p>
                  </div>
                </div>

                {/* Contract Body */}
                <div className="p-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {/* Parties */}
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3">Parties Involved</p>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400 text-xs font-bold">E</div>
                          <div>
                            <p className="text-sm font-bold">{job.employer?.name || "The Employer"}</p>
                            <p className="text-[10px] text-muted-foreground">Contracting Party</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-bold">W</div>
                          <div>
                            <p className="text-sm font-bold">{job.worker?.name || "The Worker"}</p>
                            <p className="text-[10px] text-muted-foreground">Service Provider</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Project Details */}
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3">Project Status</p>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm">
                        <Clock className="h-4 w-4 text-violet-400" />
                        <span className="text-muted-foreground">Started: <span className="text-white font-medium">{new Date(job.createdAt).toLocaleDateString()}</span></span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <ShieldCheck className="h-4 w-4 text-emerald-400" />
                        <span className="text-muted-foreground">Payment: <span className="text-white font-medium">Escrow Locked</span></span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-sky-400" />
                        <span className="text-muted-foreground">Terms: <span className="text-white font-medium">Standard Service Agreement</span></span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 justify-end">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 md:text-right">Management</p>
                    <div className="flex flex-wrap gap-2 md:justify-end">
                      <Button variant="outline" size="sm" as={Link} to={`/chat/${job.id}`} className="flex-1 md:flex-none border-white/10">
                        <MessageSquare className="h-4 w-4 mr-2" /> Discussion
                      </Button>

                      {/* Worker: Start Verification Flow */}
                      {user?.id === job.workerId && job.status === "In Progress" && (
                        <Button 
                          variant="primary" 
                          size="sm" 
                          as={Link} 
                          to={`/verification/${job.id}`}
                          className="flex-1 md:flex-none shadow-lg shadow-primary/20 bg-gradient-to-r from-violet-500 to-primary"
                        >
                          <Shield className="h-4 w-4 mr-2" /> Start Verification
                        </Button>
                      )}

                      {/* Employer: Review Submitted Work */}
                      {user?.id === job.employerId && job.status === "Completed" && (
                        <Button 
                          variant="primary" 
                          size="sm" 
                          as={Link} 
                          to={`/verification/${job.id}/review`}
                          className="flex-1 md:flex-none shadow-lg shadow-sky-500/20 bg-gradient-to-r from-sky-500 to-primary"
                        >
                          <Eye className="h-4 w-4 mr-2" /> Review Work
                        </Button>
                      )}
                      
                      {user?.id === job.employerId && (
                        <Button 
                          variant="primary" 
                          size="sm" 
                          onClick={() => handleRelease(job)} 
                          disabled={job.isDisputed}
                          className="flex-1 md:flex-none shadow-lg shadow-emerald-500/20"
                        >
                          <ShieldCheck className="h-4 w-4 mr-2" /> Release Funds
                        </Button>
                      )}

                      {user?.id === job.employerId && !job.isDisputed && (
                        <Button variant="ghost" size="sm" onClick={() => handleDispute(job.id)} className="text-red-400 hover:text-red-300 flex-1 md:flex-none">
                          <AlertTriangle className="h-4 w-4 mr-2" /> Dispute
                        </Button>
                      )}

                      {user?.id === job.workerId && job.status !== "Completed" && job.status !== "In Progress" && (
                        <Button 
                          variant="primary" 
                          size="sm" 
                          onClick={() => handleMarkComplete(job.id)}
                          className="flex-1 md:flex-none shadow-lg shadow-sky-500/20"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" /> Mark as Complete
                        </Button>
                      )}

                      {user?.id === job.workerId && job.status === "Completed" && (
                        <Badge tone="sky" className="h-9 px-4">Waiting for Release</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </motion.div>
    
    {/* Review Modal Overlay */}
    {reviewingJob && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md rounded-3xl bg-slate-900 border border-white/10 p-8 shadow-2xl"
        >
          <h2 className="text-2xl font-black mb-2">Rate your experience</h2>
          <p className="text-muted-foreground text-sm mb-6">How was your work experience for "{reviewingJob.title}"?</p>
          
          <div className="flex justify-center gap-2 mb-8">
            {[1, 2, 3, 4, 5].map((num) => (
              <button 
                key={num} 
                onClick={() => setRating(num)}
                className="transition-transform active:scale-90"
              >
                <Star className={`h-10 w-10 ${rating >= num ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}`} />
              </button>
            ))}
          </div>

          <textarea 
            className="field min-h-[120px] bg-white/5 border-white/10 mb-6"
            placeholder="Tell us more about the work..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <Button variant="ghost" onClick={() => setReviewingJob(null)}>Skip</Button>
            <Button onClick={submitReview} disabled={isSubmittingReview}>
              {isSubmittingReview ? "Submitting..." : "Submit Review"}
            </Button>
          </div>
        </motion.div>
      </div>
    )}
  </>
  );
}
