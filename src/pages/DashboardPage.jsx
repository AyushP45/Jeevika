import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  Activity, 
  BadgeIndianRupee, 
  Briefcase, 
  CheckCircle2, 
  ShieldCheck, 
  TrendingUp, 
  Users, 
  PlusCircle,
  FileText,
  UserPlus
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "../components/ui/Button.jsx";
import { Badge, Card } from "../components/ui/Card.jsx";
import { JobCard } from "../components/JobCard.jsx";
import { StatCard } from "../components/StatCard.jsx";
import { MapComponent } from "../components/MapComponent.jsx";
import { providers } from "../data/demoData.js";
import { useJeevikaStore } from "../lib/store.js";
import { formatINR } from "../lib/utils.js";
import { useTitle } from "../lib/useTitle.js";
import { jobsApi } from "../lib/api.js";

export function DashboardPage() {
  useTitle("Dashboard");
  const { user, jobs, setJobs, availability, toggleAvailability, applications } = useJeevikaStore();
  const [loadingJobs, setLoadingJobs] = useState(false);

  const isEmployer = user.role === "employer";

  const roleTitle = isEmployer ? "Employer hiring dashboard" : "Worker dashboard";

  // Fetch real jobs from API
  useEffect(() => {
    let cancelled = false;
    async function fetchJobs() {
      setLoadingJobs(true);
      try {
        const data = await jobsApi.list();
        if (!cancelled) setJobs(data);
      } catch {
        // Silently fall back to cached/demo jobs
      } finally {
        if (!cancelled) setLoadingJobs(false);
      }
    }
    fetchJobs();
    return () => { cancelled = true; };
  }, [setJobs]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="grid gap-6"
    >
      {/* ─── Top Header Section ─────────────────────────────────── */}
      <section className="grid gap-5 lg:grid-cols-[1.35fr_.65fr]">
        <Card className="overflow-hidden p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Badge tone="emerald">{roleTitle}</Badge>
              <h1 className="mt-4 text-4xl font-black">Namaste, {user.name?.split(" ")[0] || "there"}.</h1>
              <p className="mt-3 max-w-2xl text-muted-foreground">
                {isEmployer 
                  ? "Track your job postings, manage incoming applications, and release escrow payments securely."
                  : "Nearby opportunities, trust signals, escrow status, and quick actions are ready for today."}
              </p>
            </div>
            {!isEmployer && (
              <Button 
                variant={availability ? "primary" : "secondary"} 
                onClick={() => {
                  toggleAvailability();
                  toast.success(`Status updated: ${!availability ? 'Available' : 'Unavailable'}`);
                }}
              >
                <Activity className="h-4 w-4" />
                {availability ? "Available" : "Unavailable"}
              </Button>
            )}
            {isEmployer && (
              <Button as={Link} to="/post-job" variant="primary">
                <PlusCircle className="h-4 w-4" />
                Post new job
              </Button>
            )}
          </div>
          
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {isEmployer ? (
              <>
                <StatCard label="Active jobs" value={jobs.filter(j => j.employerId === user.id && !j.workerId).length || 0} detail="currently hiring" icon={Briefcase} />
                <StatCard label="Locked Escrow" value={formatINR(jobs.filter(j => j.employerId === user.id && j.escrowStatus === "Locked").reduce((acc, j) => acc + (j.budget || 0), 0))} detail="secured for workers" icon={ShieldCheck} />
                <StatCard label="Assignments" value={jobs.filter(j => j.employerId === user.id && j.workerId).length} detail="active contracts" icon={Users} />
              </>
            ) : (
              <>
                <StatCard label="Today" value={formatINR(user.earnings?.today || 0)} detail="earnings tracked" icon={BadgeIndianRupee} />
                <StatCard label="This week" value={formatINR(user.earnings?.week || 0)} detail="across active work" icon={TrendingUp} />
                <StatCard label="Applications" value={applications.length} detail="interested taps sent" icon={CheckCircle2} />
              </>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black">Trust profile</h2>
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {(user.badges || ["Verified"]).map((badge) => (
              <Badge key={badge} tone={badge === "Top Rated" ? "violet" : "emerald"}>
                {badge}
              </Badge>
            ))}
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/5 p-4">
              <p className="text-3xl font-black">{user.rating || "4.5"}</p>
              <p className="text-sm text-muted-foreground">rating</p>
            </div>
            <div className="rounded-2xl bg-white/5 p-4">
              <p className="text-3xl font-black">{isEmployer ? (jobs.length) : (user.completedJobs || 0)}</p>
              <p className="text-sm text-muted-foreground">{isEmployer ? "hiring score" : "jobs done"}</p>
            </div>
          </div>
          <Button as={Link} to="/profile" variant="outline" className="mt-5 w-full">
            View profile
          </Button>
        </Card>
      </section>

      {/* ─── Main Content Area ──────────────────────────────────── */}
      <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-black">
              {isEmployer ? "Manage your jobs" : "Nearby jobs"}
            </h2>
            <Button as={Link} to={isEmployer ? "/post-job" : "/jobs"} variant="ghost">
              {isEmployer ? "View all posts" : "Browse all"}
            </Button>
          </div>
          
          {!isEmployer && (
            <div className="mb-8">
              <MapComponent jobs={jobs} />
            </div>
          )}

          {loadingJobs ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse rounded-2xl border border-white/10 bg-white/5 p-6">
                  <div className="h-5 w-20 rounded-full bg-white/10" />
                  <div className="mt-4 h-6 w-3/4 rounded-lg bg-white/10" />
                  <div className="mt-3 h-4 w-full rounded bg-white/5" />
                  <div className="mt-5 h-10 rounded-xl bg-white/5" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {isEmployer ? (
                // Employer see their own jobs only
                jobs.filter(j => j.employerId === user.id).length > 0 ? (
                  jobs.filter(j => j.employerId === user.id).slice(0, 4).map((job) => (
                    <JobCard key={job.id} job={job} isManagementView />
                  ))
                ) : (
                  <div className="col-span-full rounded-2xl border border-dashed border-white/20 p-12 text-center">
                    <p className="text-muted-foreground">You haven't posted any jobs yet.</p>
                    <Button as={Link} to="/post-job" className="mt-4">Post your first requirement</Button>
                  </div>
                )
              ) : (
                // Workers see available jobs (excluding their own if any)
                jobs.filter(j => j.employerId !== user.id).slice(0, 4).map((job) => (
                  <JobCard key={job.id} job={job} />
                ))
              )}
            </div>
          )}
        </div>

        {/* ─── Sidebar ────────────────────────────────────────── */}
        <aside className="grid gap-4">
          {isEmployer ? (
            <Card className="p-6">
              <h2 className="text-xl font-black">Employer tools</h2>
              <div className="mt-4 grid gap-3">
                <Button variant="outline" as={Link} to="/find-workers" className="justify-start gap-3 w-full h-12">
                  <UserPlus className="h-4 w-4" /> Find new workers
                </Button>
                <Button variant="outline" as={Link} to="/active-contracts" className="justify-start gap-3 w-full h-12">
                  <FileText className="h-4 w-4" /> View active contracts
                </Button>
                <Button variant="outline" as={Link} to="/wallet" className="justify-start gap-3 w-full h-12">
                  <BadgeIndianRupee className="h-4 w-4" /> Escrow history
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="p-6">
              <h2 className="text-xl font-black">Hiring tracker</h2>
              {["Requirement posted", "3 trusted matches", "Escrow ready", "Work completion pending"].map((item, index) => (
                <div key={item} className="mt-4 flex items-center gap-3">
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                    {index + 1}
                  </div>
                  <p className="text-sm">{item}</p>
                </div>
              ))}
            </Card>
          )}

          <Card className="p-6">
            <h2 className="mb-4 text-xl font-black">
              {isEmployer ? "Recommended workers" : "Top providers"}
            </h2>
            <div className="grid gap-3">
              {providers.map((provider) => (
                <div key={provider.name} className="rounded-2xl bg-white/5 p-4 border border-white/5 hover:border-emerald-500/30 transition">
                  <div className="flex items-center justify-between">
                    <p className="font-bold">{provider.name}</p>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-amber-300">★ {provider.rating}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{provider.role} · {provider.location}</p>
                  {isEmployer && (
                    <Button variant="ghost" size="sm" className="mt-2 h-7 text-[10px] w-full border border-white/10 hover:bg-white/10">
                      View details
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-black">Platform pulse</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <StatCard label="Users" value={jobs.length > 0 ? "Active" : "—"} detail="demo network" icon={Users} />
              <StatCard label="Jobs" value={jobs.length} detail="available now" icon={Briefcase} />
            </div>
          </Card>
        </aside>
      </section>
    </motion.div>
  );
}
