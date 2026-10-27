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
import { ApiClientError } from "@/services/api-client";
import { toast } from "sonner";
import type { WorkItemResponse } from "@/services/generated/api-types";
import { Calculator, X } from "lucide-react";

export interface TaskEstimateDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  projectId: string;
  task: WorkItemResponse | null;
  onEstimated?: (updatedTask: WorkItemResponse) => void;
}

const FIBONACCI_PRESETS = [0, 0.5, 1, 2, 3, 5, 8, 13, 20, 40];

export function TaskEstimateDialog({
  isOpen,
  onOpenChange,
  organizationId,
  projectId,
  task,
  onEstimated,
}: TaskEstimateDialogProps) {
  const [points, setPoints] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (task) {
      setPoints(
        task.estimated_points !== null && task.estimated_points !== undefined
          ? String(task.estimated_points)
          : ""
      );
      setError(null);
    }
  }, [task, isOpen]);

  if (!task) return null;

  const handleSubmit = async (valueToSave?: number | null) => {
    let finalPoints: number | null = null;
    if (valueToSave !== undefined) {
      finalPoints = valueToSave;
    } else if (points.trim() !== "") {
      const parsed = parseFloat(points);
      if (isNaN(parsed) || parsed < 0 || parsed > 1000) {
        setError("Please enter a valid story point value between 0 and 1000.");
        return;
      }
      finalPoints = parsed;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const updated = await scrumService.estimateTask(
        organizationId,
        projectId,
        task.id,
        { estimated_points: finalPoints }
      );
      toast.success(
        finalPoints !== null
          ? `Estimated ${task.issue_key} at ${finalPoints} pts`
          : `Cleared estimate for ${task.issue_key}`
      );
      onEstimated?.(updated);
      onOpenChange(false);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setError(err.message || "Failed to update estimate");
      } else {
        setError("Network error while updating estimate");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Calculator className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                Estimate Story Points
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {task.issue_key} • {task.title}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {error && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-2.5 text-xs text-destructive">
              {error}
            </div>
          )}

          <div>
            <Label className="text-xs font-medium text-muted-foreground">
              Quick Presets (Fibonacci)
            </Label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {FIBONACCI_PRESETS.map((preset) => (
                <Button
                  key={preset}
                  type="button"
                  variant={points === String(preset) ? "default" : "outline"}
                  size="sm"
                  className="h-8 min-w-[36px] px-2 text-xs font-medium"
                  onClick={() => setPoints(String(preset))}
                >
                  {preset}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="estimate-input" className="text-xs font-medium">
              Custom Story Points
            </Label>
            <Input
              id="estimate-input"
              type="number"
              step="any"
              min="0"
              max="1000"
              placeholder="e.g. 5, 8, or leave empty"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              className="h-9 text-sm"
              disabled={isSubmitting}
            />
            <p className="text-[11px] text-muted-foreground">
              Estimates must be between 0 and 1000.
            </p>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleSubmit(null)}
            disabled={isSubmitting || task.estimated_points == null}
            className="gap-1.5 text-xs text-muted-foreground hover:text-destructive"
          >
            <X className="h-3.5 w-3.5" />
            <span>Clear Estimate</span>
          </Button>

          <div className="flex gap-2">
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
              type="button"
              size="sm"
              onClick={() => handleSubmit()}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Estimate"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
