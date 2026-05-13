import { useState, useEffect } from 'react';
import { adminAPI } from '../api';
import Navbar from '../components/Navbar';
import { Users, Briefcase, IndianRupee, ShieldAlert, CheckCircle, Trash2, ShieldCheck, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminPanel() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => { fetchData(); }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const res = await adminAPI.getAnalytics();
        setStats(res.data);
      } else if (activeTab === 'users') {
        const res = await adminAPI.getUsers();
        setUsers(res.data);
      }
    } catch (err) { toast.error('Failed to load admin data'); }
    finally { setLoading(false); }
  };

  const handleVerify = async (id) => {
    if (!window.confirm('Verify this worker?')) return;
    try {
      await adminAPI.verifyWorker(id);
      toast.success('Worker verified');
      fetchData();
    } catch (err) { toast.error('Verification failed'); }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete this user permanently?')) return;
    try {
      await adminAPI.deleteUser(id);
      toast.success('User deleted');
      fetchData();
    } catch (err) { toast.error('Deletion failed'); }
  };

  return (
    <div className="min-h-screen bg-background text-text pt-20 pb-12">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 grid lg:grid-cols-5 gap-8">
        
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          <button onClick={() => setActiveTab('overview')} className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition ${activeTab==='overview'?'bg-primary text-white':'text-text-muted hover:bg-surface-light hover:text-text'}`}>
            <Activity size={18}/> Overview
          </button>
          <button onClick={() => setActiveTab('users')} className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition ${activeTab==='users'?'bg-primary text-white':'text-text-muted hover:bg-surface-light hover:text-text'}`}>
            <Users size={18}/> Users & Verification
          </button>
        </div>

        {/* Content */}
        <div className="lg:col-span-4">
          {loading ? (
             <div className="py-20 text-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
          ) : activeTab === 'overview' && stats ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-6">Platform Analytics</h2>
              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Workers', val: stats.workers, icon: Users, color: 'text-primary-light' },
                  { label: 'Total Employers', val: stats.employers, icon: Briefcase, color: 'text-accent' },
                  { label: 'Completed Jobs', val: stats.completedJobs, icon: CheckCircle, color: 'text-success' },
                  { label: 'Transaction Volume', val: `₹${stats.totalTransactionVolume}`, icon: IndianRupee, color: 'text-warning' },
                  { label: 'Open Jobs', val: stats.openJobs, icon: Briefcase, color: 'text-primary-light' },
                  { label: 'Pending Verification', val: stats.pendingVerifications, icon: ShieldAlert, color: 'text-danger' },
                ].map((s, i) => (
                  <div key={i} className="card p-5">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-text-muted text-sm font-medium">{s.label}</span>
                      <s.icon size={18} className={s.color} />
                    </div>
                    <div className="text-3xl font-bold">{s.val}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === 'users' ? (
            <div className="card p-6">
              <h2 className="text-xl font-bold mb-6">User Management</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/50 text-text-muted text-sm">
                      <th className="pb-3 font-medium">User</th>
                      <th className="pb-3 font-medium">Role</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Joined</th>
                      <th className="pb-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {users.map(u => (
                      <tr key={u.id} className="border-b border-border/20 hover:bg-surface-light/30 transition">
                        <td className="py-3">
                          <div className="font-semibold">{u.name}</div>
                          <div className="text-text-muted text-xs">{u.email}</div>
                        </td>
                        <td className="py-3 capitalize">{u.role}</td>
                        <td className="py-3">
                          {u.role === 'worker' ? (
                            u.is_verified ? <span className="badge badge-success text-xs">Verified</span> : <span className="badge badge-warning text-xs">Pending</span>
                          ) : '-'}
                        </td>
                        <td className="py-3 text-text-muted">{new Date(u.created_at).toLocaleDateString()}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            {u.role === 'worker' && !u.is_verified && (
                              <button onClick={() => handleVerify(u.id)} className="p-1.5 rounded-lg bg-success/10 text-success hover:bg-success/20 transition" title="Verify Worker"><ShieldCheck size={16}/></button>
                            )}
                            <button onClick={() => handleDeleteUser(u.id)} className="p-1.5 rounded-lg bg-danger/10 text-danger hover:bg-danger/20 transition" title="Delete User"><Trash2 size={16}/></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>

      </div>
    </div>
  );
}
