"use client";

import React, { useState, useEffect, useCallback, useId } from "react";
import {
  Layers,
  Calculator,
  CheckCircle2,
  TrendingUp,
  BarChart3,
  Calendar,
  AlertCircle,
  Info,
  Download,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { scrumService } from "@/services/scrum-service";
import { exportSprintBurndownCsv } from "@/services/reports-service";
import type {
  ProjectResponse,
  SprintResponse,
  SprintSummaryResponse,
  SprintBurndownResponse,
  ProjectVelocityResponse,
} from "@/services/generated/api-types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface SprintReportsSectionProps {
  project: ProjectResponse;
  sprints: SprintResponse[];
  velocity: ProjectVelocityResponse | null;
  className?: string;
}

export function SprintReportsSection({
  project,
  sprints,
  velocity,
  className,
}: SprintReportsSectionProps) {
  const [selectedSprintId, setSelectedSprintId] = useState<string>(
    sprints.find((s) => s.status === "active")?.id || sprints[0]?.id || ""
  );

  const [summary, setSummary] = useState<SprintSummaryResponse | null>(null);
  const [burndown, setBurndown] = useState<SprintBurndownResponse | null>(null);
  const [burndownMetric, setBurndownMetric] = useState<"points" | "tasks">(
    "points"
  );
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(
    null
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const chartId = useId();

  useEffect(() => {
    if (!selectedSprintId && sprints.length > 0) {
      const active = sprints.find((s) => s.status === "active") || sprints[0];
      setSelectedSprintId(active.id);
    }
  }, [sprints, selectedSprintId]);

  const loadSprintData = useCallback(
    async (sprintId: string) => {
      if (!sprintId) return;
      setIsLoading(true);
      setError(null);
      try {
        const [sum, bd] = await Promise.all([
          scrumService.getSprintSummary(
            project.organization_id,
            project.id,
            sprintId
          ),
          scrumService.getSprintBurndown(
            project.organization_id,
            project.id,
            sprintId
          ),
        ]);
        setSummary(sum);
        setBurndown(bd);
      } catch (err: unknown) {
        setError("Failed to load sprint metrics and burndown series.");
      } finally {
        setIsLoading(false);
      }
    },
    [project.organization_id, project.id]
  );

  useEffect(() => {
    if (selectedSprintId) {
      loadSprintData(selectedSprintId);
    }
  }, [selectedSprintId, loadSprintData]);

  const handleExportBurndown = () => {
    if (!burndown) return;
    setIsExporting(true);
    try {
      exportSprintBurndownCsv(project, burndown);
      toast.success("Sprint burndown CSV exported successfully");
    } catch {
      toast.error("Failed to export sprint burndown CSV");
    } finally {
      setIsExporting(false);
    }
  };

  if (sprints.length === 0) {
    return (
      <div
        className={cn(
          "flex min-h-[240px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-8 text-center text-card-foreground shadow-sm",
          className
        )}
        data-testid="sprint-reports-empty"
      >
        <Layers
          className="mb-2 h-8 w-8 text-muted-foreground/60"
          aria-hidden="true"
        />
        <h3 className="text-sm font-semibold text-foreground">
          No Sprints Configured for This Project
        </h3>
        <p className="mt-1 max-w-md text-xs text-muted-foreground">
          To see burndown charts, committed vs completed points, and sprint
          metrics, create and start sprints in the Scrum & Sprints view.
        </p>
      </div>
    );
  }

  const selectedSprint = sprints.find((s) => s.id === selectedSprintId);

  return (
    <div
      className={cn("space-y-6", className)}
      data-testid="sprint-reports-section"
    >
      {/* Header and Sprint Selector */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" aria-hidden="true" />
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Sprint Burndown & Velocity Analytics
            </h3>
            <p className="text-xs text-muted-foreground">
              Detailed scope delivery, points burn rate, and historical sprint
              velocity.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sprint Selector */}
          <select
            value={selectedSprintId}
            onChange={(e) => setSelectedSprintId(e.target.value)}
            className="h-8 rounded-md border border-border bg-background px-2.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            aria-label="Select sprint for reports"
          >
            {sprints.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.status})
              </option>
            ))}
          </select>

          {burndown && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportBurndown}
              disabled={isExporting}
              className="h-8 gap-1.5 px-2.5 text-xs"
              title="Export Sprint Burndown as CSV"
            >
              <Download className="h-3.5 w-3.5 text-primary" />
              <span className="hidden sm:inline">Export Burndown</span>
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => loadSprintData(selectedSprintId)}
            disabled={isLoading}
            className="h-8 w-8 p-0"
            aria-label="Refresh sprint data"
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", isLoading && "animate-spin")}
            />
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
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center text-destructive">
          <AlertCircle className="mb-2 h-6 w-6" />
          <p className="text-sm font-semibold">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadSprintData(selectedSprintId)}
            className="mt-3 text-xs"
          >
            Try Again
          </Button>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {/* 1. Committed vs Completed Tasks */}
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Committed Tasks</span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="mt-2 text-2xl font-bold text-foreground">
                  {summary.completed_task_count}{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    / {summary.total_task_count} done
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                    style={{
                      width: `${Math.min(100, summary.completion_percentage_tasks)}%`,
                    }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                  <span>{summary.remaining_task_count} remaining</span>
                  <span>{summary.completion_percentage_tasks}% rate</span>
                </div>
              </div>

              {/* 2. Story Points Breakdown */}
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Story Points</span>
                  <Calculator className="h-4 w-4 text-primary" />
                </div>
                <div className="mt-2 text-2xl font-bold text-foreground">
                  {summary.completed_points}{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    / {summary.total_estimated_points} pts
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{
                      width: `${Math.min(100, summary.completion_percentage_points)}%`,
                    }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                  <span>{summary.remaining_points} pts left</span>
                  <span>{summary.completion_percentage_points}% delivered</span>
                </div>
              </div>

              {/* 3. Unestimated Tasks Notice */}
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Estimation Coverage</span>
                  <Info className="h-4 w-4 text-sky-500" />
                </div>
                <div className="mt-2 text-2xl font-bold text-foreground">
                  {summary.total_task_count - summary.unestimated_task_count}{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    / {summary.total_task_count} estimated
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  {summary.unestimated_task_count > 0 ? (
                    <span className="font-medium text-amber-500">
                      {summary.unestimated_task_count} unestimated tasks in
                      sprint
                    </span>
                  ) : (
                    <span className="font-medium text-emerald-500">
                      100% tasks estimated with story points
                    </span>
                  )}
                </p>
              </div>

              {/* 4. Sprint Status & Dates */}
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Sprint Status</span>
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {summary.status}
                  </Badge>
                </div>
                <div className="mt-2 truncate text-base font-semibold text-foreground">
                  {summary.sprint_name}
                </div>
                <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Calendar className="h-3 w-3 shrink-0" />
                  <span>
                    {summary.start_date
                      ? new Date(summary.start_date).toLocaleDateString()
                      : "Unscheduled"}{" "}
                    -{" "}
                    {summary.end_date
                      ? new Date(summary.end_date).toLocaleDateString()
                      : "Ongoing"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Burndown Chart */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-col gap-2 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h4 className="text-sm font-semibold text-foreground">
                  Sprint Burndown Chart
                </h4>
                <p className="text-xs text-muted-foreground">
                  Comparison between ideal linear velocity guideline and actual
                  remaining work.
                </p>
              </div>

              {/* Metric Toggle */}
              <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setBurndownMetric("points")}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs transition-colors",
                    burndownMetric === "points"
                      ? "bg-primary font-semibold text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Story Points
                </button>
                <button
                  type="button"
                  onClick={() => setBurndownMetric("tasks")}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs transition-colors",
                    burndownMetric === "tasks"
                      ? "bg-primary font-semibold text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Task Count
                </button>
              </div>
            </div>

            {/* Burndown Legend */}
            <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="inline-block h-0.5 w-4 border-t-2 border-dashed border-muted-foreground/60" />
                <span>Ideal Guideline</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block h-0.5 w-4 bg-primary" />
                <span className="-ml-2 inline-block h-2 w-2 rounded-full bg-primary" />
                <span>Actual Remaining</span>
              </div>
            </div>

            {/* Pure SVG Burndown */}
            {burndown && burndown.data_points.length > 0 ? (
              <div className="relative mt-4">
                <BurndownChartSvg
                  burndown={burndown}
                  metric={burndownMetric}
                  hoveredIndex={hoveredPointIndex}
                  onHoverIndex={setHoveredPointIndex}
                />

                {/* Reconstruction Policy Notes */}
                {burndown.reconstruction_policy && (
                  <div className="mt-3 flex items-start gap-1.5 border-t border-border/50 pt-2.5 text-[11px] text-muted-foreground">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    <span>{burndown.reconstruction_policy}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4 flex h-56 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
                No burndown data points available for this sprint.
              </div>
            )}
          </div>

          {/* Historical Team Velocity */}
          {velocity && (
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex flex-col gap-2 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    <span>Historical Team Velocity</span>
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Committed vs completed story points across past completed
                    sprints.
                  </p>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <div className="rounded-lg bg-secondary/80 px-3 py-1.5 text-center">
                    <span className="block text-[10px] text-muted-foreground">
                      Avg Points / Sprint
                    </span>
                    <span className="font-mono text-xs font-bold text-foreground">
                      {velocity.average_velocity_points} pts
                    </span>
                  </div>
                  <div className="rounded-lg bg-secondary/80 px-3 py-1.5 text-center">
                    <span className="block text-[10px] text-muted-foreground">
                      Avg Tasks / Sprint
                    </span>
                    <span className="font-mono text-xs font-bold text-foreground">
                      {velocity.average_velocity_tasks}
                    </span>
                  </div>
                </div>
              </div>

              {velocity.sprints.length > 0 ? (
                <div className="mt-4 space-y-3">
                  <VelocityBarChart velocity={velocity} />
                  <div className="flex items-start gap-2 rounded-lg border border-border/60 bg-muted/30 p-2.5 text-[11px] text-muted-foreground">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    <span>{velocity.policy_notes}</span>
                  </div>
                </div>
              ) : (
                <div className="mt-4 flex h-40 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
                  No completed sprints recorded yet. Complete sprints to track
                  historical velocity.
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// Pure SVG Burndown Chart Component
// -------------------------------------------------------------

function BurndownChartSvg({
  burndown,
  metric,
  hoveredIndex,
  onHoverIndex,
}: {
  burndown: SprintBurndownResponse;
  metric: "points" | "tasks";
  hoveredIndex: number | null;
  onHoverIndex: (idx: number | null) => void;
}) {
  const points = burndown.data_points;
  const width = 800;
  const height = 280;
  const padding = { top: 20, right: 30, bottom: 40, left: 45 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const isPoints = metric === "points";

  const getIdealVal = (p: (typeof points)[0]) =>
    isPoints ? p.ideal_story_points : p.ideal_tasks;
  const getRemainingVal = (p: (typeof points)[0]) =>
    isPoints ? p.remaining_story_points : p.remaining_tasks;

  const maxVal = Math.max(
    isPoints ? burndown.total_story_points : burndown.total_tasks,
    ...points.map((p) => getIdealVal(p) || 0),
    ...points.map((p) => getRemainingVal(p) || 0),
    1
  );

  const getX = (index: number) => {
    if (points.length <= 1) return padding.left + chartWidth / 2;
    return padding.left + (index / (points.length - 1)) * chartWidth;
  };

  const getY = (val: number | null | undefined) => {
    if (val === null || val === undefined) return padding.top + chartHeight;
    const clamped = Math.max(0, Math.min(val, maxVal));
    return padding.top + chartHeight - (clamped / maxVal) * chartHeight;
  };

  const idealCoords = points
    .filter((p) => getIdealVal(p) !== null)
    .map((p, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(getIdealVal(p))}`)
    .join(" ");

  const actualCoords = points
    .map((p, i) => ({ p, i }))
    .filter((item) => getRemainingVal(item.p) !== null)
    .map(
      (item, idx) =>
        `${idx === 0 ? "M" : "L"} ${getX(item.i)} ${getY(getRemainingVal(item.p))}`
    )
    .join(" ");

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full select-none overflow-visible"
        role="img"
        aria-label="Sprint Burndown Chart"
      >
        {/* Y-Axis Gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
          const y = padding.top + chartHeight * (1 - pct);
          const val = Math.round(pct * maxVal);
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

        {/* Ideal Line */}
        {idealCoords && (
          <path
            d={idealCoords}
            fill="none"
            stroke="currentColor"
            className="text-muted-foreground/60"
            strokeWidth="2"
            strokeDasharray="5 5"
          />
        )}

        {/* Actual Remaining Line */}
        {actualCoords && (
          <path
            d={actualCoords}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Data Point Dots */}
        {points.map((p, i) => {
          const rem = getRemainingVal(p);
          if (rem === null || rem === undefined) return null;
          const x = getX(i);
          const y = getY(rem);
          const isHovered = hoveredIndex === i;

          return (
            <circle
              key={p.date}
              cx={x}
              cy={y}
              r={isHovered ? 5.5 : 3.5}
              className={cn(
                "cursor-pointer fill-background stroke-primary stroke-2 transition-all",
                isHovered && "fill-primary"
              )}
              onMouseEnter={() => onHoverIndex(i)}
              onMouseLeave={() => onHoverIndex(null)}
            />
          );
        })}

        {/* X-Axis Dates */}
        {points.map((p, i) => {
          const step = Math.ceil(points.length / 8);
          if (i % step !== 0 && i !== points.length - 1) return null;
          const x = getX(i);
          const y = padding.top + chartHeight + 18;
          return (
            <text
              key={`x-${p.date}`}
              x={x}
              y={y}
              textAnchor="middle"
              className="fill-muted-foreground text-[10px]"
            >
              {p.date.slice(5)}
            </text>
          );
        })}
      </svg>

      {/* Hover Tooltip */}
      {hoveredIndex !== null && points[hoveredIndex] && (
        <div
          className="backdrop-blur-xs pointer-events-none absolute top-2 z-20 rounded-lg border border-border bg-popover/95 px-3 py-2 text-xs shadow-md"
          style={{
            left: `${Math.min(80, Math.max(10, (hoveredIndex / (points.length - 1 || 1)) * 100))}%`,
            transform: "translateX(-50%)",
          }}
        >
          <div className="mb-1 border-b border-border/50 pb-1 font-semibold text-foreground">
            {points[hoveredIndex].date}
          </div>
          <div className="flex items-center justify-between gap-3 text-muted-foreground">
            <span>Ideal:</span>
            <span>
              {getIdealVal(points[hoveredIndex]) !== null
                ? `${getIdealVal(points[hoveredIndex])} ${isPoints ? "pts" : "tasks"}`
                : "N/A"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 font-bold text-primary">
            <span>Remaining:</span>
            <span>
              {getRemainingVal(points[hoveredIndex]) !== null
                ? `${getRemainingVal(points[hoveredIndex])} ${isPoints ? "pts" : "tasks"}`
                : "N/A"}
            </span>
          </div>
          {points[hoveredIndex].notes && (
            <div className="mt-1 max-w-xs text-[10px] text-amber-500">
              {points[hoveredIndex].notes}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// Pure SVG Velocity Bar Chart
// -------------------------------------------------------------

function VelocityBarChart({ velocity }: { velocity: ProjectVelocityResponse }) {
  const sprints = velocity.sprints;
  const width = 800;
  const height = 200;
  const padding = { top: 20, right: 30, bottom: 40, left: 45 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxPts = Math.max(
    1,
    ...sprints.map((s) => Math.max(s.committed_points, s.completed_points))
  );

  const barGroupWidth = chartWidth / sprints.length;
  const barWidth = Math.min(24, barGroupWidth * 0.35);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto w-full select-none overflow-visible"
      role="img"
      aria-label="Historical Velocity Chart"
    >
      {/* Gridlines */}
      {[0, 0.5, 1].map((pct) => {
        const y = padding.top + chartHeight * (1 - pct);
        const val = Math.round(pct * maxPts);
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
              {val} pts
            </text>
          </g>
        );
      })}

      {/* Sprints Bars */}
      {sprints.map((sprint, i) => {
        const groupX = padding.left + i * barGroupWidth + barGroupWidth / 2;
        const baseline = padding.top + chartHeight;

        const committedH = (sprint.committed_points / maxPts) * chartHeight;
        const completedH = (sprint.completed_points / maxPts) * chartHeight;

        return (
          <g key={sprint.sprint_id}>
            {/* Committed Bar */}
            <rect
              x={groupX - barWidth - 2}
              y={baseline - committedH}
              width={barWidth}
              height={committedH}
              rx="2"
              className="fill-muted-foreground/40"
            >
              <title>{`Committed: ${sprint.committed_points} pts`}</title>
            </rect>
            {/* Completed Bar */}
            <rect
              x={groupX + 2}
              y={baseline - completedH}
              width={barWidth}
              height={completedH}
              rx="2"
              className="fill-primary"
            >
              <title>{`Completed: ${sprint.completed_points} pts`}</title>
            </rect>
            {/* Sprint Label */}
            <text
              x={groupX}
              y={baseline + 18}
              textAnchor="middle"
              className="fill-foreground text-[10px] font-medium"
            >
              {sprint.sprint_name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
