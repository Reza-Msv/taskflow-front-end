"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Compass,
  ArrowLeft,
  ArrowRight,
  LayoutDashboard,
  FolderKanban,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/theme-toggle";

interface NotFoundPageProps {
  homeHref?: string;
  dashboardHref?: string;
  projectsHref?: string;
}

export function NotFoundPage({
  homeHref,
  dashboardHref,
  projectsHref,
}: NotFoundPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = pathname?.split("/")[1] === "fa" ? "fa" : "en";
  const isRtl = currentLocale === "fa";

  const targetHome = homeHref || `/${currentLocale}`;
  const targetDashboard = dashboardHref || `/${currentLocale}/dashboard`;
  const targetProjects = projectsHref || `/${currentLocale}/projects`;

  const t = {
    code: isRtl ? "۴۰۴" : "404",
    title: isRtl ? "صفحه مورد نظر پیدا نشد" : "Page not found",
    subtitle: isRtl
      ? "صفحه‌ای که به دنبال آن هستید وجود ندارد، حذف شده یا نشانی آن تغییر کرده است."
      : "The page you are looking for doesn't exist, has been moved, or is temporarily unavailable.",
    dashboard: isRtl ? "ورود به داشبورد" : "Go to Dashboard",
    projects: isRtl ? "مشاهده پروژه‌ها" : "View Projects",
    home: isRtl ? "صفحه اصلی" : "Home",
    goBack: isRtl ? "بازگشت به صفحه قبل" : "Go Back",
  };

  const handleGoBack = () => {
    router.back();
  };

  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  return (
    <div
      className="relative flex min-h-[75vh] w-full flex-col items-center justify-center px-4 py-12"
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Theme toggle in corner for instant dark/light mode switching */}
      <div className="absolute right-4 top-4 z-20 rtl:left-4 rtl:right-auto">
        <ThemeToggle />
      </div>

      {/* Background radial accent */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        <div className="h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="relative z-10 flex w-full max-w-lg flex-col items-center text-center">
        {/* Subtle decorative 404 watermark */}
        <div
          className="select-none text-8xl font-black tracking-tighter text-muted/30 sm:text-9xl"
          aria-hidden="true"
        >
          {t.code}
        </div>

        {/* Floating icon */}
        <div className="-mt-12 mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card text-primary shadow-sm">
          <Compass
            className="h-8 w-8 animate-[spin_10s_linear_infinite]"
            aria-hidden="true"
          />
        </div>

        {/* Heading & Subtitle */}
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {t.title}
        </h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground sm:text-base">
          {t.subtitle}
        </p>

        {/* Primary and secondary navigation buttons */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button
            asChild
            variant="default"
            className="inline-flex items-center gap-2"
          >
            <Link href={targetDashboard}>
              <LayoutDashboard className="h-4 w-4" />
              {t.dashboard}
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="inline-flex items-center gap-2"
          >
            <Link href={targetProjects}>
              <FolderKanban className="h-4 w-4" />
              {t.projects}
            </Link>
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
        </div>

        {/* Helpful breadcrumb-like footer links */}
        <div className="mt-10 flex items-center gap-4 text-xs text-muted-foreground">
          <Link
            href={targetHome}
            className="inline-flex items-center gap-1 transition hover:text-foreground"
          >
            <Home className="h-3.5 w-3.5" />
            <span>{t.home}</span>
          </Link>
          <span className="text-border">•</span>
          <Link
            href={`/${currentLocale}/login`}
            className="transition hover:text-foreground"
          >
            {isRtl ? "ورود به حساب" : "Sign In"}
          </Link>
        </div>
      </div>
    </div>
  );
}
