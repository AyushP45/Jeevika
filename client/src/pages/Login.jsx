import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../AuthContext';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Briefcase, ShieldCheck, MessageSquare, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState('password'); // 'password' or 'otp'

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Please fill all fields');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}!`);
      navigate(user.role === 'worker' ? '/worker' : user.role === 'employer' ? '/employer' : '/admin');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  };

  const handleGoogleLogin = () => {
    toast.error('Google Sign-In is not configured yet.');
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white font-sans flex flex-col md:flex-row overflow-hidden relative">
      
      {/* Background Glow */}
      <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-[#facc15] opacity-[0.03] rounded-full blur-[120px] pointer-events-none -translate-x-1/2 -translate-y-1/4" />

      {/* Left Side: Branding & Features */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 lg:p-16 xl:p-20 relative z-10 border-r border-[#1f1f22]">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl border border-[#27272a] bg-[#18181b] flex items-center justify-center">
              <Briefcase className="text-[#facc15] w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">Jeevika</span>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center border border-[#27272a] rounded-full px-4 py-1.5 mb-8 bg-[#18181b]/50 backdrop-blur-sm">
            <span className="text-[10px] font-bold tracking-widest text-[#facc15] uppercase">Jeevika Worker Platform</span>
          </div>

          {/* Headlines */}
          <h1 className="text-5xl xl:text-6xl font-extrabold tracking-tight mb-2 text-white">Your work.</h1>
          <h1 className="text-5xl xl:text-6xl font-extrabold tracking-tight mb-6 text-[#facc15]">Your growth.</h1>
          
          <p className="text-[#a1a1aa] text-lg max-w-md mb-12 leading-relaxed">
            Find jobs, track progress, and build your career — all in one platform.
          </p>

          {/* Feature Cards */}
          <div className="space-y-4 max-w-md">
            <div className="flex items-start gap-4 p-4 rounded-2xl border border-[#27272a] bg-[#18181b]/60 hover:bg-[#18181b] transition-colors">
              <div className="bg-[#27272a] p-2.5 rounded-xl text-[#facc15]">
                <MapPin size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1">Precise matchmaking</h3>
                <p className="text-xs text-[#a1a1aa] leading-relaxed">Location-accurate job opportunities</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-2xl border border-[#27272a] bg-[#18181b]/60 hover:bg-[#18181b] transition-colors">
              <div className="bg-[#27272a] p-2.5 rounded-xl text-[#a1a1aa]">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1">Verified Employers</h3>
                <p className="text-xs text-[#a1a1aa] leading-relaxed">Prioritize safety and secure payments</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-2xl border border-[#27272a] bg-[#18181b]/60 hover:bg-[#18181b] transition-colors">
              <div className="bg-[#27272a] p-2.5 rounded-xl text-[#a1a1aa]">
                <MessageSquare size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1">Live status updates</h3>
                <p className="text-xs text-[#a1a1aa] leading-relaxed">Track your application in real time</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs text-[#71717a] mt-12">
          &copy; 2026 Jeevika &middot; Built for the community
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10">
        <div className="w-full max-w-[420px]">
          
          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center gap-3 mb-10 justify-center">
            <div className="w-10 h-10 rounded-xl border border-[#27272a] bg-[#18181b] flex items-center justify-center">
              <Briefcase className="text-[#facc15] w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">Jeevika</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2 tracking-tight">Welcome back</h2>
            <p className="text-[#a1a1aa] text-sm">Sign in to your Jeevika account</p>
          </div>

          {/* Form Tabs */}
          <div className="flex p-1 bg-[#18181b] rounded-xl mb-6 border border-[#27272a]">
            <div className="flex-1 text-center py-2 text-sm font-medium bg-[#27272a] text-white rounded-lg shadow-sm cursor-default">
              Sign In
            </div>
            <Link to="/register" className="flex-1 text-center py-2 text-sm font-medium text-[#a1a1aa] hover:text-white transition-colors">
              Sign Up
            </Link>
          </div>

          {/* Login Methods */}
          <div className="flex gap-3 mb-8">
            <button 
              onClick={() => setLoginMethod('password')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium border transition-colors ${loginMethod === 'password' ? 'bg-transparent border-[#facc15]/30 text-[#facc15]' : 'bg-[#18181b] border-[#27272a] text-[#a1a1aa] hover:text-white'}`}
            >
              <Lock size={16} className={loginMethod === 'password' ? 'text-[#facc15]' : ''} /> Password
            </button>
            <button 
              onClick={() => setLoginMethod('otp')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium border transition-colors ${loginMethod === 'otp' ? 'bg-transparent border-[#facc15]/30 text-[#facc15]' : 'bg-[#18181b] border-[#27272a] text-[#a1a1aa] hover:text-white'}`}
            >
              <ShieldCheck size={16} /> OTP
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] uppercase tracking-wider font-bold text-[#71717a] mb-2">Email Address</label>
              <div className="relative group">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#71717a] group-focus-within:text-[#facc15] transition-colors" />
                <input 
                  type="email" 
                  value={form.email} 
                  onChange={e => setForm({...form, email: e.target.value})}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-[#27272a] bg-[#09090b] text-sm focus:border-[#facc15] focus:ring-1 focus:ring-[#facc15] transition-all outline-none text-white placeholder:text-[#52525b]" 
                  placeholder="you@example.com" 
                />
              </div>
            </div>

            {loginMethod === 'password' && (
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-[#71717a] mb-2">Password</label>
                <div className="relative group">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#71717a] group-focus-within:text-[#facc15] transition-colors" />
                  <input 
                    type={showPass ? 'text' : 'password'} 
                    value={form.password} 
                    onChange={e => setForm({...form, password: e.target.value})}
                    className="w-full pl-11 pr-11 py-3.5 rounded-xl border border-[#27272a] bg-[#09090b] text-sm focus:border-[#facc15] focus:ring-1 focus:ring-[#facc15] transition-all outline-none text-white placeholder:text-[#52525b]" 
                    placeholder="Your password" 
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#71717a] hover:text-white transition-colors">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full bg-[#facc15] hover:bg-[#eab308] text-black font-semibold rounded-xl py-3.5 mt-2 flex items-center justify-center gap-2 transition-colors disabled:opacity-70">
              {loading ? <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <>Sign In <ArrowRight size={18} /></>}
            </button>
          </form>
          
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-[#27272a]"></div>
            <span className="text-[10px] text-[#71717a] font-semibold lowercase">or</span>
            <div className="flex-1 h-px bg-[#27272a]"></div>
          </div>

          {/* Google Sign-in Button */}
          <button 
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-[#27272a] bg-[#18181b] hover:bg-[#27272a] transition-all text-sm font-medium text-white"
          >
            <div className="w-6 h-6 bg-white rounded flex items-center justify-center mr-1">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            </div>
            Sign in with Google
          </button>

          <div className="mt-8 text-center">
            <p className="text-[#a1a1aa] text-sm">
              New here? <Link to="/register" className="text-[#facc15] hover:underline font-semibold">Create an account</Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
