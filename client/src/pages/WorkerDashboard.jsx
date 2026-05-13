import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { jobsAPI } from '../api';
import Navbar from '../components/Navbar';
import { Briefcase, MapPin, Search, Filter, IndianRupee, Clock, CheckCircle, Shield, Star, Award, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function WorkerDashboard() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ skill: '', location: '' });

  useEffect(() => {
    fetchJobs();
  }, [filters]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await jobsAPI.getAll(filters);
      setJobs(res.data);
    } catch (err) {
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (id) => {
    try {
      await jobsAPI.apply(id);
      toast.success('Successfully applied for the job!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to apply');
    }
  };

  return (
    <div className="min-h-screen bg-background text-text pt-20 pb-12">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 grid lg:grid-cols-4 gap-8">
        
        {/* Left Sidebar - Profile */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
            <div className="flex items-center gap-4 mb-6 relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-2xl font-bold">
                {user?.name?.[0]}
              </div>
              <div>
                <h2 className="font-bold text-lg">{user?.name}</h2>
                <div className="flex items-center gap-1 text-text-muted text-sm">
                  <MapPin size={14} /> {user?.location || 'India'}
                </div>
              </div>
            </div>

            <div className="space-y-4 border-t border-border/50 pt-4 relative">
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-muted">Status</span>
                {user?.is_verified ? (
                  <span className="badge badge-success"><CheckCircle size={12} /> Verified</span>
                ) : (
                  <span className="badge badge-warning">Pending Review</span>
                )}
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-muted">Jobs Completed</span>
                <span className="font-semibold text-text">{user?.completed_jobs || 0}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-muted">Rating</span>
                <span className="font-semibold text-warning flex items-center gap-1"><Star size={14} className="fill-warning" /> {user?.avg_rating || 'New'}</span>
              </div>
            </div>

            {user?.badges?.length > 0 && (
              <div className="mt-6 border-t border-border/50 pt-4">
                <h3 className="text-sm font-semibold text-text-muted mb-3">Badges</h3>
                <div className="flex flex-wrap gap-2">
                  {user.badges.map((b, i) => (
                    <span key={i} className="badge badge-primary bg-primary/20 flex gap-1 items-center">
                      <Award size={12} /> {b.badge_type}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {user?.skills?.length > 0 && (
              <div className="mt-6 border-t border-border/50 pt-4">
                <h3 className="text-sm font-semibold text-text-muted mb-3">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {user.skills.map((s, i) => (
                    <span key={i} className="px-2 py-1 bg-surface-lighter rounded-md text-xs font-medium text-text-muted">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content - Job Feed */}
        <div className="lg:col-span-3 space-y-6">
          <div className="card p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex-1 w-full relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input type="text" placeholder="Search by skill (e.g. Electrician)" className="input-field pl-10" 
                value={filters.skill} onChange={(e) => setFilters({...filters, skill: e.target.value})} />
            </div>
            <div className="flex-1 w-full relative">
              <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input type="text" placeholder="Location" className="input-field pl-10"
                value={filters.location} onChange={(e) => setFilters({...filters, location: e.target.value})} />
            </div>
            <button className="btn-secondary px-4 py-2 shrink-0 flex items-center gap-2 h-full"><Filter size={18} /> Filters</button>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="py-20 text-center"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
            ) : jobs.length > 0 ? (
              jobs.map(job => (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} key={job.id} className="card p-6 flex flex-col sm:flex-row gap-6 items-start">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        {job.is_boosted && <span className="badge badge-accent mb-2 mr-2">🔥 URGENT</span>}
                        <h3 className="text-xl font-bold">{job.title}</h3>
                        <p className="text-text-muted text-sm mt-1">{job.employer_name} {job.company_name ? `• ${job.company_name}` : ''}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-success flex items-center gap-1 justify-end"><IndianRupee size={20} />{job.payment}</div>
                        <div className="text-xs text-text-muted flex items-center gap-1 justify-end mt-1"><Shield size={12} className="text-primary-light" /> Escrow Protected</div>
                      </div>
                    </div>
                    
                    <p className="text-sm text-text-muted line-clamp-2">{job.description}</p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-text-muted pt-2">
                      <div className="flex items-center gap-1.5"><MapPin size={16} /> {job.location || 'Anywhere'}</div>
                      <div className="flex items-center gap-1.5"><Clock size={16} /> {job.duration || 'Not specified'}</div>
                      <div className="flex items-center gap-1.5"><Briefcase size={16} /> {job.workers_needed} Workers Needed</div>
                    </div>

                    {job.skills && job.skills.length > 0 && (
                      <div className="flex gap-2 pt-2">
                        {job.skills.map((s, i) => (
                          <span key={i} className="px-2 py-1 bg-surface-lighter rounded text-xs text-text-muted">{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="w-full sm:w-auto shrink-0 flex flex-col gap-2">
                    <button onClick={() => handleApply(job.id)} className="btn-primary w-full sm:w-auto py-2.5 px-6">Apply Now</button>
                    <span className="text-xs text-text-muted text-center">{job.applicant_count} applied</span>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="card py-16 text-center">
                <div className="w-16 h-16 bg-surface-light rounded-full flex items-center justify-center mx-auto mb-4"><Search size={24} className="text-text-muted" /></div>
                <h3 className="text-xl font-bold mb-2">No jobs found</h3>
                <p className="text-text-muted">Try adjusting your filters or search terms.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
