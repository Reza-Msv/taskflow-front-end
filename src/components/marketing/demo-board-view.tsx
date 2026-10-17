import React from "react";
import { CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";
import type { SampleTask } from "./demo-data";

interface DemoBoardViewProps {
  tasks: SampleTask[];
}

export function DemoBoardView({ tasks }: DemoBoardViewProps) {
  return (
    <motion.div
      key="board"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="grid grid-cols-1 gap-6 md:grid-cols-3"
    >
      {/* To Do Column */}
      <div className="rounded-xl border border-border bg-secondary/30 p-4">
        <div className="mb-3 flex items-center justify-between border-b border-border pb-3 text-xs font-semibold">
          <span className="text-muted-foreground">TO DO</span>
          <span className="rounded bg-secondary px-2 py-0.5 font-mono text-[11px]">
            1
          </span>
        </div>
        <div className="space-y-3">
          {tasks
            .filter((t) => t.status === "To Do")
            .map((task) => (
              <div
                key={task.id}
                className="rounded-lg border border-border bg-card p-3.5 shadow-sm transition-all hover:border-border-strong"
              >
                <div className="flex items-center justify-between font-mono text-[11px] text-muted-foreground">
                  <span>{task.id}</span>
                  <span className="rounded bg-secondary px-1.5 py-0.5 font-sans text-[10px] font-medium text-foreground">
                    {task.priority}
                  </span>
                </div>
                <h4 className="mt-2 text-xs font-semibold leading-snug text-foreground">
                  {task.title}
                </h4>
                <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2 text-[11px] text-muted-foreground">
                  <span>{task.assignee}</span>
                  <span className="text-[10px]">{task.type}</span>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* In Progress Column */}
      <div className="rounded-xl border border-brand-orange/30 bg-brand-orange/[0.02] p-4">
        <div className="mb-3 flex items-center justify-between border-b border-brand-orange/20 pb-3 text-xs font-semibold">
          <span className="flex items-center gap-1.5 text-brand-orange">
            <span className="h-2 w-2 animate-pulse rounded-full bg-brand-orange" />
            IN PROGRESS
          </span>
          <span className="rounded bg-brand-orange/15 px-2 py-0.5 font-mono text-[11px] text-brand-orange">
            2
          </span>
        </div>
        <div className="space-y-3">
          {tasks
            .filter((t) => t.status === "In Progress")
            .map((task) => (
              <div
                key={task.id}
                className="relative overflow-hidden rounded-lg border border-brand-orange/40 bg-card p-3.5 shadow-sm transition-all hover:shadow-md"
              >
                <div className="absolute left-0 top-0 h-full w-1 bg-brand-orange" />
                <div className="flex items-center justify-between font-mono text-[11px] text-muted-foreground">
                  <span className="font-bold text-foreground">{task.id}</span>
                  <span className="rounded bg-brand-orange/10 px-1.5 py-0.5 font-sans text-[10px] font-semibold text-brand-orange">
                    {task.priority}
                  </span>
                </div>
                <h4 className="mt-2 text-xs font-semibold leading-snug text-foreground">
                  {task.title}
                </h4>
                <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2 text-[11px] text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {task.assignee}
                  </span>
                  <span className="text-[10px]">{task.type}</span>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Done Column */}
      <div className="rounded-xl border border-border bg-secondary/30 p-4">
        <div className="mb-3 flex items-center justify-between border-b border-border pb-3 text-xs font-semibold">
          <span className="text-status-success">DONE</span>
          <span className="rounded bg-secondary px-2 py-0.5 font-mono text-[11px]">
            2
          </span>
        </div>
        <div className="space-y-3">
          {tasks
            .filter((t) => t.status === "Done")
            .map((task) => (
              <div
                key={task.id}
                className="rounded-lg border border-border/80 bg-card/70 p-3.5 shadow-sm"
              >
                <div className="flex items-center justify-between font-mono text-[11px] text-muted-foreground">
                  <span>{task.id}</span>
                  <span className="rounded bg-status-success/15 px-1.5 py-0.5 font-sans text-[10px] font-semibold text-status-success">
                    Done
                  </span>
                </div>
                <h4 className="mt-2 text-xs font-medium leading-snug text-muted-foreground line-through">
                  {task.title}
                </h4>
                <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2 text-[11px] text-muted-foreground">
                  <span>{task.assignee}</span>
                  <CheckCircle2 className="h-3.5 w-3.5 text-status-success" />
                </div>
              </div>
            ))}
        </div>
      </div>
    </motion.div>
  );
}
