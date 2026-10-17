"use client";

import React, { useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useAuth } from "../context/auth-context";
import { getSafeRedirectPath } from "@/lib/safe-redirect";
import { Skeleton } from "@/components/ui/skeleton";

export function GuestGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentLocale = pathname?.split("/")[1] || "en";
  const redirectParam = searchParams.get("redirect");
  const { isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const destination = getSafeRedirectPath(redirectParam, currentLocale);
      router.replace(destination);
    }
  }, [isLoading, isAuthenticated, router, redirectParam, currentLocale]);

  if (isLoading || isAuthenticated) {
    return (
      <div
        role="status"
        aria-label="Loading authentication..."
        className="flex min-h-screen w-full items-center justify-center bg-background p-4"
      >
        <div className="w-full max-w-[420px] space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="flex flex-col items-center space-y-2">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-60" />
          </div>
          <div className="space-y-3 pt-4">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
