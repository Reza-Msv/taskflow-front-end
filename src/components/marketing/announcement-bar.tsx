import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GithubIcon } from "./icons";

export function AnnouncementBar() {
  return (
    <aside
      aria-label="Announcement"
      className="relative z-50 w-full border-b border-border/60 bg-background/80 py-2 backdrop-blur-md"
    >
      <div className="container mx-auto flex items-center justify-center px-4 text-xs font-medium text-muted-foreground">
        <div className="flex flex-wrap items-center justify-center gap-2 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-orange/10 px-2 py-0.5 text-[11px] font-semibold text-brand-orange">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-orange" />
            Open Source v1.0
          </span>
          <span className="font-medium text-foreground/90">
            TaskFlow is fully open-source, tenant-isolated, and contract-driven.
          </span>
          <Link
            href="https://github.com/Reza-Msv/taskflow-front-end"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-primary underline-offset-4 transition-colors hover:text-brand-orange-hover hover:underline"
          >
            <GithubIcon className="h-3 w-3" />
            <span>Star on GitHub</span>
            <ArrowRight className="h-3 w-3 rtl:rotate-180" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
