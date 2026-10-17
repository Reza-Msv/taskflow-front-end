import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { GithubIcon } from "./icons";

interface FinalCtaSectionProps {
  locale: string;
}

export function FinalCtaSection({ locale }: FinalCtaSectionProps) {
  return (
    <section className="relative overflow-hidden border-t border-border py-24 md:py-32">
      {/* Background Subtle Orange Glow */}
      <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
        <div className="h-[400px] w-[400px] rounded-full bg-brand-orange/10 blur-[120px] dark:bg-brand-orange/15" />
      </div>

      <div className="container mx-auto px-4 sm:px-6">
        <div className="mx-auto max-w-4xl rounded-3xl border border-border/80 bg-card/80 p-8 text-center shadow-2xl backdrop-blur-md sm:p-14">
          <span className="inline-block rounded-full bg-brand-orange/10 px-3.5 py-1 font-mono text-xs font-semibold text-brand-orange">
            Get Started Today
          </span>

          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Make your next project flow.
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
            Bring clarity to your work, run deterministic sprints, and give your
            team a better way to move forward.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="gap-2 px-8 py-6 text-base font-semibold shadow-md shadow-brand-orange/20"
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
              className="gap-2 px-8 py-6 text-base font-medium"
            >
              <Link
                href="https://github.com/Reza-Msv/taskflow-front-end"
                target="_blank"
                rel="noopener noreferrer"
              >
                <GithubIcon className="h-4 w-4" />
                <span>View on GitHub</span>
              </Link>
            </Button>
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            100% open source under MIT License. No credit card required.
          </p>
        </div>
      </div>
    </section>
  );
}
