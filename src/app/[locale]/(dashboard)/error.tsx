"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertCircle, RefreshCw, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname();
  const currentLocale = pathname?.split("/")[1] || "en";

  useEffect(() => {
    console.error("Dashboard Page Error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center p-6 text-center">
      <div className="mx-auto flex max-w-md flex-col items-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-destructive/20 bg-destructive/10">
          <AlertCircle className="h-7 w-7 text-destructive" />
        </div>

        <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Failed to load view
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
          There was an issue loading this workspace view. You can retry the request or return to the main dashboard.
        </p>

        {error?.message && (
          <div className="mt-4 w-full rounded-lg border border-border bg-card p-3 text-start text-xs text-muted-foreground">
            <span className="font-semibold text-destructive">Error: </span>
            <span className="font-mono text-[11px]">{error.message}</span>
          </div>
        )}

        <div className="mt-6 flex items-center gap-3">
          <Button
            size="sm"
            onClick={() => reset()}
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Try Again</span>
          </Button>

          <Button asChild size="sm" variant="outline" className="gap-2">
            <Link href={`/${currentLocale}/dashboard`}>
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>Dashboard Overview</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
