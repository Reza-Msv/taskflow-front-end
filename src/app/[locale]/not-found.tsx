"use client";

import React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { ArrowLeft, Home, Search, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = pathname?.split("/")[1] || "en";

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background px-4 py-16 text-foreground">
      <div className="relative mx-auto flex max-w-md flex-col items-center text-center">
        {/* Glow effect */}
        <div className="absolute -top-12 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />

        {/* 404 Icon & Badge */}
        <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
          <FileQuestion className="h-10 w-10 text-primary" />
          <span className="absolute -bottom-2 -end-2 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-bold font-mono text-primary">
            404
          </span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Page Not Found
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          The page you are looking for doesn&apos;t exist, was deleted, or you might not have the required permissions to view it.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row w-full items-center justify-center gap-3">
          <Button
            asChild
            className="w-full sm:w-auto gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Link href={`/${currentLocale}/dashboard`}>
              <Home className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Link>
          </Button>

          <Button
            variant="outline"
            onClick={() => router.back()}
            className="w-full sm:w-auto gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Go Back</span>
          </Button>
        </div>

        {/* Quick Links */}
        <div className="mt-10 border-t border-border pt-6 text-xs text-muted-foreground">
          <span>Looking for something specific? Check </span>
          <Link
            href={`/${currentLocale}/my-tasks`}
            className="font-medium text-primary hover:underline inline-flex items-center gap-1"
          >
            <span>My Tasks</span>
          </Link>
          <span> or </span>
          <Link
            href={`/${currentLocale}/projects`}
            className="font-medium text-primary hover:underline inline-flex items-center gap-1"
          >
            <span>Projects</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
