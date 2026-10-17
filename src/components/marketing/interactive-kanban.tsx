"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  GripVertical,
  Plus,
  RotateCcw,
  ArrowRight,
} from "lucide-react";
import { motion } from "motion/react";

interface DemoTask {
  id: string;
  title: string;
  column: "todo" | "inprogress" | "done";
  priority: "P1 High" | "P2 Medium" | "P3 Low";
}

export function InteractiveKanban() {
  const initialTasks: DemoTask[] = [
    {
      id: "DEMO-01",
      title: "Verify tenant isolation in FastAPI dependencies",
      column: "todo",
      priority: "P1 High",
    },
    {
      id: "DEMO-02",
      title: "Optimistic concurrency version header check",
      column: "inprogress",
      priority: "P2 Medium",
    },
    {
      id: "DEMO-03",
      title: "Automate openapi-typescript client build",
      column: "done",
      priority: "P3 Low",
    },
  ];

  const [tasks, setTasks] = useState<DemoTask[]>(initialTasks);

  const moveTask = (
    taskId: string,
    targetColumn: "todo" | "inprogress" | "done"
  ) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, column: targetColumn } : t))
    );
  };

  const resetDemo = () => {
    setTasks(initialTasks);
  };

  const columns = [
    {
      key: "todo" as const,
      label: "TO DO",
      badgeClass: "bg-secondary text-foreground",
    },
    {
      key: "inprogress" as const,
      label: "IN PROGRESS",
      badgeClass: "bg-brand-orange/15 text-brand-orange",
    },
    {
      key: "done" as const,
      label: "DONE",
      badgeClass: "bg-status-success/15 text-status-success",
    },
  ];

  return (
    <section className="border-y border-border/60 bg-secondary/30 py-20">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <Badge
            variant="outline"
            className="border-brand-orange/40 font-mono text-brand-orange"
          >
            Hands-on Sandbox
          </Badge>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Try the TaskFlow board right here.
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            Click to transition work items across columns. State changes are
            handled reactively in local memory.
          </p>
          <div className="mt-4 flex justify-center">
            <button
              onClick={resetDemo}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Demo State</span>
            </button>
          </div>
        </div>

        {/* 3 Column Board */}
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {columns.map((col) => {
            const colTasks = tasks.filter((t) => t.column === col.key);
            return (
              <div
                key={col.key}
                className="rounded-xl border border-border bg-card p-4 shadow-sm"
              >
                <div className="mb-3 flex items-center justify-between border-b border-border/60 pb-3">
                  <span className="text-xs font-bold tracking-wider text-muted-foreground">
                    {col.label}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold ${col.badgeClass}`}
                  >
                    {colTasks.length}
                  </span>
                </div>

                <div className="min-h-[160px] space-y-3">
                  {colTasks.length === 0 ? (
                    <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border/60 text-xs text-muted-foreground">
                      No tasks in this column
                    </div>
                  ) : (
                    colTasks.map((task) => (
                      <motion.div
                        layout
                        key={task.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2 }}
                        className="rounded-lg border border-border bg-background p-4 shadow-sm transition-colors hover:border-brand-orange/40"
                      >
                        <div className="flex items-center justify-between font-mono text-[11px] text-muted-foreground">
                          <span className="font-bold text-foreground">
                            {task.id}
                          </span>
                          <span className="rounded bg-secondary px-1.5 py-0.5 font-sans text-[10px] font-medium text-foreground">
                            {task.priority}
                          </span>
                        </div>
                        <p className="mt-2 text-xs font-semibold leading-snug text-foreground">
                          {task.title}
                        </p>

                        {/* Interactive Move Controls */}
                        <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3 text-[11px]">
                          <span className="text-[10px] text-muted-foreground">
                            Move to:
                          </span>
                          <div className="flex gap-1.5">
                            {col.key !== "todo" && (
                              <button
                                onClick={() => moveTask(task.id, "todo")}
                                className="rounded bg-secondary px-2 py-0.5 text-[10px] font-medium text-foreground transition-colors hover:bg-secondary-hover"
                              >
                                To Do
                              </button>
                            )}
                            {col.key !== "inprogress" && (
                              <button
                                onClick={() => moveTask(task.id, "inprogress")}
                                className="rounded bg-brand-orange/15 px-2 py-0.5 text-[10px] font-semibold text-brand-orange transition-colors hover:bg-brand-orange/20"
                              >
                                In Progress
                              </button>
                            )}
                            {col.key !== "done" && (
                              <button
                                onClick={() => moveTask(task.id, "done")}
                                className="rounded bg-status-success/15 px-2 py-0.5 text-[10px] font-semibold text-status-success transition-colors hover:bg-status-success/20"
                              >
                                Done
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
