"use client";

import React, { useState } from "react";
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
import { sprintCreateSchema } from "@/lib/schemas/scrum-schemas";
import { ApiClientError } from "@/services/api-client";
import { toast } from "sonner";
import type { SprintResponse } from "@/services/generated/api-types";
import { PlusCircle, Calendar, Target } from "lucide-react";

export interface SprintCreateDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  projectId: string;
  onCreated?: (sprint: SprintResponse) => void;
}

export function SprintCreateDialog({
  isOpen,
  onOpenChange,
  organizationId,
  projectId,
  onCreated,
}: SprintCreateDialogProps) {
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setName("");
    setGoal("");
    setStartDate("");
    setEndDate("");
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = sprintCreateSchema.safeParse({
      name,
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
      const created = await scrumService.createSprint(
        organizationId,
        projectId,
        {
          name: validation.data.name,
          goal: validation.data.goal || null,
          start_date: validation.data.start_date || null,
          end_date: validation.data.end_date || null,
        }
      );
      toast.success(`Sprint "${created.name}" created successfully.`);
      onCreated?.(created);
      handleClose();
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setError(err.message || "Failed to create sprint.");
      } else {
        setError("Network error while creating sprint.");
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
                <PlusCircle className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold">
                  Create New Sprint
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Initialize a new sprint in draft status for your team.
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
              <Label htmlFor="sprint-name" className="text-xs font-medium">
                Sprint Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="sprint-name"
                placeholder="e.g. Sprint 1 - Core Foundations"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={255}
                disabled={isSubmitting}
                className="h-9 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sprint-goal" className="flex items-center gap-1.5 text-xs font-medium">
                <Target className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Sprint Goal</span>
              </Label>
              <textarea
                id="sprint-goal"
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
                <Label htmlFor="sprint-start" className="flex items-center gap-1.5 text-xs font-medium">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Start Date</span>
                </Label>
                <Input
                  id="sprint-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={isSubmitting}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sprint-end" className="flex items-center gap-1.5 text-xs font-medium">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>End Date</span>
                </Label>
                <Input
                  id="sprint-end"
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
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !name.trim()}
            >
              {isSubmitting ? "Creating..." : "Create Sprint"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
