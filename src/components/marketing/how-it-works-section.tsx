import React from "react";
import {
  FolderPlus,
  SlidersHorizontal,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

export function HowItWorksSection() {
  const steps = [
    {
      step: "01",
      title: "Initialize Your Project & Sequence",
      desc: "Create an organization, specify your unique project key (e.g. CORE, WEB), and set up tenant access rules.",
      icon: FolderPlus,
    },
    {
      step: "02",
      title: "Organize Tasks & Configure Sprints",
      desc: "Assign priorities (P0 to P3), structure stories and bugs, and snapshot your sprint scope with clear milestones.",
      icon: SlidersHorizontal,
    },
    {
      step: "03",
      title: "Execute and Deliver Deterministically",
      desc: "Track status transitions across Kanban columns with optimistic concurrency protection and full audit trails.",
      icon: CheckCircle2,
    },
  ];

  return (
    <section id="how-it-works" className="relative py-20 md:py-28">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-mono text-xs font-bold uppercase tracking-wider text-brand-orange">
            Structured Workflow
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            From backlog ideation to verified sprint completion.
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            A three-step deterministic workflow designed for clarity and team
            execution speed.
          </p>
        </div>

        <div className="relative mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
          {steps.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="relative flex flex-col justify-between rounded-2xl border border-border bg-card p-8 shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-3xl font-extrabold text-brand-orange/40">
                      {item.step}
                    </span>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <h3 className="mt-6 text-lg font-bold text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {item.desc}
                  </p>
                </div>

                <div className="mt-8 flex items-center gap-2 border-t border-border/40 pt-4 text-xs font-medium text-brand-orange">
                  <span>Deterministic Phase</span>
                  <ArrowRight className="h-3 w-3 rtl:rotate-180" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
