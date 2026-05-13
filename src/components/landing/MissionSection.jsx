import { motion as Motion } from "framer-motion";
import { Heart, Globe, Handshake } from "lucide-react";
import { Card, Badge } from "../ui/Card.jsx";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } };

export function MissionSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20">
      <Motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeUp} transition={{ duration: 0.6 }}>
        <div className="text-center">
          <Badge tone="emerald">Our Mission</Badge>
          <h2 className="mt-4 text-3xl font-black sm:text-5xl">
            <span className="gradient-text">Why Jeevika Exists</span>
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            India's informal workforce — over 400 million strong — powers agriculture, construction, and households. Yet most workers find jobs through word-of-mouth, face uncertain payments, and have no way to build a verifiable reputation. Jeevika bridges that gap with technology designed for real India.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {[
            { icon: Heart, title: "Dignity of Work", text: "Every worker deserves transparent terms, fair pay, and a reputation they own. Jeevika makes informal work professional without making it complicated.", color: "text-rose-400" },
            { icon: Globe, title: "India-First Design", text: "Built for villages, towns, and cities alike. Simple interfaces, local language support, and workflows that respect how India actually works — from farms in Kolhapur to homes in Bengaluru.", color: "text-emerald-400" },
            { icon: Handshake, title: "Trust as Currency", text: "Verified profiles, completion badges, ratings, and optional escrow payments create a trust layer that replaces the need for personal connections or middlemen.", color: "text-violet-400" }
          ].map((item, i) => (
            <Motion.div key={item.title} variants={fadeUp} transition={{ duration: 0.5, delay: i * 0.15 }}>
              <Card className="group relative overflow-hidden rounded-2xl p-7 transition-all duration-300 hover:border-emerald-400/30 hover:shadow-glow">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/5 to-violet-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="relative">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5">
                    <item.icon className={`h-6 w-6 ${item.color}`} />
                  </div>
                  <h3 className="text-xl font-bold">{item.title}</h3>
                  <p className="mt-3 leading-7 text-slate-300">{item.text}</p>
                </div>
              </Card>
            </Motion.div>
          ))}
        </div>
      </Motion.div>
    </section>
  );
}
