import React from "react";
import { motion } from "motion/react";

export function DemoOverviewView() {
  return (
    <motion.div
      key="overview"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="grid grid-cols-1 gap-6 sm:grid-cols-3"
    >
      <div className="rounded-xl border border-border bg-secondary/30 p-5">
        <p className="text-xs font-semibold text-muted-foreground">
          Sprint Completion
        </p>
        <p className="mt-2 text-3xl font-extrabold text-foreground">78%</p>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-brand-orange"
            style={{ width: "78%" }}
          />
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          14 of 18 Story Points delivered
        </p>
      </div>

      <div className="rounded-xl border border-border bg-secondary/30 p-5">
        <p className="text-xs font-semibold text-muted-foreground">
          Scope Stability
        </p>
        <p className="mt-2 text-3xl font-extrabold text-status-success">100%</p>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-status-success"
            style={{ width: "100%" }}
          />
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Zero uncommitted scope injected
        </p>
      </div>

      <div className="rounded-xl border border-border bg-secondary/30 p-5">
        <p className="text-xs font-semibold text-muted-foreground">
          Deterministic Keys
        </p>
        <p className="mt-2 text-3xl font-extrabold text-foreground">TF-108</p>
        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-status-info" />
          Sequential sequence generation
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Race-condition safe counters
        </p>
      </div>
    </motion.div>
  );
}
