"use client";

import React, { useState } from "react";
import {
  Kanban,
  ListFilter,
  LayoutDashboard,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  FolderKanban,
  Layers,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Badge } from "@/components/ui/badge";

type ViewMode = "board" | "list" | "overview";

export function ProductPreviewDemo() {
  const [activeTab, setActiveTab] = useState<ViewMode>("board");

  const sampleTasks = [
    {
      id: "TF-101",
      title: "Set up multi-tenant organization context middleware",
      status: "In Progress",
      statusColor:
        "text-brand-orange bg-brand-orange/10 border-brand-orange/20",
      priority: "P1 High",
      assignee: "Alex R.",
      sprint: "Sprint 14",
      type: "Task",
    },
    {
      id: "TF-102",
      title: "Optimistic concurrency version check in WorkItems domain",
      status: "In Progress",
      statusColor:
        "text-brand-orange bg-brand-orange/10 border-brand-orange/20",
      priority: "P1 High",
      assignee: "Elena M.",
      sprint: "Sprint 14",
      type: "Story",
    },
    {
      id: "TF-103",
      title: "Deterministic issue sequence counters on project creation",
      status: "To Do",
      statusColor: "text-status-info bg-status-info/10 border-status-info/20",
      priority: "P2 Medium",
      assignee: "Marcus T.",
      sprint: "Sprint 14",
      type: "Bug",
    },
    {
      id: "TF-104",
      title: "Synchronize openapi.json with Next.js client types",
      status: "Done",
      statusColor:
        "text-status-success bg-status-success/10 border-status-success/20",
      priority: "P3 Low",
      assignee: "Sarah K.",
      sprint: "Sprint 14",
      type: "Task",
    },
    {
      id: "TF-105",
      title: "Implement Argon2id password hash verification",
      status: "Done",
      statusColor:
        "text-status-success bg-status-success/10 border-status-success/20",
      priority: "P1 High",
      assignee: "Elena M.",
      sprint: "Sprint 14",
      type: "Task",
    },
  ];

  return (
    <section id="demo" className="relative py-20 md:py-28">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <Badge
            variant="outline"
            className="border-brand-orange/40 font-mono text-brand-orange"
          >
            Interactive Product Preview
          </Badge>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything your team needs to stay aligned.
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            Explore authentic views from the TaskFlow interface. Switch between
            Kanban boards, structured lists, and project metrics.
          </p>

          {/* Interactive View Switcher Tabs */}
          <div className="mt-8 inline-flex items-center rounded-xl border border-border bg-card p-1 shadow-sm">
            <button
              onClick={() => setActiveTab("board")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                activeTab === "board"
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Kanban className="h-3.5 w-3.5" />
              <span>Kanban Board</span>
            </button>
            <button
              onClick={() => setActiveTab("list")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                activeTab === "list"
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ListFilter className="h-3.5 w-3.5" />
              <span>Task List</span>
            </button>
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                activeTab === "overview"
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>Project Overview</span>
            </button>
          </div>
        </div>

        {/* Dashboard Shell Mockup */}
        <div className="mt-10 overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
          {/* Top Mockup Header Bar */}
          <div className="flex flex-wrap items-center justify-between border-b border-border bg-secondary/40 px-5 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-xs font-bold text-background">
                TF
              </div>
              <div>
                <h3 className="text-xs font-bold text-foreground">
                  TaskFlow Core Engineering{" "}
                  <span className="font-normal text-muted-foreground">
                    (PRJ-01)
                  </span>
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Sprint 14 • 8 days remaining • 14 of 18 Story Points completed
                </p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2 sm:mt-0">
              <span className="flex items-center gap-1 rounded-full bg-status-success/15 px-2.5 py-0.5 text-[10px] font-semibold text-status-success">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-status-success" />
                Active Sprint
              </span>
            </div>
          </div>

          {/* Interactive Content Body */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {activeTab === "board" && (
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
                      {sampleTasks
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
                      {sampleTasks
                        .filter((t) => t.status === "In Progress")
                        .map((task) => (
                          <div
                            key={task.id}
                            className="relative overflow-hidden rounded-lg border border-brand-orange/40 bg-card p-3.5 shadow-sm transition-all hover:shadow-md"
                          >
                            <div className="absolute left-0 top-0 h-full w-1 bg-brand-orange" />
                            <div className="flex items-center justify-between font-mono text-[11px] text-muted-foreground">
                              <span className="font-bold text-foreground">
                                {task.id}
                              </span>
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
                      {sampleTasks
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
              )}

              {activeTab === "list" && (
                <motion.div
                  key="list"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-x-auto"
                >
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-border font-semibold text-muted-foreground">
                        <th className="px-3 py-3">Key</th>
                        <th className="px-3 py-3">Summary</th>
                        <th className="px-3 py-3">Status</th>
                        <th className="px-3 py-3">Priority</th>
                        <th className="px-3 py-3">Assignee</th>
                        <th className="px-3 py-3">Sprint</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {sampleTasks.map((task) => (
                        <tr
                          key={task.id}
                          className="transition-colors hover:bg-secondary/40"
                        >
                          <td className="px-3 py-3 font-mono font-semibold text-foreground">
                            {task.id}
                          </td>
                          <td className="px-3 py-3 font-medium text-foreground">
                            {task.title}
                          </td>
                          <td className="px-3 py-3">
                            <span
                              className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium ${task.statusColor}`}
                            >
                              {task.status}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-muted-foreground">
                            {task.priority}
                          </td>
                          <td className="px-3 py-3 font-medium text-foreground">
                            {task.assignee}
                          </td>
                          <td className="px-3 py-3 font-mono text-muted-foreground">
                            {task.sprint}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </motion.div>
              )}

              {activeTab === "overview" && (
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
                    <p className="mt-2 text-3xl font-extrabold text-foreground">
                      78%
                    </p>
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
                    <p className="mt-2 text-3xl font-extrabold text-status-success">
                      100%
                    </p>
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
                    <p className="mt-2 text-3xl font-extrabold text-foreground">
                      TF-108
                    </p>
                    <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span className="h-2 w-2 rounded-full bg-status-info" />
                      Sequential sequence generation
                    </div>
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      Race-condition safe counters
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
