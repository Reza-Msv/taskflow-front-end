"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { scrumService } from "@/services/scrum-service";
import { sprintStartSchema } from "@/lib/schemas/scrum-schemas";
import { ApiClientError } from "@/services/api-client";
import { toast } from "sonner";
import type { SprintResponse } from "@/services/generated/api-types";
import { Play, Calendar, Target, AlertTriangle } from "lucide-react";

export interface SprintStartDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  projectId: string;
  sprint: SprintResponse | null;
  onStarted?: (startedSprint: SprintResponse) => void;
}

export function SprintStartDialog({
  isOpen,
  onOpenChange,
  organizationId,
  projectId,
  sprint,
  onStarted,
}: SprintStartDialogProps) {
  const [goal, setGoal] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sprint) {
      setGoal(sprint.goal || "");
      // Default to today if start date not set
      const today = new Date().toISOString().substring(0, 10);
      setStartDate(
        sprint.start_date ? sprint.start_date.substring(0, 10) : today
      );
      // Default to 14 days later if end date not set
      const twoWeeks = new Date(Date.now() + 14 * 86400000)
        .toISOString()
        .substring(0, 10);
      setEndDate(sprint.end_date ? sprint.end_date.substring(0, 10) : twoWeeks);
      setError(null);
    }
  }, [sprint, isOpen]);

  if (!sprint) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = sprintStartSchema.safeParse({
      goal: goal || undefined,
      start_date: startDate ? new Date(startDate).toISOString() : undefined,
      end_date: endDate ? new Date(endDate).toISOString() : undefined,
    });

    if (!validation.success) {
      setError(validation.error.issues[0]?.message || "Invalid input.");
      return;
    }

    setIsSubmitting(true);
    try {
      const started = await scrumService.startSprint(
        organizationId,
        projectId,
        sprint.id,
        {
          goal: validation.data.goal || null,
          start_date: validation.data.start_date || null,
          end_date: validation.data.end_date || null,
        }
      );
      toast.success(`Sprint "${started.name}" is now active!`);
      onStarted?.(started);
      onOpenChange(false);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        if (err.status === 409 || err.code === "ACTIVE_SPRINT_EXISTS") {
          setError(
            "An active sprint already exists in this project. Complete the current active sprint before starting a new one."
          );
        } else {
          setError(err.message || "Failed to start sprint.");
        }
      } else {
        setError("Network error while starting sprint.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                <Play className="h-4 w-4 fill-current" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold">
                  Start Sprint: {sprint.name}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Confirm sprint duration and goals to transition into Active mode.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-2.5 text-xs text-destructive">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="rounded-lg border border-border bg-secondary/30 p-3 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Committed Tasks:</span>
                <span className="font-semibold text-foreground">
                  {sprint.total_tasks}
                </span>
              </div>
              <div className="mt-1 flex justify-between text-muted-foreground">
                <span>Estimated Story Points:</span>
                <span className="font-semibold text-foreground">
                  {sprint.total_points} pts
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="start-sprint-goal" className="flex items-center gap-1.5 text-xs font-medium">
                <Target className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Sprint Goal</span>
              </Label>
              <textarea
                id="start-sprint-goal"
                placeholder="What is the overarching goal or delivery target for this sprint?"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                maxLength={2000}
                rows={3}
                disabled={isSubmitting}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="start-sprint-start" className="flex items-center gap-1.5 text-xs font-medium">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Start Date</span>
                </Label>
                <Input
                  id="start-sprint-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={isSubmitting}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="start-sprint-end" className="flex items-center gap-1.5 text-xs font-medium">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>End Date</span>
                </Label>
                <Input
                  id="start-sprint-end"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={isSubmitting}
                  className="h-9 text-xs"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="mt-2 flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Starting..." : "Start Sprint"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
