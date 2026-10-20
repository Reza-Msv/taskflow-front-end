import React from "react";

export default function Loading() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background text-foreground">
      <div className="flex flex-col items-center gap-4">
        {/* Animated Brand Logo / Spinner */}
        <div className="relative flex h-16 w-16 items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <div className="h-3 w-3 rounded-sm bg-primary" />
          </div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <span className="text-sm font-semibold tracking-wide text-foreground">
            TaskFlow
          </span>
          <span className="text-xs text-muted-foreground animate-pulse">
            Loading workspace...
          </span>
        </div>
      </div>
    </div>
  );
}
