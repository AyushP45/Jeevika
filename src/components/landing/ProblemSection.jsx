import { motion as Motion } from "framer-motion";
import { AlertTriangle, Ban, Eye, PhoneOff, UserX, Banknote } from "lucide-react";
import { Card, Badge } from "../ui/Card.jsx";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } };

const problems = [
  { icon: UserX, title: "No Verified Identity", text: "Workers and employers have no way to verify each other's identity, skills, or past work history before committing." },
  { icon: Banknote, title: "Payment Uncertainty", text: "Delayed payments, disputes, and wage theft are rampant. Workers often complete jobs without any payment guarantee." },
  { icon: PhoneOff, title: "Word-of-Mouth Only", text: "Most hiring happens through personal networks, excluding skilled workers who lack the right connections." },
  { icon: AlertTriangle, title: "No Dispute Resolution", text: "When things go wrong, there's no mechanism for fair resolution — workers lose time and employers lose money." },
  { icon: Ban, title: "Middlemen Exploitation", text: "Contractors and agents take 20–40% commissions, reducing worker earnings and inflating costs for employers." },
  { icon: Eye, title: "Zero Transparency", text: "No standardized pricing, no visibility into market rates, and no way to compare providers objectively." }
];

export function ProblemSection() {
  return (
    <section className="relative mx-auto max-w-7xl px-4 py-20">
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-rose-500/5 via-transparent to-amber-500/5" />
      <Motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fadeUp} transition={{ duration: 0.6 }} className="relative">
        <div className="text-center">
          <Badge tone="amber">The Problem</Badge>
          <h2 className="mt-4 text-3xl font-black sm:text-5xl">
            The Trust Gap in India's Informal Economy
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-300">
            400 million workers. ₹30 lakh crore in annual output. Yet the informal labor market runs on broken trust.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {problems.map((item, i) => (
            <Motion.div key={item.title} variants={fadeUp} transition={{ duration: 0.4, delay: i * 0.08 }}>
              <Card className="group rounded-2xl p-6 transition-all duration-300 hover:border-amber-400/25">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10">
                  <item.icon className="h-5 w-5 text-rose-400" />
                </div>
                <h3 className="font-bold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{item.text}</p>
              </Card>
            </Motion.div>
          ))}
        </div>
      </Motion.div>
    </section>
  );
}
