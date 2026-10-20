"use client";

import { useEffect } from "react";
import { ErrorPage } from "@/components/pages";

export default function DashboardErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("TaskFlow Dashboard error boundary caught:", error);
  }, [error]);

  return <ErrorPage error={error} reset={reset} />;
}
