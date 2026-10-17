import React from "react";
import { Users, GitBranch, Layers, ShieldCheck } from "lucide-react";

export function UseCasesSection() {
  const cases = [
    {
      title: "Software Engineering Teams",
      desc: "Manage sprints, map technical tasks to bugs or features, and protect concurrency with backend version checks.",
      icon: GitBranch,
      audience: "Developers & Tech Leads",
    },
    {
      title: "Scrum & Agile Practitioners",
      desc: "Run timeboxed sprints with snapshot committed scopes, burndown metrics, and structured backlog grooming.",
      icon: Layers,
      audience: "Scrum Masters & PMs",
    },
    {
      title: "Self-Hosters & Regulated Orgs",
      desc: "Retain complete custody of project data on private PostgreSQL instances without SaaS cloud lock-in.",
      icon: ShieldCheck,
      audience: "Enterprise & DevOps",
    },
    {
      title: "Open-Source Maintainers",
      desc: "Coordinate contributor issues with deterministic sequence identifiers and clear public milestone tracking.",
      icon: Users,
      audience: "Community Leads",
    },
  ];

  return (
    <section className="border-t border-border/50 bg-secondary/20 py-20">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-mono text-xs font-bold uppercase tracking-wider text-brand-orange">
            Tailored For Modern Teams
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Designed for those who care about how software is built.
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            Whether running tight two-week Scrum sprints or self-hosting on
            private clouds, TaskFlow adapts to your engineering workflow.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {cases.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="flex flex-col justify-between rounded-xl border border-border bg-card p-6 shadow-sm transition-colors hover:border-brand-orange/40"
              >
                <div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-base font-bold text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {item.desc}
                  </p>
                </div>
                <div className="mt-6 border-t border-border/40 pt-4">
                  <span className="font-mono text-[11px] font-medium text-brand-orange">
                    {item.audience}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
