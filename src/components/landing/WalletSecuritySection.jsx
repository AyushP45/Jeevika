import { motion as Motion } from "framer-motion";
import { Lock, ArrowDownToLine, CheckCircle2, RefreshCw, ShieldCheck, Timer } from "lucide-react";
import { Card, Badge } from "../ui/Card.jsx";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } };

const escrowSteps = [
  { icon: Lock, label: "Employer Locks Funds", desc: "Before work begins, the employer deposits payment into Jeevika's secure escrow wallet.", color: "text-amber-400", bg: "bg-amber-400/10" },
  { icon: Timer, label: "Work in Progress", desc: "The worker completes the task knowing the payment is guaranteed and waiting for them.", color: "text-sky-400", bg: "bg-sky-400/10" },
  { icon: CheckCircle2, label: "Work Verified", desc: "Both parties confirm completion. If no disputes arise, release is automatic.", color: "text-emerald-400", bg: "bg-emerald-400/10" },
  { icon: ArrowDownToLine, label: "Payment Released", desc: "Funds are instantly released to the worker's wallet. Auto-release triggers after 48 hours.", color: "text-emerald-300", bg: "bg-emerald-300/10" }
];

const securityFeatures = [
  { icon: ShieldCheck, text: "End-to-end escrow tracking with full transaction history" },
  { icon: RefreshCw, text: "Auto-release after 48 hours if no dispute is raised" },
  { icon: Lock, text: "Funds held securely — neither party can withdraw unilaterally" }
];

export function WalletSecuritySection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20">
      <Motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fadeUp} transition={{ duration: 0.6 }}>
        <div className="text-center">
          <Badge tone="amber">Wallet Security</Badge>
          <h2 className="mt-4 text-3xl font-black sm:text-5xl">
            Jeevika Escrow — Payment You Can Trust
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-300">
            Our optional escrow system eliminates payment disputes. Money is locked before work starts and released only after completion.
          </p>
        </div>

        {/* Escrow Flow */}
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {escrowSteps.map((step, i) => (
            <Motion.div key={step.label} variants={fadeUp} transition={{ duration: 0.4, delay: i * 0.1 }}>
              <Card className="group relative rounded-2xl p-6 text-center transition-all duration-300 hover:border-amber-400/25 hover:shadow-violet">
                <div className="absolute left-1/2 top-0 h-1 w-12 -translate-x-1/2 rounded-b-full bg-gradient-to-r from-emerald-400/60 to-violet-400/60" />
                <div className="mx-auto mb-4 mt-3 flex h-14 w-14 items-center justify-center rounded-2xl ${step.bg}">
                  <step.icon className={`h-7 w-7 ${step.color}`} />
                </div>
                <div className="mb-2 text-xs font-bold text-slate-500">STEP {i + 1}</div>
                <h3 className="font-bold">{step.label}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{step.desc}</p>
              </Card>
            </Motion.div>
          ))}
        </div>

        {/* Security badges */}
        <Motion.div variants={fadeUp} transition={{ duration: 0.5, delay: 0.3 }} className="mt-10">
          <Card className="mx-auto max-w-3xl rounded-2xl p-6">
            <div className="grid gap-4 sm:grid-cols-3">
              {securityFeatures.map((f) => (
                <div key={f.text} className="flex items-start gap-3">
                  <f.icon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                  <span className="text-sm leading-6 text-slate-300">{f.text}</span>
                </div>
              ))}
            </div>
          </Card>
        </Motion.div>
      </Motion.div>
    </section>
  );
}
