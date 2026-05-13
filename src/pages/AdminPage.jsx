import { useEffect, useState } from "react";
import { ShieldAlert, Users, Briefcase, FileWarning, Search, Ban, CheckCircle2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "../components/ui/Button.jsx";
import { Badge, Card } from "../components/ui/Card.jsx";
import { useTitle } from "../lib/useTitle.js";
import { adminApi } from "../lib/api.js";

export function AdminPage() {
  useTitle("Admin Console");
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ users: 0, jobs: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        const [usersData, statsData] = await Promise.all([
          adminApi.users(),
          adminApi.stats()
        ]);
        if (!cancelled) {
          setUsers(usersData);
          setStats(statsData);
        }
      } catch (err) {
        if (!cancelled) toast.error(err.message || "Failed to load admin data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, []);

  const handleToggleSuspend = async (userId, currentStatus) => {
    try {
      const updatedUser = await adminApi.suspend(userId, !currentStatus);
      setUsers(users.map(u => u.id === userId ? updatedUser : u));
      toast.success(`User ${updatedUser.isActive ? "restored" : "suspended"} successfully`);
    } catch (err) {
      toast.error(err.message || "Failed to update user status");
    }
  };

  const pendingUsers = users.filter(u => u.verificationStatus === "Pending");

  const handleVerifyAction = async (userId, action) => {
    try {
      const updatedUser = action === "approve" 
        ? await adminApi.approveVerification(userId)
        : await adminApi.rejectVerification(userId);
      setUsers(users.map(u => u.id === userId ? updatedUser : u));
      toast.success(`Verification ${action === "approve" ? "approved" : "rejected"}`);
    } catch (err) {
      toast.error(err.message || "Failed to update verification status");
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.phone?.includes(search)
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="grid gap-6 lg:grid-cols-[1.3fr_.7fr]"
    >
      <section className="grid gap-6">
        <div>
          <Badge tone="violet">Admin Console</Badge>
          <h1 className="mt-3 text-4xl font-black">Platform Moderation</h1>
          <p className="mt-2 text-muted-foreground">Manage users, disputes, and monitor platform health.</p>
        </div>

        <Card className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
            <h2 className="text-xl font-black flex items-center gap-2">
              <Users className="h-5 w-5 text-sky-500" />
              User Directory
            </h2>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input 
                className="field pl-9 py-1.5 text-sm" 
                placeholder="Search name, email, phone..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          
          <div className="grid gap-3">
            {loading ? (
              <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground border border-dashed border-white/20 rounded-2xl">
                No users found.
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div key={user.id} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-white/5 p-4 border ${user.isActive ? 'border-white/5' : 'border-red-500/30 bg-red-500/5'}`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold">{user.name}</p>
                      <Badge tone={user.role === "admin" ? "violet" : "sky"}>{user.role}</Badge>
                      {!user.isActive && <Badge tone="amber">Suspended</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {user.email || user.phone} · Joined {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {user.role !== "admin" && (
                      <Button 
                        variant={user.isActive ? "destructive" : "outline"} 
                        size="sm" 
                        onClick={() => handleToggleSuspend(user.id, user.isActive)}
                      >
                        {user.isActive ? (
                          <><Ban className="h-4 w-4 mr-1" /> Suspend</>
                        ) : (
                          <><CheckCircle2 className="h-4 w-4 mr-1" /> Restore</>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-black mb-4 flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-emerald-500" />
            Verification Queue
          </h2>
          <p className="text-sm text-muted-foreground mb-4">Review KYC and trade certificates to issue Trusted badges.</p>
          <div className="grid gap-4 mt-4">
            {pendingUsers.length === 0 ? (
              <div className="flex items-center justify-center p-8 border border-dashed border-white/20 rounded-2xl">
                <p className="text-muted-foreground">Queue is empty. Great job!</p>
              </div>
            ) : (
              pendingUsers.map(u => (
                <div key={u.id} className="rounded-2xl bg-white/5 p-4 border border-white/5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-bold">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.phone}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleVerifyAction(u.id, "reject")} className="text-red-400 hover:text-red-300">Reject</Button>
                      <Button size="sm" onClick={() => handleVerifyAction(u.id, "approve")} className="bg-emerald-600 hover:bg-emerald-500">Approve</Button>
                    </div>
                  </div>
                  {u.idProof && (
                    <div className="mt-2 rounded-xl overflow-hidden h-40 bg-slate-900 border border-white/10">
                      <img src={u.idProof} alt="ID Proof" className="h-full w-full object-contain" />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>
      </section>

      <aside className="grid gap-6 content-start">
        <Card className="p-6">
          <h2 className="text-xl font-black mb-4">System Metrics</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-white/5 p-4">
              <Users className="h-5 w-5 text-sky-400 mb-2" />
              <p className="text-2xl font-black">{stats.users}</p>
              <p className="text-xs text-muted-foreground">Registered Users</p>
            </div>
            <div className="rounded-xl bg-white/5 p-4">
              <Briefcase className="h-5 w-5 text-emerald-400 mb-2" />
              <p className="text-2xl font-black">{stats.jobs}</p>
              <p className="text-xs text-muted-foreground">Open Jobs</p>
            </div>
          </div>
        </Card>
      </aside>
    </motion.div>
  );
}
