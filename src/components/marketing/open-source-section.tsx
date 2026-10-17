import React from "react";
import Link from "next/link";
import {
  Terminal,
  GitFork,
  ArrowUpRight,
  Check,
  ShieldCheck,
  Database,
  Layers,
} from "lucide-react";
import { GithubIcon } from "./icons";
import { Button } from "@/components/ui/button";

export function OpenSourceSection() {
  const steps = [
    {
      title: "Clone Frontend & Backend",
      cmd: "git clone https://github.com/Reza-Msv/taskflow-front-end.git",
    },
    {
      title: "Install Dependencies",
      cmd: "pnpm install",
    },
    {
      title: "Run Development Server",
      cmd: "pnpm dev",
    },
  ];

  return (
    <section id="open-source" className="relative py-20 md:py-28">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-mono text-xs font-bold uppercase tracking-wider text-brand-orange">
            Open Source & Community
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Inspect the code. Self-host with confidence.
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            TaskFlow is completely transparent. Run it on your infrastructure
            with PostgreSQL, configure multi-tenancy, and customize workflows to
            your exact specifications.
          </p>
        </div>

        {/* Code terminal & install box */}
        <div className="mx-auto mt-14 max-w-4xl overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
          {/* Terminal Window Header */}
          <div className="flex items-center justify-between border-b border-border bg-secondary/60 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-destructive/60" />
              <div className="h-3 w-3 rounded-full bg-status-warning/60" />
              <div className="h-3 w-3 rounded-full bg-status-success/60" />
              <span className="ms-2 font-mono text-xs text-muted-foreground">
                bash — quickstart
              </span>
            </div>
            <span className="rounded border border-border bg-background px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
              MIT License
            </span>
          </div>

          {/* Terminal Content */}
          <div className="space-y-4 bg-background p-6 font-mono text-xs text-foreground">
            {steps.map((step, idx) => (
              <div key={step.title} className="space-y-1">
                <p className="font-sans text-[11px] text-muted-foreground">
                  # {idx + 1}. {step.title}
                </p>
                <div className="flex items-center justify-between rounded border border-border/50 bg-secondary/40 px-3.5 py-2.5 text-foreground">
                  <code>{step.cmd}</code>
                  <span className="text-[10px] text-muted-foreground">cli</span>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Call to Action */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border bg-secondary/20 p-5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-brand-orange" />
              <span>Full control over your data. No telemetry locks.</span>
            </div>
            <div className="flex items-center gap-3">
              <Button asChild variant="outline" size="sm" className="gap-2">
                <Link
                  href="https://github.com/Reza-Msv/taskflow-front-end"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <GithubIcon className="h-4 w-4" />
                  <span>GitHub Repository</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
