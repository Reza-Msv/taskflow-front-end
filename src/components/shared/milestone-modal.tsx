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
import { Flag, Calendar, AlertCircle } from "lucide-react";
import type { WorkItemResponse } from "@/services/generated/api-types";

export interface MilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    due_date: string;
    description?: string;
  }) => Promise<void>;
  milestone?: WorkItemResponse | null;
  defaultDate?: Date;
}

export function MilestoneModal({
  isOpen,
  onClose,
  onSubmit,
  milestone = null,
  defaultDate,
}: MilestoneModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (milestone) {
      setTitle(milestone.title);
      setDescription(milestone.description || "");
      if (milestone.due_date) {
        setDueDate(milestone.due_date.slice(0, 10));
      } else {
        setDueDate("");
      }
    } else {
      setTitle("");
      setDescription("");
      if (defaultDate) {
        const d = defaultDate;
        const formatted = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
          d.getDate()
        ).padStart(2, "0")}`;
        setDueDate(formatted);
      } else {
        const today = new Date();
        const formatted = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
          today.getDate()
        ).padStart(2, "0")}`;
        setDueDate(formatted);
      }
    }
    setError(null);
  }, [milestone, defaultDate, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Milestone title is required");
      return;
    }
    if (!dueDate) {
      setError("Target date is required");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const isoDueDate = new Date(`${dueDate}T23:59:59.000Z`).toISOString();
      await onSubmit({
        title: title.trim(),
        due_date: isoDueDate,
        description: description.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to save milestone");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
              <Flag className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle>
                {milestone ? "Edit Milestone" : "Create Milestone"}
              </DialogTitle>
              <DialogDescription>
                Define key project deliverable dates and release checkpoints.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-2.5 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="milestone-title" className="text-xs font-medium">
              Milestone Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="milestone-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Version 1.0 Release, Beta Signoff"
              className="text-xs"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="milestone-due" className="text-xs font-medium">
              Target Date <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="milestone-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="text-xs"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="milestone-desc" className="text-xs font-medium">
              Description (Optional)
            </Label>
            <textarea
              id="milestone-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Objectives, deliverables, or criteria for this milestone..."
              className="min-h-[80px] w-full rounded-md border border-border bg-background p-2 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              disabled={isSubmitting}
            />
          </div>

          <DialogFooter className="gap-2 pt-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting
                ? "Saving..."
                : milestone
                  ? "Update Milestone"
                  : "Create Milestone"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
