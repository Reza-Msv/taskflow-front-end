"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { ArrowLeft, Globe } from "lucide-react";

interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  const pathname = usePathname();
  const currentLocale = pathname?.split("/")[1] || "en";
  const otherLocale = currentLocale === "en" ? "fa" : "en";
  const switchLocaleHref = pathname
    ? pathname.replace(/^\/(en|fa)/, `/${otherLocale}`)
    : `/${otherLocale}`;

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-background px-4 py-12 sm:px-6">
      {/* Subtle Ambient Background Glow */}
      <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
        <div className="h-[480px] w-[480px] rounded-full bg-brand-orange/[0.06] blur-[140px] dark:bg-brand-orange/[0.08]" />
      </div>

      {/* Top Utilities Bar */}
      <header className="fixed left-0 right-0 top-4 z-10 mx-auto flex w-full max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link
          href={`/${currentLocale}`}
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
          <span>
            {currentLocale === "fa" ? "بازگشت به خانه" : "Back to Home"}
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={switchLocaleHref}
            className="flex h-8 items-center gap-1.5 rounded-md border border-border bg-card/60 px-2.5 text-xs font-medium text-muted-foreground backdrop-blur-sm transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Toggle language"
          >
            <Globe className="h-3 w-3" />
            <span>{currentLocale === "en" ? "فارسی" : "EN"}</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Single-Card Container */}
      <div className="w-full max-w-sm sm:max-w-md">
        {/* Prominent Brand Logo & Application Title */}
        <div className="mb-6 flex flex-col items-center text-center">
          <Link
            href={`/${currentLocale}`}
            className="group mb-4 flex items-center gap-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-border/60 bg-card p-2 shadow-sm transition-transform duration-200 group-hover:scale-105">
              <svg
                className="h-7 w-7"
                viewBox="0 0 600 465"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <polygon
                  points="66,51 363,51 304,125 219,127 219,234 139,233 138,125 8,125"
                  className="fill-foreground"
                />
                <polygon
                  points="446,6 545,6 183,457 29,280 133,280 182,335 341,136 365,134 365,107"
                  className="fill-foreground"
                />
                <polygon
                  points="509,112 553,181 394,382 593,383 534,457 235,456"
                  className="fill-brand-orange"
                />
              </svg>
            </div>
            <span className="font-sans text-2xl font-extrabold tracking-tight text-foreground">
              Task<span className="text-brand-orange">Flow</span>
            </span>
          </Link>

          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1.5 text-xs text-muted-foreground sm:text-sm">
              {subtitle}
            </p>
          )}
        </div>

        {/* Surface Card */}
        <div className="overflow-hidden rounded-2xl border border-border/80 bg-card/95 p-6 shadow-xl backdrop-blur-sm sm:p-8">
          {children}
        </div>

        {footer && <div className="mt-4 text-center">{footer}</div>}
      </div>
    </div>
  );
}
