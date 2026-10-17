import React from "react";
import Link from "next/link";
import { GithubIcon } from "./icons";

interface MarketingFooterProps {
  locale: string;
}

export function MarketingFooter({ locale }: MarketingFooterProps) {
  const currentYear = new Date().getFullYear();
  const isFa = locale === "fa";

  return (
    <footer
      dir={isFa ? "rtl" : "ltr"}
      className="border-t border-border bg-card/40 py-12 text-xs text-muted-foreground"
    >
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-8 border-b border-border/60 pb-10 md:grid-cols-4">
          {/* Brand Info */}
          <div className="space-y-3 md:col-span-2">
            <Link
              href={`/${locale}`}
              className="flex items-center gap-2.5 text-base font-bold tracking-tight text-foreground"
            >
              <div className="relative flex h-7 w-7 items-center justify-center">
                <svg
                  className="h-6 w-6"
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
              <span>
                Task<span className="text-brand-orange">Flow</span>
              </span>
            </Link>
            <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
              {isFa
                ? "پلتفرم مدیریت پروژه و اسپرینت سازمانی متن‌باز و خودمیزبان برای تیم‌های مهندسی پیشرو."
                : "Open-source, self-hostable project and sprint management platform built for modern engineering teams."}
            </p>
            <div className="pt-2">
              <span className="inline-block rounded bg-secondary px-2 py-0.5 font-mono text-[11px] text-foreground">
                {isFa ? "منتشر شده تحت مجوز MIT" : "Released under MIT License"}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-2">
            <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
              {isFa ? "محصول" : "Product"}
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="#features"
                  className="transition-colors hover:text-foreground"
                >
                  {isFa ? "قابلیت‌ها و معماری" : "Features & Architecture"}
                </a>
              </li>
              <li>
                <a
                  href="#demo"
                  className="transition-colors hover:text-foreground"
                >
                  {isFa ? "دموی تعاملی" : "Interactive Demo"}
                </a>
              </li>
              <li>
                <a
                  href="#how-it-works"
                  className="transition-colors hover:text-foreground"
                >
                  {isFa ? "نحوه کارکرد" : "How It Works"}
                </a>
              </li>
              <li>
                <Link
                  href={`/${locale}/projects`}
                  className="transition-colors hover:text-foreground"
                >
                  {isFa ? "داشبورد برنامه" : "App Dashboard"}
                </Link>
              </li>
            </ul>
          </div>

          {/* Open Source Links */}
          <div className="space-y-2">
            <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
              {isFa ? "متن‌باز" : "Open Source"}
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="https://github.com/Reza-Msv/taskflow-front-end"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 transition-colors hover:text-foreground"
                >
                  <GithubIcon className="h-3.5 w-3.5" />
                  <span>{isFa ? "مخزن گیت‌هاب" : "GitHub Repository"}</span>
                </Link>
              </li>
              <li>
                <a
                  href="#open-source"
                  className="transition-colors hover:text-foreground"
                >
                  {isFa ? "راه‌اندازی سریع" : "Quickstart Setup"}
                </a>
              </li>
              <li>
                <a
                  href="#faq"
                  className="transition-colors hover:text-foreground"
                >
                  {isFa ? "پرسش‌های متداول" : "FAQ"}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-8">
          <p>
            {isFa
              ? `© ${currentYear} TaskFlow. مدیریت کار سازمانی متن‌باز.`
              : `© ${currentYear} TaskFlow. Open-source enterprise work management.`}
          </p>
          <p className="font-mono text-[11px]" dir="ltr">
            Frontend: Next.js App Router • Backend: FastAPI & PostgreSQL
          </p>
        </div>
      </div>
    </footer>
  );
}
