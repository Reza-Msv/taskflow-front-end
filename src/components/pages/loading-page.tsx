"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

interface LoadingPageProps {
  message?: string;
  subMessage?: string;
}

export function LoadingPage({ message, subMessage }: LoadingPageProps) {
  const pathname = usePathname();
  const currentLocale = pathname?.split("/")[1] === "fa" ? "fa" : "en";
  const isRtl = currentLocale === "fa";

  const defaultTitle = isRtl ? "در حال بارگذاری تسک‌فلو" : "Loading TaskFlow";
  const defaultSub = isRtl
    ? "در حال آماده‌سازی فضای کاری و همگام‌سازی اطلاعات..."
    : "Preparing your workspace and syncing data...";

  const displayTitle = message || defaultTitle;
  const displaySub = subMessage || defaultSub;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={displayTitle}
      className="relative flex min-h-[70vh] w-full flex-col items-center justify-center px-4 py-12"
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        <div className="h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Brand Mark with Pulse & Rings */}
        <div className="relative mb-6 flex h-16 w-16 items-center justify-center">
          <div className="absolute inset-0 animate-ping rounded-2xl bg-primary/20 opacity-75 duration-1000" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 600 465"
              className="h-8 w-8 transition-transform duration-300"
              fill="none"
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
                className="fill-primary"
              />
            </svg>
          </div>
        </div>

        {/* Title and Subtitle */}
        <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
          {displayTitle}
        </h2>
        <p className="mt-1.5 max-w-sm text-xs text-muted-foreground sm:text-sm">
          {displaySub}
        </p>

        {/* Smooth indeterminate progress indicator */}
        <div className="mt-5 h-1 w-44 overflow-hidden rounded-full bg-secondary">
          <div className="h-full w-2/5 animate-[shimmer_1.4s_infinite_linear] rounded-full bg-primary" />
        </div>
      </div>

      {/* Structural skeleton preview */}
      <div
        className="mt-12 w-full max-w-3xl space-y-4 opacity-40 transition-opacity"
        aria-hidden="true"
      >
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-8 w-28" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
