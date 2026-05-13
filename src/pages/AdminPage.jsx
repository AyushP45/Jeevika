import { useEffect, useState } from "react";
import { ShieldAlert, Users, Briefcase, FileWarning, Search, Ban, CheckCircle2, Loader2, AlertTriangle, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "../components/ui/Button.jsx";
import { Badge, Card } from "../components/ui/Card.jsx";
import { useTitle } from "../lib/useTitle.js";
import { adminApi, verificationApi } from "../lib/api.js";
import { formatINR } from "../lib/utils.js";
import { Link } from "react-router-dom";

export function AdminPage() {
  useTitle("Admin Console");
  const [activeTab, setActiveTab] = useState("overview");
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState({ users: 0, jobs: 0, activeContracts: 0, totalBalance: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [verifications, setVerifications] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        const [usersData, statsData, jobsData] = await Promise.all([
          adminApi.users(),
          adminApi.stats(),
          adminApi.jobs()
        ]);
        if (!cancelled) {
          setUsers(usersData);
          setStats(statsData);
          setJobs(jobsData);
        }
      } catch (err) {
        if (!cancelled) toast.error(err.message || "Failed to load admin data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    verificationApi.adminAll().then(setVerifications).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const handleToggleSuspend = async (userId, currentStatus) => {
    try {
      const updatedUser = await adminApi.suspend(userId, !currentStatus);
      setUsers(users.map(u => u.id === userId ? updatedUser : u));
      toast.success(`User ${updatedUser.isActive ? "restored" : "suspended"} successfully`);
    } catch (err) {
      toast.error(err.message || "Failed to update user status");
    }
  };

  const pendingUsers = users.filter(u => u.verificationStatus === "Pending");

  const handleKycAction = async (userId, action) => {
    try {
      const updatedUser = action === "approve" 
        ? await adminApi.kycApprove(userId)
        : await adminApi.kycReject(userId);
      setUsers(users.map(u => u.id === userId ? updatedUser : u));
      toast.success(`KYC ${action === "approve" ? "approved" : "rejected"}`);
    } catch (err) {
      toast.error(err.message || "Failed to update KYC status");
    }
  };

  const handleReleaseEscrow = async (jobId) => {
    if (!window.confirm("Are you sure? This will manually release funds to the worker.")) return;
    try {
      await adminApi.releaseEscrow(jobId);
      toast.success("Escrow released successfully!");
      const jobsData = await adminApi.jobs();
      setJobs(jobsData);
    } catch (err) {
      toast.error(err.message || "Failed to release escrow");
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.phone?.includes(search)
  );

  const kycQueue = users.filter(u => u.kycStatus === "Pending");

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Badge tone="violet">System Administrator</Badge>
          <h1 className="mt-2 text-4xl font-black">Admin Command Center</h1>
        </div>
        <div className="flex gap-2 bg-white/5 p-1 rounded-2xl border border-white/10">
          {["overview", "users", "jobs", "queue"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === tab ? "bg-primary text-slate-950 shadow-lg" : "hover:bg-white/5 text-muted-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "overview" && (
        <div className="grid gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-3xl bg-white/5 p-6 border border-white/10">
              <Users className="h-6 w-6 text-sky-400 mb-4" />
              <p className="text-3xl font-black">{stats.users}</p>
              <p className="text-xs text-muted-foreground uppercase font-bold mt-1">Total Users</p>
            </div>
            <div className="rounded-3xl bg-white/5 p-6 border border-white/10">
              <Briefcase className="h-6 w-6 text-emerald-400 mb-4" />
              <p className="text-3xl font-black">{stats.activeContracts}</p>
              <p className="text-xs text-muted-foreground uppercase font-bold mt-1">Active Contracts</p>
            </div>
            <div className="rounded-3xl bg-white/5 p-6 border border-white/10">
              <ShieldAlert className="h-6 w-6 text-amber-400 mb-4" />
              <p className="text-3xl font-black">{kycQueue.length}</p>
              <p className="text-xs text-muted-foreground uppercase font-bold mt-1">Pending KYC</p>
            </div>
            <div className="rounded-3xl bg-white/5 p-6 border border-white/10">
              <CheckCircle2 className="h-6 w-6 text-violet-400 mb-4" />
              <p className="text-3xl font-black">{formatINR(stats.totalBalance)}</p>
              <p className="text-xs text-muted-foreground uppercase font-bold mt-1">System Cash Flow</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
             <Card className="p-6">
               <h2 className="text-xl font-black mb-4 flex items-center gap-2">
                 <AlertTriangle className="h-5 w-5 text-amber-400" />
                 Recent Flagged Activities
               </h2>
               <div className="space-y-3">
                 {verifications.filter(v => v.aiFraudProbability > 30).slice(0, 5).map(v => (
                   <div key={v.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                     <div>
                       <p className="font-bold text-sm">Verification #{v.id.slice(0, 8)}</p>
                       <p className="text-xs text-muted-foreground">Fraud Probability: {v.aiFraudProbability}%</p>
                     </div>
                     <Button size="sm" variant="ghost" as={Link} to={`/verification/${v.jobId}/review`}>Review</Button>
                   </div>
                 ))}
                 {verifications.filter(v => v.aiFraudProbability > 30).length === 0 && (
                   <p className="text-center py-10 text-muted-foreground">No suspicious activity detected.</p>
                 )}
               </div>
             </Card>

             <Card className="p-6">
               <h2 className="text-xl font-black mb-4">Latest Platform Jobs</h2>
               <div className="space-y-3">
                 {jobs.slice(0, 5).map(job => (
                   <div key={job.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                     <div>
                       <p className="font-bold text-sm">{job.title}</p>
                       <p className="text-xs text-muted-foreground">{job.status} · {formatINR(job.budget)}</p>
                     </div>
                     <Badge tone={job.escrowStatus === "Locked" ? "amber" : "sky"}>{job.escrowStatus}</Badge>
                   </div>
                 ))}
               </div>
             </Card>
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <h2 className="text-2xl font-black flex items-center gap-2">
              <Users className="h-6 w-6 text-sky-500" />
              User Management
            </h2>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input 
                className="field pl-10" 
                placeholder="Search name or phone..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          
          <div className="grid gap-3">
            {filteredUsers.map((user) => (
              <div key={user.id} className={`flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl bg-white/5 p-4 border ${user.isActive ? 'border-white/5' : 'border-red-500/30 bg-red-500/5'}`}>
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-xl font-black ${user.role === 'admin' ? 'bg-violet-500 text-white' : 'bg-white/10'}`}>
                    {user.name?.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold">{user.name}</p>
                      <Badge tone={user.role === "admin" ? "violet" : user.role === "employer" ? "sky" : "emerald"}>{user.role}</Badge>
                      {user.isKycVerified && <Badge tone="sky">KYC ✓</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {user.phone} · {formatINR(user.walletBalance)} balance
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" as={Link} to={`/profile/${user.id}`}>View Profile</Button>
                  {user.role !== "admin" && (
                    <Button 
                      variant={user.isActive ? "destructive" : "outline"} 
                      size="sm" 
                      onClick={() => handleToggleSuspend(user.id, user.isActive)}
                    >
                      {user.isActive ? "Suspend" : "Restore"}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeTab === "jobs" && (
        <Card className="p-6">
          <h2 className="text-2xl font-black mb-6">Jobs & Escrow Audits</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs text-muted-foreground uppercase tracking-widest border-b border-white/10">
                  <th className="pb-4 font-black">Job Details</th>
                  <th className="pb-4 font-black">Stakeholders</th>
                  <th className="pb-4 font-black">Escrow</th>
                  <th className="pb-4 font-black">Status</th>
                  <th className="pb-4 font-black text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {jobs.map(job => (
                  <tr key={job.id} className="group">
                    <td className="py-4">
                      <p className="font-bold text-sm">{job.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatINR(job.budget)}</p>
                    </td>
                    <td className="py-4">
                      <p className="text-xs"><span className="text-muted-foreground">Employer:</span> {job.employer?.name}</p>
                      <p className="text-xs"><span className="text-muted-foreground">Worker:</span> {job.worker?.name || "Unassigned"}</p>
                    </td>
                    <td className="py-4">
                      <Badge tone={job.escrowStatus === "Locked" ? "amber" : job.escrowStatus === "Released" ? "emerald" : "sky"}>
                        {job.escrowStatus}
                      </Badge>
                    </td>
                    <td className="py-4">
                      <Badge tone={job.status === "Completed" ? "emerald" : job.status === "In Progress" ? "amber" : "sky"}>
                        {job.status}
                      </Badge>
                    </td>
                    <td className="py-4 text-right">
                      {job.escrowStatus === "Locked" && (
                        <Button size="sm" onClick={() => handleReleaseEscrow(job.id)} className="bg-emerald-600 hover:bg-emerald-500">
                          Release Funds
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === "queue" && (
        <Card className="p-6">
          <h2 className="text-2xl font-black mb-2 flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-amber-500" />
            Verification Queue
          </h2>
          <p className="text-sm text-muted-foreground mb-6">Workers waiting for identity verification.</p>
          
          <div className="grid gap-6">
            {kycQueue.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 border border-dashed border-white/10 rounded-3xl">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-3" />
                <p className="text-muted-foreground font-bold">The queue is empty. You're all caught up!</p>
              </div>
            ) : (
              kycQueue.map(u => (
                <div key={u.id} className="rounded-3xl bg-white/5 p-6 border border-white/10 flex flex-col md:flex-row gap-6">
                  <div className="md:w-1/3">
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Submitted ID Photo</p>
                    <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-black border border-white/10">
                      <img src={u.idProof} alt="KYC Proof" className="w-full h-full object-contain" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <h3 className="text-xl font-black">{u.name}</h3>
                      <p className="text-sm text-muted-foreground">{u.phone} · Joined {new Date(u.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 p-3 rounded-2xl"><p className="text-xs text-muted-foreground font-bold">Role</p><p className="text-sm font-bold uppercase">{u.role}</p></div>
                      <div className="bg-white/5 p-3 rounded-2xl"><p className="text-xs text-muted-foreground font-bold">Status</p><p className="text-sm font-bold uppercase text-amber-400">Pending Review</p></div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Button onClick={() => handleKycAction(u.id, "approve")} className="flex-1 bg-emerald-600 hover:bg-emerald-500">Approve ID</Button>
                      <Button onClick={() => handleKycAction(u.id, "reject")} variant="destructive" className="flex-1">Reject Submission</Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}
    </motion.div>
  );
}
