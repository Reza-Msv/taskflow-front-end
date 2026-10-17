"use client";

import React, { useState } from "react";
import { Kanban, ListFilter, LayoutDashboard } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { sampleTasks, type ViewMode } from "./demo-data";
import { DemoBoardView } from "./demo-board-view";
import { DemoListView } from "./demo-list-view";
import { DemoOverviewView } from "./demo-overview-view";

export function ProductPreviewDemo() {
  const [activeTab, setActiveTab] = useState<ViewMode>("board");

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
              {activeTab === "board" && <DemoBoardView tasks={sampleTasks} />}
              {activeTab === "list" && <DemoListView tasks={sampleTasks} />}
              {activeTab === "overview" && <DemoOverviewView />}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
