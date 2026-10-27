"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar as CalendarIcon,
  Search,
  Filter,
  Flag,
  Layers,
  Clock,
  GitBranch,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Plus,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { WorkItemResponse } from "@/services/generated/api-types";

export type TimelineZoomLevel = "days" | "weeks" | "months";

export interface TimelineViewProps {
  tasks: WorkItemResponse[];
  isLoading?: boolean;
  onTaskClick: (taskId: string) => void;
  onCreateTask?: () => void;
  onCreateMilestone?: () => void;
  assigneeMap?: Record<string, string>;
  availableStatuses?: Array<{ id: string; name: string }>;
  members?: Array<{ userId: string; name: string }>;
}

interface TimelineTaskRow {
  task: WorkItemResponse;
  level: number;
  isParent: boolean;
  hasChildren: boolean;
  isExpanded: boolean;
  startDate: Date;
  endDate: Date;
}

const STATUS_COLORS: Record<string, { bar: string; border: string }> = {
  done: {
    bar: "bg-emerald-600/80 hover:bg-emerald-500",
    border: "border-emerald-500/40",
  },
  in_progress: {
    bar: "bg-blue-600/80 hover:bg-blue-500",
    border: "border-blue-500/40",
  },
  review: {
    bar: "bg-purple-600/80 hover:bg-purple-500",
    border: "border-purple-500/40",
  },
  todo: {
    bar: "bg-zinc-600/80 hover:bg-zinc-500",
    border: "border-zinc-500/40",
  },
};

const ROW_HEIGHT = 42; // px per row
const DAY_WIDTH_DAYS = 42; // px per day in 'days' view
const DAY_WIDTH_WEEKS = 18; // px per day in 'weeks' view
const DAY_WIDTH_MONTHS = 6; // px per day in 'months' view

function addDays(d: Date, days: number): Date {
  const result = new Date(d);
  result.setDate(result.getDate() + days);
  return result;
}

function diffDays(d1: Date, d2: Date): number {
  const utc1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
  const utc2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
  return Math.floor((utc1 - utc2) / (1000 * 60 * 60 * 24));
}

function parseDates(task: WorkItemResponse): { start: Date; end: Date } {
  let start: Date;
  let end: Date;

  if (task.created_at && task.due_date) {
    const c = new Date(task.created_at);
    const d = new Date(task.due_date);
    if (d >= c) {
      start = c;
      end = d;
    } else {
      start = d;
      end = c;
    }
  } else if (task.due_date) {
    end = new Date(task.due_date);
    start = addDays(end, -3); // Default 3 days span
  } else if (task.created_at) {
    start = new Date(task.created_at);
    end = addDays(start, 3);
  } else {
    start = new Date();
    end = addDays(start, 2);
  }

  // Ensure normalized midnight
  start = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  end = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  return { start, end };
}

export function TimelineView({
  tasks,
  isLoading = false,
  onTaskClick,
  onCreateTask,
  onCreateMilestone,
  assigneeMap = {},
  availableStatuses = [],
  members = [],
}: TimelineViewProps) {
  const [zoomLevel, setZoomLevel] = useState<TimelineZoomLevel>("days");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [collapsedParentIds, setCollapsedParentIds] = useState<Set<string>>(
    new Set()
  );
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);

  const timelineContainerRef = useRef<HTMLDivElement>(null);

  const today = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          t.title.toLowerCase().includes(q) ||
          t.issue_key.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q));
        if (!matches) return false;
      }
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (assigneeFilter !== "all" && t.assignee_id !== assigneeFilter)
        return false;
      return true;
    });
  }, [tasks, searchQuery, statusFilter, assigneeFilter]);

  // Determine timeline date boundary
  const { timelineStart, timelineEnd, totalDays } = useMemo(() => {
    let minDate = new Date(today);
    let maxDate = new Date(today);

    // Give baseline window around today: -14 days to +30 days
    minDate = addDays(minDate, -14);
    maxDate = addDays(maxDate, 35);

    for (const t of filteredTasks) {
      const { start, end } = parseDates(t);
      if (start < minDate) minDate = start;
      if (end > maxDate) maxDate = end;
    }

    // Add padding days
    minDate = addDays(minDate, -7);
    maxDate = addDays(maxDate, 14);

    const count = diffDays(maxDate, minDate) + 1;
    return { timelineStart: minDate, timelineEnd: maxDate, totalDays: count };
  }, [filteredTasks, today]);

  const dayWidth = useMemo(() => {
    if (zoomLevel === "days") return DAY_WIDTH_DAYS;
    if (zoomLevel === "weeks") return DAY_WIDTH_WEEKS;
    return DAY_WIDTH_MONTHS;
  }, [zoomLevel]);

  const timelineWidth = totalDays * dayWidth;

  // Build hierarchical task rows (Parent -> Children)
  const taskRows = useMemo(() => {
    // Map children by parent_id
    const childrenMap = new Map<string, WorkItemResponse[]>();
    const roots: WorkItemResponse[] = [];
    const allIds = new Set(filteredTasks.map((t) => t.id));

    for (const t of filteredTasks) {
      if (t.parent_id && allIds.has(t.parent_id)) {
        const existing = childrenMap.get(t.parent_id) || [];
        existing.push(t);
        childrenMap.set(t.parent_id, existing);
      } else {
        roots.push(t);
      }
    }

    // Flatten into rows with collapsible state
    const rows: TimelineTaskRow[] = [];

    const traverse = (task: WorkItemResponse, level: number) => {
      const { start, end } = parseDates(task);
      const children = childrenMap.get(task.id) || [];
      const hasChildren = children.length > 0;
      const isExpanded = !collapsedParentIds.has(task.id);

      rows.push({
        task,
        level,
        isParent: hasChildren,
        hasChildren,
        isExpanded,
        startDate: start,
        endDate: end,
      });

      if (hasChildren && isExpanded) {
        for (const child of children) {
          traverse(child, level + 1);
        }
      }
    };

    for (const root of roots) {
      traverse(root, 0);
    }

    return rows;
  }, [filteredTasks, collapsedParentIds]);

  // Map task ID to row index for drawing dependency arrows
  const rowIndices = useMemo(() => {
    const map = new Map<string, number>();
    taskRows.forEach((r, idx) => {
      map.set(r.task.id, idx);
    });
    return map;
  }, [taskRows]);

  // Dependency links: Predecessor (parent_id) -> Successor (task)
  const dependencyLinks = useMemo(() => {
    const links: Array<{
      id: string;
      fromTaskId: string;
      toTaskId: string;
      fromRow: number;
      toRow: number;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
    }> = [];

    for (const row of taskRows) {
      const task = row.task;
      if (
        task.parent_id &&
        rowIndices.has(task.parent_id) &&
        rowIndices.has(task.id)
      ) {
        const fromRowIdx = rowIndices.get(task.parent_id)!;
        const toRowIdx = rowIndices.get(task.id)!;
        const parentRow = taskRows[fromRowIdx];

        // Parent bar coordinates
        const parentOffsetDays = Math.max(
          0,
          diffDays(parentRow.endDate, timelineStart)
        );
        const x1 = (parentOffsetDays + 1) * dayWidth;
        const y1 = fromRowIdx * ROW_HEIGHT + ROW_HEIGHT / 2;

        // Child bar coordinates
        const childOffsetDays = Math.max(
          0,
          diffDays(row.startDate, timelineStart)
        );
        const x2 = childOffsetDays * dayWidth;
        const y2 = toRowIdx * ROW_HEIGHT + ROW_HEIGHT / 2;

        links.push({
          id: `${task.parent_id}->${task.id}`,
          fromTaskId: task.parent_id,
          toTaskId: task.id,
          fromRow: fromRowIdx,
          toRow: toRowIdx,
          x1,
          y1,
          x2,
          y2,
        });
      }
    }

    return links;
  }, [taskRows, rowIndices, timelineStart, dayWidth]);

  // Toggle parent expand/collapse
  const toggleParent = (taskId: string) => {
    setCollapsedParentIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  // Scroll to Today
  const handleScrollToToday = () => {
    if (!timelineContainerRef.current) return;
    const daysSinceStart = diffDays(today, timelineStart);
    const scrollTarget = daysSinceStart * dayWidth - 250;
    const target = Math.max(0, scrollTarget);
    if (typeof timelineContainerRef.current.scrollTo === "function") {
      timelineContainerRef.current.scrollTo({
        left: target,
        behavior: "smooth",
      });
    } else {
      timelineContainerRef.current.scrollLeft = target;
    }
  };

  // Auto-scroll to today on initial mount
  useEffect(() => {
    const timer = setTimeout(() => {
      handleScrollToToday();
    }, 100);
    return () => clearTimeout(timer);
  }, [zoomLevel]);

  // Generate date columns for header
  const dateColumns = useMemo(() => {
    const cols: Array<{ date: Date; isWeekend: boolean; isToday: boolean }> =
      [];
    for (let i = 0; i < totalDays; i++) {
      const d = addDays(timelineStart, i);
      const dayOfWeek = d.getDay();
      cols.push({
        date: d,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
        isToday: diffDays(d, today) === 0,
      });
    }
    return cols;
  }, [totalDays, timelineStart, today]);

  // Today position in px
  const todayOffsetDays = diffDays(today, timelineStart);
  const todayPositionX = todayOffsetDays * dayWidth + dayWidth / 2;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-9 w-64" />
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="timeline-view">
      {/* Controls Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        {/* Navigation & Today */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleScrollToToday}
            className="h-8 gap-1.5 text-xs font-medium"
          >
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span>Go to Today</span>
          </Button>

          <span className="hidden text-xs text-muted-foreground sm:inline">
            Showing {taskRows.length} items &amp; {dependencyLinks.length}{" "}
            dependencies
          </span>
        </div>

        {/* Zoom & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Zoom Level Switcher */}
          <div className="flex items-center rounded-lg border border-border bg-background p-0.5">
            <Button
              variant={zoomLevel === "days" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setZoomLevel("days")}
              className="h-7 px-2.5 text-xs"
            >
              Days
            </Button>
            <Button
              variant={zoomLevel === "weeks" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setZoomLevel("weeks")}
              className="h-7 px-2.5 text-xs"
            >
              Weeks
            </Button>
            <Button
              variant={zoomLevel === "months" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setZoomLevel("months")}
              className="h-7 px-2.5 text-xs"
            >
              Months
            </Button>
          </div>

          {onCreateMilestone && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCreateMilestone}
              className="h-8 gap-1.5 border-primary/40 text-xs text-primary hover:bg-primary/10"
            >
              <Flag className="h-3.5 w-3.5" />
              <span>Add Milestone</span>
            </Button>
          )}

          {onCreateTask && (
            <Button
              size="sm"
              onClick={onCreateTask}
              className="h-8 gap-1.5 bg-primary text-xs text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Task</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/80 bg-card/60 p-2 text-xs">
        <div className="relative min-w-[180px] flex-1 sm:max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter timeline tasks..."
            className="h-8 pl-8 text-xs"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-8 rounded-md border border-border bg-background px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
          aria-label="Filter timeline by status"
        >
          <option value="all">All Statuses</option>
          {availableStatuses.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        {/* Assignee Filter */}
        {members.length > 0 && (
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="h-8 rounded-md border border-border bg-background px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
            aria-label="Filter timeline by assignee"
          >
            <option value="all">All Assignees</option>
            {members.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.name}
              </option>
            ))}
          </select>
        )}

        {(searchQuery ||
          statusFilter !== "all" ||
          assigneeFilter !== "all") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("all");
              setAssigneeFilter("all");
            }}
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            Reset
          </Button>
        )}
      </div>

      {/* Timeline Layout Container */}
      <div className="flex overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {/* LEFT COLUMN: Hierarchical Task List */}
        <div className="z-10 flex w-80 shrink-0 flex-col border-r border-border bg-card">
          {/* Header */}
          <div className="flex h-12 items-center justify-between border-b border-border bg-muted/30 px-3.5 text-xs font-semibold text-muted-foreground">
            <span>Task &amp; Hierarchy</span>
            <span>Status</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-border/40">
            {taskRows.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No tasks match current filter.
              </div>
            ) : (
              taskRows.map((row) => {
                const { task, level, hasChildren, isExpanded } = row;
                const isHovered = hoveredTaskId === task.id;

                return (
                  <div
                    key={task.id}
                    style={{ height: `${ROW_HEIGHT}px` }}
                    onMouseEnter={() => setHoveredTaskId(task.id)}
                    onMouseLeave={() => setHoveredTaskId(null)}
                    onClick={() => onTaskClick(task.id)}
                    className={cn(
                      "flex cursor-pointer items-center justify-between px-3 transition-colors hover:bg-card-hover/80",
                      isHovered && "bg-card-hover"
                    )}
                  >
                    <div
                      className="flex items-center gap-1.5 truncate"
                      style={{ paddingLeft: `${level * 16}px` }}
                    >
                      {/* Parent Expand/Collapse Chevron */}
                      {hasChildren ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleParent(task.id);
                          }}
                          className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          <ChevronDown
                            className={cn(
                              "h-3.5 w-3.5 transition-transform",
                              !isExpanded && "-rotate-90"
                            )}
                          />
                        </button>
                      ) : (
                        <span className="w-5 shrink-0" />
                      )}

                      {/* Icon */}
                      {task.type === "milestone" ? (
                        <Flag className="h-3.5 w-3.5 shrink-0 text-primary" />
                      ) : (
                        <Layers className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      )}

                      {/* Issue Key */}
                      <span className="shrink-0 font-mono text-[11px] font-semibold text-primary">
                        {task.issue_key}
                      </span>

                      {/* Title */}
                      <span className="truncate text-xs font-medium text-foreground">
                        {task.title}
                      </span>
                    </div>

                    {/* Status Pill */}
                    <Badge
                      variant="outline"
                      className="ml-1 h-5 shrink-0 px-1.5 text-[9px] capitalize"
                    >
                      {task.status}
                    </Badge>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT AREA: Gantt Chart Horizontal Grid */}
        <div
          ref={timelineContainerRef}
          className="relative flex-1 overflow-x-auto"
          style={{
            minHeight: `${Math.max(300, taskRows.length * ROW_HEIGHT + 60)}px`,
          }}
        >
          <div
            style={{ width: `${timelineWidth}px` }}
            className="relative select-none"
          >
            {/* Horizontal Timeline Header */}
            <div className="sticky top-0 z-20 flex h-12 border-b border-border bg-muted/30">
              {dateColumns.map((col, idx) => (
                <div
                  key={idx}
                  style={{ width: `${dayWidth}px` }}
                  className={cn(
                    "flex shrink-0 flex-col items-center justify-center border-r border-border/40 text-[10px]",
                    col.isWeekend && "bg-muted/15",
                    col.isToday && "bg-primary/10 font-bold text-primary"
                  )}
                >
                  {zoomLevel === "days" && (
                    <>
                      <span className="text-[9px] text-muted-foreground">
                        {["S", "M", "T", "W", "T", "F", "S"][col.date.getDay()]}
                      </span>
                      <span>{col.date.getDate()}</span>
                    </>
                  )}
                  {zoomLevel === "weeks" && (
                    <>
                      {col.date.getDay() === 1 && (
                        <span className="font-mono text-[9px] text-foreground">
                          {col.date.toLocaleDateString("en-US", {
                            month: "numeric",
                            day: "numeric",
                          })}
                        </span>
                      )}
                    </>
                  )}
                  {zoomLevel === "months" && (
                    <>
                      {col.date.getDate() === 1 && (
                        <span className="font-mono text-[9px] font-semibold text-foreground">
                          {col.date.toLocaleDateString("en-US", {
                            month: "short",
                          })}
                        </span>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Grid Columns Background (Vertical grid lines & weekend shading) */}
            <div
              className="pointer-events-none absolute bottom-0 left-0 right-0 top-12 flex"
              style={{ height: `${taskRows.length * ROW_HEIGHT}px` }}
            >
              {dateColumns.map((col, idx) => (
                <div
                  key={idx}
                  style={{ width: `${dayWidth}px` }}
                  className={cn(
                    "h-full shrink-0 border-r border-border/20",
                    col.isWeekend && "bg-muted/10"
                  )}
                />
              ))}

              {/* Vertical TODAY line */}
              {todayPositionX >= 0 && todayPositionX <= timelineWidth && (
                <div
                  style={{ left: `${todayPositionX}px` }}
                  className="absolute bottom-0 top-0 z-10 w-0.5 bg-primary shadow-[0_0_8px_rgba(255,138,0,0.6)]"
                  title="Today"
                >
                  <div className="shadow-xs absolute -top-6 -translate-x-1/2 rounded bg-primary px-1.5 py-0.5 text-[9px] font-bold text-primary-foreground">
                    Today
                  </div>
                </div>
              )}
            </div>

            {/* SVG Dependency Connector Lines */}
            <svg
              className="pointer-events-none absolute bottom-0 left-0 right-0 top-12 z-10"
              style={{
                width: `${timelineWidth}px`,
                height: `${taskRows.length * ROW_HEIGHT}px`,
              }}
            >
              <defs>
                <marker
                  id="dep-arrow"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 8 5 L 0 9 z" fill="#FF8A00" />
                </marker>
                <marker
                  id="dep-arrow-active"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#FF8A00" />
                </marker>
              </defs>

              {dependencyLinks.map((link) => {
                const isActive =
                  hoveredTaskId === link.fromTaskId ||
                  hoveredTaskId === link.toTaskId;

                // Bezier curve or S-curve from (x1, y1) to (x2, y2)
                const dx = Math.abs(link.x2 - link.x1);
                const controlX = Math.max(link.x1 + 20, link.x1 + dx * 0.4);
                const pathData = `M ${link.x1} ${link.y1} C ${controlX} ${link.y1}, ${controlX} ${link.y2}, ${link.x2} ${link.y2}`;

                return (
                  <path
                    key={link.id}
                    d={pathData}
                    fill="none"
                    stroke={isActive ? "#FF8A00" : "rgba(255, 138, 0, 0.4)"}
                    strokeWidth={isActive ? 2.5 : 1.5}
                    strokeDasharray={isActive ? undefined : "3 3"}
                    markerEnd={
                      isActive ? "url(#dep-arrow-active)" : "url(#dep-arrow)"
                    }
                    className="transition-all duration-200"
                  />
                );
              })}
            </svg>

            {/* Task Bars & Milestones */}
            <div className="relative">
              {taskRows.map((row, idx) => {
                const { task, startDate, endDate } = row;
                const offsetDays = Math.max(
                  0,
                  diffDays(startDate, timelineStart)
                );
                const spanDays = Math.max(1, diffDays(endDate, startDate) + 1);

                const barX = offsetDays * dayWidth;
                const barWidth = Math.max(dayWidth * 0.8, spanDays * dayWidth);
                const isHovered = hoveredTaskId === task.id;

                const isMilestone = task.type === "milestone";
                const statusTheme =
                  STATUS_COLORS[task.status] || STATUS_COLORS.todo;

                return (
                  <div
                    key={task.id}
                    style={{ height: `${ROW_HEIGHT}px` }}
                    className="relative flex items-center border-b border-border/30 hover:bg-card-hover/20"
                    onMouseEnter={() => setHoveredTaskId(task.id)}
                    onMouseLeave={() => setHoveredTaskId(null)}
                  >
                    {isMilestone ? (
                      /* Milestone Marker (Diamond) */
                      <div
                        style={{
                          left: `${barX + barWidth / 2 - 12}px`,
                        }}
                        onClick={() => onTaskClick(task.id)}
                        className={cn(
                          "group absolute z-20 flex cursor-pointer items-center gap-1.5 transition-transform hover:scale-110",
                          isHovered && "scale-110"
                        )}
                        title={`Milestone: ${task.title}`}
                      >
                        <div className="rounded-xs flex h-6 w-6 rotate-45 items-center justify-center border-2 border-primary-foreground/30 bg-primary shadow-md">
                          <Flag className="h-3 w-3 -rotate-45 text-primary-foreground" />
                        </div>
                        <span className="shadow-2xs whitespace-nowrap rounded bg-background/90 px-1.5 py-0.5 text-[11px] font-semibold text-primary">
                          {task.title}
                        </span>
                      </div>
                    ) : (
                      /* Task Bar */
                      <div
                        style={{
                          left: `${barX}px`,
                          width: `${barWidth}px`,
                          height: "26px",
                        }}
                        onClick={() => onTaskClick(task.id)}
                        className={cn(
                          "shadow-xs absolute z-10 flex cursor-pointer items-center justify-between rounded-md border px-2 text-xs font-medium text-white transition-all",
                          statusTheme.bar,
                          statusTheme.border,
                          isHovered &&
                            "scale-[1.01] ring-2 ring-primary ring-offset-1 ring-offset-background"
                        )}
                        title={`${task.issue_key}: ${task.title} (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()})`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="shrink-0 font-mono text-[10px] text-white/80">
                            {task.issue_key}
                          </span>
                          <span className="truncate text-[11px]">
                            {task.title}
                          </span>
                        </div>

                        {task.status === "done" && (
                          <CheckCircle2 className="ml-1 h-3 w-3 shrink-0 text-emerald-300" />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
