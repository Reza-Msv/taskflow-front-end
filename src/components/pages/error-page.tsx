"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  AlertTriangle,
  RotateCcw,
  LayoutDashboard,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/theme-toggle";

interface ErrorPageProps {
  error?: Error & { digest?: string };
  reset?: () => void;
}

export function ErrorPage({ error, reset }: ErrorPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = pathname?.split("/")[1] === "fa" ? "fa" : "en";
  const isRtl = currentLocale === "fa";

  const [copied, setCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const t = {
    badge: isRtl ? "خطای سیستمی" : "System Error",
    title: isRtl ? "مشکلی در سامانه پیش آمد" : "Something went wrong",
    subtitle: isRtl
      ? "هنگام پردازش این درخواست خطای غیرمنتظره‌ای رخ داد. داده‌های شما امن هستند."
      : "An unexpected error occurred while processing this request. Your data remains secure.",
    tryAgain: isRtl ? "تلاش مجدد" : "Try again",
    dashboard: isRtl ? "ورود به داشبورد" : "Go to Dashboard",
    backHome: isRtl ? "بازگشت به خانه" : "Back to Home",
    goBack: isRtl ? "بازگشت به صفحه قبل" : "Go Back",
    errorReference: isRtl ? "شناسه خطا:" : "Error Reference:",
    technicalDetails: isRtl ? "جزئیات فنی" : "Technical Details",
    copy: isRtl ? "کپی" : "Copy",
    copied: isRtl ? "کپی شد" : "Copied",
  };

  const digest = error?.digest;
  const errorMessage =
    error?.message || "An unknown client or server error occurred.";

  const handleCopyDigest = async () => {
    const textToCopy = digest || errorMessage;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback if clipboard API is restricted
    }
  };

  const handleNavigate = (targetPath: string) => {
    reset?.();
    if (pathname === targetPath) {
      router.refresh();
    } else {
      router.push(targetPath);
    }
  };

  const handleGoBack = () => {
    reset?.();
    router.back();
  };

  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  return (
    <div
      role="alert"
      className="relative flex min-h-[75vh] w-full flex-col items-center justify-center px-4 py-12"
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Theme toggle in corner for instant dark/light mode switching */}
      <div className="absolute right-4 top-4 z-20 rtl:left-4 rtl:right-auto">
        <ThemeToggle />
      </div>
      {/* Background radial accent */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        <div className="h-80 w-80 rounded-full bg-destructive/10 blur-3xl" />
      </div>

      <div className="relative z-10 flex w-full max-w-lg flex-col items-center text-center">
        {/* Error Icon */}
        <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/10 text-destructive shadow-sm">
          <AlertTriangle className="h-8 w-8" aria-hidden="true" />
        </div>

        {/* Status Badge */}
        <div className="inline-flex items-center rounded-full border border-destructive/20 bg-destructive/5 px-2.5 py-0.5 text-xs font-medium text-destructive">
          {t.badge}
        </div>

        {/* Heading & Subtitle */}
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {t.title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          {t.subtitle}
        </p>

        {/* Error Digest Badge (if available) */}
        {digest && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 font-mono text-xs text-muted-foreground shadow-sm">
            <span>{t.errorReference}</span>
            <span className="font-semibold text-foreground">{digest}</span>
            <button
              type="button"
              onClick={handleCopyDigest}
              aria-label={t.copy}
              className="ml-1 inline-flex items-center gap-1 rounded p-1 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {reset && (
            <Button
              onClick={reset}
              variant="default"
              className="inline-flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              {t.tryAgain}
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            onClick={() => handleNavigate(`/${currentLocale}/dashboard`)}
            className="inline-flex items-center gap-2"
          >
            <LayoutDashboard className="h-4 w-4" />
            {t.dashboard}
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={handleGoBack}
            className="inline-flex items-center gap-1.5"
          >
            <BackIcon className="h-4 w-4" />
            {t.goBack}
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={() => handleNavigate(`/${currentLocale}`)}
          >
            {t.backHome}
          </Button>
        </div>

        {/* Collapsible Technical Details */}
        <div className="mt-8 w-full">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
          >
            <span>{t.technicalDetails}</span>
            {showDetails ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>

          {showDetails && (
            <div
              className="mt-3 w-full rounded-xl border border-border bg-card p-4 text-left font-mono text-xs text-muted-foreground shadow-sm"
              dir="ltr"
            >
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Stack / Diagnostic
                </span>
                <button
                  type="button"
                  onClick={handleCopyDigest}
                  className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                >
                  {copied ? (
                    <span className="text-green-600">{t.copied}</span>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>{t.copy}</span>
                    </>
                  )}
                </button>
              </div>
              <p className="mt-2 break-all text-foreground">{errorMessage}</p>
              {error?.stack && (
                <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-[11px] text-muted-foreground/80">
                  {error.stack}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
