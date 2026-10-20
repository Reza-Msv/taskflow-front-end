import React from "react";
import Link from "next/link";
import { Home, FileQuestion } from "lucide-react";
import "@/styles/globals.css";

export const metadata = {
  title: "404 — Page Not Found | TaskFlow",
  description: "The requested page could not be found.",
};

export default function RootNotFound() {
  return (
    <html lang="en" className="dark">
      <body className="bg-background font-sans text-foreground antialiased min-h-screen flex items-center justify-center p-4">
        <div className="relative mx-auto flex max-w-md flex-col items-center text-center">
          <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
            <FileQuestion className="h-10 w-10 text-[#FF5F01]" />
            <span className="absolute -bottom-2 -end-2 rounded-full border border-[#FF5F01]/30 bg-[#FF5F01]/10 px-2 py-0.5 text-[11px] font-bold font-mono text-[#FF5F01]">
              404
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Page Not Found
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            The page you are looking for does not exist or has been moved.
          </p>

          <div className="mt-8">
            <Link
              href="/en/dashboard"
              className="inline-flex items-center gap-2 rounded-lg bg-[#FF5F01] px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#e05400] transition-colors"
            >
              <Home className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
