import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Users, Wallet, Star, Zap, CheckCircle, ChevronDown, ChevronUp, ArrowRight, Briefcase, BadgeCheck, TrendingUp, Lock, Search, Clock, MapPin, Phone } from 'lucide-react';
import Navbar from '../components/Navbar';

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

function Section({ children, className = '', id }) {
  return (
    <motion.section id={id} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={stagger}
      className={`py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto ${className}`}>
      {children}
    </motion.section>
  );
}

function SectionTitle({ badge, title, sub }) {
  return (
    <motion.div variants={fadeUp} className="text-center mb-16">
      {badge && <span className="badge badge-primary mb-4 inline-block">{badge}</span>}
      <h2 className="text-3xl sm:text-4xl font-semibold text-heading mb-4">{title}</h2>
      {sub && <p className="text-text-muted max-w-2xl mx-auto text-lg">{sub}</p>}
    </motion.div>
  );
}

const features = [
  { icon: Shield, title: 'Escrow Protection', desc: 'Payments held securely until work is confirmed complete', color: 'text-primary-light' },
  { icon: BadgeCheck, title: 'Verified Profiles', desc: 'Workers verified through documents and employer ratings', color: 'text-success' },
  { icon: Search, title: 'Smart Discovery', desc: 'Find workers by skill, location, rating, and availability', color: 'text-accent' },
  { icon: Star, title: 'Rating System', desc: 'Build reputation through reviews and earn trust badges', color: 'text-warning' },
  { icon: Zap, title: 'Priority Boost', desc: 'Employers can boost jobs for faster hiring visibility', color: 'text-primary-light' },
  { icon: Lock, title: 'Fraud Prevention', desc: 'Escrow wallet ensures workers always get paid on time', color: 'text-danger' },
];

const steps = [
  { num: '01', title: 'Sign Up', desc: 'Create your profile as a Worker or Employer in under 2 minutes', icon: Users },
  { num: '02', title: 'Post or Discover', desc: 'Employers post jobs, workers browse and apply to matching work', icon: Briefcase },
  { num: '03', title: 'Secure Payment', desc: 'Payment deposited in escrow wallet before work begins', icon: Wallet },
  { num: '04', title: 'Get Paid', desc: 'Work completed, employer confirms, money released instantly', icon: CheckCircle },
];

const testimonials = [
  { name: 'Rajesh Kumar', role: 'Electrician, Delhi', text: 'Jeevika changed my life. I no longer worry about not getting paid after completing work. The escrow system gives me peace of mind.', rating: 5 },
  { name: 'Priya Sharma', role: 'Employer, Mumbai', text: 'Finding verified and skilled workers was always a challenge. Jeevika makes it so simple with skill-based search and ratings.', rating: 5 },
  { name: 'Amit Patel', role: 'Carpenter, Ahmedabad', text: 'I have earned my Gold Worker badge and now get more job offers than ever. The platform truly values workers.', rating: 5 },
];

const faqs = [
  { q: 'How does the escrow payment system work?', a: 'When an employer posts a job, the payment amount is deposited into Jeevika\'s secure wallet. The money is held safely until the worker completes the job and the employer confirms satisfaction. Then the payment is released to the worker\'s wallet instantly.' },
  { q: 'Is Jeevika free for workers?', a: 'Yes! Jeevika is completely free for workers. We only charge employers a small fee for premium features like Priority Boost.' },
  { q: 'How do workers get verified?', a: 'Workers can upload their ID proof, skill certificates, and work verification documents. Our admin team reviews and verifies these documents to award the Verified Worker badge.' },
  { q: 'What types of workers can use Jeevika?', a: 'Jeevika supports all kinds of gig and informal workers — electricians, plumbers, painters, maids, cooks, farm laborers, delivery workers, and many more.' },
  { q: 'How do I withdraw money from my wallet?', a: 'You can withdraw your wallet balance directly to your UPI ID. The withdrawal is processed instantly in our simulated system.' },
];

const workerBenefits = [
  'Guaranteed payment through escrow',
  'Build verified reputation & badges',
  'Discover jobs matching your skills',
  'Get rated and earn more work',
  'Free to use, no hidden charges',
  'Withdraw earnings to UPI instantly',
];

const employerBenefits = [
  'Find verified, skilled workers fast',
  'Post jobs in under 2 minutes',
  'Secure payment protection',
  'Rate and review workers',
  'Boost jobs for urgent hiring',
  'Track hiring history easily',
];

export default function Landing() {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="min-h-screen bg-background text-text">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -left-16 top-16 w-72 h-72 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute right-0 top-40 w-80 h-80 rounded-full bg-secondary/20 blur-3xl" />
          <div className="absolute left-1/2 top-48 w-64 h-64 rounded-full bg-cta/10 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto text-center lg:text-left">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 rounded-full bg-surface-light px-4 py-2 text-sm font-semibold text-primary-dark shadow-soft hero-eyebrow mb-6">Trusted by workers and employers</div>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-[-0.04em] mb-6 leading-tight text-heading">
            Calm hiring. Confident work.<br />Payments protected in every step.
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
            className="text-text-muted text-lg sm:text-xl lg:max-w-2xl lg:mx-0 mx-auto mb-10 leading-relaxed">
            Jeevika brings premium trust to India’s gig economy with escrow-secured payments, verified profiles, and seamless match-making.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4">
            <Link to="/register" className="btn-primary text-lg px-8 py-4 flex items-center gap-2 rounded-[1.5rem] cursor-pointer">
              Begin your secure journey <ArrowRight size={18} />
            </Link>
            <a href="#how-it-works" className="btn-secondary text-lg px-8 py-4 rounded-[1.5rem] cursor-pointer">See How It Works</a>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            {[{ label: 'Workers registered', val: '10,000+' }, { label: 'Jobs completed', val: '25,000+' }, { label: 'Payments secured', val: '₹2Cr+' }, { label: 'Cities active', val: '50+' }].map((s, i) => (
              <div key={i} className="rounded-full bg-surface border border-border px-5 py-4 shadow-soft">
                <div className="text-2xl sm:text-3xl font-semibold text-text">{s.val}</div>
                <div className="text-text-muted text-sm mt-1">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Problem */}
      <Section>
        <SectionTitle badge="The Problem" title="India's Gig Workers Deserve Better"
          sub="Millions of workers face unfair treatment, payment fraud, and lack of trusted opportunities every day" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: Shield, title: 'Payment Fraud', desc: 'Workers complete jobs but never receive payment' },
            { icon: BadgeCheck, title: 'No Verification', desc: 'Employers cannot find trustworthy, verified workers' },
            { icon: MapPin, title: 'Limited Access', desc: 'Workers struggle to find jobs matching their skills and location' },
            { icon: Clock, title: 'Job Insecurity', desc: 'No guarantee of consistent work or fair compensation' },
            { icon: Briefcase, title: 'No Reputation', desc: 'No system to build and showcase work credibility' },
            { icon: Search, title: 'Tech Gap', desc: 'Most platforms ignore non-technical and informal workers' },
          ].map((item, i) => (
            <motion.div key={i} variants={fadeUp} className="card flex items-start gap-4">
              <div className="w-12 h-12 rounded-3xl bg-secondary/15 text-secondary flex items-center justify-center">
                <item.icon size={22} />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                <p className="text-text-muted text-sm">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* How it works */}
      <Section id="how-it-works" className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />
        <SectionTitle badge="How It Works" title="Simple. Secure. Seamless."
          sub="Four easy steps to connect workers and employers with trust" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {steps.map((s, i) => (
            <motion.div key={i} variants={fadeUp} className="card text-center relative group">
              <div className="text-5xl font-black text-primary/20 mb-2">{s.num}</div>
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <s.icon className="text-primary-light" size={24} />
              </div>
              <h3 className="font-bold text-lg mb-2">{s.title}</h3>
              <p className="text-text-muted text-sm">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* Features */}
      <Section id="features">
        <SectionTitle badge="Features" title="Everything You Need" sub="Powerful features designed to make gig work fair and transparent" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div key={i} variants={fadeUp} className="card group">
              <div className="w-12 h-12 rounded-xl bg-surface-light flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <f.icon className={f.color} size={22} />
              </div>
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-text-muted text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* Wallet */}
      <Section>
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div variants={fadeUp}>
            <span className="badge badge-accent mb-4 inline-block">🔐 Escrow Security</span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">Your Money, Always Protected</h2>
            <p className="text-text-muted text-lg mb-8 leading-relaxed">
              Jeevika's wallet-based escrow system ensures every rupee is protected.
              Employers deposit payment before work begins. Workers get paid only after confirmed completion.
            </p>
            <div className="space-y-4">
              {['Employer deposits payment into escrow', 'Money held safely during job', 'Worker completes the work', 'Employer confirms → Payment released'].map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary-light font-bold text-sm">{i + 1}</div>
                  <span className="text-text">{s}</span>
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div variants={fadeUp} className="relative">
            <div className="card animate-float p-8">
              <div className="flex items-center justify-between mb-6">
                <span className="text-text-muted">Jeevika Wallet</span>
                <Wallet className="text-primary-light" size={24} />
              </div>
              <div className="text-4xl font-bold mb-2">₹15,750<span className="text-success text-sm ml-2">+₹2,500</span></div>
              <div className="text-text-muted text-sm mb-6">Available Balance</div>
              <div className="space-y-3">
                {[
                  { label: 'Plumbing Job - Payment Released', amount: '+₹2,500', type: 'success' },
                  { label: 'Painting Job - In Escrow', amount: '₹5,000', type: 'warning' },
                  { label: 'Withdrawal to UPI', amount: '-₹3,000', type: 'danger' },
                ].map((t, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-sm text-text-muted">{t.label}</span>
                    <span className={`text-sm font-semibold text-${t.type}`}>{t.amount}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-accent/10 rounded-full blur-2xl" />
          </motion.div>
        </div>
      </Section>

      {/* Benefits */}
      <Section>
        <SectionTitle badge="Benefits" title="Built for Everyone" sub="Whether you're hiring or looking for work, Jeevika has you covered" />
        <div className="grid md:grid-cols-2 gap-8">
          <motion.div variants={fadeUp} className="card p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center"><Briefcase className="text-success" size={20} /></div>
              <h3 className="text-xl font-bold">For Workers</h3>
            </div>
            <div className="space-y-3">
              {workerBenefits.map((b, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle size={16} className="text-success shrink-0" />
                  <span className="text-text-muted">{b}</span>
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div variants={fadeUp} className="card p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center"><TrendingUp className="text-primary-light" size={20} /></div>
              <h3 className="text-xl font-bold">For Employers</h3>
            </div>
            <div className="space-y-3">
              {employerBenefits.map((b, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle size={16} className="text-primary-light shrink-0" />
                  <span className="text-text-muted">{b}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </Section>

      {/* Testimonials */}
      <Section>
        <SectionTitle badge="Testimonials" title="Loved by Workers & Employers" sub="Real stories from our community" />
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div key={i} variants={fadeUp} className="card p-8">
              <div className="flex gap-1 mb-4 text-cta">
                {Array(t.rating).fill(0).map((_, j) => <Star key={j} size={16} className="fill-cta" />)}
              </div>
              <p className="text-text-muted mb-6 leading-relaxed italic">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center font-semibold text-sm">
                  {t.name[0]}
                </div>
                <div>
                  <div className="font-semibold text-sm">{t.name}</div>
                  <div className="text-text-muted text-xs">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="relative max-w-4xl mx-auto rounded-[2rem] border border-border bg-surface p-10 shadow-soft">
          <div className="absolute inset-x-0 top-0 h-1 rounded-full bg-gradient-to-r from-primary to-cta opacity-50 blur-xl" />
          <div className="relative text-center">
            <p className="text-sm uppercase tracking-[0.35em] text-text-muted mb-4">Secure, calm, premium</p>
            <h2 className="text-3xl sm:text-4xl font-semibold mb-4">Ready to bring trust and ease to every hire?</h2>
            <p className="text-text-muted mb-8">Start your Jeevika journey with transparent payments, verified talent, and a smooth onboarding experience.</p>
            <Link to="/register" className="btn-primary text-lg px-10 py-4 rounded-[1.5rem]">Create Free Account</Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <Section id="faq">
        <SectionTitle badge="FAQ" title="Frequently Asked Questions" sub="Everything you need to know about Jeevika" />
        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((f, i) => (
            <motion.div key={i} variants={fadeUp} className="card cursor-pointer" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold pr-4">{f.q}</h3>
                {openFaq === i ? <ChevronUp size={20} className="text-primary-light shrink-0" /> : <ChevronDown size={20} className="text-text-muted shrink-0" />}
              </div>
              {openFaq === i && (
                <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="text-text-muted mt-4 leading-relaxed">{f.a}</motion.p>
              )}
            </motion.div>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10" />
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-text-muted text-lg mb-8">Join thousands of workers and employers who trust Jeevika for secure, fair, and transparent hiring.</p>
          <Link to="/register" className="btn-primary text-lg px-8 py-4 inline-flex items-center gap-2 rounded-xl">
            Create Free Account <ArrowRight size={18} />
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center font-bold text-white text-sm">J</div>
              <span className="text-xl font-bold gradient-text">Jeevika</span>
            </div>
            <p className="text-text-muted text-sm leading-relaxed">Empowering India's gig workforce with trusted hiring and secure payments.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Platform</h4>
            <div className="space-y-2 text-sm text-text-muted">
              <a href="#features" className="block hover:text-text transition">Features</a>
              <a href="#how-it-works" className="block hover:text-text transition">How It Works</a>
              <a href="#faq" className="block hover:text-text transition">FAQ</a>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Workers</h4>
            <div className="space-y-2 text-sm text-text-muted">
              <Link to="/register" className="block hover:text-text transition">Register as Worker</Link>
              <span className="block">Browse Jobs</span>
              <span className="block">Build Profile</span>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <div className="space-y-2 text-sm text-text-muted">
              <div className="flex items-center gap-2"><Phone size={14} /> +91 98765 43210</div>
              <div className="flex items-center gap-2"><MapPin size={14} /> India</div>
              <div>support@jeevika.in</div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-border text-center text-text-muted text-sm">
          © 2026 Jeevika. Built with ❤️ for India's workforce.
        </div>
      </footer>
    </div>
  );
}
