import React, { forwardRef } from "react";

export const HeroMockup = forwardRef<HTMLDivElement>(
  function HeroMockup(_props, ref) {
    return (
      <div
        ref={ref}
        className="relative mx-auto mt-14 max-w-5xl rounded-xl border border-border/80 bg-card p-2 shadow-2xl backdrop-blur-xl sm:p-3"
      >
        {/* Window Chrome */}
        <div className="flex items-center justify-between border-b border-border/60 px-3 pb-3 pt-1">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-destructive/60" />
            <div className="h-3 w-3 rounded-full bg-status-warning/60" />
            <div className="h-3 w-3 rounded-full bg-status-success/60" />
            <span className="ms-2 font-mono text-[11px] text-muted-foreground">
              TaskFlow Workspace — Sprint 14
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
            <span className="rounded bg-secondary px-2 py-0.5 text-foreground/80">
              app.taskflow.dev
            </span>
          </div>
        </div>

        {/* Mini Interactive Preview Graphic */}
        <div className="mt-2 grid grid-cols-1 gap-3 rounded-lg bg-secondary/30 p-4 md:grid-cols-4">
          {/* Sidebar teaser */}
          <div className="hidden flex-col gap-2 rounded-md border border-border/40 bg-card/60 p-3 text-xs md:flex">
            <div className="flex items-center justify-between font-semibold text-foreground">
              <span>TaskFlow Core</span>
              <span className="py-0.2 rounded bg-brand-orange/20 px-1.5 font-mono text-[10px] text-brand-orange">
                ACTIVE
              </span>
            </div>
            <div className="mt-2 space-y-1 text-muted-foreground">
              <div className="flex items-center gap-2 rounded bg-accent px-2 py-1 font-medium text-accent-foreground">
                <div className="h-2 w-2 rounded-full bg-brand-orange" />
                <span>Kanban Board</span>
              </div>
              <div className="flex items-center gap-2 rounded px-2 py-1 hover:bg-secondary">
                <div className="h-2 w-2 rounded-full bg-muted-foreground/40" />
                <span>Active Sprint (14)</span>
              </div>
              <div className="flex items-center gap-2 rounded px-2 py-1 hover:bg-secondary">
                <div className="h-2 w-2 rounded-full bg-muted-foreground/40" />
                <span>Backlog</span>
              </div>
            </div>
          </div>

          {/* Board teaser columns */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:col-span-3">
            {/* Column 1: To Do */}
            <div className="rounded-lg border border-border/60 bg-card/80 p-3">
              <div className="mb-2 flex items-center justify-between border-b border-border/40 pb-2 text-xs font-semibold">
                <span className="text-muted-foreground">TO DO</span>
                <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px]">
                  3
                </span>
              </div>
              <div className="space-y-2">
                <div className="rounded border border-border/70 bg-background p-2.5 text-xs shadow-sm">
                  <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground">
                    <span>TF-108</span>
                    <span className="rounded bg-status-info/10 px-1 font-sans text-status-info">
                      P2 Medium
                    </span>
                  </div>
                  <p className="mt-1.5 font-medium text-foreground">
                    Migrate auth tokens to Argon2id
                  </p>
                </div>
              </div>
            </div>

            {/* Column 2: In Progress */}
            <div className="rounded-lg border border-border/60 bg-card/80 p-3">
              <div className="mb-2 flex items-center justify-between border-b border-border/40 pb-2 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-brand-orange">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-orange" />
                  IN PROGRESS
                </span>
                <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px]">
                  2
                </span>
              </div>
              <div className="space-y-2">
                <div className="relative overflow-hidden rounded border border-brand-orange/40 bg-background p-2.5 text-xs shadow-sm">
                  <div className="absolute left-0 top-0 h-full w-1 bg-brand-orange" />
                  <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground">
                    <span>TF-102</span>
                    <span className="rounded bg-brand-orange/15 px-1 font-sans font-semibold text-brand-orange">
                      P1 High
                    </span>
                  </div>
                  <p className="mt-1.5 font-medium text-foreground">
                    Implement tenant-isolated sequence counters
                  </p>
                </div>
              </div>
            </div>

            {/* Column 3: Done */}
            <div className="rounded-lg border border-border/60 bg-card/80 p-3">
              <div className="mb-2 flex items-center justify-between border-b border-border/40 pb-2 text-xs font-semibold">
                <span className="text-status-success">DONE</span>
                <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px]">
                  8
                </span>
              </div>
              <div className="space-y-2">
                <div className="rounded border border-border/70 bg-background/70 p-2.5 text-xs shadow-sm">
                  <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground">
                    <span>TF-097</span>
                    <span className="rounded bg-status-success/15 px-1 font-sans text-status-success">
                      Done
                    </span>
                  </div>
                  <p className="mt-1.5 font-medium text-muted-foreground line-through">
                    OpenAPI 3.1 client synchronization
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
