"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Terminal,
  CheckCircle2,
  Shield,
  Sparkles,
} from "lucide-react";
import { GithubIcon } from "./icons";
import { gsap } from "gsap";
import { motion } from "motion/react";

interface HeroSectionProps {
  locale: string;
}

export function HeroSection({ locale }: HeroSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const copyRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const mockupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "power3.out", duration: 0.8 },
      });

      tl.from(".hero-badge", { opacity: 0, y: -16, duration: 0.6 })
        .from(
          headlineRef.current,
          { opacity: 0, y: 24, duration: 0.9 },
          "-=0.3"
        )
        .from(copyRef.current, { opacity: 0, y: 20, duration: 0.7 }, "-=0.5")
        .from(ctaRef.current, { opacity: 0, y: 16, duration: 0.6 }, "-=0.4")
        .from(
          mockupRef.current,
          { opacity: 0, y: 40, scale: 0.98, duration: 1.1, ease: "power2.out" },
          "-=0.4"
        );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative overflow-hidden pb-20 pt-12 md:pb-32 md:pt-20"
    >
      {/* Background Radial Glow & Technical Grid */}
      <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
        <div className="h-[520px] w-[520px] rounded-full bg-brand-orange/10 blur-[130px] dark:bg-brand-orange/15" />
      </div>

      <div className="container mx-auto px-4 sm:px-6">
        <div className="mx-auto max-w-4xl text-center">
          {/* Eyebrow / Open Source Badge */}
          <div className="hero-badge inline-flex items-center gap-2 rounded-full border border-border/70 bg-secondary/50 px-3.5 py-1.5 text-xs font-semibold text-muted-foreground shadow-sm backdrop-blur-sm">
            <span className="flex h-2 w-2 rounded-full bg-brand-orange" />
            <span className="font-mono text-[11px] uppercase tracking-widest text-foreground">
              Open-Source Project Management
            </span>
            <span className="text-border">|</span>
            <span className="text-xs font-medium text-primary">
              FastAPI + Next.js
            </span>
          </div>

          {/* Main Headline */}
          <h1
            ref={headlineRef}
            className="mt-6 text-4xl font-extrabold leading-[1.08] tracking-tight text-foreground sm:text-6xl md:text-7xl"
          >
            Bring your team&apos;s best work{" "}
            <span className="relative whitespace-nowrap">
              <span className="relative z-10 text-brand-orange">
                into focus.
              </span>
              <span
                aria-hidden="true"
                className="absolute bottom-1 left-0 right-0 -z-10 h-3 -rotate-1 rounded bg-brand-orange/15"
              />
            </span>
          </h1>

          {/* Supporting Subtitle */}
          <p
            ref={copyRef}
            className="mx-auto mt-6 max-w-2xl text-base font-normal leading-relaxed text-muted-foreground sm:text-lg md:text-xl"
          >
            Plan projects, track tasks, run deterministic sprints, and move from
            ideas to delivery in one unified, multi-tenant workspace.
          </p>

          {/* Primary & Secondary CTAs */}
          <div
            ref={ctaRef}
            className="mt-8 flex flex-wrap items-center justify-center gap-3.5 sm:gap-4"
          >
            <Button
              asChild
              size="lg"
              className="gap-2 px-6 py-6 text-base font-semibold shadow-md shadow-brand-orange/15"
            >
              <Link href={`/${locale}/projects`}>
                <span>Get Started Free</span>
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="gap-2 border-border/80 px-6 py-6 text-base font-medium hover:bg-secondary/70"
            >
              <Link
                href="https://github.com/Reza-Msv/taskflow-front-end"
                target="_blank"
                rel="noopener noreferrer"
              >
                <GithubIcon className="h-4 w-4" />
                <span>Explore on GitHub</span>
              </Link>
            </Button>
          </div>

          {/* Verifiable Credentials Pill Line */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-brand-orange" />
              100% Deterministic Workflows
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-brand-orange" />
              Strict Multi-Tenant Isolation
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-brand-orange" />
              OpenAPI Contract Synchronized
            </span>
          </div>
        </div>

        {/* Hero Interactive Visual / Product Teaser Frame */}
        <div
          ref={mockupRef}
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
      </div>
    </section>
  );
}
