"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { taskService } from "@/services/task-service";
import { collaborationService } from "@/services/collaboration-service";
import { ApiClientError } from "@/services/api-client";
import { useOptionalAuth } from "@/modules/auth/context/auth-context";
import { TaskChecklistsSubtasks } from "@/components/task-detail/task-checklists-subtasks";
import { TaskAttachmentsTab } from "@/components/task-detail/task-attachments-tab";
import { TaskDependenciesTab } from "@/components/task-detail/task-dependencies-tab";
import { TaskCommentsTab } from "@/components/task-detail/task-comments-tab";
import { TaskActivityTab } from "@/components/task-detail/task-activity-tab";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  CheckSquare,
  GitBranch,
  Paperclip,
  MessageSquare,
  History,
  Trash2,
  Edit2,
  Download,
  Plus,
  RefreshCw,
  AlertCircle,
  Clock,
  User as UserIcon,
  Send,
  UploadCloud,
  FileText,
  FileImage,
  ArrowLeft,
  X,
  Check,
  Calendar,
  Layers,
  ChevronRight,
  AtSign,
  Link2,
  Unlink,
  Network,
  Flag,
  AlertTriangle,
} from "lucide-react";
import type {
  WorkItemDetailResponse,
  WorkItemResponse,
  WorkItemCommentResponse,
  ChecklistItemResponse,
  AttachmentResponse,
  MentionableUserResponse,
  WorkItemActivityResponse,
  WorkItemUpdateRequest,
} from "@/services/generated/api-types";

export interface TaskDetailSheetProps {
  taskId: string | null;
  organizationId: string;
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated?: (
    updatedTask: WorkItemDetailResponse | WorkItemResponse
  ) => void;
  onTaskDeleted?: (taskId: string) => void;
  members?: Array<{ userId: string; name: string }>;
  availableStatuses?: Array<{ id: string; name: string }>;
}

const ALLOWED_EXTENSIONS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".svg",
  ".pdf",
  ".txt",
  ".csv",
  ".md",
  ".json",
  ".zip",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(isoString?: string | null): string {
  if (!isoString) return "None";
  try {
    const d = new Date(isoString);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}

function formatRelativeTime(isoString?: string | null): string {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diffSec < 60) return "just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return formatDate(isoString);
  } catch {
    return isoString;
  }
}

export function TaskDetailSheet({
  taskId,
  organizationId,
  projectId,
  isOpen,
  onClose,
  onTaskUpdated,
  onTaskDeleted,
  members = [],
  availableStatuses = [],
}: TaskDetailSheetProps) {
  const authContext = useOptionalAuth();
  const currentUser = authContext?.user;

  // Active task ID state (supports navigating down to subtasks and back)
  const [activeTaskId, setActiveTaskId] = useState<string | null>(taskId);
  const [taskHistoryStack, setTaskHistoryStack] = useState<string[]>([]);

  // Task Details Data
  const [task, setTask] = useState<WorkItemDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editable fields state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descValue, setDescValue] = useState("");
  const [isSavingMetadata, setIsSavingMetadata] = useState(false);

  // Checklists state
  const [checklists, setChecklists] = useState<ChecklistItemResponse[]>([]);
  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  const [isAddingChecklist, setIsAddingChecklist] = useState(false);

  // Subtasks state
  const [subtasks, setSubtasks] = useState<WorkItemResponse[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);

  // Attachments state
  const [attachments, setAttachments] = useState<AttachmentResponse[]>([]);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [attachmentToDelete, setAttachmentToDelete] =
    useState<AttachmentResponse | null>(null);

  // Comments state
  const [comments, setComments] = useState<WorkItemCommentResponse[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  // Request ID refs to drop stale asynchronous responses on rapid task switching
  const taskRequestIdRef = useRef(0);
  const commentsRequestIdRef = useRef(0);
  const activitiesRequestIdRef = useRef(0);

  // Activity History state
  const [activities, setActivities] = useState<WorkItemActivityResponse[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);

  // Delete Task dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Dependencies state
  const [parentTask, setParentTask] = useState<WorkItemResponse | null>(null);
  const [isLoadingParent, setIsLoadingParent] = useState(false);
  const [projectTasksList, setProjectTasksList] = useState<WorkItemResponse[]>(
    []
  );
  const [isLoadingProjectTasks, setIsLoadingProjectTasks] = useState(false);
  const [selectedPredecessorId, setSelectedPredecessorId] =
    useState<string>("");
  const [isUpdatingDependency, setIsUpdatingDependency] = useState(false);
  const [dependencyError, setDependencyError] = useState<string | null>(null);

  // Blocked predecessor validation state
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [isBlockedTransitionConfirmOpen, setIsBlockedTransitionConfirmOpen] =
    useState(false);

  const isPredecessorBlocked = Boolean(
    parentTask &&
    !["done", "completed"].includes(parentTask.status?.toLowerCase() || "")
  );

  // Synchronize activeTaskId when prop taskId changes
  useEffect(() => {
    setActiveTaskId(taskId);
    setTaskHistoryStack([]);
  }, [taskId]);

  // Load Task Details
  const loadTaskDetails = useCallback(
    async (id: string) => {
      const currentReqId = ++taskRequestIdRef.current;
      setIsLoading(true);
      setError(null);
      try {
        const detail = await taskService.getTaskDetail(
          organizationId,
          projectId,
          id
        );
        if (currentReqId !== taskRequestIdRef.current) return;
        setTask(detail);
        setTitleValue(detail.title);
        setDescValue(detail.description || "");
        setChecklists(detail.checklists || []);
        setSubtasks(detail.subtasks || []);
        setAttachments(detail.attachments || []);

        // Load parent task if parent_id exists
        if (detail.parent_id) {
          setIsLoadingParent(true);
          taskService
            .getTask(organizationId, projectId, detail.parent_id)
            .then((p) => {
              if (currentReqId === taskRequestIdRef.current) {
                setParentTask(p);
              }
            })
            .catch(() => {
              if (currentReqId === taskRequestIdRef.current) {
                setParentTask(null);
              }
            })
            .finally(() => {
              if (currentReqId === taskRequestIdRef.current) {
                setIsLoadingParent(false);
              }
            });
        } else {
          setParentTask(null);
        }
      } catch (err: unknown) {
        if (currentReqId !== taskRequestIdRef.current) return;
        if (err instanceof ApiClientError) {
          setError(err.message);
        } else {
          setError("Failed to load task details");
        }
      } finally {
        if (currentReqId === taskRequestIdRef.current) {
          setIsLoading(false);
        }
      }
    },
    [organizationId, projectId]
  );

  const loadProjectTasks = useCallback(async () => {
    setIsLoadingProjectTasks(true);
    try {
      const res = await taskService.getTasks(organizationId, projectId, {
        page_size: 150,
      });
      setProjectTasksList(res.items.filter((t) => t.id !== activeTaskId));
    } catch {
      // ignore
    } finally {
      setIsLoadingProjectTasks(false);
    }
  }, [organizationId, projectId, activeTaskId]);

  const handleSetPredecessor = async (newParentId: string) => {
    if (!activeTaskId || !newParentId) return;
    setIsUpdatingDependency(true);
    setDependencyError(null);
    try {
      const updated = await taskService.setTaskParent(
        organizationId,
        projectId,
        activeTaskId,
        newParentId
      );
      toast.success("Predecessor dependency set");
      setSelectedPredecessorId("");
      loadTaskDetails(activeTaskId);
      onTaskUpdated?.(updated);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        if (
          err.code === "CIRCULAR_HIERARCHY" ||
          err.message.toLowerCase().includes("circular")
        ) {
          const msg =
            "Circular hierarchy error: Setting this parent would create a circular dependency cycle.";
          setDependencyError(msg);
          toast.error(msg);
          return;
        }
        if (
          err.code === "INVALID_PARENT" ||
          err.message.toLowerCase().includes("own parent")
        ) {
          const msg = "A task cannot be its own parent.";
          setDependencyError(msg);
          toast.error(msg);
          return;
        }
        if (err.code === "CROSS_PROJECT_HIERARCHY") {
          const msg = "Parent task must belong to the same project.";
          setDependencyError(msg);
          toast.error(msg);
          return;
        }
        setDependencyError(err.message);
        toast.error(err.message);
      } else {
        setDependencyError("Failed to set predecessor dependency");
        toast.error("Failed to set predecessor dependency");
      }
    } finally {
      setIsUpdatingDependency(false);
    }
  };

  const handleRemovePredecessor = async () => {
    if (!activeTaskId) return;
    setIsUpdatingDependency(true);
    setDependencyError(null);
    try {
      const updated = await taskService.removeTaskParent(
        organizationId,
        projectId,
        activeTaskId
      );
      toast.success("Predecessor dependency removed");
      setParentTask(null);
      loadTaskDetails(activeTaskId);
      onTaskUpdated?.(updated);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to remove predecessor dependency");
      }
    } finally {
      setIsUpdatingDependency(false);
    }
  };

  // Load Comments
  const loadComments = useCallback(
    async (id: string) => {
      const currentReqId = ++commentsRequestIdRef.current;
      setIsLoadingComments(true);
      try {
        const res = await collaborationService.getComments(
          organizationId,
          projectId,
          id,
          {
            page_size: 50,
          }
        );
        if (currentReqId !== commentsRequestIdRef.current) return;
        setComments(res.items);
      } catch {
        // Silently handle comments load error
      } finally {
        if (currentReqId === commentsRequestIdRef.current) {
          setIsLoadingComments(false);
        }
      }
    },
    [organizationId, projectId]
  );

  // Load Activity History
  const loadActivities = useCallback(
    async (id: string) => {
      const currentReqId = ++activitiesRequestIdRef.current;
      setIsLoadingActivities(true);
      try {
        const res = await taskService.getTaskHistory(
          organizationId,
          projectId,
          id,
          {
            page_size: 50,
          }
        );
        if (currentReqId !== activitiesRequestIdRef.current) return;
        setActivities(res.items || []);
      } catch {
        // Silently handle activity load error
      } finally {
        if (currentReqId === activitiesRequestIdRef.current) {
          setIsLoadingActivities(false);
        }
      }
    },
    [organizationId, projectId]
  );

  useEffect(() => {
    if (isOpen && activeTaskId) {
      loadTaskDetails(activeTaskId);
      loadComments(activeTaskId);
      loadProjectTasks();
    }
  }, [isOpen, activeTaskId, loadTaskDetails, loadComments, loadProjectTasks]);

  // Navigate to subtask
  const handleNavigateToSubtask = (subtask: WorkItemResponse) => {
    if (activeTaskId) {
      setTaskHistoryStack((prev) => [...prev, activeTaskId]);
    }
    setActiveTaskId(subtask.id);
  };

  // Navigate back to parent task
  const handleNavigateBack = () => {
    const prevStack = [...taskHistoryStack];
    const prevTaskId = prevStack.pop();
    if (prevTaskId) {
      setTaskHistoryStack(prevStack);
      setActiveTaskId(prevTaskId);
    }
  };

  // Update Task Metadata (Status, Priority, Assignee, Due Date, Points, Title, Description)
  const handleUpdateTaskField = async (
    fields: Partial<WorkItemUpdateRequest>
  ) => {
    if (!task || !activeTaskId) return;
    setIsSavingMetadata(true);
    try {
      const updated = await taskService.updateTask(
        organizationId,
        projectId,
        activeTaskId,
        fields
      );
      setTask((prev) => (prev ? { ...prev, ...updated } : prev));
      onTaskUpdated?.(updated);
      toast.success("Task updated");
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to update task");
      }
    } finally {
      setIsSavingMetadata(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string, force = false) => {
    if (!task || !activeTaskId) return;

    if (
      !force &&
      ["done", "completed"].includes(newStatus.toLowerCase()) &&
      isPredecessorBlocked
    ) {
      setPendingStatus(newStatus);
      setIsBlockedTransitionConfirmOpen(true);
      return;
    }

    setIsSavingMetadata(true);
    try {
      const updated = await taskService.moveTask(
        organizationId,
        projectId,
        activeTaskId,
        { status: newStatus, version: task.version }
      );
      setTask((prev) =>
        prev ? { ...prev, ...updated, status: newStatus } : prev
      );
      onTaskUpdated?.(updated);
      toast.success(`Status updated to ${newStatus}`);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to update status");
      }
    } finally {
      setIsSavingMetadata(false);
      setPendingStatus(null);
    }
  };

  const handleSaveTitle = async () => {
    if (!titleValue.trim() || titleValue === task?.title) {
      setIsEditingTitle(false);
      return;
    }
    await handleUpdateTaskField({ title: titleValue.trim() });
    setIsEditingTitle(false);
  };

  const handleSaveDescription = async () => {
    if (descValue === task?.description) {
      setIsEditingDesc(false);
      return;
    }
    await handleUpdateTaskField({ description: descValue });
    setIsEditingDesc(false);
  };

  // Delete Task
  const handleDeleteTask = async () => {
    if (!activeTaskId) return;
    try {
      await taskService.deleteTask(organizationId, projectId, activeTaskId);
      toast.success("Task deleted");
      onTaskDeleted?.(activeTaskId);
      onClose();
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to delete task");
      }
    }
  };

  // --- Checklist Handlers ---
  const handleAddChecklistItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistTitle.trim() || !activeTaskId) return;
    setIsAddingChecklist(true);
    try {
      const created = await taskService.createChecklistItem(
        organizationId,
        projectId,
        activeTaskId,
        { title: newChecklistTitle.trim() }
      );
      setChecklists((prev) => [...prev, created]);
      setNewChecklistTitle("");
      toast.success("Checklist item added");
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to add checklist item");
      }
    } finally {
      setIsAddingChecklist(false);
    }
  };

  const handleToggleChecklistItem = async (item: ChecklistItemResponse) => {
    if (!activeTaskId) return;
    const newStatus = !item.is_completed;
    // Optimistic toggle
    setChecklists((prev) =>
      prev.map((i) =>
        i.id === item.id ? { ...i, is_completed: newStatus } : i
      )
    );
    try {
      const updated = await taskService.updateChecklistItem(
        organizationId,
        projectId,
        activeTaskId,
        item.id,
        { is_completed: newStatus }
      );
      setChecklists((prev) =>
        prev.map((i) => (i.id === item.id ? updated : i))
      );
    } catch {
      // Rollback
      setChecklists((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, is_completed: item.is_completed } : i
        )
      );
      toast.error("Failed to update checklist item");
    }
  };

  const handleDeleteChecklistItem = async (itemId: string) => {
    if (!activeTaskId) return;
    try {
      await taskService.deleteChecklistItem(
        organizationId,
        projectId,
        activeTaskId,
        itemId
      );
      setChecklists((prev) => prev.filter((i) => i.id !== itemId));
      toast.success("Checklist item deleted");
    } catch {
      toast.error("Failed to delete checklist item");
    }
  };

  // --- Subtask Handlers ---
  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim() || !activeTaskId) return;
    setIsAddingSubtask(true);
    try {
      const created = await taskService.createSubtask(
        organizationId,
        projectId,
        activeTaskId,
        { title: newSubtaskTitle.trim(), priority: "medium" }
      );
      setSubtasks((prev) => [...prev, created]);
      setNewSubtaskTitle("");
      toast.success("Subtask created");
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to create subtask");
      }
    } finally {
      setIsAddingSubtask(false);
    }
  };

  // --- Attachment Handlers ---
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !activeTaskId) return;
    const file = files[0];

    // Validate size (10 MB limit)
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File exceeds maximum allowed size of 10 MB");
      return;
    }

    // Validate extension
    const extension = `.${file.name.split(".").pop()?.toLowerCase()}`;
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      toast.error(
        `File extension ${extension} is not supported. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`
      );
      return;
    }

    setIsUploadingAttachment(true);
    try {
      const uploaded = await taskService.uploadAttachment(
        organizationId,
        projectId,
        activeTaskId,
        file
      );
      setAttachments((prev) => [uploaded, ...prev]);
      toast.success(`Attached ${file.name}`);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to upload attachment");
      }
    } finally {
      setIsUploadingAttachment(false);
    }
  };

  const handleDeleteAttachment = async () => {
    if (!attachmentToDelete || !activeTaskId) return;
    try {
      await taskService.deleteAttachment(
        organizationId,
        projectId,
        activeTaskId,
        attachmentToDelete.id
      );
      setAttachments((prev) =>
        prev.filter((a) => a.id !== attachmentToDelete.id)
      );
      toast.success("Attachment deleted");
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to delete attachment");
      }
    } finally {
      setAttachmentToDelete(null);
    }
  };

  // Checklist counts & progress
  const completedChecklistsCount = checklists.filter(
    (i) => i.is_completed
  ).length;
  const checklistProgressPercent =
    checklists.length > 0
      ? Math.round((completedChecklistsCount / checklists.length) * 100)
      : 0;

  // Subtask counts & progress
  const completedSubtasksCount = subtasks.filter(
    (s) => s.status === "done"
  ).length;
  const subtaskProgressPercent =
    subtasks.length > 0
      ? Math.round((completedSubtasksCount / subtasks.length) * 100)
      : 0;

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent
          side="right"
          className="flex h-full w-full flex-col border-l border-border bg-background p-0 sm:max-w-3xl lg:max-w-4xl"
        >
          {/* Top Bar / Header */}
          <SheetHeader className="flex flex-row items-center justify-between border-b border-border px-6 py-4">
            <div className="flex items-center gap-2">
              {taskHistoryStack.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={handleNavigateBack}
                  title="Back to parent task"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}

              <Badge
                variant="outline"
                className="font-mono text-xs font-semibold uppercase"
              >
                {task?.issue_key || "TASK"}
              </Badge>

              <Badge variant="secondary" className="text-[11px] capitalize">
                {task?.type || "task"}
              </Badge>

              {task?.parent_id && (
                <button
                  type="button"
                  onClick={() =>
                    parentTask && handleNavigateToSubtask(parentTask)
                  }
                  className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-primary"
                  title="Navigate to predecessor"
                >
                  <Link2 className="h-3.5 w-3.5 text-primary" />
                  <span>Predecessor:</span>
                  <span className="font-mono font-semibold text-foreground hover:text-primary">
                    {parentTask?.issue_key || `#${task.parent_id.slice(0, 8)}`}
                  </span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => activeTaskId && loadTaskDetails(activeTaskId)}
                title="Refresh details"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                onClick={() => setIsDeleteDialogOpen(true)}
                title="Delete task"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            {/* Accessible Screen-Reader Description */}
            <SheetDescription className="sr-only">
              Comprehensive task details, checklists, subtasks, attachments,
              comments, and activity history.
            </SheetDescription>
          </SheetHeader>

          {/* Main Content Area */}
          {isLoading ? (
            <div className="space-y-6 p-6">
              <Skeleton className="h-8 w-3/4" />
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="space-y-4 lg:col-span-2">
                  <Skeleton className="h-28 w-full" />
                  <Skeleton className="h-40 w-full" />
                </div>
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center space-y-4 p-12 text-center">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-foreground">
                  Failed to load task
                </h3>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => activeTaskId && loadTaskDetails(activeTaskId)}
              >
                Try Again
              </Button>
            </div>
          ) : task ? (
            <div className="flex flex-1 overflow-hidden">
              {/* Left / Main Column: Details, Checklists, Subtasks, Attachments, Comments */}
              <div className="flex-1 overflow-y-auto px-6 py-5">
                {/* Blocked Predecessor Banner */}
                {isPredecessorBlocked && (
                  <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-500">
                    <div className="flex items-center gap-2.5">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                      <div>
                        <span className="font-semibold">
                          Blocked by Predecessor:{" "}
                        </span>
                        <span>
                          [{parentTask?.issue_key}] {parentTask?.title} is still{" "}
                          {parentTask?.status}.
                        </span>
                      </div>
                    </div>
                    {parentTask && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleNavigateToSubtask(parentTask)}
                        className="h-7 border-amber-500/30 text-xs text-amber-500 hover:bg-amber-500/20"
                      >
                        View
                      </Button>
                    )}
                  </div>
                )}

                {/* Title */}
                <div className="mb-4">
                  {isEditingTitle ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={titleValue}
                        onChange={(e) => setTitleValue(e.target.value)}
                        className="text-lg font-semibold"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveTitle();
                          if (e.key === "Escape") {
                            setTitleValue(task.title);
                            setIsEditingTitle(false);
                          }
                        }}
                      />
                      <Button size="sm" onClick={handleSaveTitle}>
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setTitleValue(task.title);
                          setIsEditingTitle(false);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <h2
                      onClick={() => setIsEditingTitle(true)}
                      className="group flex cursor-pointer items-center justify-between text-xl font-bold tracking-tight text-foreground hover:text-primary"
                      title="Click to edit title"
                    >
                      <span>{task.title}</span>
                      <Edit2 className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </h2>
                  )}
                </div>

                {/* Description */}
                <div className="mb-6 rounded-lg border border-border/60 bg-muted/20 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase text-muted-foreground">
                      Description
                    </span>
                    {!isEditingDesc && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => setIsEditingDesc(true)}
                      >
                        <Edit2 className="h-3 w-3" />
                        <span>Edit</span>
                      </Button>
                    )}
                  </div>

                  {isEditingDesc ? (
                    <div className="space-y-2">
                      <textarea
                        value={descValue}
                        onChange={(e) => setDescValue(e.target.value)}
                        placeholder="Add a detailed description..."
                        rows={4}
                        className="w-full rounded-md border border-input bg-background p-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setDescValue(task.description || "");
                            setIsEditingDesc(false);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button size="sm" onClick={handleSaveDescription}>
                          Save Description
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap text-sm text-foreground/90">
                      {task.description || (
                        <span className="italic text-muted-foreground">
                          No description provided. Click edit to add one.
                        </span>
                      )}
                    </p>
                  )}
                </div>

                {/* Tabs: Details / Work Items vs Discussions vs Timeline */}
                <Tabs defaultValue="work_items" className="w-full">
                  <TabsList className="mb-4 grid w-full grid-cols-4">
                    <TabsTrigger value="work_items" className="gap-1.5 text-xs">
                      <CheckSquare className="h-3.5 w-3.5" />
                      <span>Checklist</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="dependencies"
                      className="gap-1.5 text-xs"
                      onClick={() => loadProjectTasks()}
                    >
                      <GitBranch className="h-3.5 w-3.5" />
                      <span>Dependencies</span>
                    </TabsTrigger>
                    <TabsTrigger value="comments" className="gap-1.5 text-xs">
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>Comments ({comments.length})</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="activity"
                      className="gap-1.5 text-xs"
                      onClick={() =>
                        activeTaskId && loadActivities(activeTaskId)
                      }
                    >
                      <History className="h-3.5 w-3.5" />
                      <span>Activity</span>
                    </TabsTrigger>
                  </TabsList>

                  {/* TAB 1: Checklists, Subtasks, Attachments */}
                  <TabsContent value="work_items" className="space-y-6">
                    <TaskChecklistsSubtasks
                      checklists={checklists}
                      subtasks={subtasks}
                      newChecklistTitle={newChecklistTitle}
                      isAddingChecklist={isAddingChecklist}
                      newSubtaskTitle={newSubtaskTitle}
                      isAddingSubtask={isAddingSubtask}
                      onChecklistTitleChange={setNewChecklistTitle}
                      onSubtaskTitleChange={setNewSubtaskTitle}
                      onToggleChecklistItem={handleToggleChecklistItem}
                      onDeleteChecklistItem={handleDeleteChecklistItem}
                      onAddChecklistItem={handleAddChecklistItem}
                      onAddSubtask={handleAddSubtask}
                      onNavigateToSubtask={handleNavigateToSubtask}
                    />

                    <TaskAttachmentsTab
                      organizationId={organizationId}
                      projectId={projectId}
                      taskId={activeTaskId!}
                      attachments={attachments}
                      isUploadingAttachment={isUploadingAttachment}
                      onFileUpload={handleFileUpload}
                      onDeleteAttachmentClick={(att) =>
                        setAttachmentToDelete(att)
                      }
                    />
                  </TabsContent>

                  {/* TAB: Dependencies & Relationships */}
                  <TabsContent value="dependencies" className="space-y-6">
                    <TaskDependenciesTab
                      parentTask={parentTask}
                      isLoadingParent={isLoadingParent}
                      projectTasksList={projectTasksList}
                      isLoadingProjectTasks={isLoadingProjectTasks}
                      selectedPredecessorId={selectedPredecessorId}
                      isUpdatingDependency={isUpdatingDependency}
                      dependencyError={dependencyError}
                      subtasks={subtasks}
                      newSubtaskTitle={newSubtaskTitle}
                      isAddingSubtask={isAddingSubtask}
                      onClearDependencyError={() => setDependencyError(null)}
                      onSelectPredecessorId={setSelectedPredecessorId}
                      onSetPredecessor={handleSetPredecessor}
                      onRemovePredecessor={handleRemovePredecessor}
                      onNavigateToTask={handleNavigateToSubtask}
                      onSubtaskTitleChange={setNewSubtaskTitle}
                      onAddSubtask={handleAddSubtask}
                    />
                  </TabsContent>

                  {/* TAB 2: Comments & @Mentions */}
                  <TabsContent value="comments" className="space-y-4">
                    <TaskCommentsTab
                      organizationId={organizationId}
                      projectId={projectId}
                      taskId={activeTaskId!}
                      currentUserId={currentUser?.id}
                      comments={comments}
                      setComments={setComments}
                      isLoadingComments={isLoadingComments}
                      formatRelativeTime={formatRelativeTime}
                    />
                  </TabsContent>

                  {/* TAB 3: Activity History */}
                  <TabsContent value="activity" className="space-y-3">
                    <TaskActivityTab
                      activities={activities}
                      isLoadingActivities={isLoadingActivities}
                      formatRelativeTime={formatRelativeTime}
                    />
                  </TabsContent>
                </Tabs>
              </div>

              {/* Right Column: Metadata Sidebar */}
              <div className="hidden w-72 space-y-5 overflow-y-auto border-l border-border bg-card/40 p-4 md:block">
                {/* Status */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="task-status-select"
                    className="text-xs text-muted-foreground"
                  >
                    Status
                  </Label>
                  <select
                    id="task-status-select"
                    value={task.status}
                    onChange={(e) => handleUpdateStatus(e.target.value)}
                    disabled={isSavingMetadata}
                    className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {availableStatuses.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="task-priority-select"
                    className="text-xs text-muted-foreground"
                  >
                    Priority
                  </Label>
                  <select
                    id="task-priority-select"
                    value={task.priority}
                    onChange={(e) =>
                      handleUpdateTaskField({
                        priority: e.target.value as
                          "lowest" | "low" | "medium" | "high" | "urgent",
                      })
                    }
                    disabled={isSavingMetadata}
                    className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="lowest">Lowest</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                {/* Assignee */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="task-assignee-select"
                    className="text-xs text-muted-foreground"
                  >
                    Assignee
                  </Label>
                  <select
                    id="task-assignee-select"
                    value={task.assignee_id || ""}
                    onChange={(e) =>
                      handleUpdateTaskField({
                        assignee_id:
                          e.target.value === "" ? null : e.target.value,
                      })
                    }
                    disabled={isSavingMetadata}
                    className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Unassigned</option>
                    {members.map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Reporter */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Reporter
                  </Label>
                  <div className="flex items-center gap-2 rounded-md border border-border/40 bg-muted/20 px-2.5 py-1.5 text-xs">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="bg-primary/10 text-[10px] text-primary">
                        {(task.reporter?.full_name ||
                          task.reporter?.name ||
                          "R")[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate text-foreground">
                      {task.reporter?.full_name ||
                        task.reporter?.name ||
                        "System"}
                    </span>
                  </div>
                </div>

                {/* Due Date */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="task-due-date-input"
                    className="text-xs text-muted-foreground"
                  >
                    Due Date
                  </Label>
                  <input
                    id="task-due-date-input"
                    type="date"
                    value={task.due_date ? task.due_date.slice(0, 10) : ""}
                    onChange={(e) =>
                      handleUpdateTaskField({
                        due_date: e.target.value
                          ? new Date(e.target.value).toISOString()
                          : null,
                      })
                    }
                    disabled={isSavingMetadata}
                    className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* Story Points */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="task-points-input"
                    className="text-xs text-muted-foreground"
                  >
                    Story Points
                  </Label>
                  <input
                    id="task-points-input"
                    type="number"
                    min={0}
                    value={
                      task.estimated_points != null ? task.estimated_points : ""
                    }
                    onChange={(e) =>
                      handleUpdateTaskField({
                        estimated_points: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                    placeholder="e.g. 5"
                    disabled={isSavingMetadata}
                    className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* Timestamps */}
                <div className="space-y-2 border-t border-border/50 pt-4 text-[11px] text-muted-foreground">
                  <div>
                    <span className="block font-medium">Created:</span>
                    <span>{formatDate(task.created_at)}</span>
                  </div>
                  <div>
                    <span className="block font-medium">Updated:</span>
                    <span>{formatDate(task.updated_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      {/* Confirm Task Deletion */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Task"
        description="Are you sure you want to delete this task? This action cannot be undone and will remove all associated checklists, comments, and attachments."
        confirmLabel="Delete Task"
        onConfirm={handleDeleteTask}
        isDestructive
      />

      {/* Confirm Attachment Deletion */}
      <ConfirmDialog
        open={Boolean(attachmentToDelete)}
        onOpenChange={(open) => !open && setAttachmentToDelete(null)}
        title="Delete Attachment"
        description={`Are you sure you want to delete attachment "${attachmentToDelete?.file_name || attachmentToDelete?.filename}"?`}
        confirmLabel="Delete"
        onConfirm={handleDeleteAttachment}
        isDestructive
      />

      {/* Confirm Blocked Status Transition */}
      <ConfirmDialog
        open={isBlockedTransitionConfirmOpen}
        onOpenChange={setIsBlockedTransitionConfirmOpen}
        title="Resolve Blocked Task?"
        description={`Predecessor task [${parentTask?.issue_key}] is still ${parentTask?.status}. Resolving this task before its predecessor is completed may violate workflow sequencing. Do you wish to proceed?`}
        confirmLabel="Mark Completed"
        onConfirm={() => {
          if (pendingStatus) {
            handleUpdateStatus(pendingStatus, true);
          }
        }}
      />
    </>
  );
}
