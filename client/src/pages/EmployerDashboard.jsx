import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { jobsAPI } from '../api';
import Navbar from '../components/Navbar';
import { Briefcase, MapPin, Plus, Zap, Users, Shield, Clock, CheckCircle, ChevronRight, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function EmployerDashboard() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPostModal, setShowPostModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', payment: '', location: '', workers_needed: 1, duration: '', skills: '' });

  useEffect(() => { fetchJobs(); }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await jobsAPI.getMyJobs();
      setJobs(res.data);
    } catch (err) { toast.error('Failed to load jobs'); }
    finally { setLoading(false); }
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (parseFloat(form.payment) * parseInt(form.workers_needed) > parseFloat(user?.wallet_balance || 0)) {
      return toast.error('Insufficient wallet balance to escrow this payment. Please deposit funds first.');
    }
    try {
      const payload = { ...form, skills: form.skills ? form.skills.split(',').map(s => s.trim()) : [] };
      await jobsAPI.create(payload);
      toast.success('Job posted and payment escrowed!');
      setShowPostModal(false);
      setForm({ title: '', description: '', payment: '', location: '', workers_needed: 1, duration: '', skills: '' });
      fetchJobs();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to post job'); }
  };

  return (
    <div className="min-h-screen bg-background text-text pt-20 pb-12">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Header & Stats */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Employer Dashboard</h1>
            <p className="text-text-muted mt-1">Manage your job postings and applicants safely.</p>
          </div>
          <button onClick={() => setShowPostModal(true)} className="btn-primary py-2.5 px-6 flex items-center gap-2">
            <Plus size={18} /> Post New Job
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Active Jobs', val: jobs.filter(j => j.status === 'open' || j.status === 'in_progress').length, icon: Briefcase, color: 'text-primary-light' },
            { label: 'Total Applicants', val: jobs.reduce((a,b) => a + parseInt(b.applicant_count || 0), 0), icon: Users, color: 'text-accent' },
            { label: 'Escrow Protected', val: 'Active', icon: Shield, color: 'text-success' },
            { label: 'Wallet Balance', val: `₹${user?.wallet_balance || 0}`, icon: Zap, color: 'text-warning' },
          ].map((s, i) => (
            <div key={i} className="card p-5">
              <div className="flex justify-between items-start mb-2">
                <span className="text-text-muted text-sm font-medium">{s.label}</span>
                <s.icon size={18} className={s.color} />
              </div>
              <div className="text-2xl font-bold">{s.val}</div>
            </div>
          ))}
        </div>

        {/* Jobs List */}
        <div className="card p-6">
          <h2 className="text-xl font-bold mb-6">Your Posted Jobs</h2>
          {loading ? (
            <div className="py-12 text-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
          ) : jobs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/50 text-text-muted text-sm">
                    <th className="pb-3 font-medium">Job Details</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Payment (Escrow)</th>
                    <th className="pb-3 font-medium">Applicants</th>
                    <th className="pb-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {jobs.map(job => (
                    <tr key={job.id} className="border-b border-border/20 hover:bg-surface-light/30 transition">
                      <td className="py-4 pr-4">
                        <div className="font-semibold text-base mb-1">{job.title}</div>
                        <div className="text-text-muted flex gap-3">
                          <span className="flex items-center gap-1"><MapPin size={12}/> {job.location || 'Any'}</span>
                          <span className="flex items-center gap-1"><Clock size={12}/> {new Date(job.created_at).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="py-4">
                        {job.status === 'open' && <span className="badge badge-primary">Open</span>}
                        {job.status === 'in_progress' && <span className="badge badge-warning">In Progress</span>}
                        {job.status === 'completed' && <span className="badge badge-success">Completed</span>}
                        {job.is_boosted && <span className="badge badge-accent ml-2">Boosted</span>}
                      </td>
                      <td className="py-4 font-medium">₹{job.payment} <span className="text-text-muted text-xs">/worker</span></td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <Users size={16} className="text-text-muted"/> {job.applicant_count} 
                          <span className="text-success text-xs">({job.accepted_count} Hired)</span>
                        </div>
                      </td>
                      <td className="py-4">
                        <Link to={`/jobs/${job.id}`} className="btn-secondary py-1.5 px-3 text-xs inline-flex items-center gap-1">
                          Manage <ChevronRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText size={48} className="mx-auto text-text-muted mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-1">No Jobs Posted Yet</h3>
              <p className="text-text-muted mb-4">Post a job to find trusted workers and securely hold payment in escrow.</p>
              <button onClick={() => setShowPostModal(true)} className="btn-primary py-2 px-4 text-sm">Post Your First Job</button>
            </div>
          )}
        </div>

      </div>

      {/* Post Job Modal */}
      <AnimatePresence>
        {showPostModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="card w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Post a New Job</h2>
                <button onClick={() => setShowPostModal(false)} className="text-text-muted hover:text-text">&times;</button>
              </div>

              <div className="mb-6 p-4 rounded-xl bg-primary/10 border border-primary/20 flex gap-3">
                <Shield className="text-primary-light shrink-0" size={24} />
                <div className="text-sm text-primary-light/90">
                  <strong className="block text-primary-light mb-1">Escrow Payment Required</strong>
                  Posting this job requires funds in your Jeevika Wallet. The total amount (Payment × Workers Needed) will be held safely in escrow and only released to the workers when you confirm job completion.
                </div>
              </div>

              <form onSubmit={handlePost} className="space-y-4">
                <div>
                  <label className="block text-sm text-text-muted mb-1">Job Title</label>
                  <input type="text" required value={form.title} onChange={e=>setForm({...form, title: e.target.value})} className="input-field" placeholder="e.g. Need 2 Painters for 3 Days" />
                </div>
                <div>
                  <label className="block text-sm text-text-muted mb-1">Description</label>
                  <textarea required value={form.description} onChange={e=>setForm({...form, description: e.target.value})} className="input-field min-h-[100px]" placeholder="Detailed description of the work..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-text-muted mb-1">Payment per Worker (₹)</label>
                    <input type="number" required min="100" value={form.payment} onChange={e=>setForm({...form, payment: e.target.value})} className="input-field" placeholder="1000" />
                  </div>
                  <div>
                    <label className="block text-sm text-text-muted mb-1">Workers Needed</label>
                    <input type="number" required min="1" value={form.workers_needed} onChange={e=>setForm({...form, workers_needed: e.target.value})} className="input-field" placeholder="1" />
                  </div>
                  <div>
                    <label className="block text-sm text-text-muted mb-1">Location</label>
                    <input type="text" value={form.location} onChange={e=>setForm({...form, location: e.target.value})} className="input-field" placeholder="e.g. Andheri, Mumbai" />
                  </div>
                  <div>
                    <label className="block text-sm text-text-muted mb-1">Duration</label>
                    <input type="text" value={form.duration} onChange={e=>setForm({...form, duration: e.target.value})} className="input-field" placeholder="e.g. 3 Days" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-text-muted mb-1">Required Skills (Comma separated)</label>
                  <input type="text" value={form.skills} onChange={e=>setForm({...form, skills: e.target.value})} className="input-field" placeholder="e.g. Painter, Wall Putty" />
                </div>
                
                <div className="pt-4 border-t border-border mt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowPostModal(false)} className="btn-secondary py-2 px-4">Cancel</button>
                  <button type="submit" className="btn-primary py-2 px-6 flex items-center gap-2">
                    <Shield size={16} /> Pay & Post Job
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
