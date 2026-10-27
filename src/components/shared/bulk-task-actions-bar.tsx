"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Trash2,
  UserCheck,
  Flag,
  ArrowRightCircle,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { taskService } from "@/services/task-service";
import { ApiClientError } from "@/services/api-client";
import { toast } from "sonner";
import type {
  WorkItemResponse,
  ProjectMembershipResponse,
} from "@/services/generated/api-types";

export interface BulkTaskActionsBarProps {
  organizationId: string;
  projectId: string;
  selectedTasks: WorkItemResponse[];
  availableStatuses?: Array<{ id: string; name: string }>;
  members?: ProjectMembershipResponse[];
  onClearSelection: () => void;
  onOperationComplete: () => void;
}

export function BulkTaskActionsBar({
  organizationId,
  projectId,
  selectedTasks,
  availableStatuses = [
    { id: "todo", name: "To Do" },
    { id: "in_progress", name: "In Progress" },
    { id: "done", name: "Done" },
  ],
  members = [],
  onClearSelection,
  onOperationComplete,
}: BulkTaskActionsBarProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressText, setProgressText] = useState<string | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  if (selectedTasks.length === 0) return null;

  const count = selectedTasks.length;

  const handleBulkStatusChange = async (newStatus: string) => {
    setIsProcessing(true);
    let successCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < selectedTasks.length; i++) {
      const task = selectedTasks[i];
      setProgressText(`Moving ${i + 1}/${count}...`);
      try {
        await taskService.moveTask(organizationId, projectId, task.id, {
          status: newStatus,
          version: task.version,
        });
        successCount++;
      } catch (err: unknown) {
        if (err instanceof ApiClientError) {
          errors.push(`${task.issue_key}: ${err.message}`);
        } else {
          errors.push(`${task.issue_key}: Failed to move`);
        }
      }
    }

    setIsProcessing(false);
    setProgressText(null);

    if (successCount === count) {
      toast.success(`Successfully moved ${count} task(s) to ${newStatus}`);
    } else if (successCount > 0) {
      toast.warning(
        `Moved ${successCount}/${count} task(s). ${errors.length} failed.`,
        { description: errors[0] }
      );
    } else {
      toast.error(`Failed to move tasks`, { description: errors[0] });
    }

    onClearSelection();
    onOperationComplete();
  };

  const handleBulkPriorityChange = async (
    priority: "lowest" | "low" | "medium" | "high" | "urgent"
  ) => {
    setIsProcessing(true);
    let successCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < selectedTasks.length; i++) {
      const task = selectedTasks[i];
      setProgressText(`Updating priority ${i + 1}/${count}...`);
      try {
        await taskService.updateTask(organizationId, projectId, task.id, {
          priority,
          version: task.version,
        });
        successCount++;
      } catch (err: unknown) {
        if (err instanceof ApiClientError) {
          errors.push(`${task.issue_key}: ${err.message}`);
        } else {
          errors.push(`${task.issue_key}: Failed to update`);
        }
      }
    }

    setIsProcessing(false);
    setProgressText(null);

    if (successCount === count) {
      toast.success(`Updated priority to ${priority} for ${count} task(s)`);
    } else if (successCount > 0) {
      toast.warning(
        `Updated priority for ${successCount}/${count} tasks. ${errors.length} failed.`,
        { description: errors[0] }
      );
    } else {
      toast.error(`Failed to update priority`, { description: errors[0] });
    }

    onClearSelection();
    onOperationComplete();
  };

  const handleBulkAssigneeChange = async (assigneeId: string | null) => {
    setIsProcessing(true);
    let successCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < selectedTasks.length; i++) {
      const task = selectedTasks[i];
      setProgressText(`Assigning ${i + 1}/${count}...`);
      try {
        await taskService.updateTask(organizationId, projectId, task.id, {
          assignee_id: assigneeId,
          version: task.version,
        });
        successCount++;
      } catch (err: unknown) {
        if (err instanceof ApiClientError) {
          errors.push(`${task.issue_key}: ${err.message}`);
        } else {
          errors.push(`${task.issue_key}: Failed to assign`);
        }
      }
    }

    setIsProcessing(false);
    setProgressText(null);

    if (successCount === count) {
      toast.success(
        assigneeId
          ? `Assigned ${count} task(s)`
          : `Unassigned ${count} task(s)`
      );
    } else if (successCount > 0) {
      toast.warning(
        `Assigned ${successCount}/${count} tasks. ${errors.length} failed.`,
        { description: errors[0] }
      );
    } else {
      toast.error(`Failed to assign tasks`, { description: errors[0] });
    }

    onClearSelection();
    onOperationComplete();
  };

  const handleBulkDelete = async () => {
    setIsProcessing(true);
    let successCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < selectedTasks.length; i++) {
      const task = selectedTasks[i];
      setProgressText(`Deleting ${i + 1}/${count}...`);
      try {
        await taskService.deleteTask(organizationId, projectId, task.id);
        successCount++;
      } catch (err: unknown) {
        if (err instanceof ApiClientError) {
          errors.push(`${task.issue_key}: ${err.message}`);
        } else {
          errors.push(`${task.issue_key}: Failed to delete`);
        }
      }
    }

    setIsProcessing(false);
    setProgressText(null);
    setIsDeleteConfirmOpen(false);

    if (successCount === count) {
      toast.success(`Deleted ${count} task(s)`);
    } else if (successCount > 0) {
      toast.warning(
        `Deleted ${successCount}/${count} tasks. ${errors.length} failed.`,
        { description: errors[0] }
      );
    } else {
      toast.error(`Failed to delete tasks`, { description: errors[0] });
    }

    onClearSelection();
    onOperationComplete();
  };

  return (
    <>
      <div className="sticky bottom-4 z-40 mx-auto flex w-full max-w-2xl items-center justify-between gap-3 rounded-xl border border-primary/40 bg-card/95 p-3 shadow-xl backdrop-blur-md animate-in slide-in-from-bottom-2">
        <div className="flex items-center gap-2.5">
          <Badge
            variant="default"
            className="flex h-6 items-center gap-1.5 px-2 text-xs font-semibold"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{count} Selected</span>
          </Badge>
          {progressText && (
            <span className="flex items-center gap-1.5 text-xs text-primary font-medium animate-pulse">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>{progressText}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Status Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isProcessing}
                className="h-8 gap-1 text-xs"
              >
                <ArrowRightCircle className="h-3.5 w-3.5 text-primary" />
                <span>Move Status</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs">
                Set Workflow Status
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {availableStatuses.map((st) => (
                <DropdownMenuItem
                  key={st.id}
                  onClick={() => handleBulkStatusChange(st.id)}
                  className="capitalize text-xs cursor-pointer"
                >
                  {st.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Priority Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isProcessing}
                className="h-8 gap-1 text-xs"
              >
                <Flag className="h-3.5 w-3.5 text-orange-500" />
                <span>Set Priority</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuLabel className="text-xs">
                Choose Priority
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(
                ["urgent", "high", "medium", "low", "lowest"] as const
              ).map((p) => (
                <DropdownMenuItem
                  key={p}
                  onClick={() => handleBulkPriorityChange(p)}
                  className="capitalize text-xs cursor-pointer"
                >
                  {p}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Assignee Dropdown */}
          {members.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isProcessing}
                  className="h-8 gap-1 text-xs"
                >
                  <UserCheck className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Assign</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 max-h-56 overflow-y-auto">
                <DropdownMenuLabel className="text-xs">
                  Assign to Member
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleBulkAssigneeChange(null)}
                  className="text-xs text-muted-foreground cursor-pointer"
                >
                  Unassigned
                </DropdownMenuItem>
                {members.map((m) => (
                  <DropdownMenuItem
                    key={m.user_id}
                    onClick={() => handleBulkAssigneeChange(m.user_id)}
                    className="text-xs cursor-pointer"
                  >
                    {m.user?.full_name || m.user?.email || m.user_id}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Delete Button */}
          <Button
            variant="ghost"
            size="sm"
            disabled={isProcessing}
            onClick={() => setIsDeleteConfirmOpen(true)}
            className="h-8 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
            title="Delete Selected Tasks"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>

          {/* Clear Button */}
          <Button
            variant="ghost"
            size="icon"
            disabled={isProcessing}
            onClick={onClearSelection}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title="Clear Selection"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        title="Delete Selected Tasks?"
        description={`Are you sure you want to permanently delete ${count} task(s)? This action cannot be undone.`}
        confirmLabel={isProcessing ? "Deleting..." : "Delete Tasks"}
        isDestructive={true}
        onConfirm={handleBulkDelete}
      />
    </>
  );
}
