import React from "react";
import { FolderPlus, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyState({
  icon: Icon = FolderPlus,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-8 text-center duration-150 animate-in fade-in-50">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-primary">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-foreground sm:text-base">
        {title}
      </h3>
      <p className="mt-1.5 max-w-sm text-xs text-muted-foreground sm:text-sm">
        {description}
      </p>
      {actionLabel && (
        <div className="mt-5">
          <Button onClick={onAction} size="default">
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}

export function LoadingState({
  message = "Loading items...",
}: {
  message?: string;
}) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-3">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <span className="text-xs text-muted-foreground">{message}</span>
    </div>
  );
}
