import React from "react";
import Link from "next/link";
import {
  Database,
  ShieldCheck,
  Cpu,
  Code2,
  GitFork,
  ArrowUpRight,
} from "lucide-react";
import { GithubIcon } from "./icons";

export function TrustSection() {
  const stackItems = [
    {
      title: "FastAPI Backend",
      desc: "Python 3.12+ async architecture with Pydantic v2 & SQLAlchemy 2.0 ORM.",
      badge: "REST 3.1",
      icon: Cpu,
    },
    {
      title: "PostgreSQL & AsyncPG",
      desc: "Robust relational data store with Alembic async database migrations.",
      badge: "Postgres 15+",
      icon: Database,
    },
    {
      title: "Multi-Tenant Security",
      desc: "Strict tenant isolation, Argon2id encryption, and IDOR defenses.",
      badge: "Tenant-Isolated",
      icon: ShieldCheck,
    },
    {
      title: "OpenAPI Client Sync",
      desc: "Zero hand-written backend DTOs. Synchronized TypeScript schemas.",
      badge: "Type-Safe",
      icon: Code2,
    },
  ];

  return (
    <section className="relative border-y border-border/60 bg-secondary/30 py-16">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-mono text-xs font-bold uppercase tracking-wider text-brand-orange">
            Verifiable Engineering
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Built with deterministic, production-proven technology.
          </h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            No black-box AI magic or vendor lock-in. TaskFlow is 100%
            open-source software built for reliable team governance.
          </p>
        </div>

        {/* Stack Grid */}
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stackItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="group relative rounded-xl border border-border/80 bg-card p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-brand-orange/40 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary transition-colors group-hover:bg-brand-orange/10">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 font-mono text-[11px] font-medium text-muted-foreground">
                    {item.badge}
                  </span>
                </div>
                <h3 className="mt-4 text-base font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* GitHub Repository Bar */}
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border/80 bg-card/60 p-4 backdrop-blur-sm sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-background">
              <GithubIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Reza-Msv / taskflow-front-end
              </p>
              <p className="text-xs text-muted-foreground">
                Public repository under MIT License. Contributions and issues
                welcome.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="https://github.com/Reza-Msv/taskflow-front-end"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-secondary"
            >
              <GitFork className="h-3.5 w-3.5" />
              <span>Fork Repository</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
