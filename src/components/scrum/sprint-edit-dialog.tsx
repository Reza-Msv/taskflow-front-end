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
import { sprintUpdateSchema } from "@/lib/schemas/scrum-schemas";
import { ApiClientError } from "@/services/api-client";
import { toast } from "sonner";
import type { SprintResponse } from "@/services/generated/api-types";
import { Edit3, Calendar, Target } from "lucide-react";

export interface SprintEditDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  projectId: string;
  sprint: SprintResponse | null;
  onUpdated?: (updatedSprint: SprintResponse) => void;
}

export function SprintEditDialog({
  isOpen,
  onOpenChange,
  organizationId,
  projectId,
  sprint,
  onUpdated,
}: SprintEditDialogProps) {
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sprint) {
      setName(sprint.name);
      setGoal(sprint.goal || "");
      setStartDate(
        sprint.start_date ? sprint.start_date.substring(0, 10) : ""
      );
      setEndDate(sprint.end_date ? sprint.end_date.substring(0, 10) : "");
      setError(null);
    }
  }, [sprint, isOpen]);

  if (!sprint) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = sprintUpdateSchema.safeParse({
      name: name || undefined,
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
      const updated = await scrumService.updateSprint(
        organizationId,
        projectId,
        sprint.id,
        {
          name: validation.data.name,
          goal: validation.data.goal || null,
          start_date: validation.data.start_date || null,
          end_date: validation.data.end_date || null,
        }
      );
      toast.success(`Sprint "${updated.name}" updated successfully.`);
      onUpdated?.(updated);
      onOpenChange(false);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setError(err.message || "Failed to update sprint.");
      } else {
        setError("Network error while updating sprint.");
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
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Edit3 className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold">
                  Edit Sprint
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Update sprint schedule, name, or business goal.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {error && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-2.5 text-xs text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="edit-sprint-name" className="text-xs font-medium">
                Sprint Name
              </Label>
              <Input
                id="edit-sprint-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={255}
                disabled={isSubmitting}
                className="h-9 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-sprint-goal" className="flex items-center gap-1.5 text-xs font-medium">
                <Target className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Sprint Goal</span>
              </Label>
              <textarea
                id="edit-sprint-goal"
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
                <Label htmlFor="edit-sprint-start" className="flex items-center gap-1.5 text-xs font-medium">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Start Date</span>
                </Label>
                <Input
                  id="edit-sprint-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={isSubmitting}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-sprint-end" className="flex items-center gap-1.5 text-xs font-medium">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>End Date</span>
                </Label>
                <Input
                  id="edit-sprint-end"
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
              disabled={isSubmitting || !name.trim()}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
