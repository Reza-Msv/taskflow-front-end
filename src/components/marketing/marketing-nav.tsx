"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { Menu, X, ArrowRight } from "lucide-react";
import { GithubIcon } from "./icons";
import { motion, AnimatePresence } from "motion/react";

export function MarketingNav() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Extract locale from pathname (e.g. /en/... or /fa/...)
  const currentLocale = pathname?.split("/")[1] || "en";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Product", href: "#features" },
    { label: "Interactive Demo", href: "#demo" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Open Source", href: "#open-source" },
    { label: "FAQ", href: "#faq" },
  ];

  const scrollToSection = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      const el = document.querySelector(href);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        setMobileMenuOpen(false);
      }
    }
  };

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-300 ${
        isScrolled
          ? "border-b border-border/80 bg-background/85 shadow-sm backdrop-blur-md"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Brand Logo & Wordmark */}
        <Link
          href={`/${currentLocale}`}
          className="group flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="relative flex h-8 w-8 items-center justify-center transition-transform duration-200 group-hover:scale-105">
            <svg
              className="h-7 w-7"
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
          <span className="font-sans text-lg font-bold tracking-tight text-foreground">
            Task<span className="text-brand-orange">Flow</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav
          aria-label="Main Navigation"
          className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex"
        >
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => scrollToSection(e, link.href)}
              className="rounded text-xs font-semibold uppercase tracking-wider transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Actions & Utilities */}
        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="https://github.com/Reza-Msv/taskflow-front-end"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="TaskFlow on GitHub"
          >
            <GithubIcon className="h-4 w-4" />
          </Link>
          <ThemeToggle />
          <Link
            href={
              pathname.replace(
                /^\/(en|fa)/,
                currentLocale === "en" ? "/fa" : "/en"
              ) || (currentLocale === "en" ? "/fa" : "/en")
            }
            className="flex h-9 items-center justify-center rounded-md border border-border px-2.5 font-mono text-xs font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Toggle language"
          >
            {currentLocale === "en" ? "فارسی" : "EN"}
          </Link>
          <Button asChild size="sm" className="gap-1.5 font-semibold shadow-sm">
            <Link href={`/${currentLocale}/projects`}>
              <span>
                {currentLocale === "fa" ? "شروع به کار" : "Get Started"}
              </span>
              <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
            </Link>
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="border-b border-border bg-background/95 px-4 py-6 backdrop-blur-md md:hidden"
          >
            <nav className="flex flex-col gap-4 text-base font-medium">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => scrollToSection(e, link.href)}
                  className="py-1 font-semibold text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </a>
              ))}
              <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
                <Link
                  href="https://github.com/Reza-Msv/taskflow-front-end"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-md border border-border py-2 text-sm font-medium hover:bg-secondary"
                >
                  <GithubIcon className="h-4 w-4" />
                  <span>GitHub Repository</span>
                </Link>
                <Button asChild className="w-full justify-center">
                  <Link href={`/${currentLocale}/projects`}>
                    Get Started Free
                  </Link>
                </Button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
