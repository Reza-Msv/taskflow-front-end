import React from "react";
import { AlertCircle } from "lucide-react";

interface AuthErrorBannerProps {
  title: string;
  message: string;
}

export function AuthErrorBanner({ title, message }: AuthErrorBannerProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive dark:border-destructive/50"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
      <div className="flex-1 leading-relaxed">
        <span className="font-semibold">{title}: </span>
        {message}
      </div>
    </div>
  );
}
