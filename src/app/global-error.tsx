"use client";

import "@/styles/globals.css";
import { useEffect } from "react";
import { ErrorPage } from "@/components/pages";
import { ThemeProvider } from "@/components/shared/theme-provider";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("TaskFlow Global Error caught:", error);
  }, [error]);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background font-sans text-foreground antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ErrorPage error={error} reset={reset} />
        </ThemeProvider>
      </body>
    </html>
  );
}
