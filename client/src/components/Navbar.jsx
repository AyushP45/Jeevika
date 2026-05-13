import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Menu, X, Wallet, LogOut, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const dash = user?.role === 'worker' ? '/worker' : user?.role === 'employer' ? '/employer' : '/admin';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-soft border-b border-border shadow-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-3xl bg-primary/15 text-primary-dark flex items-center justify-center font-semibold text-sm shadow-soft">J</div>
            <span className="text-xl font-semibold tracking-tight">Jeevika</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {user ? (
              <>
                <Link to={dash} className="text-text-muted hover:text-text transition flex items-center gap-2 text-sm font-medium">
                  <LayoutDashboard size={16} /> Dashboard
                </Link>
                <Link to="/wallet" className="text-text-muted hover:text-text transition flex items-center gap-2 text-sm font-medium">
                  <Wallet size={16} /> Wallet
                </Link>
                <span className="text-text-muted text-sm">Hi, {user.name?.split(' ')[0]}</span>
                <button onClick={logout} className="btn-secondary text-sm py-2 px-4 flex items-center gap-2">
                  <LogOut size={14} /> Logout
                </button>
              </>
            ) : (
              <>
                <a href="#features" className="text-text-muted hover:text-text transition text-sm font-medium">Features</a>
                <a href="#how-it-works" className="text-text-muted hover:text-text transition text-sm font-medium">How it Works</a>
                <a href="#faq" className="text-text-muted hover:text-text transition text-sm font-medium">FAQ</a>
                <Link to="/login" className="btn-secondary text-sm py-2 px-4">Log In</Link>
                <Link to="/register" className="btn-primary text-sm py-2 px-4">Get Started</Link>
              </>
            )}
          </div>

          <button onClick={() => setOpen(!open)} className="md:hidden text-text-muted">
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="md:hidden glass border-t border-border overflow-hidden">
            <div className="px-4 py-4 space-y-3">
              {user ? (
                <>
                  <Link to={dash} onClick={() => setOpen(false)} className="block text-text-muted hover:text-text py-2">Dashboard</Link>
                  <Link to="/wallet" onClick={() => setOpen(false)} className="block text-text-muted hover:text-text py-2">Wallet</Link>
                  <button onClick={() => { logout(); setOpen(false); }} className="btn-secondary w-full text-sm py-2">Logout</button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setOpen(false)} className="block text-text-muted hover:text-text py-2">Log In</Link>
                  <Link to="/register" onClick={() => setOpen(false)} className="btn-primary block text-center text-sm py-2">Get Started</Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
