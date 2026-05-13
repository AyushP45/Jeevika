import { motion as Motion } from "framer-motion";
import { Card } from "./ui/Card.jsx";

export function StatCard({ label, value, detail, icon: Icon }) {
  return (
    <Motion.div whileHover={{ y: -3 }}>
      <Card>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 text-3xl font-black">{value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
          </div>
          {Icon ? (
            <div className="rounded-xl bg-primary/10 p-3 text-primary">
              <Icon className="h-5 w-5" />
            </div>
          ) : null}
        </div>
      </Card>
    </Motion.div>
  );
}
