import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Award, Camera, MapPin, Star, UserRoundCheck, Loader2, CheckCircle2, Briefcase } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Badge, Card } from "../components/ui/Card.jsx";
import { StatCard } from "../components/StatCard.jsx";
import { Button } from "../components/ui/Button.jsx";
import { useJeevikaStore } from "../lib/store.js";
import { initials } from "../lib/utils.js";
import { authApi, workersApi, jobsApi } from "../lib/api.js";
import { compressImage } from "../lib/imageUtils.js";

export function ProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, loginWithUser, jobs: allJobs } = useJeevikaStore();
  
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Hiring state
  const [showHireModal, setShowHireModal] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [isHiring, setIsHiring] = useState(false);

  const isOwnProfile = !id || id === currentUser.id;

  const [formData, setFormData] = useState({
    name: "",
    location: "",
    upi: "",
    skills: "",
    experience: ""
  });

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      try {
        if (isOwnProfile) {
          setProfileUser(currentUser);
          setFormData({
            name: currentUser.name || "",
            location: currentUser.location || "",
            upi: currentUser.upi || "",
            skills: currentUser.skills ? currentUser.skills.join(", ") : "",
            experience: currentUser.experience || ""
          });
        } else {
          const data = await workersApi.getById(id);
          setProfileUser(data);
        }
      } catch (err) {
        toast.error("Could not load profile");
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [id, currentUser, isOwnProfile, navigate]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        name: formData.name,
        location: formData.location,
        upi: formData.upi,
        skills: formData.skills.split(",").map(s => s.trim()).filter(Boolean),
        experience: formData.experience
      };
      
      const res = await authApi.updateProfile(payload);
      loginWithUser(res.user);
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const compressed = await compressImage(ev.target.result, type === 'id' ? 1200 : 800);
        
        let res;
        if (type === 'id') {
          res = await authApi.verify({ idProof: compressed });
        } else {
          const payload = {};
          if (type === 'profile') payload.profilePhoto = compressed;
          if (type === 'work') {
            payload.workSamples = [...(currentUser.workSamples || []), compressed];
          }
          res = await authApi.updateProfile(payload);
        }

        loginWithUser(res.user);
        toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} uploaded!`);
      } catch (err) {
        toast.error("Failed to process image.");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDirectHire = async () => {
    if (!selectedJobId) {
      toast.error("Please select a job first");
      return;
    }
    
    const job = allJobs.find(j => j.id === selectedJobId);
    if (!job) return;

    setIsHiring(true);
    try {
      await jobsApi.hire(selectedJobId, profileUser.id, job.budget);
      toast.success(`Hired ${profileUser.name} for ${job.title}!`);
      setShowHireModal(false);
      navigate("/active-contracts");
    } catch (err) {
      toast.error(err.message || "Hiring failed");
    } finally {
      setIsHiring(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  const myOpenJobs = allJobs.filter(j => j.employerId === currentUser.id && !j.workerId);

  return (
    <>
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="grid gap-6 lg:grid-cols-[360px_1fr]"
    >
      <Card className="p-6 h-fit">
        <div className="grid place-items-center text-center">
          <div className="relative group cursor-pointer">
            <div className="grid h-28 w-28 place-items-center rounded-[2rem] bg-gradient-to-br from-emerald-300 to-violet-500 text-4xl font-black text-slate-950 overflow-hidden">
              {profileUser.profilePhoto ? (
                <img src={profileUser.profilePhoto} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                initials(profileUser.name)
              )}
            </div>
            {isOwnProfile && (
              <>
                <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'profile')} className="absolute inset-0 cursor-pointer opacity-0 z-10" />
                <div className="absolute inset-0 grid place-items-center rounded-[2rem] bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none">
                  <Camera className="h-6 w-6 text-white" />
                </div>
              </>
            )}
          </div>
          
          {isEditing ? (
            <div className="w-full mt-5 grid gap-3">
              <input name="name" value={formData.name} onChange={handleChange} className="field text-center font-bold" placeholder="Full Name" />
              <input name="location" value={formData.location} onChange={handleChange} className="field text-center text-sm" placeholder="Location (e.g. Pune)" />
            </div>
          ) : (
            <>
              <h1 className="mt-5 text-3xl font-black">{profileUser.name}</h1>
              <p className="mt-2 flex items-center justify-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {profileUser.location || "Location not set"}
              </p>
            </>
          )}

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {(profileUser.badges || []).map((badge) => (
              <Badge key={badge} tone={badge === "Top Rated" ? "violet" : "emerald"}>
                {badge}
              </Badge>
            ))}
          </div>

          <div className="w-full mt-6 space-y-3">
            {isOwnProfile ? (
              isEditing ? (
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                  </Button>
                </div>
              ) : (
                <Button className="w-full" variant="outline" onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
              )
            ) : (
              currentUser.role === 'employer' && (
                <>
                  <Button className="w-full h-12 text-lg font-black" onClick={() => setShowHireModal(true)}>
                    Hire for Project
                  </Button>
                  <Button variant="outline" className="w-full h-12" onClick={() => navigate(`/chat/${profileUser.id}`)}>
                    Send Message
                  </Button>
                </>
              )
            )}
          </div>
        </div>
      </Card>
      
      <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Rating" value={profileUser.rating || "4.5"} detail="from verified work" icon={Star} />
          <StatCard label="Completed" value={profileUser.completedJobs || 0} detail="jobs and orders" icon={UserRoundCheck} />
          <StatCard label="Trust level" value="Gold" detail="fast response, low disputes" icon={Award} />
        </div>
        
        <Card>
          <h2 className="text-2xl font-black">Details</h2>
          
          {isOwnProfile && isEditing ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold">
                UPI ID
                <input name="upi" value={formData.upi} onChange={handleChange} className="field" placeholder="your@upi" />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Experience
                <input name="experience" value={formData.experience} onChange={handleChange} className="field" placeholder="e.g. 5 years" />
              </label>
              <label className="grid gap-2 text-sm font-semibold md:col-span-2">
                Skills (comma separated)
                <input name="skills" value={formData.skills} onChange={handleChange} className="field" placeholder="Painter, Plumber, Tractor" />
              </label>
            </div>
          ) : (
            <>
              <div className="mt-4 flex flex-wrap gap-2">
                {profileUser.skills && profileUser.skills.length > 0 ? (
                  profileUser.skills.map((skill) => (
                    <Badge key={skill}>{skill}</Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No skills added yet.</p>
                )}
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-white/5 p-5">
                  <h3 className="font-bold text-emerald-400">Verified Identity</h3>
                  <p className="mt-2 text-sm text-muted-foreground">Phone number verified. Profile photo approved. Platform terms accepted.</p>
                </div>
                <div className="rounded-2xl bg-white/5 p-5">
                  <h3 className="font-bold">Payment & Experience</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Experience: {profileUser.experience || "Not set"}<br />
                    Availability: {profileUser.availability ? "Available Now" : "Currently Busy"}
                  </p>
                </div>
              </div>
            </>
          )}
        </Card>
        
        {isOwnProfile && (
          <Card>
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black">Identity Verification</h2>
              <Badge tone={
                profileUser.verificationStatus === 'Verified' ? 'emerald' : 
                profileUser.verificationStatus === 'Pending' ? 'amber' : 
                profileUser.verificationStatus === 'Rejected' ? 'rose' : 'slate'
              }>
                {profileUser.verificationStatus || 'None'}
              </Badge>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Upload your Aadhaar or Voter ID to get the "Verified Worker" blue tick and increase your trust score.</p>
            <div className="mt-5 relative overflow-hidden rounded-2xl border-2 border-dashed border-white/20 p-6 text-center transition hover:bg-white/5 cursor-pointer">
              {profileUser.idProof ? (
                <div className="h-32 w-full overflow-hidden rounded-xl">
                  <img src={profileUser.idProof} alt="ID Proof" className="h-full w-full object-cover" />
                </div>
              ) : (
                <>
                  <UserRoundCheck className="mx-auto h-8 w-8 text-slate-400" />
                  <p className="mt-2 font-semibold">Upload ID Photo</p>
                  <p className="text-xs text-muted-foreground">Aadhaar, Voter ID, or PAN card</p>
                </>
              )}
              <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'id')} className="absolute inset-0 cursor-pointer opacity-0" />
            </div>
          </Card>
        )}

        <Card>
          <h2 className="text-2xl font-black">Visual Resume</h2>
          <p className="mt-2 text-sm text-muted-foreground">{isOwnProfile ? "Employers trust what they can see. Upload photos of your past work to win more jobs." : "Take a look at some of the past projects completed by this professional."}</p>
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {isOwnProfile && (
              <div className="relative flex aspect-square flex-col items-center justify-center rounded-2xl border-2 border-dashed border-emerald-500/50 bg-emerald-500/10 text-emerald-400 transition hover:bg-emerald-500/20 cursor-pointer">
                <Camera className="h-6 w-6" />
                <p className="mt-2 text-xs font-semibold">Add Photo</p>
                <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'work')} className="absolute inset-0 cursor-pointer opacity-0" />
              </div>
            )}
            {/* Real uploaded photos */}
            {(profileUser.workSamples || []).map((sample, i) => (
              <div key={i} className="aspect-square rounded-2xl bg-slate-800 relative overflow-hidden group">
                <img src={sample} alt={`Work sample ${i + 1}`} className="h-full w-full object-cover opacity-80" />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-2xl font-black">Recent reviews</h2>
          {[
            ["Meera Joshi", "Very punctual and clean painting work."],
            ["Patil Farms", "Team arrived early and finished harvesting on schedule."],
            ["Shinde Contractors", "Good communication and reliable completion."]
          ].map(([name, review]) => (
            <div key={name} className="mt-4 rounded-2xl bg-white/5 p-4">
              <p className="font-semibold">{name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{review}</p>
            </div>
          ))}
        </Card>
      </div>
    </motion.div>

    {/* Hire Modal */}
    <AnimatePresence>
      {showHireModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-md rounded-3xl bg-slate-900 border border-white/10 p-8 shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                <Briefcase className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black">Hire {profileUser.name}</h2>
                <p className="text-muted-foreground text-sm">Assign to one of your active posts</p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Select an open job</label>
              {myOpenJobs.length === 0 ? (
                <div className="p-4 rounded-2xl border border-dashed border-white/10 text-center">
                  <p className="text-sm text-muted-foreground">You don't have any open jobs to hire for.</p>
                  <Button variant="ghost" className="mt-2 text-xs" onClick={() => navigate("/post-job")}>Post a new job first</Button>
                </div>
              ) : (
                <div className="grid gap-2">
                  {myOpenJobs.map(job => (
                    <button 
                      key={job.id}
                      onClick={() => setSelectedJobId(job.id)}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition ${selectedJobId === job.id ? 'bg-primary/10 border-primary' : 'bg-white/5 border-white/5 hover:border-white/10'}`}
                    >
                      <div className="text-left">
                        <p className="font-bold">{job.title}</p>
                        <p className="text-xs text-muted-foreground">Budget: ₹{job.budget}</p>
                      </div>
                      {selectedJobId === job.id && <CheckCircle2 className="h-5 w-5 text-primary" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="ghost" onClick={() => setShowHireModal(false)}>Cancel</Button>
              <Button onClick={handleDirectHire} disabled={!selectedJobId || isHiring}>
                {isHiring ? "Hiring..." : "Confirm & Hire"}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </>
  );
}
