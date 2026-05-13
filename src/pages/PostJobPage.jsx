import { useNavigate } from "react-router-dom";
import { ImagePlus, Send } from "lucide-react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useState } from "react";
import { Button } from "../components/ui/Button.jsx";
import { Card } from "../components/ui/Card.jsx";
import { useJeevikaStore } from "../lib/store.js";
import { jobsApi } from "../lib/api.js";
import { MapPicker } from "../components/MapPicker.jsx";
import { MapPin, Target, Loader2 } from "lucide-react";
import { compressImage } from "../lib/imageUtils.js";

const jobSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  type: z.string(),
  category: z.string().min(2, "Required"),
  budget: z.coerce.number().min(100, "Budget must be at least ₹100"),
  location: z.string().min(3, "Required"),
  duration: z.string().min(1, "Required"),
  escrow: z.string(),
  description: z.string().min(10, "Description must be at least 10 characters"),
  startDate: z.string().min(1, "Required"),
  workersNeeded: z.coerce.number().min(1, "Must be at least 1")
});

export function PostJobPage() {
  const { user, addJob, updateUser } = useJeevikaStore();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [position, setPosition] = useState(null);
  const [sitePhoto, setSitePhoto] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: "",
      type: "Labor",
      category: "",
      budget: "",
      location: user.location || "",
      duration: "",
      escrow: "Ready",
      description: "",
      startDate: new Date().toISOString().split('T')[0],
      workersNeeded: 1
    }
  });

  const handleGetCurrentLocation = () => {
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsLocating(false);
        toast.success("Location detected!");
      },
      () => {
        setIsLocating(false);
        toast.error("Failed to detect location.");
      }
    );
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const compressed = await compressImage(ev.target.result, 1000, 0.7);
        setSitePhoto(compressed);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const payload = {
        title: data.title,
        type: data.type,
        category: data.category,
        budget: data.budget,
        location: data.location,
        duration: data.duration,
        escrowStatus: data.lockBudgetNow ? "Locked" : "Ready",
        lockBudgetNow: data.lockBudgetNow,
        description: data.description,
        startDate: data.startDate,
        workersNeeded: data.workersNeeded,
        sitePhoto,
        coordinates: position ? JSON.stringify(position) : null
      };
      const job = await jobsApi.create(payload);
      
      // Update local store for instant UI update
      addJob({
        ...job,
        employer: user.name,
        postedBy: user.name,
        rating: user.rating || 4.5,
        distance: "New",
        escrow: job.escrowStatus
      });

      // If money was locked, update the local user wallet
      if (data.lockBudgetNow) {
        updateUser({ wallet: user.wallet - data.budget });
      }

      toast.success(data.lockBudgetNow ? "Job posted and Escrow locked!" : "Job requirement posted!");
      navigate("/jobs");
    } catch (err) {
      toast.error(err.message || "Failed to post job. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-4xl"
    >
      <p className="text-sm font-semibold text-primary">Post job</p>
      <h1 className="mt-2 text-4xl font-black">Create a fast, clear requirement.</h1>
      <Card className="mt-6 p-6">
        <form className="grid gap-5" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold">
              Title
              <input {...register("title")} className="field" placeholder="e.g. 4 painters for exterior house work" />
              {errors.title && <span className="text-xs text-destructive">{errors.title.message}</span>}
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Requirement type
              <select {...register("type")} className="field">
                <option>Labor</option>
                <option>Equipment</option>
                <option>Material</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Skill / category
              <input {...register("category")} className="field" placeholder="e.g. Painter, Plumber, Tractor" />
              {errors.category && <span className="text-xs text-destructive">{errors.category.message}</span>}
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Budget (₹)
              <input {...register("budget")} className="field" type="number" placeholder="e.g. 12000" />
              {errors.budget && <span className="text-xs text-destructive">{errors.budget.message}</span>}
            </label>
            <div className="grid gap-2 md:col-span-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Job Location (Tap map or use GPS)</p>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleGetCurrentLocation}
                  disabled={isLocating}
                >
                  {isLocating ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Target className="h-3 w-3 mr-2" />}
                  Use Current GPS
                </Button>
              </div>
              <MapPicker position={position} setPosition={setPosition} />
              <input {...register("location")} className="field mt-2" placeholder="e.g. Rajarampuri, Kolhapur" />
              {errors.location && <span className="text-xs text-destructive">{errors.location.message}</span>}
            </div>
            <label className="grid gap-2 text-sm font-semibold">
              Work Date
              <input {...register("startDate")} className="field" type="date" />
              {errors.startDate && <span className="text-xs text-destructive">{errors.startDate.message}</span>}
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Vacancies (Workers Needed)
              <input {...register("workersNeeded")} className="field" type="number" placeholder="e.g. 3" />
              {errors.workersNeeded && <span className="text-xs text-destructive">{errors.workersNeeded.message}</span>}
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Duration
              <input {...register("duration")} className="field" placeholder="e.g. 2 days, 4 hours" />
              {errors.duration && <span className="text-xs text-destructive">{errors.duration.message}</span>}
            </label>
            <div className="md:col-span-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 p-5 mt-2">
              <div className="flex items-start gap-4">
                <input 
                  type="checkbox" 
                  id="lockBudgetNow" 
                  {...register("lockBudgetNow")}
                  className="mt-1.5 h-5 w-5 rounded border-amber-500/50 bg-slate-900 text-amber-500 focus:ring-amber-500"
                />
                <label htmlFor="lockBudgetNow" className="cursor-pointer">
                  <p className="font-bold text-amber-200">Secure this job with immediate Escrow locking</p>
                  <p className="text-sm text-amber-200/60 mt-1">Funds will be deducted from your wallet and held by Jeevika. This builds massive trust—workers are 5x more likely to apply to pre-funded jobs.</p>
                </label>
              </div>
            </div>
          </div>
          <label className="grid gap-2 text-sm font-semibold">
            Description
            <textarea
              {...register("description")}
              className="field min-h-32 resize-y"
              placeholder="Describe the work, requirements, and any special instructions..."
            />
            {errors.description && <span className="text-xs text-destructive">{errors.description.message}</span>}
          </label>
          <div className="relative overflow-hidden rounded-2xl border border-dashed border-white/20 p-5 hover:bg-white/5 transition-colors cursor-pointer">
            {sitePhoto ? (
              <div className="flex items-center gap-4">
                <img src={sitePhoto} className="h-20 w-20 rounded-xl object-cover" alt="Site" />
                <div>
                  <p className="font-semibold">Site Photo Added</p>
                  <p className="text-sm text-muted-foreground">Click to change</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center py-4">
                <ImagePlus className="h-10 w-10 text-primary opacity-50" />
                <p className="mt-2 font-semibold">Add Site/Equipment Photo</p>
                <p className="text-sm text-muted-foreground text-center">Help workers understand the site or requirement visually</p>
              </div>
            )}
            <input type="file" accept="image/*" onChange={handlePhotoUpload} className="absolute inset-0 cursor-pointer opacity-0" />
          </div>
          <Button className="w-full md:w-auto" disabled={isSubmitting}>
            {isSubmitting ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="h-5 w-5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground"
              />
            ) : (
              <>
                <Send className="h-4 w-4" />
                Publish requirement
              </>
            )}
          </Button>
        </form>
      </Card>
    </motion.div>
  );
}
