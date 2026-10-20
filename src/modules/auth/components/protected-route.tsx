"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../context/auth-context";
import { Skeleton } from "@/components/ui/skeleton";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = pathname?.split("/")[1] || "en";
  const { isLoading, isAuthenticated, user, refreshSession } = useAuth();
  const [isVerifying, setIsVerifying] = useState(!user);

  useEffect(() => {
    if (user && isAuthenticated) {
      setIsVerifying(false);
    }
  }, [user, isAuthenticated]);

  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;
  const currentLocaleRef = useRef(currentLocale);
  currentLocaleRef.current = currentLocale;
  const hasVerifiedOnMountRef = useRef(false);

  useEffect(() => {
    if (user && isAuthenticated) {
      setIsVerifying(false);
      return;
    }

    if (hasVerifiedOnMountRef.current) return;
    hasVerifiedOnMountRef.current = true;

    let cancelled = false;

    const verify = async () => {
      try {
        const verifiedUser = await refreshSession();
        if (cancelled) return;
        if (!verifiedUser) {
          const redirectUrl = `/${currentLocaleRef.current}/login?redirect=${encodeURIComponent(
            pathnameRef.current
          )}`;
          router.replace(redirectUrl);
        }
      } catch {
        if (cancelled) return;
        const redirectUrl = `/${currentLocaleRef.current}/login?redirect=${encodeURIComponent(
          pathnameRef.current
        )}`;
        router.replace(redirectUrl);
      } finally {
        if (!cancelled) {
          setIsVerifying(false);
        }
      }
    };

    verify();

    return () => {
      cancelled = true;
    };
  }, [refreshSession, router, user, isAuthenticated]);

  useEffect(() => {
    if (!isLoading && !isVerifying && (!isAuthenticated || !user)) {
      const redirectUrl = `/${currentLocaleRef.current}/login?redirect=${encodeURIComponent(
        pathnameRef.current
      )}`;
      router.replace(redirectUrl);
    }
  }, [
    isLoading,
    isVerifying,
    isAuthenticated,
    user,
    router,
  ]);

  if (isLoading || isVerifying || !isAuthenticated || !user) {
    return (
      <div
        role="status"
        aria-label="Loading workspace..."
        className="flex min-h-screen w-full bg-background text-foreground"
      >
        {/* Placeholder Sidebar */}
        <aside className="hidden h-screen w-[240px] shrink-0 border-r border-border bg-sidebar p-4 lg:flex lg:flex-col lg:space-y-4">
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-5 w-28" />
          </div>
          <Skeleton className="h-9 w-full rounded-lg" />
          <div className="flex-1 space-y-2 pt-2">
            <Skeleton className="h-8 w-full rounded-md" />
            <Skeleton className="h-8 w-full rounded-md" />
            <Skeleton className="h-8 w-full rounded-md" />
          </div>
        </aside>

        {/* Main Content Area Placeholder */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 w-full items-center justify-between border-b border-border px-6">
            <Skeleton className="h-5 w-32" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </header>
          <main className="flex-1 p-6 sm:p-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-96 max-w-full" />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-44 rounded-xl" />
                <Skeleton className="h-44 rounded-xl" />
                <Skeleton className="h-44 rounded-xl" />
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
