"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart3,
  TrendingDown,
  TrendingUp,
  Calendar,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Layers,
  Calculator,
  RefreshCw,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { scrumService } from "@/services/scrum-service";
import { ApiClientError } from "@/services/api-client";
import { cn } from "@/lib/utils";
import type {
  SprintResponse,
  SprintSummaryResponse,
  SprintBurndownResponse,
  ProjectVelocityResponse,
  BurndownDataPoint,
} from "@/services/generated/api-types";

export interface SprintMetricsViewProps {
  organizationId: string;
  projectId: string;
  availableSprints: SprintResponse[];
  activeSprint: SprintResponse | null;
}

export function SprintMetricsView({
  organizationId,
  projectId,
  availableSprints,
  activeSprint,
}: SprintMetricsViewProps) {
  const [selectedSprintId, setSelectedSprintId] = useState<string>(
    activeSprint?.id || availableSprints[0]?.id || ""
  );

  const [summary, setSummary] = useState<SprintSummaryResponse | null>(null);
  const [burndown, setBurndown] = useState<SprintBurndownResponse | null>(null);
  const [velocity, setVelocity] = useState<ProjectVelocityResponse | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Burndown active tooltip hover index
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  useEffect(() => {
    if (activeSprint) {
      setSelectedSprintId(activeSprint.id);
    } else if (availableSprints.length > 0 && !selectedSprintId) {
      setSelectedSprintId(availableSprints[0].id);
    }
  }, [activeSprint, availableSprints]);

  const loadMetrics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Load project velocity
      const velPromise = scrumService.getProjectVelocity(organizationId, projectId);

      // 2. Load sprint summary and burndown if sprint selected
      if (selectedSprintId) {
        const [sumData, bdData, velData] = await Promise.all([
          scrumService.getSprintSummary(organizationId, projectId, selectedSprintId),
          scrumService.getSprintBurndown(organizationId, projectId, selectedSprintId),
          velPromise,
        ]);
        setSummary(sumData);
        setBurndown(bdData);
        setVelocity(velData);
      } else {
        const velData = await velPromise;
        setVelocity(velData);
        setSummary(null);
        setBurndown(null);
      }
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setError(err.message || "Failed to load sprint metrics");
      } else {
        setError("Network error loading sprint metrics");
      }
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, projectId, selectedSprintId]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  return (
    <div className="space-y-6">
      {/* Header and Sprint Selector */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Sprint Reports & Agile Analytics
          </h2>
          <p className="text-xs text-muted-foreground">
            Real-time delivery burndown, scope completion, and historical project velocity.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {availableSprints.length > 0 && (
            <select
              value={selectedSprintId}
              onChange={(e) => setSelectedSprintId(e.target.value)}
              className="h-8 rounded-md border border-border bg-background px-2.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              aria-label="Select sprint for reports"
            >
              {availableSprints.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.status})
                </option>
              ))}
            </select>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={loadMetrics}
            disabled={isLoading}
            className="h-8 gap-1 px-2.5 text-xs"
          >
            <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
          <Skeleton className="h-72 w-full rounded-xl" />
          <Skeleton className="h-72 w-full rounded-xl" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border p-8 text-center text-destructive">
          <AlertCircle className="mb-2 h-7 w-7" />
          <p className="text-sm font-semibold">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={loadMetrics}
            className="mt-3 text-xs"
          >
            Try Again
          </Button>
        </div>
      ) : (
        <>
          {/* Sprint Summary Cards */}
          {summary ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {/* Total Tasks */}
                <div className="rounded-xl border border-border bg-card p-4 text-card-foreground">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Total Tasks</span>
                    <Layers className="h-4 w-4 text-primary" />
                  </div>
                  <div className="mt-2 text-2xl font-bold text-foreground">
                    {summary.total_task_count}
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{summary.completed_task_count} done</span>
                    <span>{summary.remaining_task_count} remaining</span>
                  </div>
                </div>

                {/* Total Story Points */}
                <div className="rounded-xl border border-border bg-card p-4 text-card-foreground">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Story Points</span>
                    <Calculator className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="mt-2 text-2xl font-bold text-foreground">
                    {summary.total_estimated_points} pts
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{summary.completed_points} pts done</span>
                    <span>{summary.remaining_points} pts remaining</span>
                  </div>
                </div>

                {/* Task Completion Rate */}
                <div className="rounded-xl border border-border bg-card p-4 text-card-foreground">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Tasks Completed</span>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="mt-2 text-2xl font-bold text-foreground">
                    {summary.completion_percentage_tasks}%
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                      style={{
                        width: `${Math.min(100, summary.completion_percentage_tasks)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Points Completion Rate */}
                <div className="rounded-xl border border-border bg-card p-4 text-card-foreground">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Points Delivered</span>
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </div>
                  <div className="mt-2 text-2xl font-bold text-foreground">
                    {summary.completion_percentage_points}%
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{
                        width: `${Math.min(100, summary.completion_percentage_points)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Unestimated Tasks Alert */}
              {summary.unestimated_task_count > 0 && (
                <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3.5 py-2 text-xs text-amber-600 dark:text-amber-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>
                    <strong>Notice:</strong> {summary.unestimated_task_count}{" "}
                    assigned task(s) do not have story point estimates. Burndown points may not represent entire sprint scope.
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card p-6 text-center text-xs text-muted-foreground">
              Select a sprint to view summary metrics.
            </div>
          )}

          {/* Sprint Burndown Chart Section */}
          <div className="rounded-xl border border-border bg-card p-5 text-card-foreground">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <TrendingDown className="h-4 w-4 text-primary" />
                  <span>Sprint Burndown Chart</span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Daily remaining story points comparing actual burn against ideal linear guideline.
                </p>
              </div>

              {/* Chart Legend */}
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="h-0.5 w-4 border-b-2 border-dashed border-muted-foreground" />
                  <span className="text-muted-foreground">Ideal Guideline</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                  <span className="font-medium text-foreground">
                    Actual Remaining Points
                  </span>
                </div>
              </div>
            </div>

            {/* SVG Burndown Rendering */}
            <div className="mt-4">
              {burndown && burndown.data_points.length > 0 ? (
                <div className="space-y-3">
                  <BurndownSvgChart
                    burndown={burndown}
                    hoveredIndex={hoveredPointIndex}
                    onHoverIndex={setHoveredPointIndex}
                  />

                  {/* Policy and data reconstruction transparency note */}
                  <div className="flex items-start gap-2 rounded-lg border border-border bg-secondary/30 p-2.5 text-[11px] text-muted-foreground">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    <div>
                      <span>
                        <strong>Audit Integrity:</strong> {burndown.reconstruction_policy}.
                      </span>
                      {hoveredPointIndex !== null &&
                        burndown.data_points[hoveredPointIndex]?.notes && (
                          <div className="mt-0.5 font-medium text-amber-500">
                            Note for {burndown.data_points[hoveredPointIndex].date}:{" "}
                            {burndown.data_points[hoveredPointIndex].notes}
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex h-56 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
                  No burndown data points available for this sprint.
                </div>
              )}
            </div>
          </div>

          {/* Historical Project Velocity Section */}
          <div className="rounded-xl border border-border bg-card p-5 text-card-foreground">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  <span>Historical Team Velocity</span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Committed vs completed story points across past completed sprints.
                </p>
              </div>

              {velocity && (
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-secondary px-3 py-1 text-center">
                    <span className="block text-[10px] text-muted-foreground">
                      Avg Points / Sprint
                    </span>
                    <span className="font-mono text-xs font-bold text-foreground">
                      {velocity.average_velocity_points} pts
                    </span>
                  </div>

                  <div className="rounded-lg bg-secondary px-3 py-1 text-center">
                    <span className="block text-[10px] text-muted-foreground">
                      Avg Tasks / Sprint
                    </span>
                    <span className="font-mono text-xs font-bold text-foreground">
                      {velocity.average_velocity_tasks}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* SVG Velocity Bar Chart */}
            <div className="mt-4">
              {velocity && velocity.sprints.length > 0 ? (
                <div className="space-y-3">
                  <VelocitySvgChart velocity={velocity} />

                  <div className="flex items-start gap-2 rounded-lg border border-border bg-secondary/30 p-2.5 text-[11px] text-muted-foreground">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    <span>{velocity.policy_notes}</span>
                  </div>
                </div>
              ) : (
                <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
                  No completed sprints yet. Complete sprint iterations to record team velocity trends.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// Pure SVG Burndown Chart Component
// -------------------------------------------------------------

function BurndownSvgChart({
  burndown,
  hoveredIndex,
  onHoverIndex,
}: {
  burndown: SprintBurndownResponse;
  hoveredIndex: number | null;
  onHoverIndex: (index: number | null) => void;
}) {
  const points = burndown.data_points;
  const width = 800;
  const height = 300;
  const padding = { top: 25, right: 30, bottom: 40, left: 50 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Max points for Y scale
  const maxPoints = Math.max(
    burndown.total_story_points,
    ...points.map((p) => p.ideal_story_points || 0),
    ...points.map((p) => p.remaining_story_points || 0),
    1
  );

  const getX = (index: number) => {
    if (points.length <= 1) return padding.left + chartWidth / 2;
    return padding.left + (index / (points.length - 1)) * chartWidth;
  };

  const getY = (val: number | null | undefined) => {
    if (val === null || val === undefined) return padding.top + chartHeight;
    const clamped = Math.max(0, Math.min(val, maxPoints));
    return padding.top + chartHeight - (clamped / maxPoints) * chartHeight;
  };

  // Build SVG path for ideal line
  const idealPath = points
    .filter((p) => p.ideal_story_points !== null)
    .map((p, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(p.ideal_story_points)}`)
    .join(" ");

  // Build SVG path for actual remaining points line
  const actualPointsWithIndex = points
    .map((p, i) => ({ p, i }))
    .filter((item) => item.p.remaining_story_points !== null);

  const actualPath = actualPointsWithIndex
    .map(
      (item, idx) =>
        `${idx === 0 ? "M" : "L"} ${getX(item.i)} ${getY(item.p.remaining_story_points)}`
    )
    .join(" ");

  // Y-axis tick intervals (4 ticks)
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((pct) =>
    Math.round(pct * maxPoints)
  );

  return (
    <div className="relative w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-64 w-full min-w-[500px] select-none"
      >
        {/* Horizontal Grid lines */}
        {yTicks.map((tickVal) => {
          const y = getY(tickVal);
          return (
            <g key={tickVal}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="currentColor"
                className="text-border/60"
                strokeDasharray="3 3"
              />
              <text
                x={padding.left - 10}
                y={y + 3}
                textAnchor="end"
                className="fill-muted-foreground text-[10px]"
              >
                {tickVal}
              </text>
            </g>
          );
        })}

        {/* Ideal guideline line (dashed) */}
        {idealPath && (
          <path
            d={idealPath}
            fill="none"
            stroke="currentColor"
            className="text-muted-foreground/60"
            strokeWidth="2"
            strokeDasharray="5 5"
          />
        )}

        {/* Actual remaining points line (solid primary) */}
        {actualPath && (
          <path
            d={actualPath}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Interactive point dots on actual points */}
        {actualPointsWithIndex.map(({ p, i }) => {
          const cx = getX(i);
          const cy = getY(p.remaining_story_points);
          const isHovered = hoveredIndex === i;

          return (
            <g
              key={p.date}
              onMouseEnter={() => onHoverIndex(i)}
              onMouseLeave={() => onHoverIndex(null)}
              className="cursor-pointer"
            >
              <circle
                cx={cx}
                cy={cy}
                r={isHovered ? 6 : 4}
                className={cn(
                  "fill-primary stroke-background transition-all",
                  isHovered && "stroke-primary stroke-2"
                )}
              />
            </g>
          );
        })}

        {/* X-axis date labels */}
        {points.map((p, i) => {
          // If many points, show every other label or first/mid/last
          const showLabel =
            points.length <= 10 ||
            i === 0 ||
            i === points.length - 1 ||
            i % Math.ceil(points.length / 6) === 0;

          if (!showLabel) return null;
          const x = getX(i);
          const formattedDate = p.date.substring(5); // e.g. "10-22"

          return (
            <text
              key={p.date}
              x={x}
              y={height - 12}
              textAnchor="middle"
              className="fill-muted-foreground text-[10px]"
            >
              {formattedDate}
            </text>
          );
        })}
      </svg>

      {/* Floating Tooltip when point hovered */}
      {hoveredIndex !== null && points[hoveredIndex] && (
        <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 rounded-lg border border-border bg-card/95 px-3 py-2 text-xs shadow-lg backdrop-blur">
          <div className="font-semibold text-foreground">
            {points[hoveredIndex].date}
          </div>
          <div className="mt-1 flex items-center gap-3 text-[11px]">
            <span className="text-muted-foreground">
              Ideal:{" "}
              <strong>
                {points[hoveredIndex].ideal_story_points != null
                  ? `${points[hoveredIndex].ideal_story_points} pts`
                  : "–"}
              </strong>
            </span>
            <span className="text-primary font-medium">
              Actual Remaining:{" "}
              <strong>
                {points[hoveredIndex].remaining_story_points != null
                  ? `${points[hoveredIndex].remaining_story_points} pts`
                  : "–"}
              </strong>
            </span>
            <span className="text-emerald-500">
              Completed:{" "}
              <strong>{points[hoveredIndex].completed_story_points} pts</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// Pure SVG Velocity Bar Chart Component
// -------------------------------------------------------------

function VelocitySvgChart({
  velocity,
}: {
  velocity: ProjectVelocityResponse;
}) {
  const sprints = velocity.sprints;
  const width = 800;
  const height = 260;
  const padding = { top: 25, right: 30, bottom: 40, left: 50 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxPoints = Math.max(
    ...sprints.map((s) => s.committed_points),
    ...sprints.map((s) => s.completed_points),
    1
  );

  const barGroupWidth = chartWidth / sprints.length;
  const barWidth = Math.min(28, (barGroupWidth - 16) / 2);

  const getY = (val: number) => {
    const clamped = Math.max(0, Math.min(val, maxPoints));
    return padding.top + chartHeight - (clamped / maxPoints) * chartHeight;
  };

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-60 w-full min-w-[500px] select-none"
      >
        {/* Horizontal grid lines */}
        {[0, 0.5, 1].map((pct) => {
          const val = Math.round(pct * maxPoints);
          const y = getY(val);
          return (
            <g key={pct}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="currentColor"
                className="text-border/60"
                strokeDasharray="3 3"
              />
              <text
                x={padding.left - 10}
                y={y + 3}
                textAnchor="end"
                className="fill-muted-foreground text-[10px]"
              >
                {val} pts
              </text>
            </g>
          );
        })}

        {/* Bars for each sprint */}
        {sprints.map((s, i) => {
          const groupX = padding.left + i * barGroupWidth + barGroupWidth / 2;
          const committedX = groupX - barWidth - 2;
          const completedX = groupX + 2;

          const committedY = getY(s.committed_points);
          const committedH = padding.top + chartHeight - committedY;

          const completedY = getY(s.completed_points);
          const completedH = padding.top + chartHeight - completedY;

          return (
            <g key={s.sprint_id}>
              {/* Committed points bar */}
              <rect
                x={committedX}
                y={committedY}
                width={barWidth}
                height={Math.max(1, committedH)}
                rx="3"
                className="fill-muted-foreground/30 hover:fill-muted-foreground/50 transition-colors"
              >
                <title>{`${s.sprint_name}: Committed ${s.committed_points} pts`}</title>
              </rect>

              {/* Completed points bar */}
              <rect
                x={completedX}
                y={completedY}
                width={barWidth}
                height={Math.max(1, completedH)}
                rx="3"
                fill="hsl(var(--primary))"
                className="hover:opacity-80 transition-opacity"
              >
                <title>{`${s.sprint_name}: Completed ${s.completed_points} pts`}</title>
              </rect>

              {/* Sprint label */}
              <text
                x={groupX}
                y={height - 12}
                textAnchor="middle"
                className="fill-muted-foreground text-[10px] font-medium"
              >
                {s.sprint_name.length > 14
                  ? `${s.sprint_name.substring(0, 12)}…`
                  : s.sprint_name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
