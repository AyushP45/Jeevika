import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { walletAPI } from '../api';
import Navbar from '../components/Navbar';
import { Wallet as WalletIcon, ArrowDownRight, ArrowUpRight, Shield, IndianRupee, RefreshCw, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function Wallet() {
  const { user, updateUser } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(user?.wallet_balance || 0);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [action, setAction] = useState('deposit'); // deposit or withdraw

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [balRes, transRes] = await Promise.all([walletAPI.getBalance(), walletAPI.getTransactions()]);
      setBalance(balRes.data.balance);
      setTransactions(transRes.data);
      updateUser({ ...user, wallet_balance: balRes.data.balance });
    } catch (err) { toast.error('Failed to load wallet data'); }
    finally { setLoading(false); }
  };

  const handleTransaction = async (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount) || amount <= 0) return toast.error('Enter a valid amount');
    
    try {
      setLoading(true);
      if (action === 'deposit') await walletAPI.deposit(amount);
      else await walletAPI.withdraw(amount);
      
      toast.success(action === 'deposit' ? 'Funds deposited to wallet' : 'Funds withdrawn to UPI');
      setAmount('');
      fetchData();
    } catch (err) { toast.error(err.response?.data?.error || 'Transaction failed'); }
  };

  const getTransactionIcon = (type) => {
    switch(type) {
      case 'deposit': return <ArrowDownRight className="text-success" size={20} />;
      case 'withdraw': return <ArrowUpRight className="text-danger" size={20} />;
      case 'escrow': return <Shield className="text-warning" size={20} />;
      case 'release': return <CheckCircle className="text-primary-light" size={20} />;
      case 'boost': return <Zap className="text-accent" size={20} />;
      default: return <RefreshCw className="text-text-muted" size={20} />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-text pt-20 pb-12">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 grid md:grid-cols-3 gap-8">
        
        {/* Left Col: Balance & Actions */}
        <div className="md:col-span-1 space-y-6">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card p-6 bg-gradient-to-br from-primary/20 to-accent/10 border-primary/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center gap-2 text-text-muted mb-4"><WalletIcon size={18}/> Available Balance</div>
            <div className="text-4xl font-bold mb-1 flex items-center"><IndianRupee size={28}/>{balance}</div>
            <div className="text-xs text-text-muted mt-4 flex items-center gap-1">
              <Shield size={12} className="text-primary-light"/> 100% Escrow Protected
            </div>
          </motion.div>

          <div className="card p-6">
            <div className="flex gap-2 mb-6">
              <button onClick={() => setAction('deposit')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${action==='deposit'?'bg-primary text-white':'bg-surface-light text-text-muted'}`}>Deposit</button>
              <button onClick={() => setAction('withdraw')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${action==='withdraw'?'bg-surface-lighter text-white':'bg-surface-light text-text-muted'}`}>Withdraw</button>
            </div>
            <form onSubmit={handleTransaction} className="space-y-4">
              <div>
                <label className="block text-xs text-text-muted mb-1">Amount (₹)</label>
                <div className="relative">
                  <IndianRupee size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input type="number" required min="1" value={amount} onChange={e=>setAmount(e.target.value)} className="input-field pl-9" placeholder="1000" />
                </div>
              </div>
              <button type="submit" disabled={loading} className={`w-full py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 ${action==='deposit'?'btn-primary':'bg-surface-lighter hover:bg-surface-light border border-border text-text transition'}`}>
                {action === 'deposit' ? 'Add Funds' : 'Withdraw to UPI'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Col: Transactions */}
        <div className="md:col-span-2">
          <div className="card p-6 h-full">
            <h2 className="text-xl font-bold mb-6">Transaction History</h2>
            
            {loading ? (
              <div className="py-12 text-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
            ) : transactions.length > 0 ? (
              <div className="space-y-4">
                {transactions.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-4 border border-border/50 rounded-xl bg-surface-light/30">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center">
                        {getTransactionIcon(t.type)}
                      </div>
                      <div>
                        <div className="font-semibold text-sm capitalize">{t.type} {t.job_title ? `- ${t.job_title}` : ''}</div>
                        <div className="text-xs text-text-muted mt-0.5">{new Date(t.created_at).toLocaleString()} • {t.description}</div>
                      </div>
                    </div>
                    <div className={`font-bold ${['deposit','release'].includes(t.type) && t.to_user_id === user.id ? 'text-success' : 'text-danger'}`}>
                      {['deposit','release'].includes(t.type) && t.to_user_id === user.id ? '+' : '-'}₹{t.amount}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-text-muted">
                <RefreshCw size={32} className="mx-auto mb-3 opacity-50" />
                <p>No transactions yet.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
