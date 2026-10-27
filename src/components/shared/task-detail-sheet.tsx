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

function formatRelativeTime(isoString: string): string {
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Comments state
  const [comments, setComments] = useState<WorkItemCommentResponse[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [newCommentContent, setNewCommentContent] = useState("");
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState("");
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);

  // Mention Autocomplete state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionSuggestions, setMentionSuggestions] = useState<
    MentionableUserResponse[]
  >([]);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  // Synchronize activeTaskId when prop taskId changes
  useEffect(() => {
    setActiveTaskId(taskId);
    setTaskHistoryStack([]);
  }, [taskId]);

  // Load Task Details
  const loadTaskDetails = useCallback(
    async (id: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const detail = await taskService.getTaskDetail(
          organizationId,
          projectId,
          id
        );
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
            .then((p) => setParentTask(p))
            .catch(() => setParentTask(null))
            .finally(() => setIsLoadingParent(false));
        } else {
          setParentTask(null);
        }
      } catch (err: unknown) {
        if (err instanceof ApiClientError) {
          setError(err.message);
        } else {
          setError("Failed to load task details");
        }
      } finally {
        setIsLoading(false);
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
        setComments(res.items);
      } catch {
        // Silently handle comments load error
      } finally {
        setIsLoadingComments(false);
      }
    },
    [organizationId, projectId]
  );

  // Load Activity History
  const loadActivities = useCallback(
    async (id: string) => {
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
        setActivities(res.items || []);
      } catch {
        // Silently handle activity load error
      } finally {
        setIsLoadingActivities(false);
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

  const handleUpdateStatus = async (newStatus: string) => {
    if (!task || !activeTaskId) return;
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
      if (fileInputRef.current) fileInputRef.current.value = "";
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

  // --- Mention Autocomplete Logic ---
  const handleCommentChange = async (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const val = e.target.value;
    setNewCommentContent(val);

    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursorPos);
    const atMatch = textBeforeCursor.match(/@(\w*)$/);

    if (atMatch && activeTaskId) {
      const query = atMatch[1];
      setMentionQuery(query);
      try {
        const results = await collaborationService.getMentionableMembers(
          organizationId,
          projectId,
          activeTaskId,
          query
        );
        setMentionSuggestions(results);
        setSelectedMentionIndex(0);
      } catch {
        setMentionSuggestions([]);
      }
    } else {
      setMentionQuery(null);
      setMentionSuggestions([]);
    }
  };

  const handleSelectMention = (user: MentionableUserResponse) => {
    if (!textareaRef.current) return;
    const cursorPos = textareaRef.current.selectionStart;
    const textBeforeCursor = newCommentContent.slice(0, cursorPos);
    const textAfterCursor = newCommentContent.slice(cursorPos);
    const atIndex = textBeforeCursor.lastIndexOf("@");

    if (atIndex !== -1) {
      const mentionName = user.full_name || user.name;
      const updatedBefore =
        textBeforeCursor.slice(0, atIndex) + `@${mentionName} `;
      setNewCommentContent(updatedBefore + textAfterCursor);
      setMentionedUserIds((prev) => Array.from(new Set([...prev, user.id])));
      setMentionQuery(null);
      setMentionSuggestions([]);

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(
            updatedBefore.length,
            updatedBefore.length
          );
        }
      }, 0);
    }
  };

  const handleCommentKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (mentionSuggestions.length > 0 && mentionQuery !== null) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedMentionIndex(
          (prev) => (prev + 1) % mentionSuggestions.length
        );
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedMentionIndex(
          (prev) =>
            (prev - 1 + mentionSuggestions.length) % mentionSuggestions.length
        );
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        const selected = mentionSuggestions[selectedMentionIndex];
        if (selected) handleSelectMention(selected);
        return;
      }
      if (e.key === "Escape") {
        setMentionQuery(null);
        setMentionSuggestions([]);
        return;
      }
    }
  };

  // --- Comments CRUD ---
  const handleCreateComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentContent.trim() || !activeTaskId) return;
    setIsSubmittingComment(true);
    try {
      const created = await collaborationService.createComment(
        organizationId,
        projectId,
        activeTaskId,
        {
          content: newCommentContent.trim(),
          mentioned_user_ids:
            mentionedUserIds.length > 0 ? mentionedUserIds : undefined,
        }
      );
      setComments((prev) => [created, ...prev]);
      setNewCommentContent("");
      setMentionedUserIds([]);
      toast.success("Comment added");
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to post comment");
      }
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editingCommentContent.trim() || !activeTaskId) return;
    try {
      const updated = await collaborationService.updateComment(
        organizationId,
        projectId,
        activeTaskId,
        commentId,
        { content: editingCommentContent.trim() }
      );
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? updated : c))
      );
      setEditingCommentId(null);
      setEditingCommentContent("");
      toast.success("Comment updated");
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to update comment");
      }
    }
  };

  const handleDeleteComment = async () => {
    if (!commentToDelete || !activeTaskId) return;
    try {
      await collaborationService.deleteComment(
        organizationId,
        projectId,
        activeTaskId,
        commentToDelete
      );
      setComments((prev) => prev.filter((c) => c.id !== commentToDelete));
      toast.success("Comment deleted");
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to delete comment");
      }
    } finally {
      setCommentToDelete(null);
    }
  };

  // Render formatted comment text with highlighted @mentions
  const renderCommentContent = (content: string) => {
    const parts = content.split(/(@[\w\s.-]+?)(?=\s|[.,!?]|$)/g);
    return parts.map((part, index) => {
      if (part.startsWith("@")) {
        return (
          <span
            key={index}
            className="inline-flex items-center rounded bg-primary/10 px-1 py-0.5 text-xs font-semibold text-primary"
          >
            {part}
          </span>
        );
      }
      return part;
    });
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
                    {/* Checklists Section */}
                    <div className="rounded-lg border border-border bg-card p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckSquare className="h-4 w-4 text-primary" />
                          <h3 className="text-sm font-semibold text-foreground">
                            Checklist
                          </h3>
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
                                onChange={() => handleToggleChecklistItem(item)}
                                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                              />
                              <span
                                className={cn(
                                  "text-foreground",
                                  item.is_completed &&
                                    "text-muted-foreground line-through"
                                )}
                              >
                                {item.title}
                              </span>
                            </label>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100"
                              onClick={() => handleDeleteChecklistItem(item.id)}
                              title="Delete checklist item"
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>

                      {/* Add checklist input */}
                      <form
                        onSubmit={handleAddChecklistItem}
                        className="mt-3 flex items-center gap-2"
                      >
                        <Input
                          value={newChecklistTitle}
                          onChange={(e) => setNewChecklistTitle(e.target.value)}
                          placeholder="Add checklist item..."
                          className="h-8 text-xs"
                          disabled={isAddingChecklist}
                        />
                        <Button
                          type="submit"
                          size="sm"
                          className="h-8 gap-1 px-3 text-xs"
                          disabled={
                            !newChecklistTitle.trim() || isAddingChecklist
                          }
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
                          <h3 className="text-sm font-semibold text-foreground">
                            Subtasks
                          </h3>
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
                            onClick={() => handleNavigateToSubtask(st)}
                            className="group flex cursor-pointer items-center justify-between rounded-md border border-border/50 bg-background/50 p-2 transition-colors hover:border-primary/40 hover:bg-card-hover"
                          >
                            <div className="flex items-center gap-2.5">
                              <Badge
                                variant="outline"
                                className="font-mono text-[10px]"
                              >
                                {st.issue_key}
                              </Badge>
                              <span className="text-xs font-medium text-foreground group-hover:text-primary">
                                {st.title}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  st.status === "done" ? "default" : "secondary"
                                }
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
                      <form
                        onSubmit={handleAddSubtask}
                        className="mt-3 flex items-center gap-2"
                      >
                        <Input
                          value={newSubtaskTitle}
                          onChange={(e) => setNewSubtaskTitle(e.target.value)}
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

                    {/* Attachments Section */}
                    <div className="rounded-lg border border-border bg-card p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Paperclip className="h-4 w-4 text-primary" />
                          <h3 className="text-sm font-semibold text-foreground">
                            Attachments
                          </h3>
                          <span className="text-xs text-muted-foreground">
                            ({attachments.length})
                          </span>
                        </div>

                        {/* File upload trigger */}
                        <label className="cursor-pointer">
                          <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            onChange={(e) => handleFileUpload(e.target.files)}
                            disabled={isUploadingAttachment}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 gap-1 px-2.5 text-xs"
                            disabled={isUploadingAttachment}
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <UploadCloud className="h-3.5 w-3.5" />
                            <span>
                              {isUploadingAttachment
                                ? "Uploading..."
                                : "Upload File"}
                            </span>
                          </Button>
                        </label>
                      </div>

                      {/* Dropzone hint */}
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          handleFileUpload(e.dataTransfer.files);
                        }}
                        className="mb-3 flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-border py-4 text-center transition-colors hover:border-primary/50 hover:bg-muted/10"
                      >
                        <UploadCloud className="mb-1 h-5 w-5 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">
                          Click or drag and drop files (Max 10MB)
                        </p>
                      </div>

                      {/* Attachments List */}
                      {attachments.length === 0 ? (
                        <p className="py-2 text-center text-xs italic text-muted-foreground">
                          No attachments yet
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {attachments.map((att) => {
                            const isImage =
                              att.content_type.startsWith("image/");
                            const downloadUrl =
                              taskService.getAttachmentDownloadUrl(
                                organizationId,
                                projectId,
                                activeTaskId!,
                                att.id
                              );

                            return (
                              <div
                                key={att.id}
                                className="flex items-center justify-between rounded-md border border-border/60 bg-muted/20 p-2 text-xs"
                              >
                                <div className="flex items-center gap-2 overflow-hidden">
                                  {isImage ? (
                                    <FileImage className="h-5 w-5 shrink-0 text-primary" />
                                  ) : (
                                    <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
                                  )}
                                  <div className="truncate">
                                    <p className="truncate font-medium text-foreground">
                                      {att.file_name || att.filename}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">
                                      {formatBytes(att.file_size)} •{" "}
                                      {formatRelativeTime(att.created_at)}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1">
                                  <a
                                    href={downloadUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download={att.file_name || att.filename}
                                    className="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                                    title="Download"
                                  >
                                    <Download className="h-3.5 w-3.5" />
                                  </a>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                    onClick={() => setAttachmentToDelete(att)}
                                    title="Delete"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* TAB: Dependencies & Relationships */}
                  <TabsContent value="dependencies" className="space-y-6">
                    {/* Error Alert if Circular or Invalid */}
                    {dependencyError && (
                      <div className="flex items-start gap-2.5 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <div className="flex-1">
                          <p className="font-semibold">
                            Dependency Validation Failed
                          </p>
                          <p className="mt-0.5 text-destructive/90">
                            {dependencyError}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDependencyError(null)}
                          className="h-5 w-5 text-destructive hover:bg-destructive/20"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}

                    {/* Predecessors Section ("Blocked by") */}
                    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Link2 className="h-4 w-4 text-primary" />
                          <h3 className="text-sm font-semibold text-foreground">
                            Predecessor (Blocked By)
                          </h3>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {parentTask ? "1 dependency" : "0 dependencies"}
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        This task cannot start or complete until its predecessor
                        work item is resolved.
                      </p>

                      {isLoadingParent ? (
                        <Skeleton className="h-14 w-full rounded-lg" />
                      ) : parentTask ? (
                        <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 p-3">
                          <div
                            onClick={() => handleNavigateToSubtask(parentTask)}
                            className="flex cursor-pointer items-center gap-3 transition-colors hover:text-primary"
                          >
                            <Badge
                              variant="outline"
                              className="font-mono text-xs"
                            >
                              {parentTask.issue_key}
                            </Badge>
                            <div>
                              <p className="text-xs font-semibold text-foreground">
                                {parentTask.title}
                              </p>
                              <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                                <span className="capitalize">
                                  {parentTask.status}
                                </span>
                                {parentTask.priority && (
                                  <>
                                    <span>•</span>
                                    <span className="capitalize">
                                      {parentTask.priority}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isUpdatingDependency}
                            onClick={handleRemovePredecessor}
                            className="h-8 gap-1.5 text-xs text-destructive hover:bg-destructive/10"
                            title="Remove predecessor dependency"
                          >
                            <Unlink className="h-3.5 w-3.5" />
                            <span>Unlink</span>
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="rounded-md border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
                            No predecessor linked. This task is currently
                            unblocked.
                          </div>

                          <div className="flex items-center gap-2">
                            <select
                              aria-label="Select predecessor task"
                              value={selectedPredecessorId}
                              onChange={(e) =>
                                setSelectedPredecessorId(e.target.value)
                              }
                              className="h-8 flex-1 rounded-md border border-border bg-background px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                              disabled={
                                isUpdatingDependency || isLoadingProjectTasks
                              }
                            >
                              <option value="">
                                Select a predecessor task...
                              </option>
                              {projectTasksList.map((pt) => (
                                <option key={pt.id} value={pt.id}>
                                  [{pt.issue_key}] {pt.title} ({pt.status})
                                </option>
                              ))}
                            </select>

                            <Button
                              size="sm"
                              disabled={
                                !selectedPredecessorId ||
                                isUpdatingDependency ||
                                isLoadingProjectTasks
                              }
                              onClick={() =>
                                handleSetPredecessor(selectedPredecessorId)
                              }
                              className="h-8 gap-1 bg-primary px-3 text-xs text-primary-foreground"
                            >
                              <Link2 className="h-3.5 w-3.5" />
                              <span>Link</span>
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Successors Section ("Blocks") */}
                    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Network className="h-4 w-4 text-primary" />
                          <h3 className="text-sm font-semibold text-foreground">
                            Successors (Blocks)
                          </h3>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {subtasks.length}{" "}
                          {subtasks.length === 1 ? "task" : "tasks"}
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        Work items that depend on this task before they can
                        finish.
                      </p>

                      <div className="space-y-1.5">
                        {subtasks.length === 0 ? (
                          <div className="rounded-md border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
                            No successor tasks. This task does not block other
                            work items.
                          </div>
                        ) : (
                          subtasks.map((st) => (
                            <div
                              key={st.id}
                              onClick={() => handleNavigateToSubtask(st)}
                              className="group flex cursor-pointer items-center justify-between rounded-lg border border-border/60 bg-background/60 p-2.5 transition-colors hover:border-primary/50 hover:bg-card-hover"
                            >
                              <div className="flex items-center gap-2.5">
                                <Badge
                                  variant="outline"
                                  className="font-mono text-xs"
                                >
                                  {st.issue_key}
                                </Badge>
                                <div>
                                  <span className="text-xs font-medium text-foreground group-hover:text-primary">
                                    {st.title}
                                  </span>
                                  <div className="text-[10px] capitalize text-muted-foreground">
                                    {st.status} • {st.priority || "Normal"}
                                  </div>
                                </div>
                              </div>
                              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                            </div>
                          ))
                        )}
                      </div>

                      {/* Add Successor / Subtask input */}
                      <form
                        onSubmit={handleAddSubtask}
                        className="mt-3 flex items-center gap-2"
                      >
                        <Input
                          value={newSubtaskTitle}
                          onChange={(e) => setNewSubtaskTitle(e.target.value)}
                          placeholder="Add child successor task..."
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
                          <span>Add</span>
                        </Button>
                      </form>
                    </div>
                  </TabsContent>

                  {/* TAB 2: Comments & @Mentions */}
                  <TabsContent value="comments" className="space-y-4">
                    {/* New Comment Box */}
                    <form
                      onSubmit={handleCreateComment}
                      className="relative rounded-lg border border-border bg-card p-3"
                    >
                      <div className="relative">
                        <textarea
                          ref={textareaRef}
                          value={newCommentContent}
                          onChange={handleCommentChange}
                          onKeyDown={handleCommentKeyDown}
                          placeholder="Write a comment... (Type @ to mention team members)"
                          rows={3}
                          className="w-full resize-none rounded-md border border-transparent bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                        />

                        {/* Mention Suggestions Autocomplete Menu */}
                        {mentionSuggestions.length > 0 &&
                          mentionQuery !== null && (
                            <div className="absolute bottom-full left-0 z-50 mb-2 w-64 rounded-md border border-border bg-popover p-1 shadow-lg">
                              <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground">
                                Mention member
                              </div>
                              <div className="max-h-40 overflow-y-auto">
                                {mentionSuggestions.map((user, idx) => (
                                  <button
                                    key={user.id}
                                    type="button"
                                    onClick={() => handleSelectMention(user)}
                                    className={cn(
                                      "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-popover-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                                      idx === selectedMentionIndex &&
                                        "bg-accent text-accent-foreground"
                                    )}
                                  >
                                    <Avatar className="h-5 w-5">
                                      <AvatarFallback className="bg-primary/10 text-[10px] text-primary">
                                        {(user.full_name ||
                                          user.name ||
                                          "U")[0]?.toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="truncate">
                                      <p className="font-medium">
                                        {user.full_name || user.name}
                                      </p>
                                      <p className="text-[10px] text-muted-foreground">
                                        {user.email}
                                      </p>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                      </div>

                      <div className="mt-2 flex items-center justify-between border-t border-border/40 pt-2">
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <AtSign className="h-3 w-3" />
                          <span>Type @ to mention</span>
                        </div>

                        <Button
                          type="submit"
                          size="sm"
                          className="h-8 gap-1.5 px-3 text-xs"
                          disabled={
                            !newCommentContent.trim() || isSubmittingComment
                          }
                        >
                          <Send className="h-3 w-3" />
                          <span>
                            {isSubmittingComment ? "Posting..." : "Comment"}
                          </span>
                        </Button>
                      </div>
                    </form>

                    {/* Comments List */}
                    {isLoadingComments ? (
                      <div className="space-y-3 py-4">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                      </div>
                    ) : comments.length === 0 ? (
                      <p className="py-6 text-center text-xs italic text-muted-foreground">
                        No comments yet. Start the conversation!
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {comments.map((comment) => {
                          const isAuthor =
                            currentUser?.id === comment.author?.id ||
                            currentUser?.id === comment.author_id;

                          return (
                            <div
                              key={comment.id}
                              className="rounded-lg border border-border/60 bg-card p-3 text-xs"
                            >
                              <div className="mb-2 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">
                                      {(comment.author?.full_name ||
                                        comment.author?.name ||
                                        "U")[0]?.toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="font-semibold text-foreground">
                                    {comment.author?.full_name ||
                                      comment.author?.name ||
                                      "Unknown User"}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">
                                    {formatRelativeTime(comment.created_at)}
                                  </span>
                                  {comment.is_edited && (
                                    <span className="rounded bg-muted px-1 text-[9px] text-muted-foreground">
                                      (edited)
                                    </span>
                                  )}
                                </div>

                                {isAuthor && (
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                      onClick={() => {
                                        setEditingCommentId(comment.id);
                                        setEditingCommentContent(
                                          comment.content
                                        );
                                      }}
                                      title="Edit comment"
                                    >
                                      <Edit2 className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                      onClick={() =>
                                        setCommentToDelete(comment.id)
                                      }
                                      title="Delete comment"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                )}
                              </div>

                              {editingCommentId === comment.id ? (
                                <div className="mt-2 space-y-2">
                                  <textarea
                                    value={editingCommentContent}
                                    onChange={(e) =>
                                      setEditingCommentContent(e.target.value)
                                    }
                                    rows={2}
                                    className="w-full rounded border border-input bg-background p-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                  />
                                  <div className="flex justify-end gap-1.5">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 text-xs"
                                      onClick={() => {
                                        setEditingCommentId(null);
                                        setEditingCommentContent("");
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      size="sm"
                                      className="h-7 text-xs"
                                      onClick={() =>
                                        handleUpdateComment(comment.id)
                                      }
                                    >
                                      Save
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <p className="whitespace-pre-wrap leading-relaxed text-foreground">
                                  {renderCommentContent(comment.content)}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>

                  {/* TAB 3: Activity History */}
                  <TabsContent value="activity" className="space-y-3">
                    {isLoadingActivities ? (
                      <div className="space-y-3 py-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                      </div>
                    ) : activities.length === 0 ? (
                      <p className="py-6 text-center text-xs italic text-muted-foreground">
                        No activity recorded yet
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {activities.map((act) => (
                          <div
                            key={act.id}
                            className="flex items-start gap-3 rounded-md border border-border/40 p-2.5 text-xs"
                          >
                            <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <div className="flex-1 space-y-0.5">
                              <p className="text-foreground">
                                <span className="font-semibold text-primary">
                                  {act.user?.full_name ||
                                    act.user?.name ||
                                    "System"}
                                </span>{" "}
                                {(
                                  act.activity_type ||
                                  act.field ||
                                  "Updated"
                                ).replace(/_/g, " ")}
                                :{" "}
                                <span className="font-medium">
                                  {act.field_name || act.field}
                                </span>
                              </p>
                              {(act.old_value || act.new_value) && (
                                <p className="text-[11px] text-muted-foreground">
                                  {act.old_value && (
                                    <span className="line-through">
                                      {act.old_value}
                                    </span>
                                  )}
                                  {act.old_value && act.new_value && " → "}
                                  {act.new_value && (
                                    <span className="font-medium text-foreground">
                                      {act.new_value}
                                    </span>
                                  )}
                                </p>
                              )}
                              <p className="text-[10px] text-muted-foreground">
                                {formatRelativeTime(act.created_at)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
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

      {/* Confirm Comment Deletion */}
      <ConfirmDialog
        open={Boolean(commentToDelete)}
        onOpenChange={(open) => !open && setCommentToDelete(null)}
        title="Delete Comment"
        description="Are you sure you want to delete this comment?"
        confirmLabel="Delete"
        onConfirm={handleDeleteComment}
        isDestructive
      />
    </>
  );
}
