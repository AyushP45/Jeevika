import { motion as Motion } from "framer-motion";
import { cn } from "../../lib/utils.js";

const variants = {
  primary: "bg-primary text-primary-foreground shadow-glow hover:brightness-110",
  secondary: "bg-white/10 text-foreground hover:bg-white/15",
  ghost: "bg-transparent text-muted-foreground hover:bg-white/10 hover:text-foreground",
  outline: "border border-border bg-transparent text-foreground hover:bg-white/10"
};

export function Button({ className, variant = "primary", children, as: Component = "button", ...props }) {
  return (
    <Motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} className="inline-flex">
      <Component
        className={cn(
          "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60",
          variants[variant],
          className
        )}
        {...props}
      >
        {children}
      </Component>
    </Motion.div>
  );
}
