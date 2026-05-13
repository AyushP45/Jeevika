import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Briefcase, Home, LogOut, MessageCircle, Moon, PlusCircle, Sun, User, Wallet, ShieldAlert } from "lucide-react";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "./ui/Button.jsx";
import { useJeevikaStore } from "../lib/store.js";
import { cn } from "../lib/utils.js";
import { useTranslation } from "../lib/i18n.js";
import { NotificationBell } from "./NotificationBell.jsx";


export function AppShell() {
  const { theme, setTheme, user, logout, language, setLanguage } = useJeevikaStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const isEmployer = user.role === "employer";
  const isAdmin = user.role === "admin";

  const nav = [
    { to: "/dashboard", label: t("nav.dashboard"), icon: Home, show: true },
    { to: "/jobs", label: t("nav.jobs"), icon: Briefcase, show: !isEmployer && !isAdmin },
    { to: "/post-job", label: isEmployer ? "Manage Jobs" : t("nav.post"), icon: PlusCircle, show: isEmployer },
    { to: "/wallet", label: t("nav.wallet"), icon: Wallet, show: !isAdmin },
    { to: "/profile", label: t("nav.profile"), icon: User, show: true },
    { to: "/admin", label: "Admin", icon: ShieldAlert, show: isAdmin }
  ].filter(item => item.show);

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
  }, [theme]);

  const cycleLanguage = () => {
    const next = { en: "hi", hi: "mr", mr: "en" }[language] || "en";
    setLanguage(next);
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-background/75 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="Jeevika Logo" className="h-10 w-auto" />
            <div className="hidden sm:block">
              <p className="text-base font-black">Jeevika</p>
              <p className="text-xs text-muted-foreground">Connecting Workers & Resources</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-1 lg:flex">
            {nav.map((item) => {
              const isActive = location.pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "relative flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition",
                    isActive ? "text-slate-950 dark:text-slate-950" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-nav-desktop"
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-500"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <item.icon className="relative z-10 h-4 w-4" />
                  <span className="relative z-10">{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Button variant="ghost" className="font-bold text-xs px-2" onClick={cycleLanguage} aria-label="Toggle language">
              {language.toUpperCase()}
            </Button>
            <Button variant="ghost" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="secondary" className="hidden sm:inline-flex" onClick={() => navigate("/profile")}>
              {user.name}
            </Button>
            <Button variant="ghost" onClick={() => { logout(); navigate("/"); }} aria-label="Logout">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 pb-24 lg:py-8">
        <Outlet />
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-background/90 px-2 py-2 backdrop-blur-2xl lg:hidden overflow-x-auto no-scrollbar">
        <div className="mx-auto flex min-w-max justify-around gap-2 px-1">
          {nav.map((item) => {
            const isActive = location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "relative grid place-items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium transition",
                  isActive ? "text-emerald-500 dark:text-emerald-400" : "text-muted-foreground"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-nav-mobile"
                    className="absolute inset-0 rounded-xl bg-emerald-500/10 dark:bg-emerald-400/10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <item.icon className="relative z-10 h-4 w-4" />
                <span className="relative z-10">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
