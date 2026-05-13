import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { jobsAPI } from '../api';
import Navbar from '../components/Navbar';
import { MapPin, Clock, Users, Shield, CheckCircle, XCircle, ArrowLeft, Zap, Star } from 'lucide-react';
import toast from 'react-hot-toast';

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchJob(); }, [id]);

  const fetchJob = async () => {
    try {
      const res = await jobsAPI.getOne(id);
      setJob(res.data);
    } catch (err) {
      toast.error('Job not found');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleApplicantStatus = async (appId, status) => {
    try {
      await jobsAPI.updateApplicant(id, appId, { status });
      toast.success(`Applicant ${status}`);
      fetchJob();
    } catch (err) { toast.error('Failed to update status'); }
  };

  const handleCompleteJob = async () => {
    if (!window.confirm('Are you sure the work is complete? This will instantly release the escrow payment to the workers.')) return;
    try {
      await jobsAPI.complete(id);
      toast.success('Job completed! Payment released from Escrow.');
      fetchJob();
    } catch (err) { toast.error('Failed to complete job'); }
  };

  const handleBoost = async () => {
    if (!window.confirm('Boosting costs ₹500 from your wallet. It makes your job appear at the top. Proceed?')) return;
    try {
      await jobsAPI.boost(id);
      toast.success('Job Boosted successfully!');
      fetchJob();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to boost job'); }
  };

  if (loading) return <div className="min-h-screen bg-background text-text pt-20 flex justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!job) return null;

  const isEmployer = user?.id === job.employer_id;
  const isWorker = user?.role === 'worker';
  const myApp = job.applicants?.find(a => a.worker_id === user?.id);

  return (
    <div className="min-h-screen bg-background text-text pt-20 pb-12">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4">
        
        <button onClick={() => navigate(-1)} className="text-text-muted hover:text-text flex items-center gap-2 mb-6">
          <ArrowLeft size={16} /> Back
        </button>

        <div className="grid md:grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            <div className="card p-8">
              <div className="flex justify-between items-start mb-4">
                <div>
                  {job.is_boosted && <span className="badge badge-accent mb-3 inline-flex items-center gap-1"><Zap size={12}/> Boosted Priority</span>}
                  <h1 className="text-3xl font-bold mb-2">{job.title}</h1>
                  <p className="text-text-muted">Posted by {job.employer_name} {job.company_name && `• ${job.company_name}`}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-success mb-1">₹{job.payment}</div>
                  <div className="text-xs text-text-muted flex items-center justify-end gap-1"><Shield size={12} className="text-primary-light"/> Secured in Escrow</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-text-muted border-y border-border/50 py-4 mb-6">
                <span className="flex items-center gap-1.5"><MapPin size={16}/> {job.location || 'Anywhere'}</span>
                <span className="flex items-center gap-1.5"><Clock size={16}/> {job.duration || 'Not specified'}</span>
                <span className="flex items-center gap-1.5"><Users size={16}/> {job.workers_needed} Workers Needed</span>
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-lighter">Status: {job.status.toUpperCase()}</span>
              </div>

              <h3 className="font-bold text-lg mb-2">Job Description</h3>
              <p className="text-text-muted leading-relaxed whitespace-pre-wrap mb-6">{job.description}</p>

              {job.skills?.length > 0 && (
                <>
                  <h3 className="font-bold text-lg mb-2">Required Skills</h3>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {job.skills.map((s, i) => <span key={i} className="px-3 py-1 bg-surface-lighter rounded-md text-sm text-text-muted">{s}</span>)}
                  </div>
                </>
              )}
            </div>

            {/* Applicants Section (Employer View) */}
            {isEmployer && (
              <div className="card p-8">
                <h2 className="text-xl font-bold mb-6 flex items-center justify-between">
                  Applicants ({job.applicants?.length || 0})
                  <span className="text-sm font-normal text-text-muted">
                    {job.applicants?.filter(a => a.status === 'accepted').length} / {job.workers_needed} Hired
                  </span>
                </h2>

                {job.applicants?.length > 0 ? (
                  <div className="space-y-4">
                    {job.applicants.map(app => (
                      <div key={app.id} className="p-4 border border-border/50 rounded-xl bg-surface/30">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg">{app.worker_name[0]}</div>
                            <div>
                              <div className="font-bold flex items-center gap-2">
                                {app.worker_name}
                                {app.is_verified && <CheckCircle size={14} className="text-success" />}
                              </div>
                              <div className="text-xs text-text-muted mt-1 flex items-center gap-3">
                                <span><Star size={12} className="inline text-warning mb-0.5"/> {app.avg_rating || 'New'}</span>
                                <span><MapPin size={12} className="inline mb-0.5"/> {app.worker_location || 'N/A'}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {app.status === 'pending' && job.status === 'open' ? (
                              <>
                                <button onClick={() => handleApplicantStatus(app.id, 'rejected')} className="btn-secondary py-1.5 px-3 text-xs text-danger hover:border-danger hover:bg-danger/10"><XCircle size={14} className="inline mr-1"/> Reject</button>
                                <button onClick={() => handleApplicantStatus(app.id, 'accepted')} className="btn-primary py-1.5 px-4 text-xs"><CheckCircle size={14} className="inline mr-1"/> Hire</button>
                              </>
                            ) : (
                              <span className={`badge ${app.status === 'accepted' ? 'badge-success' : 'badge-danger'}`}>
                                {app.status.toUpperCase()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-text-muted py-8">No applicants yet.</p>
                )}
              </div>
            )}
          </div>

          {/* Sidebar / Actions */}
          <div className="space-y-6">
            
            {/* Employer Actions */}
            {isEmployer && (
              <div className="card p-6">
                <h3 className="font-bold mb-4">Job Actions</h3>
                
                {job.status === 'in_progress' && (
                  <div className="p-4 bg-success/10 border border-success/20 rounded-xl mb-4">
                    <CheckCircle className="text-success mb-2" />
                    <h4 className="font-bold text-success text-sm mb-1">Work In Progress</h4>
                    <p className="text-xs text-success/80 mb-3">Once work is finished, confirm completion to release funds to the hired workers.</p>
                    <button onClick={handleCompleteJob} className="btn-primary w-full py-2 bg-success hover:bg-success/80 text-sm">Release Payment</button>
                  </div>
                )}

                {job.status === 'completed' && (
                  <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl text-center">
                    <CheckCircle className="text-primary-light mx-auto mb-2" size={32} />
                    <h4 className="font-bold text-primary-light mb-1">Job Completed</h4>
                    <p className="text-xs text-primary-light/80">Payments have been successfully released to workers.</p>
                  </div>
                )}

                {job.status === 'open' && !job.is_boosted && (
                  <div className="p-4 bg-accent/10 border border-accent/20 rounded-xl">
                    <h4 className="font-bold text-accent text-sm mb-1">Urgent Hiring?</h4>
                    <p className="text-xs text-accent/80 mb-3">Boost your job to the top of the feed for ₹500.</p>
                    <button onClick={handleBoost} className="w-full py-2 rounded-lg bg-accent text-text font-bold text-sm flex justify-center items-center gap-2 hover:bg-accent-light transition"><Zap size={14}/> Boost Job</button>
                  </div>
                )}
              </div>
            )}

            {/* Worker Actions */}
            {isWorker && (
              <div className="card p-6">
                <h3 className="font-bold mb-4">Application</h3>
                {myApp ? (
                  <div className={`p-4 rounded-xl border text-center ${myApp.status === 'accepted' ? 'bg-success/10 border-success/20 text-success' : myApp.status === 'rejected' ? 'bg-danger/10 border-danger/20 text-danger' : 'bg-warning/10 border-warning/20 text-warning'}`}>
                    <div className="font-bold mb-1">Status: {myApp.status.toUpperCase()}</div>
                    {myApp.status === 'accepted' && <div className="text-xs mt-2">You are hired! Payment is secured in escrow. Complete work to get paid.</div>}
                    {myApp.status === 'pending' && <div className="text-xs mt-2">Employer is reviewing your profile.</div>}
                  </div>
                ) : (
                  <div className="text-center">
                    <Shield className="text-success mx-auto mb-3" size={32} />
                    <p className="text-sm text-text-muted mb-4">Payment for this job is 100% secured by Jeevika Escrow. You will get paid guaranteed upon completion.</p>
                    <button onClick={async () => {
                      try { await jobsAPI.apply(id); fetchJob(); toast.success('Applied!'); }
                      catch(e) { toast.error('Failed to apply'); }
                    }} disabled={job.status !== 'open'} className="btn-primary w-full py-3 disabled:opacity-50">Apply for Job</button>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}
