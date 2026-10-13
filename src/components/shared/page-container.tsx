import React from "react";
import { cn } from "@/lib/utils";

export function PageContainer({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "w-full min-w-0 flex-1 space-y-6 p-4 sm:p-6 lg:p-8",
        className
      )}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  className,
}: {
  title: string;
  description?: string;
  breadcrumbs?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="space-y-1">
        {breadcrumbs && (
          <div className="text-xs text-muted-foreground">{breadcrumbs}</div>
        )}
        <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          {title}
        </h2>
        {description && (
          <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground sm:text-sm">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-2 self-start sm:self-auto">
          {actions}
        </div>
      )}
    </div>
  );
}
