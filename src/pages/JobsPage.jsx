import { useEffect, useMemo, useState } from "react";
import { Filter, Loader2, SearchX } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { JobCard } from "../components/JobCard.jsx";
import { Card } from "../components/ui/Card.jsx";
import { useJeevikaStore } from "../lib/store.js";
import { jobsApi } from "../lib/api.js";

export function JobsPage() {
  const { jobs, setJobs } = useJeevikaStore();
  const [type, setType] = useState("All");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch jobs from API on mount
  useEffect(() => {
    let cancelled = false;
    async function fetchJobs() {
      setLoading(true);
      try {
        const data = await jobsApi.list();
        if (!cancelled) setJobs(data);
      } catch (err) {
        if (!cancelled) toast.error("Could not load jobs. Showing cached data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchJobs();
    return () => { cancelled = true; };
  }, [setJobs]);

  // Client-side filtering (API already supports it, but this is instant)
  const visibleJobs = useMemo(
    () =>
      jobs.filter((job) => {
        const matchesType = type === "All" || job.type === type;
        const text = `${job.title} ${job.category} ${job.location}`.toLowerCase();
        return matchesType && text.includes(query.toLowerCase());
      }),
    [jobs, query, type]
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="grid gap-6"
    >
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold text-primary">Job feed</p>
          <h1 className="mt-2 text-4xl font-black">Browse nearby requirements.</h1>
        </div>
        <Card className="flex flex-col gap-3 p-3 sm:flex-row">
          <div className="relative min-w-72">
            <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input className="field pl-10" placeholder="Search skill, category, location" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <select className="field sm:w-44" value={type} onChange={(e) => setType(e.target.value)}>
            {["All", "Labor", "Equipment", "Material"].map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
          <select className="field sm:w-44">
            <option>Within 15 km</option>
            <option>Within 5 km</option>
            <option>Remote delivery</option>
          </select>
          <select className="field sm:w-44">
            <option>Any payment</option>
            <option>₹1k - ₹5k</option>
            <option>₹5k - ₹20k</option>
          </select>
        </Card>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="flex gap-2">
                <div className="h-6 w-16 rounded-full bg-white/10" />
                <div className="h-6 w-24 rounded-full bg-white/10" />
              </div>
              <div className="mt-4 h-6 w-3/4 rounded-lg bg-white/10" />
              <div className="mt-3 h-4 w-full rounded-lg bg-white/5" />
              <div className="mt-2 h-4 w-2/3 rounded-lg bg-white/5" />
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="h-4 rounded bg-white/5" />
                <div className="h-4 rounded bg-white/5" />
                <div className="h-4 rounded bg-white/5" />
                <div className="h-4 rounded bg-white/5" />
              </div>
              <div className="mt-5 flex justify-between border-t border-white/5 pt-4">
                <div className="h-8 w-24 rounded-lg bg-white/5" />
                <div className="flex gap-2">
                  <div className="h-9 w-16 rounded-xl bg-white/5" />
                  <div className="h-9 w-28 rounded-xl bg-white/10" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : visibleJobs.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
            <SearchX className="h-8 w-8 text-slate-500" />
          </div>
          <h3 className="mt-5 text-xl font-bold">No jobs found</h3>
          <p className="mt-2 max-w-sm text-sm text-slate-400">
            {query || type !== "All"
              ? "Try adjusting your search or filters to see more results."
              : "No jobs have been posted yet. Be the first to post a requirement!"}
          </p>
        </div>
      ) : (
        /* Job Grid */
        <div className="grid gap-4 lg:grid-cols-2">
          {visibleJobs.map((job, index) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <JobCard job={job} />
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
