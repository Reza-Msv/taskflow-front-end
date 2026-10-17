"use client";

import React, { useRef, useEffect } from "react";
import {
  Kanban,
  Layers,
  ShieldCheck,
  RefreshCcw,
  ListOrdered,
  KeyRound,
  CheckCircle,
  Clock,
  Sparkles,
} from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function FeaturesShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>(".feature-card");
      cards.forEach((card) => {
        gsap.from(card, {
          scrollTrigger: {
            trigger: card,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
          opacity: 0,
          y: 30,
          duration: 0.6,
          ease: "power2.out",
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const coreFeatures = [
    {
      badge: "Scrum & Kanban",
      title: "Deterministic Sprint Lifecycles",
      desc: "Draft, active, and completed sprint states with immutable scope snapshots. Track committed versus completed velocity without guesswork.",
      icon: Layers,
      highlight: "Implemented in Core",
      codePreview: `sprint.state = SprintState.ACTIVE\nsprint.scope_snapshot = capture_scope(project_id)\nawait session.commit()`,
    },
    {
      badge: "Concurrency Control",
      title: "Optimistic Version Verification",
      desc: "Every work item mutation carries a strict version check. Eliminate stale overwrites and race conditions during simultaneous team edits.",
      icon: RefreshCcw,
      highlight: "HTTP 409 Conflict Safe",
      codePreview: `if current_item.version != incoming.version:\n    raise ConflictError("Stale write detected")`,
    },
    {
      badge: "Multi-Tenancy",
      title: "Backend-Authoritative Governance",
      desc: "Tenant boundaries enforced on every single query and mutation. Role policies (owner, admin, member, viewer) evaluated in dependency pipelines.",
      icon: ShieldCheck,
      highlight: "Zero IDOR Leaks",
      codePreview: `query = select(WorkItem).where(\n    WorkItem.organization_id == current_tenant.id\n)`,
    },
    {
      badge: "Data Integrity",
      title: "Race-Condition-Proof Issue Counters",
      desc: "Atomic sequence generators guarantee continuous issue keys (e.g. TF-101, TF-102) even under high-frequency distributed API submissions.",
      icon: ListOrdered,
      highlight: "PostgreSQL Sequences",
      codePreview: `next_seq = await get_atomic_sequence(\n    session, org_id, project_key\n)`,
    },
  ];

  return (
    <section
      id="features"
      ref={containerRef}
      className="border-t border-border/50 bg-secondary/20 py-20 md:py-28"
    >
      <div className="container mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-mono text-xs font-bold uppercase tracking-wider text-brand-orange">
            Core Architecture & Capabilities
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Engineered for high-performing engineering teams.
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            TaskFlow combines rigorous backend invariants with a fluid,
            accessible frontend experience.
          </p>
        </div>

        {/* 2x2 Feature Bento Layout */}
        <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-2">
          {coreFeatures.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="feature-card flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:border-brand-orange/40 hover:shadow-lg sm:p-8"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-orange/10 text-brand-orange">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="rounded-full bg-secondary px-3 py-1 font-mono text-[11px] font-medium text-foreground">
                      {feature.highlight}
                    </span>
                  </div>

                  <span className="mt-6 inline-block font-mono text-xs font-semibold text-brand-orange">
                    {feature.badge}
                  </span>
                  <h3 className="mt-1 text-xl font-bold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {feature.desc}
                  </p>
                </div>

                {/* Code verification snippet */}
                <div className="mt-6 overflow-x-auto rounded-lg border border-border/70 bg-background p-3.5 font-mono text-[11px] text-muted-foreground">
                  <div className="mb-2 flex items-center gap-1.5 border-b border-border/40 pb-2 text-[10px] text-muted-foreground/60">
                    <span className="h-2 w-2 rounded-full bg-border" />
                    <span>backend-invariant.py</span>
                  </div>
                  <pre className="font-mono text-foreground/90">
                    <code>{feature.codePreview}</code>
                  </pre>
                </div>
              </div>
            );
          })}
        </div>

        {/* Roadmap Transparency Callout */}
        <div className="mx-auto mt-12 max-w-3xl rounded-xl border border-border bg-card/60 p-6 text-center sm:p-8">
          <h4 className="font-mono text-sm font-semibold uppercase tracking-wider text-foreground">
            Clear Roadmap Transparency
          </h4>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Sprint management, Kanban, task states, and multi-tenancy are fully
            implemented. Team invites via email tokens and burndown report
            calculation are actively in progress in accordance with our
            technical plan.
          </p>
        </div>
      </div>
    </section>
  );
}
