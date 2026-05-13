import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { toast } from "sonner";
import { Clock, IndianRupee, MapPin, ShieldCheck, Star, Phone, Users, Calendar, Volume2, VolumeX } from "lucide-react";
import { Badge, Card } from "./ui/Card.jsx";
import { Button } from "./ui/Button.jsx";
import { formatINR } from "../lib/utils.js";
import { useJeevikaStore } from "../lib/store.js";
import { jobsApi } from "../lib/api.js";
import { useTranslation } from "../lib/i18n.js";

export function JobCard({ job }) {
  const { applications, expressInterest, user } = useJeevikaStore();
  const applied = applications.includes(job.id);
  const [loading, setLoading] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const { t, language } = useTranslation();
  const utteranceRef = useRef(null);
  const isOwner = user?.id === job.employerId;

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handleInterest = async () => {
    if (applied) return;
    setLoading(true);
    try {
      await jobsApi.expressInterest(job.id);
      expressInterest(job.id);
      toast.success(`Interest expressed in "${job.title}"`);
    } catch (err) {
      toast.error(err.message || "Could not express interest. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReadAloud = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isReading) {
      window.speechSynthesis.cancel();
      setIsReading(false);
      return;
    }

    const textToRead = `${job.title}. ${job.description}. Budget is ${job.budget} rupees. Location is ${job.location}.`;
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utteranceRef.current = utterance; // Prevent garbage collection

    // Attempt to match voice to language
    if (language === "hi" || language === "mr") utterance.lang = "hi-IN";
    else utterance.lang = "en-IN";

    utterance.onend = () => setIsReading(false);
    utterance.onerror = () => setIsReading(false);

    setIsReading(true);
    window.speechSynthesis.speak(utterance);
  };

  // If the job has images, use the first one. Otherwise use a generated placeholder.
  const imageUrl = job.images && job.images.length > 0
    ? job.images[0]
    : `https://images.unsplash.com/photo-1541888086425-d81bb19240f5?q=80&w=400&h=200&auto=format&fit=crop`;

  return (
    <Motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <Card className="h-full overflow-hidden p-0 flex flex-col relative group">

        {/* Read Aloud floating button */}
        <button
          onClick={handleReadAloud}
          className={`absolute top-3 right-3 z-10 p-2 rounded-full backdrop-blur-md transition shadow-lg ${isReading ? 'bg-primary text-primary-foreground' : 'bg-black/40 text-white hover:bg-black/60'}`}
          title={isReading ? t("job.stop_reading") : t("job.read_aloud")}
        >
          {isReading ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>

        {/* Job Image Banner */}
        <Link to={`/jobs/${job.id}`} className="h-32 w-full bg-slate-800 relative block">
          <img src={imageUrl} alt={job.title} className="h-full w-full object-cover opacity-60 mix-blend-overlay" />
          <div className="absolute inset-x-4 bottom-4 flex flex-wrap items-center gap-2">
            <Badge tone={job.type === "Labor" ? "emerald" : job.type === "Equipment" ? "violet" : "sky"}>{job.type}</Badge>
            <Badge tone={job.escrow === "Locked" ? "amber" : "emerald"}>
              <ShieldCheck className="mr-1 h-3 w-3" />
              {t("job.escrow")} {job.escrow === "Optional" ? t("job.optional") : job.escrow || t("job.optional")}
            </Badge>
          </div>
        </Link>

        <div className="p-6 flex flex-col flex-1">
          <Link to={`/jobs/${job.id}`} className="hover:text-emerald-400 transition-colors">
            <h3 className="text-xl font-bold pr-8">{job.title}</h3>
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">{job.description}</p>

          <div className="mt-5 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
            <span className="flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-emerald-300" />
              <span className="font-semibold text-slate-200">
                {formatINR(job.budget)} 
                <span className="text-xs text-muted-foreground ml-1">
                  {job.paymentType === "Per Day" ? "/ Day" : "Total"}
                </span>
              </span>
            </span>
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-300" />
              {job.location}
            </span>
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-violet-300" />
              {job.duration || "N/A"}
            </span>
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-sky-300" />
              {job.startDate || "Date tbd"}
            </span>
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4 text-orange-300" />
              {job.workersNeeded || 1} {t("job.workers_needed")}
            </span>
          </div>

        <div className="mt-auto pt-5 border-t border-white/10 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">{job.employer}</p>
            <div className="flex items-center gap-3 mt-1">
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="h-3 w-3 fill-amber-300 text-amber-300" />
                {job.rating}
              </p>
              {/* Employer Contact - visible when applied */}
              {applied && job.employerPhone && (
                <p className="flex items-center gap-1 text-xs text-emerald-400 font-medium bg-emerald-400/10 px-2 py-0.5 rounded-full">
                  <Phone className="h-3 w-3" />
                  {job.employerPhone}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            {isOwner ? (
              <Button as={Link} to={`/jobs/${job.id}`} variant="primary" className="gap-2">
                Manage Applicants
                {job.applicants > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold">
                    {job.applicants}
                  </span>
                )}
              </Button>
            ) : (
              <>
                <Button variant="outline" as={Link} to={`/chat/${job.id}`}>
                  {t("job.chat")}
                </Button>
                <Button onClick={handleInterest} disabled={applied || loading} variant={applied ? "secondary" : "primary"}>
                  {loading ? (
                    <Motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground"
                    />
                  ) : applied ? (
                    t("job.applied")
                  ) : (
                    t("job.interested")
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
    </Motion.div >
  );
}
