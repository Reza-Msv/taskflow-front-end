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
import { createTaskSchema, updateTaskSchema } from "@/lib/schemas/task-schemas";
import type {
  WorkItemResponse,
  WorkItemCreateRequest,
  WorkItemUpdateRequest,
} from "@/services/generated/api-types";
import { Trash2 } from "lucide-react";

export interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: WorkItemResponse | null;
  defaultStatus?: string;
  members: Array<{ userId: string; name: string }>;
  availableStatuses: Array<{ id: string; name: string }>;
  onSubmitCreate: (data: WorkItemCreateRequest) => Promise<void>;
  onSubmitUpdate: (
    taskId: string,
    data: WorkItemUpdateRequest
  ) => Promise<void>;
  onDeleteTask?: (taskId: string) => Promise<void>;
  isSubmitting?: boolean;
}

export function TaskModal({
  isOpen,
  onClose,
  task,
  defaultStatus = "todo",
  members,
  availableStatuses,
  onSubmitCreate,
  onSubmitUpdate,
  onDeleteTask,
  isSubmitting = false,
}: TaskModalProps) {
  const isEditing = Boolean(task);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState(defaultStatus);
  const [priority, setPriority] = useState<
    "lowest" | "low" | "medium" | "high" | "urgent"
  >("medium");
  const [type, setType] = useState<
    "task" | "bug" | "story" | "epic" | "subtask"
  >("task");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [estimatedPoints, setEstimatedPoints] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      setStatus(task.status || defaultStatus);
      setPriority((task.priority as any) || "medium");
      setType((task.type as any) || "task");
      setAssigneeId(task.assignee_id || "");
      setDueDate(task.due_date ? task.due_date.slice(0, 10) : "");
      setEstimatedPoints(
        task.estimated_points != null ? String(task.estimated_points) : ""
      );
    } else {
      setTitle("");
      setDescription("");
      setStatus(defaultStatus);
      setPriority("medium");
      setType("task");
      setAssigneeId("");
      setDueDate("");
      setEstimatedPoints("");
    }
    setFormError(null);
  }, [task, defaultStatus, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const parsedPoints =
      estimatedPoints.trim() === "" ? null : Number(estimatedPoints);

    if (isEditing && task) {
      const payload: WorkItemUpdateRequest = {
        title: title.trim(),
        description: description.trim() || null,
        priority,
        assignee_id: assigneeId || null,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        estimated_points: parsedPoints,
        version: task.version,
      };

      const valRes = updateTaskSchema.safeParse(payload);
      if (!valRes.success) {
        setFormError(valRes.error.issues[0]?.message || "Invalid input");
        return;
      }

      try {
        await onSubmitUpdate(task.id, valRes.data);
        onClose();
      } catch (err: any) {
        setFormError(err?.message || "Failed to update task");
      }
    } else {
      const payload: WorkItemCreateRequest = {
        title: title.trim(),
        description: description.trim() || null,
        status,
        priority,
        type,
        assignee_id: assigneeId || null,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        estimated_points: parsedPoints,
      };

      const valRes = createTaskSchema.safeParse(payload);
      if (!valRes.success) {
        setFormError(valRes.error.issues[0]?.message || "Invalid input");
        return;
      }

      try {
        await onSubmitCreate(valRes.data);
        onClose();
      } catch (err: any) {
        setFormError(err?.message || "Failed to create task");
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? `Edit Task [${task?.issue_key}]` : "Create New Task"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update task details, assignment, or priority."
              : "Create a work item tracked in this project's workflow."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-md bg-destructive/10 p-2.5 text-xs text-destructive">
              {formError}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="task-title">Title *</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Implement user invite workflow"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-desc">Description</Label>
            <textarea
              id="task-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description or acceptance criteria..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {!isEditing && (
              <div className="space-y-1.5">
                <Label htmlFor="task-status">Status</Label>
                <select
                  id="task-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  disabled={isSubmitting}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {availableStatuses.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="task-priority">Priority</Label>
              <select
                id="task-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                disabled={isSubmitting}
                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="lowest">Lowest</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {!isEditing && (
              <div className="space-y-1.5">
                <Label htmlFor="task-type">Type</Label>
                <select
                  id="task-type"
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  disabled={isSubmitting}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="task">Task</option>
                  <option value="bug">Bug</option>
                  <option value="story">Story</option>
                  <option value="epic">Epic</option>
                  <option value="subtask">Subtask</option>
                </select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="task-assignee">Assignee</Label>
              <select
                id="task-assignee"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                disabled={isSubmitting}
                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="task-due">Due Date</Label>
              <Input
                id="task-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="task-points">Story Points</Label>
              <Input
                id="task-points"
                type="number"
                step="0.5"
                min="0"
                value={estimatedPoints}
                onChange={(e) => setEstimatedPoints(e.target.value)}
                placeholder="e.g. 3.0"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between pt-2">
            {isEditing && task && onDeleteTask ? (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={async () => {
                  if (confirm(`Delete task ${task.issue_key}?`)) {
                    await onDeleteTask(task.id);
                    onClose();
                  }
                }}
                disabled={isSubmitting}
                className="gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete</span>
              </Button>
            ) : (
              <div />
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Saving..."
                  : isEditing
                    ? "Update Task"
                    : "Create Task"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
