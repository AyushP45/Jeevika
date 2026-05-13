import { Link } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CheckCircle2,
  Clock,
  HandCoins,
  MapPin,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Tractor,
  Users,
  WalletCards
} from "lucide-react";
import { Button } from "../components/ui/Button.jsx";
import { Card, Badge } from "../components/ui/Card.jsx";
import { testimonials } from "../data/demoData.js";
import { MapComponent } from "../components/MapComponent.jsx";

// Section components
import { MissionSection } from "../components/landing/MissionSection.jsx";
import { ProblemSection } from "../components/landing/ProblemSection.jsx";
import { BenefitsSection } from "../components/landing/BenefitsSection.jsx";
import { WalletSecuritySection } from "../components/landing/WalletSecuritySection.jsx";
import { FaqSection } from "../components/landing/FaqSection.jsx";
import { FooterSection } from "../components/landing/FooterSection.jsx";

import { useJeevikaStore } from "../lib/store.js";
import { useTranslation } from "../lib/i18n.js";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } };

const steps = [
  ["Post or Discover", "Describe labor, equipment, material, location, and budget in under a minute.", Search],
  ["Match Nearby", "Jeevika ranks trusted options by distance, skill, price, and rating.", MapPin],
  ["Chat & Confirm", "Confirm details with simple in-app chat before committing to work.", MessageCircle],
  ["Lock Escrow", "Optional payment lock builds confidence before the work starts.", WalletCards],
  ["Complete & Rate", "Release payment, rate the experience, and grow verified work history.", BadgeCheck]
];

const features = [
  ["Role-Based Marketplace", "Workers, employers, equipment owners, and suppliers matched in one unified system.", Users],
  ["Trust Badges", "Verified, Top Rated, Trusted, Gold, and completion badges make reputation visible at a glance.", ShieldCheck],
  ["Nearby Job Feed", "Filter by distance, skill, category, payment type, and requirement — find work within kilometers.", BriefcaseBusiness],
  ["Escrow Wallet", "Lock, release, refund, and track work payments with full transparency and visual flow.", HandCoins],
  ["Availability Signal", "Workers and providers toggle availability in one tap — employers see who's ready now.", Clock],
  ["India-First Data", "Kolhapur, Pune, Bengaluru, villages, farms, homes, and local trades — built for real India.", Tractor]
];

export function LandingPage() {
  const { t, language } = useTranslation();
  const { setLanguage } = useJeevikaStore();

  return (
    <div className="min-h-screen overflow-hidden bg-jeevika-hero text-foreground">
      {/* ========== HEADER ========== */}
      <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5">
        <Link to="/" className="flex items-center gap-3">
          <img src="/logo.png" alt="Jeevika Logo" className="h-11 w-auto" />
          <div>
            <p className="font-black">Jeevika</p>
            <p className="text-xs text-slate-300">Building Trust</p>
          </div>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
          <a href="#mission" className="transition-colors hover:text-white">Mission</a>
          <a href="#how-it-works" className="transition-colors hover:text-white">How It Works</a>
          <button 
            onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold transition-colors hover:bg-white/10"
          >
            {language === 'en' ? "हिन्दी" : "English"}
          </button>
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" as={Link} to="/login">Login</Button>
          <Button as={Link} to="/register">Get started</Button>
        </div>
      </header>

      {/* ========== HERO SECTION ========== */}
      <section className="mx-auto grid min-h-[78vh] max-w-7xl items-center gap-10 px-4 py-10 lg:grid-cols-[1.05fr_.95fr]">
        <Motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <Badge tone="emerald">
            <Sparkles className="mr-1 h-3 w-3" />
            Trusted work matching for India
          </Badge>
          <h1 className="mt-6 max-w-5xl text-5xl font-black leading-[1.02] tracking-normal sm:text-6xl lg:text-7xl">
            <span className="gradient-text">{t('heroTitle')}</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            {t('heroSubtitle')}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button as={Link} to="/dashboard" className="px-6">
              {t('openDemo')} <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="secondary" as={Link} to="/post-job" className="px-6">
              {t('postRequirement')}
            </Button>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {[
              ["400M+", "Informal workers need better access"],
              ["48h", "Simulated escrow auto-release"],
              ["4 Roles", "Labor · Equipment · Material · Employer"]
            ].map(([value, label]) => (
              <Card key={value} className="rounded-2xl p-4">
                <p className="text-3xl font-black">{value}</p>
                <p className="mt-1 text-sm text-slate-300">{label}</p>
              </Card>
            ))}
          </div>
        </Motion.div>

        <Motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="relative"
        >
          <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-emerald-400/20 via-transparent to-violet-500/20 blur-3xl" />
          <div className="relative">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-400" />
                Workers Nearby (Hatkanangale)
              </h3>
              <Badge tone="emerald">Live</Badge>
            </div>
            <MapComponent 
              type="workers"
              items={[
                { name: "Rahul S.", location: "2km away", rating: 4.8 },
                { name: "Amit P.", location: "5km away", rating: 4.9 },
                { name: "Suresh K.", location: "1.2km away", rating: 4.7 }
              ]} 
            />
            <div className="mt-5 grid gap-3">
              {["10 workers for harvesting — Kolhapur", "Tractor + operator nearby — Hatkanangale", "Paint materials same-day — Pune"].map((item, index) => (
                <Motion.div
                  key={item}
                  animate={{ x: [0, index % 2 ? -4 : 4, 0] }}
                  transition={{ duration: 4, repeat: Infinity, delay: index * 0.3 }}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/8 p-4"
                >
                  <span className="font-semibold">{item}</span>
                  <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                </Motion.div>
              ))}
            </div>
          </div>
        </Motion.div>
      </section>

      {/* ========== MISSION ========== */}
      <div id="mission">
        <MissionSection />
      </div>

      {/* ========== PROBLEM STATEMENT ========== */}
      <ProblemSection />

      {/* ========== HOW JEEVIKA WORKS ========== */}
      <section id="how-it-works" className="mx-auto max-w-7xl px-4 py-20">
        <Motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeUp} transition={{ duration: 0.6 }}>
          <div className="max-w-2xl">
            <Badge tone="violet">How Jeevika Works</Badge>
            <h2 className="mt-4 text-3xl font-black sm:text-5xl">Five quick steps from need to paid work.</h2>
            <p className="mt-4 text-slate-400">Simple, fast, and transparent — designed for workers and employers who value their time.</p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-5">
            {steps.map(([title, text, StepIcon], index) => (
              <Motion.div key={title} variants={fadeUp} transition={{ duration: 0.4, delay: index * 0.1 }}>
                <Card className="group relative overflow-hidden p-5 transition-all duration-300 hover:border-violet-400/30 hover:shadow-violet">
                  <div className="absolute inset-0 bg-gradient-to-b from-violet-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="relative">
                    <div className="mb-5 flex items-center justify-between">
                      <StepIcon className="h-6 w-6 text-emerald-300" />
                      <span className="text-sm font-bold text-slate-500">0{index + 1}</span>
                    </div>
                    <h3 className="font-bold">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{text}</p>
                  </div>
                </Card>
              </Motion.div>
            ))}
          </div>
        </Motion.div>
      </section>

      {/* ========== USE CASES ========== */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <Motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeUp} transition={{ duration: 0.6 }}>
          <div className="grid gap-5 lg:grid-cols-3">
            {[
              { title: "Agriculture", desc: "Harvesting teams, tractor rentals, irrigation repairs, seed suppliers, and seasonal farm hiring across villages.", gradient: "from-emerald-400/25 via-lime-400/15 to-green-500/25" },
              { title: "Construction", desc: "Masons, painters, plumbers, scaffolding rentals, cement, tiles, and verified contractors for any scale project.", gradient: "from-amber-400/25 via-orange-400/15 to-yellow-500/25" },
              { title: "Household", desc: "Maid services, home repairs, cleaning, painting, local material suppliers, and quick-hire for everyday needs.", gradient: "from-violet-400/25 via-sky-400/15 to-indigo-500/25" }
            ].map((useCase) => (
              <Motion.div key={useCase.title} variants={fadeUp}>
                <Card className="group min-h-64 overflow-hidden p-6 transition-all duration-300 hover:border-emerald-400/20">
                  <div className={`h-28 rounded-2xl bg-gradient-to-br ${useCase.gradient} transition-transform duration-500 group-hover:scale-105`} />
                  <h3 className="mt-5 text-2xl font-black">{useCase.title}</h3>
                  <p className="mt-2 text-slate-300">{useCase.desc}</p>
                </Card>
              </Motion.div>
            ))}
          </div>
        </Motion.div>
      </section>

      {/* ========== FEATURES ========== */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-20">
        <Motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fadeUp} transition={{ duration: 0.6 }}>
          <div className="text-center">
            <Badge tone="emerald">Features</Badge>
            <h2 className="mt-4 text-3xl font-black sm:text-5xl">
              <span className="gradient-text">Everything You Need in One Platform</span>
            </h2>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map(([title, text, FeatureIcon], i) => (
              <Motion.div key={title} variants={fadeUp} transition={{ duration: 0.4, delay: i * 0.08 }}>
                <Card className="group relative overflow-hidden transition-all duration-300 hover:border-emerald-400/25 hover:shadow-glow">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/5 to-violet-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="relative">
                    <FeatureIcon className="h-6 w-6 text-primary" />
                    <h3 className="mt-4 text-lg font-bold">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{text}</p>
                  </div>
                </Card>
              </Motion.div>
            ))}
          </div>
        </Motion.div>
      </section>

      {/* ========== BENEFITS ========== */}
      <BenefitsSection />

      {/* ========== WALLET SECURITY ========== */}
      <WalletSecuritySection />

      {/* ========== TESTIMONIALS ========== */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <Motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeUp} transition={{ duration: 0.6 }}>
          <div className="text-center">
            <Badge tone="violet">Testimonials</Badge>
            <h2 className="mt-4 text-3xl font-black sm:text-5xl">What Our Users Say</h2>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {testimonials.map((item, i) => (
              <Motion.div key={item.name} variants={fadeUp} transition={{ duration: 0.4, delay: i * 0.1 }}>
                <Card className="group relative overflow-hidden transition-all duration-300 hover:border-violet-400/25">
                  <div className="absolute right-4 top-4 text-5xl font-black text-white/5">"</div>
                  <div className="relative">
                    <div className="mb-4 flex gap-1">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-lg leading-8 text-slate-200">"{item.quote}"</p>
                    <div className="mt-6 flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-violet-500 text-sm font-bold text-slate-950">
                        {item.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold">{item.name}</p>
                        <p className="text-sm text-slate-400">{item.role}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </Motion.div>
            ))}
          </div>
        </Motion.div>
      </section>

      {/* ========== FAQ ========== */}
      <div id="faq">
        <FaqSection />
      </div>

      {/* ========== CTA BANNER ========== */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <Motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Card className="relative overflow-hidden rounded-3xl p-10 text-center sm:p-16">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-violet-500/10" />
            <div className="relative">
              <h2 className="text-3xl font-black sm:text-5xl">
                <span className="gradient-text">Ready to Get Started?</span>
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-lg text-slate-300">
                Join thousands of workers and employers who trust Jeevika for faster matching, transparent payments, and verified reputations.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Button as={Link} to="/register" className="px-8">
                  Create Free Account <ArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="secondary" as={Link} to="/dashboard" className="px-8">
                  Explore Demo
                </Button>
              </div>
            </div>
          </Card>
        </Motion.div>
      </section>

      {/* ========== FOOTER ========== */}
      <FooterSection />
    </div>
  );
}
