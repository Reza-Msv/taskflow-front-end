"use client";

import { useEffect } from "react";
import { ErrorPage } from "@/components/pages";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log unexpected errors for client monitoring
    console.error("TaskFlow App Router error boundary caught:", error);
  }, [error]);

  return <ErrorPage error={error} reset={reset} />;
}
