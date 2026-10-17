"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Shield, Sparkles } from "lucide-react";
import { GithubIcon } from "./icons";
import { gsap } from "gsap";
import { HeroMockup } from "./hero-mockup";

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
        <HeroMockup ref={mockupRef} />
      </div>
    </section>
  );
}
