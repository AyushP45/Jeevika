import { useState } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Badge } from "../ui/Card.jsx";

const faqs = [
  {
    q: "Is Jeevika free to use?",
    a: "Yes! Posting requirements, browsing jobs, and chatting with matches is completely free. We only facilitate optional escrow — there are no hidden fees or commissions."
  },
  {
    q: "How does the escrow system protect my money?",
    a: "When an employer locks funds in escrow, the money is held securely by Jeevika. It's released to the worker only after the employer confirms completion. If no action is taken, funds auto-release after 48 hours. Either party can raise a dispute for resolution."
  },
  {
    q: "What roles can I register as?",
    a: "You can register as a Worker (labor, farm, repair, household), Equipment Owner (tractors, tools, machines), Material Provider (cement, paint, tiles), or Employer (hire people, equipment, or materials). You can hold multiple roles."
  },
  {
    q: "How does Jeevika verify workers and employers?",
    a: "We use phone verification, Aadhaar-based identity checks (optional), job completion tracking, and community ratings. Workers earn trust badges like 'Verified', 'Top Rated', 'Trusted', and 'Gold' based on their track record."
  },
  {
    q: "Which areas does Jeevika cover?",
    a: "Jeevika currently operates as an MVP across Kolhapur, Pune, and Bengaluru with demo data covering villages, towns, and cities. We're designed to scale to any location across India."
  },
  {
    q: "Can I use Jeevika in my local language?",
    a: "Multi-language support is on our roadmap. The platform is designed with India-first simplicity — clear icons, minimal text, and intuitive workflows that work regardless of language barriers."
  },
  {
    q: "What happens if there's a dispute?",
    a: "Disputes are handled through our resolution system. Both parties can submit evidence, and Jeevika mediates based on chat history, job details, and escrow terms. Funds remain locked until resolution."
  },
  {
    q: "Do I need a bank account to use Jeevika?",
    a: "No. Jeevika integrates with UPI, so you only need a UPI ID linked to any bank account or digital wallet. Payments are instant and free."
  }
];

function FaqItem({ faq, isOpen, onToggle }) {
  return (
    <div className="border-b border-white/8">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between py-5 text-left transition-colors hover:text-emerald-300"
      >
        <span className="pr-4 font-semibold">{faq.q}</span>
        <Motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <ChevronDown className="h-5 w-5 shrink-0 text-slate-400" />
        </Motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <Motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="pb-5 leading-7 text-slate-400">{faq.a}</p>
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="mx-auto max-w-7xl px-4 py-20">
      <Motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-center">
          <Badge tone="sky">FAQ</Badge>
          <h2 className="mt-4 text-3xl font-black sm:text-5xl">
            Frequently Asked Questions
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-400">
            Everything you need to know about Jeevika, escrow, and getting started.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-3xl">
          {faqs.map((faq, i) => (
            <FaqItem
              key={faq.q}
              faq={faq}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
            />
          ))}
        </div>
      </Motion.div>
    </section>
  );
}
