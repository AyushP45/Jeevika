import { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Clock3, LockKeyhole, ShieldCheck, Wallet, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Badge, Card } from "../components/ui/Card.jsx";
import { Button } from "../components/ui/Button.jsx";
import { useJeevikaStore } from "../lib/store.js";
import { formatINR } from "../lib/utils.js";
import { walletApi } from "../lib/api.js";

const statusTone = {
  Locked: "amber",
  Released: "emerald",
  Refunded: "violet",
  "Auto-release 32h": "sky" // Still used by demo data if present
};

export function WalletPage() {
  const { user, transactions, setTransactions, updateUser } = useJeevikaStore();
  const [loading, setLoading] = useState(true);
  const [locking, setLocking] = useState(false);
  const [depositing, setDepositing] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState("5000");

  // Fetch real transactions on mount
  useEffect(() => {
    let cancelled = false;
    async function fetchTransactions() {
      try {
        const data = await walletApi.transactions();
        if (!cancelled) setTransactions(data);
      } catch (err) {
        if (!cancelled) toast.error("Could not load latest transactions.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchTransactions();
    return () => { cancelled = true; };
  }, [setTransactions]);

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) return toast.error("Please enter a valid amount.");
    
    setDepositing(true);
    try {
      const res = await walletApi.deposit(amount);
      
      setTransactions([res.transaction, ...transactions]);
      updateUser({ wallet: res.updatedBalance });
      toast.success(`₹${amount} added to your wallet!`);
      setShowDepositModal(false);
    } catch (err) {
      toast.error(err.message || "Deposit failed. Please try again.");
    } finally {
      setDepositing(false);
    }
  };

  const handleRelease = async (txn) => {
    try {
      const updatedTxn = await walletApi.releaseEscrow(txn.id);
      setTransactions(transactions.map(t => t.id === txn.id ? updatedTxn : t));
      toast.success("Funds released successfully.");
    } catch (err) {
      toast.error(err.message || "Failed to release funds.");
    }
  };

  const handleRefund = async (txn) => {
    try {
      const updatedTxn = await walletApi.refundEscrow(txn.id);
      setTransactions(transactions.map(t => t.id === txn.id ? updatedTxn : t));
      updateUser({ wallet: updatedTxn.updatedBalance });
      toast.success("Funds refunded to wallet.");
    } catch (err) {
      toast.error(err.message || "Failed to refund.");
    }
  };

  // Calculate stats from actual transactions
  const lockedAmount = transactions.filter(t => t.status === "Locked").reduce((sum, t) => sum + t.amount, 0);
  const releasedAmount = transactions.filter(t => t.status === "Released").reduce((sum, t) => sum + t.amount, 0);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="grid gap-6 lg:grid-cols-[1fr_380px]"
    >
      <section className="grid gap-6">
        <Card className="overflow-hidden p-6 bg-gradient-to-br from-slate-900 to-slate-950 border-white/5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Badge tone="emerald" className="px-3 py-1">
                  <Wallet className="mr-2 h-4 w-4" />
                  Total Value
                </Badge>
                {lockedAmount > 0 && (
                  <Badge tone="amber" className="animate-pulse">
                    <LockKeyhole className="mr-1 h-3 w-3" />
                    Escrow Active
                  </Badge>
                )}
              </div>
              <h1 className="mt-5 text-6xl font-black tracking-tight">{formatINR((user.wallet || 0) + lockedAmount)}</h1>
              <p className="mt-3 text-muted-foreground max-w-sm">Manage your earnings, project deposits, and secure escrow payments in one place.</p>
            </div>
            <div className="flex flex-col gap-3 w-full sm:w-auto">
              <Button 
                size="lg"
                className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white border-none shadow-xl shadow-emerald-500/20 font-black h-14 text-lg" 
                onClick={() => setShowDepositModal(true)}
              >
                <ArrowDownLeft className="mr-2 h-6 w-6" />
                Add Cash
              </Button>
              <Button 
                variant="outline"
                className="w-full sm:w-auto h-12 font-bold border-white/10"
                onClick={() => toast.success("Funds withdrawn to UPI successfully!")}
              >
                <ArrowUpRight className="mr-2 h-4 w-4" />
                Withdraw
              </Button>
            </div>
          </div>
          
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <div className="rounded-[2rem] bg-white/5 border border-white/5 p-6 backdrop-blur-sm">
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Withdrawable</p>
              <p className="mt-2 text-3xl font-black text-emerald-400">{formatINR(user.wallet || 0)}</p>
              <p className="mt-1 text-[10px] text-muted-foreground italic">Ready for instant UPI transfer</p>
            </div>
            <div className="rounded-[2rem] bg-amber-500/10 border border-amber-500/20 p-6 backdrop-blur-sm">
              <p className="text-sm font-bold text-amber-300 uppercase tracking-wider">Locked Escrow</p>
              <p className="mt-2 text-3xl font-black text-amber-200">{formatINR(lockedAmount)}</p>
              <p className="mt-1 text-[10px] text-amber-500/60 font-bold italic underline">Secured for active work</p>
            </div>
            <div className="rounded-[2rem] bg-violet-500/10 border border-violet-500/20 p-6 backdrop-blur-sm">
              <p className="text-sm font-bold text-violet-300 uppercase tracking-wider">Total Payouts</p>
              <p className="mt-2 text-3xl font-black text-violet-200">{formatINR(releasedAmount)}</p>
              <p className="mt-1 text-[10px] text-violet-400/60 font-bold italic">Historical earnings released</p>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-2xl font-black">Transaction history</h2>
          
          {loading ? (
            <div className="mt-4 grid gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex items-center justify-between gap-3 rounded-2xl bg-white/5 p-4">
                  <div>
                    <div className="h-5 w-32 rounded bg-white/10" />
                    <div className="mt-2 h-4 w-20 rounded bg-white/5" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-6 w-16 rounded bg-white/10" />
                    <div className="h-6 w-16 rounded-xl bg-white/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="mt-4 flex flex-col items-center justify-center rounded-2xl bg-white/5 p-8 text-center border border-dashed border-white/10">
              <Wallet className="h-8 w-8 text-slate-500 mb-3" />
              <p className="font-semibold">No transactions yet</p>
              <p className="text-sm text-muted-foreground mt-1">Your wallet activity will appear here once you start taking jobs or locking escrow.</p>
            </div>
          ) : (
            <div className="mt-4 grid gap-3">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-white/5 p-4 transition-colors hover:bg-white/10">
                  <div>
                    <p className="font-semibold">{transaction.title}</p>
                    <p className="text-sm text-muted-foreground">{transaction.date}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-bold">{formatINR(transaction.amount)}</p>
                    <Badge tone={statusTone[transaction.status] || "sky"}>{transaction.status}</Badge>
                    
                    {/* Actions if Locked */}
                    {transaction.status === "Locked" && (
                      <div className="flex gap-2 ml-2">
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleRelease(transaction)}>
                          Release
                        </Button>
                        <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => handleRefund(transaction)}>
                          Refund
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>
      <aside>
        <Card className="sticky top-24">
          <h2 className="text-2xl font-black">Escrow flow</h2>
          {[
            ["Employer accepts match", "Worker/provider and employer agree terms."],
            ["Payment locked", "Amount is held visibly before work starts."],
            ["Work marked complete", "Provider uploads proof or marks complete."],
            ["Confirm or auto-release", "Employer releases or funds auto-release after 48 hours in demo."]
          ].map(([title, text], index) => (
            <div key={title} className="mt-5 flex gap-4">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/15 font-bold text-primary">{index + 1}</div>
              <div>
                <p className="font-semibold">{title}</p>
                <p className="text-sm text-muted-foreground">{text}</p>
              </div>
            </div>
          ))}
          <div className="mt-8 border-t border-white/10 pt-6">
            <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-widest">Withdrawal Status</h3>
            <div className="mt-4 flex items-center justify-between rounded-2xl bg-white/5 p-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-emerald-500/20 grid place-items-center text-emerald-400">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <p className="text-sm font-semibold">KYC Verified</p>
              </div>
              <Badge tone="emerald">Active</Badge>
            </div>
          </div>
        </Card>
      </aside>

      <AnimatePresence>
        {showDepositModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md rounded-3xl bg-slate-900 border border-white/10 p-8 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <ArrowDownLeft className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black">Add Cash</h2>
                  <p className="text-muted-foreground text-sm">Top up your Jeevika Wallet</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Amount to add (₹)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-500">₹</span>
                  <input 
                    type="number" 
                    value={depositAmount} 
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="field h-16 pl-10 text-3xl font-black bg-white/5 border-white/10 focus:border-emerald-500/50"
                    placeholder="0"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {["1000", "2000", "5000", "10000"].map(amt => (
                    <button 
                      key={amt}
                      onClick={() => setDepositAmount(amt)}
                      className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-bold hover:bg-white/10 transition-colors"
                    >
                      +₹{amt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="ghost" onClick={() => setShowDepositModal(false)}>Cancel</Button>
                <Button 
                  onClick={handleDeposit} 
                  disabled={depositing}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                >
                  {depositing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Deposit"}
                </Button>
              </div>

              <p className="mt-6 text-center text-[10px] text-muted-foreground">
                Secure payment powered by UPI & Escrow Protection.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
