"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background px-4 py-8 sm:px-6">
      {/* Top Utilities */}
      <div className="fixed top-4 flex w-full max-w-md items-center justify-between px-4 sm:px-0">
        <Link
          href={`/${currentLocale}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
          <span>
            {currentLocale === "fa" ? "بازگشت به خانه" : "Back to Home"}
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={switchLocaleHref}
            className="flex h-8 items-center gap-1 rounded-md border border-border px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Toggle language"
          >
            <Globe className="h-3 w-3" />
            <span>{currentLocale === "en" ? "فارسی" : "EN"}</span>
          </Link>
          <ThemeToggle />
        </div>
      </div>

      <div className="w-full max-w-[420px] space-y-6">
        {/* Brand Logo Header */}
        <div className="flex flex-col items-center text-center">
          <Link
            href={`/${currentLocale}`}
            className="group mb-3 flex items-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="relative flex h-10 w-10 items-center justify-center transition-transform duration-200 group-hover:scale-105">
              <svg
                className="h-9 w-9"
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
            <span className="font-sans text-xl font-bold tracking-tight text-foreground">
              Task<span className="text-brand-orange">Flow</span>
            </span>
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              {subtitle}
            </p>
          )}
        </div>

        {/* Card Body */}
        <Card className="border border-border bg-card shadow-sm">
          <CardHeader className="sr-only">
            <h2>{title}</h2>
          </CardHeader>
          <CardContent className="p-6 sm:p-8">{children}</CardContent>
          {footer && (
            <div className="border-t border-border bg-muted/30 px-6 py-4 text-center text-xs text-muted-foreground sm:px-8">
              {footer}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
