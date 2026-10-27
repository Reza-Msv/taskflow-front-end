"use client";

import React, { useState, useRef } from "react";
import { AtSign, Send, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { collaborationService } from "@/services/collaboration-service";
import { ApiClientError } from "@/services/api-client";
import { formatTimeAgo } from "@/lib/date-utils";
import type {
  WorkItemCommentResponse,
  MentionableUserResponse,
} from "@/services/generated/api-types";

export interface TaskCommentsTabProps {
  organizationId: string;
  projectId: string;
  taskId: string;
  currentUserId?: string | null;
  comments: WorkItemCommentResponse[];
  setComments: React.Dispatch<React.SetStateAction<WorkItemCommentResponse[]>>;
  isLoadingComments: boolean;
  formatRelativeTime?: (dateStr?: string | null) => string;
}

export function TaskCommentsTab({
  organizationId,
  projectId,
  taskId,
  currentUserId,
  comments,
  setComments,
  isLoadingComments,
  formatRelativeTime = formatTimeAgo,
}: TaskCommentsTabProps) {
  const [newCommentContent, setNewCommentContent] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState("");
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);

  // Mention autocomplete state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionSuggestions, setMentionSuggestions] = useState<
    MentionableUserResponse[]
  >([]);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleCommentChange = async (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const val = e.target.value;
    setNewCommentContent(val);

    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (
      lastAtIndex !== -1 &&
      (lastAtIndex === 0 || /\s/.test(textBeforeCursor[lastAtIndex - 1]))
    ) {
      const query = textBeforeCursor.slice(lastAtIndex + 1);
      if (!/\s/.test(query)) {
        setMentionQuery(query);
        try {
          const suggestions = await collaborationService.getMentionableMembers(
            organizationId,
            projectId,
            taskId,
            query
          );
          setMentionSuggestions(suggestions);
          setSelectedMentionIndex(0);
        } catch {
          setMentionSuggestions([]);
        }
      } else {
        setMentionQuery(null);
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

  const handleCreateComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentContent.trim() || !taskId) return;
    setIsSubmittingComment(true);
    try {
      const created = await collaborationService.createComment(
        organizationId,
        projectId,
        taskId,
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
    if (!editingCommentContent.trim() || !taskId) return;
    try {
      const updated = await collaborationService.updateComment(
        organizationId,
        projectId,
        taskId,
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
    if (!commentToDelete || !taskId) return;
    try {
      await collaborationService.deleteComment(
        organizationId,
        projectId,
        taskId,
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

  return (
    <div className="space-y-4">
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
          {mentionSuggestions.length > 0 && mentionQuery !== null && (
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
                        {(user.full_name || user.name || "U")[0]?.toUpperCase()}
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
            disabled={!newCommentContent.trim() || isSubmittingComment}
          >
            <Send className="h-3 w-3" />
            <span>{isSubmittingComment ? "Posting..." : "Comment"}</span>
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
              Boolean(currentUserId) &&
              (currentUserId === comment.author?.id ||
                currentUserId === comment.author_id);

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
                          setEditingCommentContent(comment.content);
                        }}
                        title="Edit comment"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => setCommentToDelete(comment.id)}
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
                      onChange={(e) => setEditingCommentContent(e.target.value)}
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
                        onClick={() => handleUpdateComment(comment.id)}
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

      {/* Delete Comment Confirm Dialog */}
      <ConfirmDialog
        open={Boolean(commentToDelete)}
        onOpenChange={(open) => !open && setCommentToDelete(null)}
        title="Delete comment?"
        description="Are you sure you want to delete this comment? This action cannot be undone."
        confirmLabel="Delete comment"
        isDestructive
        onConfirm={handleDeleteComment}
      />
    </div>
  );
}
