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
import { ApiClientError } from "@/services/api-client";
import { toast } from "sonner";
import type { SprintResponse } from "@/services/generated/api-types";
import { Sparkles, ThumbsUp, AlertCircle, CheckSquare } from "lucide-react";

export interface SprintRetrospectiveDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  projectId: string;
  sprint: SprintResponse | null;
}

export function SprintRetrospectiveDialog({
  isOpen,
  onOpenChange,
  organizationId,
  projectId,
  sprint,
}: SprintRetrospectiveDialogProps) {
  const [whatWentWell, setWhatWentWell] = useState("");
  const [whatCouldBeImproved, setWhatCouldBeImproved] = useState("");
  const [actionItems, setActionItems] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sprint && isOpen) {
      setIsLoading(true);
      setError(null);
      scrumService
        .getSprintRetrospective(organizationId, projectId, sprint.id)
        .then((data) => {
          if (data) {
            setWhatWentWell(data.what_went_well || "");
            setWhatCouldBeImproved(data.what_could_be_improved || "");
            setActionItems(data.action_items || "");
          } else {
            setWhatWentWell("");
            setWhatCouldBeImproved("");
            setActionItems("");
          }
        })
        .catch((err: unknown) => {
          if (err instanceof ApiClientError) {
            setError(err.message);
          }
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [sprint, isOpen, organizationId, projectId]);

  if (!sprint) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await scrumService.saveSprintRetrospective(
        organizationId,
        projectId,
        sprint.id,
        {
          what_went_well: whatWentWell.trim() || null,
          what_could_be_improved: whatCouldBeImproved.trim() || null,
          action_items: actionItems.trim() || null,
        }
      );
      toast.success("Retrospective saved successfully!");
      onOpenChange(false);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setError(err.message || "Failed to save retrospective");
      } else {
        setError("Network error while saving retrospective");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold">
                  Sprint Retrospective: {sprint.name}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Continuous improvement review for agile sprint delivery.
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

            {isLoading ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                Loading retrospective notes...
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="retro-went-well" className="flex items-center gap-1.5 text-xs font-medium text-emerald-500">
                    <ThumbsUp className="h-3.5 w-3.5" />
                    <span>What Went Well?</span>
                  </Label>
                  <textarea
                    id="retro-went-well"
                    placeholder="Celebrated wins, effective teamwork, tools or processes that succeeded..."
                    value={whatWentWell}
                    onChange={(e) => setWhatWentWell(e.target.value)}
                    rows={3}
                    disabled={isSubmitting}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="retro-improved" className="flex items-center gap-1.5 text-xs font-medium text-amber-500">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>What Could Be Improved?</span>
                  </Label>
                  <textarea
                    id="retro-improved"
                    placeholder="Bottlenecks, unexpected impediments, scope volatility, technical debt..."
                    value={whatCouldBeImproved}
                    onChange={(e) => setWhatCouldBeImproved(e.target.value)}
                    rows={3}
                    disabled={isSubmitting}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="retro-actions" className="flex items-center gap-1.5 text-xs font-medium text-primary">
                    <CheckSquare className="h-3.5 w-3.5" />
                    <span>Action Items for Next Sprint</span>
                  </Label>
                  <textarea
                    id="retro-actions"
                    placeholder="Actionable steps, changes in workflow, spike investigations..."
                    value={actionItems}
                    onChange={(e) => setActionItems(e.target.value)}
                    rows={3}
                    disabled={isSubmitting}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                  />
                </div>
              </>
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
              disabled={isSubmitting || isLoading}
            >
              {isSubmitting ? "Saving..." : "Save Retrospective"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
