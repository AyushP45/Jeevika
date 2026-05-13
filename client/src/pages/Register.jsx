import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../AuthContext';
import { Mail, Lock, User, Phone, MapPin, Briefcase, Building, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('worker');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', mobile: '', password: '', location: '', upi_id: '',
    experience: '', company_name: '', skills: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.mobile) {
      return toast.error('Please fill required fields');
    }
    setLoading(true);
    try {
      const payload = { ...form, role };
      if (role === 'worker' && form.skills) {
        payload.skills = form.skills.split(',').map(s => s.trim());
      }
      const user = await register(payload);
      toast.success('Registration successful!');
      navigate(user.role === 'worker' ? '/worker' : '/employer');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-text pt-20 pb-12">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Join Jeevika</h1>
            <p className="text-text-muted">Create an account to find work or hire talent safely.</p>
          </div>

          <div className="flex gap-4 mb-8">
            <button
              type="button"
              onClick={() => setRole('worker')}
              className={`flex-1 py-3 rounded-xl border font-medium transition-all ${
                role === 'worker' ? 'border-primary bg-primary/10 text-primary-light' : 'border-border bg-surface-light text-text-muted hover:border-text-muted'
              }`}
            >
              I am a Worker
            </button>
            <button
              type="button"
              onClick={() => setRole('employer')}
              className={`flex-1 py-3 rounded-xl border font-medium transition-all ${
                role === 'employer' ? 'border-primary bg-primary/10 text-primary-light' : 'border-border bg-surface-light text-text-muted hover:border-text-muted'
              }`}
            >
              I want to Hire
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">Full Name *</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input-field pl-10" placeholder="John Doe" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">Mobile Number *</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input type="tel" required value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value})} className="input-field pl-10" placeholder="9876543210" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">Email Address *</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="input-field pl-10" placeholder="john@example.com" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">Password *</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input type="password" required value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="input-field pl-10" placeholder="••••••••" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">Location</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input type="text" value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="input-field pl-10" placeholder="Mumbai, MH" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">UPI ID (For Payments)</label>
                <input type="text" value={form.upi_id} onChange={e => setForm({...form, upi_id: e.target.value})} className="input-field" placeholder="john@upi" />
              </div>

              {role === 'worker' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-2">Skills (comma separated)</label>
                    <div className="relative">
                      <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                      <input type="text" value={form.skills} onChange={e => setForm({...form, skills: e.target.value})} className="input-field pl-10" placeholder="Electrician, Plumber" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-2">Experience</label>
                    <input type="text" value={form.experience} onChange={e => setForm({...form, experience: e.target.value})} className="input-field" placeholder="e.g. 5 Years" />
                  </div>
                </>
              ) : (
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-text-muted mb-2">Company/Individual Name</label>
                  <div className="relative">
                    <Building size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input type="text" value={form.company_name} onChange={e => setForm({...form, company_name: e.target.value})} className="input-field pl-10" placeholder="Your Company Name" />
                  </div>
                </div>
              )}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-6 flex items-center justify-center gap-2 py-3">
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Create Account <ChevronRight size={18} /></>}
            </button>
          </form>

          <p className="mt-6 text-center text-text-muted text-sm">
            Already have an account? <Link to="/login" className="text-primary-light hover:underline font-medium">Log In</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
