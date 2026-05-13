import { motion as Motion } from "framer-motion";
import { CheckCircle2, TrendingUp, MapPin, Star, Shield, Wallet, Clock, Smartphone } from "lucide-react";
import { Card, Badge } from "../ui/Card.jsx";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } };

const workerBenefits = [
  { icon: MapPin, text: "Find nearby jobs without relying on middlemen or personal contacts" },
  { icon: Wallet, text: "Get guaranteed payment through escrow — work with confidence" },
  { icon: Star, text: "Build a verified reputation with ratings and trust badges" },
  { icon: TrendingUp, text: "Increase your earnings by 20-40% by eliminating agent commissions" },
  { icon: Smartphone, text: "Simple mobile-first interface that works on any smartphone" },
  { icon: Clock, text: "Set your availability and get matched to jobs automatically" }
];

const employerBenefits = [
  { icon: Shield, text: "Hire verified workers with transparent ratings and work history" },
  { icon: CheckCircle2, text: "Post requirements and get matched to nearby providers in minutes" },
  { icon: Wallet, text: "Optional escrow ensures work completion before payment release" },
  { icon: Star, text: "Access top-rated workers, equipment owners, and material suppliers" },
  { icon: Clock, text: "Save hours of calling and negotiating — compare options instantly" },
  { icon: MapPin, text: "Find local talent for agriculture, construction, and household needs" }
];

export function BenefitsSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20">
      <Motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fadeUp} transition={{ duration: 0.6 }}>
        <div className="text-center">
          <Badge tone="sky">Benefits</Badge>
          <h2 className="mt-4 text-3xl font-black sm:text-5xl">
            <span className="gradient-text">Built for Both Sides of the Marketplace</span>
          </h2>
        </div>

        <div className="mt-14 grid gap-8 lg:grid-cols-2">
          {/* Workers */}
          <Motion.div variants={fadeUp} transition={{ duration: 0.5, delay: 0.1 }}>
            <Card className="relative overflow-hidden rounded-2xl p-8">
              <div className="absolute right-0 top-0 h-32 w-32 bg-gradient-to-bl from-emerald-500/15 to-transparent" />
              <div className="relative">
                <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1 text-sm font-semibold text-emerald-300">
                  <TrendingUp className="h-4 w-4" /> For Workers
                </div>
                <h3 className="mt-4 text-2xl font-black">Earn More, Stress Less</h3>
                <p className="mt-2 text-slate-400">Direct access to employers means higher wages and transparent terms.</p>
                <ul className="mt-6 space-y-4">
                  {workerBenefits.map((b) => (
                    <li key={b.text} className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                        <b.icon className="h-4 w-4 text-emerald-400" />
                      </div>
                      <span className="text-sm leading-6 text-slate-300">{b.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          </Motion.div>

          {/* Employers */}
          <Motion.div variants={fadeUp} transition={{ duration: 0.5, delay: 0.2 }}>
            <Card className="relative overflow-hidden rounded-2xl p-8">
              <div className="absolute right-0 top-0 h-32 w-32 bg-gradient-to-bl from-violet-500/15 to-transparent" />
              <div className="relative">
                <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-violet-400/10 px-3 py-1 text-sm font-semibold text-violet-300">
                  <Shield className="h-4 w-4" /> For Employers
                </div>
                <h3 className="mt-4 text-2xl font-black">Hire Fast, Hire Right</h3>
                <p className="mt-2 text-slate-400">Find verified workers nearby with proven track records and fair pricing.</p>
                <ul className="mt-6 space-y-4">
                  {employerBenefits.map((b) => (
                    <li key={b.text} className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
                        <b.icon className="h-4 w-4 text-violet-400" />
                      </div>
                      <span className="text-sm leading-6 text-slate-300">{b.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          </Motion.div>
        </div>
      </Motion.div>
    </section>
  );
}
