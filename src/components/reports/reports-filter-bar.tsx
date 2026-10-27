"use client";

import React, { useState } from "react";
import {
  Calendar,
  FolderKanban,
  Download,
  RefreshCw,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type {
  DateRangeFilter,
  DateRangePreset,
} from "@/services/reports-service";
import { validateDateRange } from "@/services/reports-service";
import type { ProjectResponse } from "@/services/generated/api-types";
import { cn } from "@/lib/utils";

export interface ReportsFilterBarProps {
  projects: ProjectResponse[];
  selectedProjectId: string;
  onProjectChange: (projectId: string) => void;
  dateRange: DateRangeFilter;
  onDateRangeChange: (range: DateRangeFilter) => void;
  onRefresh: () => void;
  onExportOverview: () => void;
  onExportWorkload: () => void;
  isLoading?: boolean;
  className?: string;
}

const PRESET_OPTIONS: { value: DateRangePreset; label: string }[] = [
  { value: "7d", label: "Last 7 Days" },
  { value: "14d", label: "Last 14 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" },
  { value: "all", label: "All Time" },
  { value: "custom", label: "Custom Range" },
];

export function ReportsFilterBar({
  projects,
  selectedProjectId,
  onProjectChange,
  dateRange,
  onDateRangeChange,
  onRefresh,
  onExportOverview,
  onExportWorkload,
  isLoading = false,
  className,
}: ReportsFilterBarProps) {
  const [customFrom, setCustomFrom] = useState(dateRange.from || "");
  const [customTo, setCustomTo] = useState(dateRange.to || "");
  const [validationError, setValidationError] = useState<string | null>(null);

  const handlePresetSelect = (preset: DateRangePreset) => {
    setValidationError(null);
    if (preset === "custom") {
      onDateRangeChange({
        preset: "custom",
        from: customFrom || undefined,
        to: customTo || undefined,
      });
    } else {
      onDateRangeChange({ preset });
    }
  };

  const handleApplyCustomDates = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateDateRange(customFrom, customTo);
    if (err) {
      setValidationError(err);
      return;
    }
    setValidationError(null);
    onDateRangeChange({
      preset: "custom",
      from: customFrom || undefined,
      to: customTo || undefined,
    });
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm",
        className
      )}
      data-testid="reports-filter-bar"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Project Selector and Date Range Selector */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Project Selector */}
          {projects.length > 0 && (
            <div className="flex items-center gap-1.5">
              <FolderKanban
                className="h-4 w-4 shrink-0 text-primary"
                aria-hidden="true"
              />
              <select
                value={selectedProjectId}
                onChange={(e) => onProjectChange(e.target.value)}
                className="h-8 max-w-[220px] truncate rounded-md border border-border bg-background px-2.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                aria-label="Select reporting project"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.key})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date Range Preset Selector */}
          <div className="flex items-center gap-1.5">
            <Calendar
              className="h-4 w-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <select
              value={dateRange.preset}
              onChange={(e) =>
                handlePresetSelect(e.target.value as DateRangePreset)
              }
              className="h-8 rounded-md border border-border bg-background px-2.5 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              aria-label="Select date range"
            >
              {PRESET_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons: Refresh & Export */}
        <div className="flex items-center gap-2">
          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 px-3 text-xs"
                title="Export report datasets"
              >
                <Download className="h-3.5 w-3.5 text-primary" />
                <span>Export CSV</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 text-xs">
              <DropdownMenuLabel className="text-xs">
                Export Real API Data
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onExportOverview}
                className="cursor-pointer gap-2 text-xs"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
                <span>Tasks & Overview (CSV)</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onExportWorkload}
                className="cursor-pointer gap-2 text-xs"
              >
                <FileSpreadsheet className="h-4 w-4 text-sky-500" />
                <span>Team Workload (CSV)</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="h-8 gap-1 px-2.5 text-xs"
            title="Refresh reports data"
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", isLoading && "animate-spin")}
            />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Custom Date Range Picker (rendered when custom is active) */}
      {dateRange.preset === "custom" && (
        <form
          onSubmit={handleApplyCustomDates}
          className="flex flex-wrap items-center gap-2.5 border-t border-border/60 pt-3"
        >
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>From:</span>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="h-7 rounded-md border border-border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              aria-label="Filter from date"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>To:</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="h-7 rounded-md border border-border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              aria-label="Filter to date"
            />
          </div>

          <Button type="submit" size="sm" className="h-7 px-3 text-xs">
            Apply Range
          </Button>

          {validationError && (
            <div className="flex items-center gap-1 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>{validationError}</span>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
