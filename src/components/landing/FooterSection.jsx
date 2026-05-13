import { Link } from "react-router-dom";
import { Mail, MapPin, Phone } from "lucide-react";

const footerLinks = {
  Platform: [
    { label: "Dashboard", to: "/dashboard" },
    { label: "Browse Jobs", to: "/jobs" },
    { label: "Post a Requirement", to: "/post-job" },
    { label: "Wallet & Escrow", to: "/wallet" }
  ],
  Company: [
    { label: "About Jeevika", to: "#mission" },
    { label: "How It Works", to: "#how-it-works" },
    { label: "FAQ", to: "#faq" },
    { label: "Contact Us", to: "#contact" }
  ],
  Legal: [
    { label: "Privacy Policy", to: "#" },
    { label: "Terms of Service", to: "#" },
    { label: "Escrow Policy", to: "#" },
    { label: "Refund Policy", to: "#" }
  ]
};

export function FooterSection() {
  return (
    <footer className="border-t border-white/8 bg-gradient-to-b from-transparent to-slate-950/50">
      <div className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-emerald-300 to-violet-500 font-black text-slate-950">
                J
              </div>
              <div>
                <p className="font-black text-lg">Jeevika</p>
                <p className="text-xs text-slate-400">Building Trust in Work</p>
              </div>
            </Link>
            <p className="mt-5 max-w-sm leading-7 text-slate-400">
              Connecting India's informal workforce with trusted employers through verified matching, transparent payments, and optional escrow protection.
            </p>
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <MapPin className="h-4 w-4 text-emerald-400" />
                Kolhapur · Pune · Bengaluru · India
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Mail className="h-4 w-4 text-emerald-400" />
                hello@jeevika.in
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Phone className="h-4 w-4 text-emerald-400" />
                +91 98765 43210
              </div>
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-300">{heading}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className="text-sm text-slate-400 transition-colors hover:text-emerald-300">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-14 flex flex-col gap-4 border-t border-white/8 pt-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; 2026 Jeevika. All rights reserved. Built for India's workforce.</p>
          <p>MVP Demo · Hackathon Project · Fast Matching + Trust + Escrow</p>
        </div>
      </div>
    </footer>
  );
}
