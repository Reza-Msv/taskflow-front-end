"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { useAuth } from "@/modules/auth/context/auth-context";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = pathname?.split("/")[1] || "en";
  const { isLoading, isAuthenticated, user, refreshSession } = useAuth();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const verify = async () => {
      setIsVerifying(true);
      try {
        const verifiedUser = await refreshSession();
        if (cancelled) return;
        if (!verifiedUser) {
          const redirectUrl = `/${currentLocale}/login?redirect=${encodeURIComponent(
            pathname
          )}`;
          router.replace(redirectUrl);
        }
      } catch {
        if (cancelled) return;
        const redirectUrl = `/${currentLocale}/login?redirect=${encodeURIComponent(
          pathname
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
  }, [pathname, currentLocale, refreshSession, router]);

  if (isLoading || isVerifying) {
    return (
      <div
        role="status"
        aria-label="Verifying administrative permissions..."
        className="flex min-h-screen w-full bg-background p-6 lg:p-8"
      >
        <div className="mx-auto w-full max-w-6xl space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-96 max-w-full" />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
          <Skeleton className="h-80 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  // Not authenticated -> redirect happens in effect, return null
  if (!isAuthenticated || !user) {
    return null;
  }

  // Authenticated, but not superuser -> forbidden state
  if (!user.is_superuser) {
    return (
      <div
        role="alert"
        aria-label="Access Denied"
        className="flex min-h-[80vh] w-full flex-col items-center justify-center p-6 text-center"
      >
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive ring-8 ring-destructive/5">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          {currentLocale === "fa" ? "دسترسی مجاز نیست" : "Access Denied"}
        </h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {currentLocale === "fa"
            ? "حساب کاربری شما سطح دسترسی مدیر کل (Superuser) مورد نیاز برای مشاهده این بخش را ندارد."
            : "Your account does not possess the administrative superuser privileges required to access the TaskFlow administration console."}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button asChild variant="default">
            <Link href={`/${currentLocale}/projects`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {currentLocale === "fa"
                ? "بازگشت به پروژه‌ها"
                : "Return to Projects"}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
