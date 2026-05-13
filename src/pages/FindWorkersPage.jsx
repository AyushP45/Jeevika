import { useEffect, useState } from "react";
import { Search, MapPin, Star, UserCheck, Loader2, ArrowRight, Filter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, Badge } from "../components/ui/Card.jsx";
import { Button } from "../components/ui/Button.jsx";
import { workersApi } from "../lib/api.js";
import { initials } from "../lib/utils.js";
import { Link } from "react-router-dom";

export function FindWorkersPage() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterSkill, setFilterSkill] = useState("");

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      const data = await workersApi.list({ q: search, skill: filterSkill });
      setWorkers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchWorkers, 300);
    return () => clearTimeout(timer);
  }, [search, filterSkill]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-6xl space-y-8"
    >
      <header className="text-center">
        <h1 className="text-4xl font-black gradient-text">Find Skilled Workers</h1>
        <p className="mt-2 text-muted-foreground">Discover verified professionals ready for your next project.</p>
      </header>

      <section className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input 
            className="field pl-12 h-14 text-lg" 
            placeholder="Search by name, location, or experience..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="relative w-full md:w-64">
          <Filter className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <select 
            className="field pl-12 h-14 appearance-none"
            value={filterSkill}
            onChange={(e) => setFilterSkill(e.target.value)}
          >
            <option value="">All Skills</option>
            <option value="Painter">Painter</option>
            <option value="Plumber">Plumber</option>
            <option value="Electrician">Electrician</option>
            <option value="Farmer">Farmer</option>
            <option value="Driver">Driver</option>
          </select>
        </div>
      </section>

      {loading ? (
        <div className="grid h-64 place-items-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {workers.map((worker) => (
              <motion.div
                layout
                key={worker.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <Card className="group h-full flex flex-col p-6 hover:border-emerald-500/30 transition-all">
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-300 to-violet-500">
                      {worker.profilePhoto ? (
                        <img src={worker.profilePhoto} alt={worker.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="grid h-full w-full place-items-center font-black text-slate-950 text-xl">
                          {initials(worker.name)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-black group-hover:text-primary transition-colors">{worker.name}</h3>
                      <p className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {worker.location}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 font-bold text-amber-400">
                        <Star className="h-4 w-4 fill-amber-400" />
                        {worker.rating || "4.5"}
                      </div>
                      <p className="text-[10px] text-muted-foreground">({worker.completedJobs || 0} jobs)</p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {(worker.skills || []).map(skill => (
                      <Badge key={skill} tone="emerald" className="text-[10px]">{skill}</Badge>
                    ))}
                  </div>

                  <p className="mt-4 text-sm text-muted-foreground line-clamp-2 italic">
                    "{worker.experience || "Available for skilled work and labor tasks."}"
                  </p>

                  <div className="mt-auto pt-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${worker.availability ? "bg-emerald-500" : "bg-red-500"}`} />
                      <span className="text-xs font-semibold">{worker.availability ? "Available" : "Busy"}</span>
                    </div>
                    <Button variant="ghost" size="sm" as={Link} to={`/profile/${worker.id}`} className="group/btn">
                      View Profile <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {!loading && workers.length === 0 && (
        <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
          <UserCheck className="mx-auto h-12 w-12 text-muted-foreground opacity-20" />
          <h3 className="mt-4 text-xl font-bold">No workers found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filters.</p>
        </div>
      )}
    </motion.div>
  );
}
