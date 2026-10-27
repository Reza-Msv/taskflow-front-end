"use client";

import React from "react";
import { CheckSquare, GitBranch, Plus, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  ChecklistItemResponse,
  WorkItemResponse,
} from "@/services/generated/api-types";

export interface TaskChecklistsSubtasksProps {
  checklists: ChecklistItemResponse[];
  subtasks: WorkItemResponse[];
  newChecklistTitle: string;
  isAddingChecklist: boolean;
  newSubtaskTitle: string;
  isAddingSubtask: boolean;
  onChecklistTitleChange: (title: string) => void;
  onSubtaskTitleChange: (title: string) => void;
  onToggleChecklistItem: (item: ChecklistItemResponse) => void;
  onDeleteChecklistItem: (id: string) => void;
  onAddChecklistItem: (e: React.FormEvent) => void;
  onAddSubtask: (e: React.FormEvent) => void;
  onNavigateToSubtask: (subtask: WorkItemResponse) => void;
}

export function TaskChecklistsSubtasks({
  checklists,
  subtasks,
  newChecklistTitle,
  isAddingChecklist,
  newSubtaskTitle,
  isAddingSubtask,
  onChecklistTitleChange,
  onSubtaskTitleChange,
  onToggleChecklistItem,
  onDeleteChecklistItem,
  onAddChecklistItem,
  onAddSubtask,
  onNavigateToSubtask,
}: TaskChecklistsSubtasksProps) {
  const completedChecklistsCount = checklists.filter(
    (c) => c.is_completed
  ).length;
  const checklistProgressPercent =
    checklists.length > 0
      ? Math.round((completedChecklistsCount / checklists.length) * 100)
      : 0;

  const completedSubtasksCount = subtasks.filter(
    (s) => s.status === "done" || s.status === "completed"
  ).length;
  const subtaskProgressPercent =
    subtasks.length > 0
      ? Math.round((completedSubtasksCount / subtasks.length) * 100)
      : 0;

  return (
    <>
      {/* Checklists Section */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Checklist</h3>
            {checklists.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {completedChecklistsCount}/{checklists.length} (
                {checklistProgressPercent}%)
              </span>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {checklists.length > 0 && (
          <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${checklistProgressPercent}%` }}
            />
          </div>
        )}

        {/* Checklist items list */}
        <div className="space-y-1.5">
          {checklists.map((item) => (
            <div
              key={item.id}
              className="group flex items-center justify-between rounded-md p-1.5 transition-colors hover:bg-muted/40"
            >
              <label className="flex flex-1 cursor-pointer items-center gap-2.5 text-sm">
                <input
                  type="checkbox"
                  checked={item.is_completed}
                  onChange={() => onToggleChecklistItem(item)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <span
                  className={cn(
                    "text-foreground",
                    item.is_completed && "text-muted-foreground line-through"
                  )}
                >
                  {item.title}
                </span>
              </label>

              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100"
                onClick={() => onDeleteChecklistItem(item.id)}
                title="Delete checklist item"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>

        {/* Add checklist input */}
        <form
          onSubmit={onAddChecklistItem}
          className="mt-3 flex items-center gap-2"
        >
          <Input
            value={newChecklistTitle}
            onChange={(e) => onChecklistTitleChange(e.target.value)}
            placeholder="Add checklist item..."
            className="h-8 text-xs"
            disabled={isAddingChecklist}
          />
          <Button
            type="submit"
            size="sm"
            className="h-8 gap-1 px-3 text-xs"
            disabled={!newChecklistTitle.trim() || isAddingChecklist}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add</span>
          </Button>
        </form>
      </div>

      {/* Subtasks Section */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Subtasks</h3>
            {subtasks.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {completedSubtasksCount}/{subtasks.length} (
                {subtaskProgressPercent}%)
              </span>
            )}
          </div>
        </div>

        {/* Subtasks Progress */}
        {subtasks.length > 0 && (
          <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${subtaskProgressPercent}%` }}
            />
          </div>
        )}

        {/* Subtasks list */}
        <div className="space-y-1.5">
          {subtasks.map((st) => (
            <div
              key={st.id}
              onClick={() => onNavigateToSubtask(st)}
              className="group flex cursor-pointer items-center justify-between rounded-md border border-border/50 bg-background/50 p-2 transition-colors hover:border-primary/40 hover:bg-card-hover"
            >
              <div className="flex items-center gap-2.5">
                <Badge variant="outline" className="font-mono text-[10px]">
                  {st.issue_key}
                </Badge>
                <span className="text-xs font-medium text-foreground group-hover:text-primary">
                  {st.title}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant={st.status === "done" ? "default" : "secondary"}
                  className="text-[10px] capitalize"
                >
                  {st.status}
                </Badge>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
              </div>
            </div>
          ))}
        </div>

        {/* Add subtask input */}
        <form onSubmit={onAddSubtask} className="mt-3 flex items-center gap-2">
          <Input
            value={newSubtaskTitle}
            onChange={(e) => onSubtaskTitleChange(e.target.value)}
            placeholder="Create subtask..."
            className="h-8 text-xs"
            disabled={isAddingSubtask}
          />
          <Button
            type="submit"
            size="sm"
            className="h-8 gap-1 px-3 text-xs"
            disabled={!newSubtaskTitle.trim() || isAddingSubtask}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create</span>
          </Button>
        </form>
      </div>
    </>
  );
}
