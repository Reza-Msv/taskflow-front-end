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
import { Label } from "@/components/ui/label";
import { scrumService } from "@/services/scrum-service";
import { sprintCompleteSchema } from "@/lib/schemas/scrum-schemas";
import { ApiClientError } from "@/services/api-client";
import { toast } from "sonner";
import type { SprintResponse } from "@/services/generated/api-types";
import { CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";

export interface SprintCompleteDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  projectId: string;
  sprint: SprintResponse | null;
  availableSprints?: SprintResponse[];
  onCompleted?: (completedSprint: SprintResponse) => void;
}

export function SprintCompleteDialog({
  isOpen,
  onOpenChange,
  organizationId,
  projectId,
  sprint,
  availableSprints = [],
  onCompleted,
}: SprintCompleteDialogProps) {
  const [moveOption, setMoveOption] = useState<"backlog" | "next_sprint">("backlog");
  const [targetSprintId, setTargetSprintId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter available draft sprints other than current sprint
  const draftSprints = availableSprints.filter(
    (s) => s.status === "draft" && s.id !== sprint?.id
  );

  useEffect(() => {
    if (isOpen) {
      setMoveOption("backlog");
      setTargetSprintId(draftSprints[0]?.id || "");
      setError(null);
    }
  }, [isOpen]);

  if (!sprint) return null;

  const incompleteTasksCount = Math.max(
    0,
    sprint.total_tasks - sprint.completed_tasks
  );
  const incompletePoints = Math.max(
    0,
    sprint.total_points - sprint.completed_points
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = sprintCompleteSchema.safeParse({
      move_unfinished_to: moveOption,
      target_sprint_id: moveOption === "next_sprint" ? targetSprintId : undefined,
    });

    if (!validation.success) {
      setError(validation.error.issues[0]?.message || "Invalid input.");
      return;
    }

    setIsSubmitting(true);
    try {
      const completed = await scrumService.completeSprint(
        organizationId,
        projectId,
        sprint.id,
        {
          move_unfinished_to: validation.data.move_unfinished_to,
          target_sprint_id: validation.data.target_sprint_id || undefined,
        }
      );
      toast.success(`Sprint "${completed.name}" successfully completed!`);
      onCompleted?.(completed);
      onOpenChange(false);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setError(err.message || "Failed to complete sprint.");
      } else {
        setError("Network error while completing sprint.");
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
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold">
                  Complete Sprint: {sprint.name}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Finalize sprint delivery and choose rollover strategy for incomplete tasks.
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

            {/* Performance Summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  Completed
                </span>
                <div className="mt-1 text-sm font-bold text-foreground">
                  {sprint.completed_tasks} / {sprint.total_tasks} tasks
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {sprint.completed_points} / {sprint.total_points} pts
                </div>
              </div>

              <div className="rounded-lg border border-warning/20 bg-warning/5 p-3 text-xs">
                <span className="font-semibold text-warning">Incomplete</span>
                <div className="mt-1 text-sm font-bold text-foreground">
                  {incompleteTasksCount} tasks
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {incompletePoints} pts remaining
                </div>
              </div>
            </div>

            {/* Incomplete Tasks Policy Selection */}
            {incompleteTasksCount > 0 ? (
              <div className="space-y-2.5 border-t border-border/50 pt-3">
                <Label className="text-xs font-medium">
                  What should happen with the {incompleteTasksCount} unfinished task(s)?
                </Label>

                <div className="space-y-2">
                  <label
                    className={`flex cursor-pointer items-start gap-2.5 rounded-lg border p-2.5 text-xs transition-colors ${
                      moveOption === "backlog"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-secondary/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name="rollover"
                      value="backlog"
                      checked={moveOption === "backlog"}
                      onChange={() => setMoveOption("backlog")}
                      className="mt-0.5"
                    />
                    <div>
                      <div className="font-medium text-foreground">
                        Move to Product Backlog
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Tasks will return to the unassigned backlog for future prioritization.
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex cursor-pointer items-start gap-2.5 rounded-lg border p-2.5 text-xs transition-colors ${
                      moveOption === "next_sprint"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-secondary/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name="rollover"
                      value="next_sprint"
                      checked={moveOption === "next_sprint"}
                      onChange={() => setMoveOption("next_sprint")}
                      className="mt-0.5"
                    />
                    <div className="w-full">
                      <div className="font-medium text-foreground">
                        Rollover into another Sprint
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Tasks are immediately scheduled into an upcoming draft sprint.
                      </div>

                      {moveOption === "next_sprint" && (
                        <div className="mt-2.5">
                          {draftSprints.length > 0 ? (
                            <select
                              value={targetSprintId}
                              onChange={(e) => setTargetSprintId(e.target.value)}
                              className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                              <option value="">Select target draft sprint...</option>
                              {draftSprints.map((ds) => (
                                <option key={ds.id} value={ds.id}>
                                  {ds.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <p className="text-[11px] text-amber-500">
                              No draft sprints available. Please create a draft sprint first or choose Backlog.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-secondary/30 p-3 text-xs text-muted-foreground">
                🎉 All tasks were completed! No rollover needed.
              </div>
            )}
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
              disabled={
                isSubmitting ||
                (moveOption === "next_sprint" && !targetSprintId)
              }
            >
              {isSubmitting ? "Completing..." : "Complete Sprint"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
