"use client";

import React, { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Search,
  Filter,
  Clock,
  User as UserIcon,
  Flag,
  AlertCircle,
  Plus,
  Layers,
  ChevronDown,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { WorkItemResponse } from "@/services/generated/api-types";

export type CalendarViewMode = "month" | "week" | "day";

export interface CalendarViewProps {
  tasks: WorkItemResponse[];
  isLoading?: boolean;
  onTaskClick: (taskId: string) => void;
  onDateClick?: (date: Date) => void;
  onCreateTask?: (date?: Date) => void;
  assigneeMap?: Record<string, string>;
  availableStatuses?: Array<{ id: string; name: string }>;
  members?: Array<{ userId: string; name: string }>;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatMonthYear(date: Date): string {
  return date.toLocaleString("en-US", { month: "long", year: "numeric" });
}

function formatWeekRange(start: Date): string {
  const end = addDays(start, 6);
  const startStr = start.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
  });
  const endStr = end.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${startStr} – ${endStr}`;
}

function formatDayHeader(date: Date): string {
  return date.toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "bg-red-500/20 text-red-400 border-red-500/40",
  high: "bg-amber-500/20 text-amber-400 border-amber-500/40",
  medium: "bg-blue-500/20 text-blue-400 border-blue-500/40",
  low: "bg-zinc-500/20 text-zinc-300 border-zinc-500/40",
  lowest: "bg-zinc-500/10 text-zinc-400 border-zinc-600/30",
};

const STATUS_BADGE: Record<string, string> = {
  done: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  in_progress: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  review: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  todo: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30",
};

export function CalendarView({
  tasks,
  isLoading = false,
  onTaskClick,
  onDateClick,
  onCreateTask,
  assigneeMap = {},
  availableStatuses = [],
  members = [],
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>("month");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [isUnscheduledOpen, setIsUnscheduledOpen] = useState(false);
  const [dayOverflowDate, setDayOverflowDate] = useState<Date | null>(null);

  const today = useMemo(() => new Date(), []);

  // Filter tasks based on search & dropdown filters
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
      if (
        priorityFilter !== "all" &&
        t.priority?.toLowerCase() !== priorityFilter.toLowerCase()
      ) {
        return false;
      }
      if (assigneeFilter !== "all" && t.assignee_id !== assigneeFilter) {
        return false;
      }
      return true;
    });
  }, [tasks, searchQuery, statusFilter, priorityFilter, assigneeFilter]);

  // Separate scheduled tasks and unscheduled tasks (those without due_date)
  const { scheduledTasks, unscheduledTasks } = useMemo(() => {
    const scheduled: WorkItemResponse[] = [];
    const unscheduled: WorkItemResponse[] = [];

    for (const t of filteredTasks) {
      if (t.due_date) {
        scheduled.push(t);
      } else {
        unscheduled.push(t);
      }
    }
    return { scheduledTasks: scheduled, unscheduledTasks: unscheduled };
  }, [filteredTasks]);

  // Map tasks by date string (YYYY-MM-DD)
  const tasksByDate = useMemo(() => {
    const map = new Map<string, WorkItemResponse[]>();
    for (const t of scheduledTasks) {
      if (!t.due_date) continue;
      const d = new Date(t.due_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;
      const existing = map.get(key) || [];
      existing.push(t);
      map.set(key, existing);
    }
    return map;
  }, [scheduledTasks]);

  // Date navigation handlers
  const handlePrevious = () => {
    if (viewMode === "month") {
      setCurrentDate(
        new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
      );
    } else if (viewMode === "week") {
      setCurrentDate(addDays(currentDate, -7));
    } else {
      setCurrentDate(addDays(currentDate, -1));
    }
  };

  const handleNext = () => {
    if (viewMode === "month") {
      setCurrentDate(
        new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
      );
    } else if (viewMode === "week") {
      setCurrentDate(addDays(currentDate, 7));
    } else {
      setCurrentDate(addDays(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Month days generation (includes padding days from previous/next months)
  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startDayOfWeek = firstDay.getDay(); // 0 is Sunday
    const daysInMonth = lastDay.getDate();

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // Previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    // Next month padding to fill out 35 or 42 cells (5 or 6 weeks)
    const totalSlots = Math.ceil(days.length / 7) * 7;
    const remainingSlots = totalSlots - days.length;
    for (let i = 1; i <= remainingSlots; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [currentDate]);

  // Week days generation
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate);
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(start, i));
    }
    return days;
  }, [currentDate]);

  const getTasksForDay = (date: Date): WorkItemResponse[] => {
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
      date.getDate()
    ).padStart(2, "0")}`;
    return tasksByDate.get(key) || [];
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-9 w-64" />
        </div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="calendar-view">
      {/* Calendar Controls & Navigation Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        {/* Navigation & Title */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-border bg-background p-0.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevious}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              aria-label="Previous period"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToday}
              className="h-8 px-2.5 text-xs font-medium"
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNext}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              aria-label="Next period"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <h2 className="text-base font-semibold text-foreground sm:text-lg">
            {viewMode === "month" && formatMonthYear(currentDate)}
            {viewMode === "week" && formatWeekRange(startOfWeek(currentDate))}
            {viewMode === "day" && formatDayHeader(currentDate)}
          </h2>
        </div>

        {/* View Mode Switcher & Unscheduled Tray Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={isUnscheduledOpen ? "secondary" : "outline"}
            size="sm"
            onClick={() => setIsUnscheduledOpen(!isUnscheduledOpen)}
            className="h-8 gap-1.5 text-xs"
            title="Toggle Unscheduled Tasks"
          >
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Unscheduled</span>
            <Badge
              variant="outline"
              className={cn(
                "ml-1 h-5 px-1.5 font-mono text-[10px]",
                unscheduledTasks.length > 0 &&
                  "border-amber-500/40 text-amber-400"
              )}
            >
              {unscheduledTasks.length}
            </Badge>
          </Button>

          <div className="flex items-center rounded-lg border border-border bg-background p-0.5">
            <Button
              variant={viewMode === "month" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("month")}
              className="h-8 px-3 text-xs"
            >
              Month
            </Button>
            <Button
              variant={viewMode === "week" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("week")}
              className="h-8 px-3 text-xs"
            >
              Week
            </Button>
            <Button
              variant={viewMode === "day" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("day")}
              className="h-8 px-3 text-xs"
            >
              Day
            </Button>
          </div>

          {onCreateTask && (
            <Button
              size="sm"
              onClick={() => onCreateTask(currentDate)}
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
            placeholder="Filter calendar tasks..."
            className="h-8 pl-8 text-xs"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-8 rounded-md border border-border bg-background px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
          aria-label="Filter by status"
        >
          <option value="all">All Statuses</option>
          {availableStatuses.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        {/* Priority Filter */}
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="h-8 rounded-md border border-border bg-background px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
          aria-label="Filter by priority"
        >
          <option value="all">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
          <option value="lowest">Lowest</option>
        </select>

        {/* Assignee Filter */}
        {members.length > 0 && (
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="h-8 rounded-md border border-border bg-background px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
            aria-label="Filter by assignee"
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
          priorityFilter !== "all" ||
          assigneeFilter !== "all") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("all");
              setPriorityFilter("all");
              setAssigneeFilter("all");
            }}
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            Reset
          </Button>
        )}
      </div>

      {/* Main Calendar Area + Collapsible Unscheduled Panel */}
      <div className="flex gap-4">
        {/* Calendar Grid Container */}
        <div className="flex-1 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          {/* MONTH VIEW */}
          {viewMode === "month" && (
            <div className="flex flex-col">
              {/* Day-of-week Headers */}
              <div className="grid grid-cols-7 border-b border-border bg-muted/30 text-center text-xs font-semibold text-muted-foreground">
                {WEEKDAYS.map((day) => (
                  <div
                    key={day}
                    className="border-r border-border/50 py-2.5 last:border-r-0"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Month Day Cells */}
              <div className="grid auto-rows-fr grid-cols-7">
                {monthDays.map(({ date, isCurrentMonth }, idx) => {
                  const isCurrentDay = isSameDay(date, today);
                  const dayTasks = getTasksForDay(date);
                  const maxVisible = 3;
                  const visibleTasks = dayTasks.slice(0, maxVisible);
                  const overflowCount = dayTasks.length - maxVisible;

                  return (
                    <div
                      key={idx}
                      onClick={() => onDateClick?.(date)}
                      className={cn(
                        "group relative min-h-[115px] border-b border-r border-border/60 p-1.5 transition-colors hover:bg-card-hover/60",
                        !isCurrentMonth && "bg-muted/10 opacity-40",
                        (idx + 1) % 7 === 0 && "border-r-0"
                      )}
                    >
                      {/* Day Number Header */}
                      <div className="mb-1 flex items-center justify-between">
                        <span
                          className={cn(
                            "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                            isCurrentDay
                              ? "bg-primary font-bold text-primary-foreground shadow-sm"
                              : "text-foreground group-hover:text-primary"
                          )}
                        >
                          {date.getDate()}
                        </span>

                        {onCreateTask && isCurrentMonth && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onCreateTask(date);
                            }}
                            className="hidden h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground group-hover:flex"
                            title={`Add task for ${date.toLocaleDateString()}`}
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        )}
                      </div>

                      {/* Day Tasks List */}
                      <div className="space-y-1">
                        {visibleTasks.map((t) => (
                          <div
                            key={t.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onTaskClick(t.id);
                            }}
                            className={cn(
                              "shadow-2xs hover:shadow-xs flex cursor-pointer items-center justify-between rounded border border-border/60 bg-background/90 px-1.5 py-1 text-[11px] transition-all hover:border-primary/60 hover:bg-card",
                              t.type === "milestone" &&
                                "border-primary/50 bg-primary/10"
                            )}
                            title={`${t.issue_key}: ${t.title} (${t.status})`}
                          >
                            <div className="flex min-w-0 items-center gap-1">
                              {t.type === "milestone" ? (
                                <Flag className="h-3 w-3 shrink-0 text-primary" />
                              ) : (
                                <span
                                  className={cn(
                                    "h-1.5 w-1.5 shrink-0 rounded-full",
                                    t.priority === "urgent"
                                      ? "bg-red-500"
                                      : t.priority === "high"
                                        ? "bg-amber-500"
                                        : "bg-blue-400"
                                  )}
                                />
                              )}
                              <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                                {t.issue_key}
                              </span>
                              <span className="truncate font-medium text-foreground">
                                {t.title}
                              </span>
                            </div>

                            {t.status === "done" && (
                              <Badge
                                variant="outline"
                                className="h-4 border-emerald-500/30 px-1 text-[9px] text-emerald-400"
                              >
                                ✓
                              </Badge>
                            )}
                          </div>
                        ))}

                        {/* Overflow Counter */}
                        {overflowCount > 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDayOverflowDate(date);
                            }}
                            className="w-full py-0.5 text-center text-[10px] font-semibold text-primary hover:underline"
                          >
                            +{overflowCount} more
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* WEEK VIEW */}
          {viewMode === "week" && (
            <div className="flex flex-col">
              {/* Week Column Headers */}
              <div className="grid grid-cols-7 border-b border-border bg-muted/30 text-center">
                {weekDays.map((d) => {
                  const isCurrentDay = isSameDay(d, today);
                  return (
                    <div
                      key={d.toISOString()}
                      className={cn(
                        "flex flex-col items-center gap-1 border-r border-border/50 py-3 last:border-r-0",
                        isCurrentDay && "bg-primary/5"
                      )}
                    >
                      <span className="text-xs text-muted-foreground">
                        {WEEKDAYS[d.getDay()]}
                      </span>
                      <span
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold",
                          isCurrentDay
                            ? "bg-primary text-primary-foreground"
                            : "text-foreground"
                        )}
                      >
                        {d.getDate()}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Week Days Task Columns */}
              <div className="grid min-h-[450px] grid-cols-7 divide-x divide-border/60">
                {weekDays.map((d) => {
                  const dayTasks = getTasksForDay(d);
                  const isCurrentDay = isSameDay(d, today);

                  return (
                    <div
                      key={d.toISOString()}
                      onClick={() => onDateClick?.(d)}
                      className={cn(
                        "flex flex-col space-y-2 p-2 transition-colors hover:bg-card-hover/40",
                        isCurrentDay && "bg-primary/5"
                      )}
                    >
                      {dayTasks.length === 0 ? (
                        <div className="flex flex-1 items-center justify-center p-2 text-center text-xs text-muted-foreground/60">
                          <span>No tasks</span>
                        </div>
                      ) : (
                        dayTasks.map((t) => (
                          <div
                            key={t.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onTaskClick(t.id);
                            }}
                            className={cn(
                              "shadow-2xs group flex cursor-pointer flex-col gap-1.5 rounded-lg border border-border/70 bg-background/90 p-2.5 transition-all hover:border-primary/60 hover:bg-card",
                              t.type === "milestone" &&
                                "border-primary/50 bg-primary/10"
                            )}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <Badge
                                variant="outline"
                                className="font-mono text-[10px]"
                              >
                                {t.issue_key}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[9px] capitalize",
                                  STATUS_BADGE[t.status] || "border-border"
                                )}
                              >
                                {t.status}
                              </Badge>
                            </div>

                            <p className="line-clamp-2 text-xs font-medium text-foreground group-hover:text-primary">
                              {t.title}
                            </p>

                            <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
                              {t.priority && (
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-[9px] capitalize",
                                    PRIORITY_COLORS[t.priority]
                                  )}
                                >
                                  {t.priority}
                                </Badge>
                              )}
                              {t.assignee_id && (
                                <span className="max-w-[80px] truncate">
                                  {assigneeMap[t.assignee_id] || "Assigned"}
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* DAY VIEW */}
          {viewMode === "day" && (
            <div className="space-y-4 p-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-lg font-bold text-primary">
                    {currentDate.getDate()}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">
                      {formatDayHeader(currentDate)}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {getTasksForDay(currentDate).length} scheduled tasks
                    </p>
                  </div>
                </div>

                {onCreateTask && (
                  <Button
                    size="sm"
                    onClick={() => onCreateTask(currentDate)}
                    className="gap-1.5 bg-primary text-xs text-primary-foreground"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Schedule Task</span>
                  </Button>
                )}
              </div>

              {/* Day Tasks List */}
              <div className="space-y-2.5">
                {getTasksForDay(currentDate).length === 0 ? (
                  <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-border/80 p-8 text-center">
                    <CalendarIcon className="mb-2 h-8 w-8 text-muted-foreground/60" />
                    <h4 className="text-sm font-medium text-foreground">
                      No tasks scheduled for this day
                    </h4>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Use the "Schedule Task" button or select another date.
                    </p>
                  </div>
                ) : (
                  getTasksForDay(currentDate).map((t) => (
                    <div
                      key={t.id}
                      onClick={() => onTaskClick(t.id)}
                      className={cn(
                        "group flex cursor-pointer items-center justify-between rounded-xl border border-border/80 bg-background/90 p-3.5 transition-all hover:border-primary/50 hover:bg-card",
                        t.type === "milestone" &&
                          "border-primary/50 bg-primary/10"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-lg border",
                            t.type === "milestone"
                              ? "border-primary/40 bg-primary/20 text-primary"
                              : "border-border bg-muted/40 text-muted-foreground"
                          )}
                        >
                          {t.type === "milestone" ? (
                            <Flag className="h-4 w-4" />
                          ) : (
                            <Layers className="h-4 w-4" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-primary">
                              {t.issue_key}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              •
                            </span>
                            <span className="text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                              {t.title}
                            </span>
                          </div>
                          {t.description && (
                            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                              {t.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        {t.priority && (
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs capitalize",
                              PRIORITY_COLORS[t.priority]
                            )}
                          >
                            {t.priority}
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs capitalize",
                            STATUS_BADGE[t.status] || "border-border"
                          )}
                        >
                          {t.status}
                        </Badge>
                        {t.assignee_id && (
                          <span className="hidden text-xs text-muted-foreground sm:inline">
                            {assigneeMap[t.assignee_id] || "Assigned"}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Collapsible Unscheduled Tasks Drawer */}
        {isUnscheduledOpen && (
          <aside className="flex w-80 shrink-0 flex-col space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-foreground">
                  Unscheduled Tasks
                </h3>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsUnscheduledOpen(false)}
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Tasks without a target due date. Click to open details and assign
              dates.
            </p>

            <div className="max-h-[500px] flex-1 space-y-2 overflow-y-auto pr-1">
              {unscheduledTasks.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  All filtered tasks have scheduled due dates!
                </div>
              ) : (
                unscheduledTasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => onTaskClick(t.id)}
                    className="group flex cursor-pointer flex-col gap-1 rounded-lg border border-border/70 bg-background/80 p-2.5 transition-all hover:border-primary/50 hover:bg-card"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {t.issue_key}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[9px] capitalize",
                          STATUS_BADGE[t.status] || "border-border"
                        )}
                      >
                        {t.status}
                      </Badge>
                    </div>
                    <span className="truncate text-xs font-medium text-foreground group-hover:text-primary">
                      {t.title}
                    </span>
                  </div>
                ))
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Overflow Tasks Popover Modal */}
      {dayOverflowDate && (
        <div
          role="dialog"
          aria-modal="true"
          className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setDayOverflowDate(null)}
        >
          <div
            className="w-full max-w-md space-y-3 rounded-xl border border-border bg-card p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <h3 className="text-sm font-semibold text-foreground">
                Tasks for{" "}
                {dayOverflowDate.toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDayOverflowDate(null)}
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="max-h-[350px] space-y-2 overflow-y-auto pr-1">
              {getTasksForDay(dayOverflowDate).map((t) => (
                <div
                  key={t.id}
                  onClick={() => {
                    setDayOverflowDate(null);
                    onTaskClick(t.id);
                  }}
                  className="flex cursor-pointer items-center justify-between rounded-lg border border-border/70 bg-background p-2.5 transition-colors hover:border-primary/50 hover:bg-card-hover"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-primary">
                      {t.issue_key}
                    </span>
                    <span className="text-xs font-medium text-foreground">
                      {t.title}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {t.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
