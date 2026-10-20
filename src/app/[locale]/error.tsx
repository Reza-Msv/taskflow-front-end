"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname();
  const currentLocale = pathname?.split("/")[1] || "en";

  useEffect(() => {
    // Log unexpected errors for telemetry and auditing
    console.error("TaskFlow App Error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background px-4 py-16 text-foreground">
      <div className="relative mx-auto flex max-w-lg flex-col items-center text-center">
        {/* Ambient glow */}
        <div className="absolute -top-12 h-32 w-32 rounded-full bg-destructive/10 blur-3xl" />

        {/* Error Icon */}
        <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/10 shadow-sm">
          <AlertTriangle className="h-10 w-10 text-destructive" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Something went wrong
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          An unexpected error occurred while processing your request. You can try reloading the section or returning to the dashboard.
        </p>

        {/* Error detail snippet */}
        {error?.message && (
          <div className="mt-4 w-full rounded-lg border border-border bg-card/60 p-3 text-start font-mono text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 font-semibold text-destructive mb-1">
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Error Details</span>
            </div>
            <p className="line-clamp-3 text-[11px] text-foreground/80 break-words">
              {error.message}
            </p>
            {error.digest && (
              <p className="mt-1 text-[10px] text-muted-foreground/60">
                Digest: {error.digest}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row w-full items-center justify-center gap-3">
          <Button
            onClick={() => reset()}
            className="w-full sm:w-auto gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Try Again</span>
          </Button>

          <Button asChild variant="outline" className="w-full sm:w-auto gap-2">
            <Link href={`/${currentLocale}/dashboard`}>
              <Home className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
