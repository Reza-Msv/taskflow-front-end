"use client";

import React, { useState, useId } from "react";
import {
  Calendar,
  Info,
  Table as TableIcon,
  BarChart2,
  CheckCircle2,
  PlusCircle,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TrendDataPoint, TrendInterval } from "@/services/reports-service";
import { cn } from "@/lib/utils";

export interface CompletionTrendsChartProps {
  trends: TrendDataPoint[];
  interval: TrendInterval;
  onIntervalChange: (interval: TrendInterval) => void;
  isLoading?: boolean;
  className?: string;
}

export function CompletionTrendsChart({
  trends,
  interval,
  onIntervalChange,
  isLoading = false,
  className,
}: CompletionTrendsChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [showTableView, setShowTableView] = useState(false);
  const chartId = useId();

  const isEmpty = trends.length === 0;

  // Compute maximum values for scaling
  const maxBarValue = Math.max(
    1,
    ...trends.map((t) => Math.max(t.created, t.completed))
  );
  const maxCumulative = Math.max(
    1,
    ...trends.map((t) => t.cumulativeCompleted)
  );

  // Chart dimensions
  const viewBoxWidth = 800;
  const viewBoxHeight = 320;
  const padding = { top: 24, right: 36, bottom: 48, left: 48 };
  const chartWidth = viewBoxWidth - padding.left - padding.right;
  const chartHeight = viewBoxHeight - padding.top - padding.bottom;

  // Coordinate mappers
  const getX = (index: number) => {
    if (trends.length <= 1) return padding.left + chartWidth / 2;
    return padding.left + (index / (trends.length - 1)) * chartWidth;
  };

  const getYBar = (val: number) => {
    return (
      padding.top + chartHeight - (val / maxBarValue) * (chartHeight * 0.85)
    );
  };

  const getYCumulative = (val: number) => {
    return (
      padding.top + chartHeight - (val / maxCumulative) * (chartHeight * 0.85)
    );
  };

  // Build path for cumulative line
  const cumulativePoints = trends.map(
    (t, i) => `${getX(i)},${getYCumulative(t.cumulativeCompleted)}`
  );
  const cumulativePath =
    cumulativePoints.length > 0 ? `M ${cumulativePoints.join(" L ")}` : "";

  // Interval label formatting
  const intervalDisplay =
    interval === "daily"
      ? "Daily"
      : interval === "weekly"
        ? "Weekly"
        : "Monthly";

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm",
        className
      )}
      data-testid="completion-trends-chart"
    >
      {/* Header and Controls */}
      <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-foreground">
              Task Velocity & Completion Trends
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Activity and cumulative delivery progression aggregated by{" "}
            {intervalDisplay} intervals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Interval Toggle */}
          <div
            className="flex items-center rounded-lg border border-border bg-muted/30 p-0.5 text-xs font-medium"
            role="group"
            aria-label="Select trend interval"
          >
            {(["daily", "weekly", "monthly"] as TrendInterval[]).map((int) => (
              <button
                key={int}
                type="button"
                onClick={() => onIntervalChange(int)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs capitalize transition-colors",
                  interval === int
                    ? "shadow-xs bg-primary font-semibold text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-pressed={interval === int}
              >
                {int}
              </button>
            ))}
          </div>

          {/* Toggle Table Accessibility View */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTableView(!showTableView)}
            className="h-7 gap-1.5 px-2.5 text-xs"
            aria-label={showTableView ? "Show chart view" : "Show table view"}
          >
            {showTableView ? (
              <>
                <BarChart2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Chart</span>
              </>
            ) : (
              <>
                <TableIcon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Table</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="rounded-xs inline-block h-3 w-3 bg-emerald-500" />
          <span>Tasks Completed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="rounded-xs inline-block h-3 w-3 bg-sky-500" />
          <span>Tasks Created</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 bg-primary" />
          <span className="-ml-2 inline-block h-2 w-2 rounded-full border border-primary bg-primary" />
          <span>Cumulative Delivered</span>
        </div>
      </div>

      {/* Content Area */}
      {isEmpty ? (
        <div className="flex min-h-[260px] flex-col items-center justify-center p-8 text-center">
          <Calendar
            className="mb-2 h-8 w-8 text-muted-foreground/60"
            aria-hidden="true"
          />
          <p className="text-sm font-medium text-foreground">
            No task activity recorded in this date range
          </p>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            Try expanding the date filter or creating new tasks to see
            completion trends.
          </p>
        </div>
      ) : showTableView ? (
        /* Accessible Table View */
        <div className="mt-4 overflow-x-auto">
          <table
            className="w-full text-left text-xs"
            aria-label="Task completion data table"
          >
            <thead className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
              <tr>
                <th className="px-3 py-2.5">Period</th>
                <th className="px-3 py-2.5 text-right">Tasks Created</th>
                <th className="px-3 py-2.5 text-right">Tasks Completed</th>
                <th className="px-3 py-2.5 text-right">Cumulative Delivered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {trends.map((pt) => (
                <tr key={pt.key} className="hover:bg-muted/20">
                  <td className="px-3 py-2 font-medium text-foreground">
                    {pt.label}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-sky-500">
                    {pt.created}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-emerald-500">
                    {pt.completed}
                  </td>
                  <td className="px-3 py-2 text-right font-bold text-primary">
                    {pt.cumulativeCompleted}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* SVG Interactive Chart */
        <div className="relative mt-4">
          <svg
            viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
            className="h-auto w-full select-none overflow-visible"
            role="img"
            aria-labelledby={`${chartId}-title`}
          >
            <title id={`${chartId}-title`}>
              Task Velocity and Completion Trends Chart ({intervalDisplay})
            </title>

            <defs>
              <linearGradient
                id={`${chartId}-grad`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="hsl(var(--primary))"
                  stopOpacity="0.25"
                />
                <stop
                  offset="100%"
                  stopColor="hsl(var(--primary))"
                  stopOpacity="0.0"
                />
              </linearGradient>
            </defs>

            {/* Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
              const y = padding.top + chartHeight * (1 - pct * 0.85);
              const val = Math.round(pct * maxBarValue);
              return (
                <g key={pct}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={padding.left + chartWidth}
                    y2={y}
                    stroke="currentColor"
                    className="text-border/60"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                  <text
                    x={padding.left - 8}
                    y={y + 3}
                    textAnchor="end"
                    className="fill-muted-foreground text-[10px]"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Right Y-Axis (Cumulative Completed) */}
            {[0, 0.5, 1].map((pct) => {
              const y = padding.top + chartHeight * (1 - pct * 0.85);
              const val = Math.round(pct * maxCumulative);
              return (
                <text
                  key={`r-${pct}`}
                  x={padding.left + chartWidth + 8}
                  y={y + 3}
                  textAnchor="start"
                  className="fill-primary text-[10px] font-semibold"
                >
                  {val}
                </text>
              );
            })}

            {/* Activity Bars (Created and Completed) */}
            {trends.map((pt, i) => {
              const x = getX(i);
              const barWidth = Math.max(
                3,
                Math.min(16, (chartWidth / trends.length) * 0.35)
              );
              const createdY = getYBar(pt.created);
              const completedY = getYBar(pt.completed);
              const baseline = padding.top + chartHeight;

              return (
                <g key={`bars-${pt.key}`}>
                  {/* Created Bar */}
                  {pt.created > 0 && (
                    <rect
                      x={x - barWidth - 1}
                      y={createdY}
                      width={barWidth}
                      height={baseline - createdY}
                      rx="2"
                      className="cursor-pointer fill-sky-500/80 transition-colors hover:fill-sky-500"
                      onMouseEnter={() => setHoveredIndex(i)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    />
                  )}
                  {/* Completed Bar */}
                  {pt.completed > 0 && (
                    <rect
                      x={x + 1}
                      y={completedY}
                      width={barWidth}
                      height={baseline - completedY}
                      rx="2"
                      className="cursor-pointer fill-emerald-500/80 transition-colors hover:fill-emerald-500"
                      onMouseEnter={() => setHoveredIndex(i)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    />
                  )}
                </g>
              );
            })}

            {/* Cumulative Delivery Line */}
            {cumulativePath && (
              <path
                d={cumulativePath}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Cumulative Data Points */}
            {trends.map((pt, i) => {
              const x = getX(i);
              const y = getYCumulative(pt.cumulativeCompleted);
              const isHovered = hoveredIndex === i;

              return (
                <g key={`pt-${pt.key}`}>
                  <circle
                    cx={x}
                    cy={y}
                    r={isHovered ? 5.5 : 3.5}
                    className={cn(
                      "cursor-pointer fill-background stroke-primary stroke-2 transition-all",
                      isHovered && "fill-primary"
                    )}
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                </g>
              );
            })}

            {/* X-Axis Labels (Filtered to avoid crowding) */}
            {trends.map((pt, i) => {
              // Show label every N items depending on length
              const step = Math.ceil(trends.length / 8);
              const showLabel = i % step === 0 || i === trends.length - 1;
              if (!showLabel) return null;

              const x = getX(i);
              const y = padding.top + chartHeight + 18;

              return (
                <text
                  key={`lbl-${pt.key}`}
                  x={x}
                  y={y}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[10px]"
                >
                  {pt.label}
                </text>
              );
            })}

            {/* Hover Guide and Tooltip */}
            {hoveredIndex !== null && trends[hoveredIndex] && (
              <g pointerEvents="none">
                {/* Vertical Cursor Line */}
                <line
                  x1={getX(hoveredIndex)}
                  y1={padding.top}
                  x2={getX(hoveredIndex)}
                  y2={padding.top + chartHeight}
                  stroke="hsl(var(--primary))"
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                  opacity="0.75"
                />
              </g>
            )}
          </svg>

          {/* HTML Overlay Tooltip */}
          {hoveredIndex !== null && trends[hoveredIndex] && (
            <div
              className="backdrop-blur-xs pointer-events-none absolute top-2 z-20 rounded-lg border border-border bg-popover/95 px-3 py-2 text-xs shadow-md transition-all duration-150"
              style={{
                left: `${Math.min(80, Math.max(10, (hoveredIndex / (trends.length - 1 || 1)) * 100))}%`,
                transform: "translateX(-50%)",
              }}
              data-testid="trend-tooltip"
            >
              <div className="mb-1 border-b border-border/50 pb-1 font-semibold text-foreground">
                {trends[hoveredIndex].label}
              </div>
              <div className="flex items-center justify-between gap-4 font-medium text-emerald-500">
                <span>Completed:</span>
                <span>{trends[hoveredIndex].completed}</span>
              </div>
              <div className="flex items-center justify-between gap-4 font-medium text-sky-500">
                <span>Created:</span>
                <span>{trends[hoveredIndex].created}</span>
              </div>
              <div className="mt-1 flex items-center justify-between gap-4 border-t border-border/40 pt-1 font-bold text-primary">
                <span>Total Delivered:</span>
                <span>{trends[hoveredIndex].cumulativeCompleted}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Explanatory Footer */}
      <div className="mt-4 flex items-center gap-1.5 border-t border-border/60 pt-3 text-[11px] text-muted-foreground">
        <Info className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
        <span>
          Left axis measures active task count per{" "}
          {intervalDisplay.toLowerCase()} interval; right axis measures
          cumulative completed tasks.
        </span>
      </div>
    </div>
  );
}
