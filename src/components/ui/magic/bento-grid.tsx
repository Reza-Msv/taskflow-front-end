import React from "react";
import { cn } from "@/lib/utils";

export function BentoGrid({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid w-full auto-rows-[16rem] grid-cols-1 gap-4 md:grid-cols-3",
        className
      )}
    >
      {children}
    </div>
  );
}

export function BentoCard({
  className,
  name,
  classNameHeading,
  background,
  Icon,
  description,
  href,
  cta,
}: {
  className?: string;
  name: string;
  classNameHeading?: string;
  background?: React.ReactNode;
  Icon?: React.ComponentType<{ className?: string }>;
  description: string;
  href?: string;
  cta?: string;
}) {
  return (
    <div
      className={cn(
        "group relative col-span-1 flex flex-col justify-between overflow-hidden rounded-xl border border-border bg-card p-6 transition-all duration-150 hover:border-border-strong hover:bg-card-hover",
        className
      )}
    >
      <div>{background}</div>
      <div className="z-10 flex flex-col gap-2">
        {Icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary">
            <Icon className="h-5 w-5" />
          </div>
        )}
        <h3
          className={cn(
            "text-lg font-semibold text-foreground",
            classNameHeading
          )}
        >
          {name}
        </h3>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      {cta && (
        <div className="z-10 pt-2 text-xs font-medium text-primary">
          {cta} &rarr;
        </div>
      )}
    </div>
  );
}
