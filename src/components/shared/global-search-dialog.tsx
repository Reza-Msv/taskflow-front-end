"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Search,
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  X,
  CornerDownLeft,
  Calendar,
  Lock,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  searchService,
  type ProjectSearchResult,
  type TaskSearchResult,
} from "@/services/search-service";
import { cn } from "@/lib/utils";

export interface GlobalSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId?: string;
  projectId?: string;
  onSelectTask?: (task: TaskSearchResult) => void;
}

type SearchItem =
  | { type: "project"; data: ProjectSearchResult }
  | { type: "task"; data: TaskSearchResult };

export function GlobalSearchDialog({
  isOpen,
  onClose,
  organizationId,
  projectId,
  onSelectTask,
}: GlobalSearchDialogProps) {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = pathname?.split("/")[1] || "en";

  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<ProjectSearchResult[]>([]);
  const [tasks, setTasks] = useState<TaskSearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const requestIdRef = useRef(0);

  // Flat list of selectable items for keyboard navigation
  const flatItems: SearchItem[] = [
    ...projects.map((p) => ({ type: "project" as const, data: p })),
    ...tasks.map((t) => ({ type: "task" as const, data: t })),
  ];

  // Debounced search logic
  const performSearch = useCallback(
    async (q: string) => {
      const trimmed = q.trim();
      if (!trimmed) {
        setIsLoading(false);
        setProjects([]);
        setTasks([]);
        setError(null);
        setSelectedIndex(0);
        return;
      }

      const curReqId = ++requestIdRef.current;
      setIsLoading(true);
      setError(null);

      try {
        const results = await searchService.globalSearch(trimmed, {
          organizationId,
          projectId,
          limit: 8,
        });

        // Ignore stale requests
        if (curReqId === requestIdRef.current) {
          setProjects(results.projects);
          setTasks(results.tasks);
          setSelectedIndex(0);
        }
      } catch (err: unknown) {
        if (curReqId === requestIdRef.current) {
          setError(
            err instanceof Error ? err.message : "Failed to fetch search results"
          );
        }
      } finally {
        if (curReqId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    },
    [organizationId, projectId]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 280);

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  // Focus input when dialog opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setQuery("");
      setProjects([]);
      setTasks([]);
      setError(null);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const handleSelect = (item: SearchItem) => {
    onClose();
    if (item.type === "project") {
      const p = item.data;
      const targetOrg = p.organizationId || organizationId || "default";
      router.push(`/${currentLocale}/organizations/${targetOrg}/projects/${p.id}/board`);
    } else {
      const t = item.data;
      if (onSelectTask) {
        onSelectTask(t);
      } else {
        const targetOrg = t.organizationId || organizationId || "default";
        router.push(
          `/${currentLocale}/organizations/${targetOrg}/projects/${t.projectId}/board?task=${t.id}`
        );
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (flatItems.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % flatItems.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + flatItems.length) % flatItems.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (flatItems[selectedIndex]) {
        handleSelect(flatItems[selectedIndex]);
      }
    }
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "urgent":
        return "border-destructive/30 bg-destructive/10 text-destructive";
      case "high":
        return "border-orange-500/30 bg-orange-500/10 text-orange-500";
      case "medium":
        return "border-primary/30 bg-primary/10 text-primary";
      default:
        return "border-muted-foreground/30 bg-muted text-muted-foreground";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden rounded-2xl border-border bg-card shadow-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Global Search</DialogTitle>
        </DialogHeader>

        {/* Search Input Bar */}
        <div className="flex items-center border-b border-border px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground me-3" />
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search projects, tasks, or issue keys..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            aria-label="Global search input"
          />
          {isLoading && (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary me-2" />
          )}
          {query && (
            <button
              onClick={() => {
                setQuery("");
                searchInputRef.current?.focus();
              }}
              className="p-1 text-muted-foreground hover:text-foreground rounded"
              aria-label="Clear search query"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Results / Empty / Error States */}
        <div className="max-h-[380px] overflow-y-auto p-2">
          {error && (
            <div className="flex items-center gap-2 p-4 text-xs text-destructive bg-destructive/10 rounded-lg m-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!query.trim() && (
            <div className="py-12 text-center text-xs text-muted-foreground">
              <p>Type a project title, task name, or issue key (e.g. &apos;PROJ-1&apos;) to search</p>
              <div className="mt-3 flex justify-center gap-2">
                <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
                  ↑ ↓ Navigate
                </span>
                <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
                  ↵ Select
                </span>
                <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
                  ESC Close
                </span>
              </div>
            </div>
          )}

          {query.trim() && !isLoading && flatItems.length === 0 && !error && (
            <div className="py-12 text-center text-xs text-muted-foreground">
              <p>No results found for &ldquo;<span className="font-semibold text-foreground">{query}</span>&rdquo;</p>
              <p className="mt-1 text-[11px]">Check your spelling or try different keywords</p>
            </div>
          )}

          {/* Group 1: Projects */}
          {projects.length > 0 && (
            <div className="mb-3">
              <div className="px-2 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Projects
              </div>
              <div className="space-y-1">
                {projects.map((p) => {
                  const itemIndex = flatItems.findIndex(
                    (it) => it.type === "project" && it.data.id === p.id
                  );
                  const isSelected = itemIndex === selectedIndex;
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleSelect({ type: "project", data: p })}
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                      className={cn(
                        "flex items-center justify-between rounded-lg px-3 py-2 text-xs cursor-pointer transition-colors",
                        isSelected
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-secondary/60"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FolderKanban className="h-4 w-4 shrink-0 text-primary" />
                        <span className="font-medium truncate">{p.name}</span>
                        <Badge variant="outline" className="text-[10px] uppercase font-mono py-0">
                          {p.key}
                        </Badge>
                        {p.isPrivate && (
                          <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
                        )}
                      </div>
                      {isSelected && (
                        <CornerDownLeft className="h-3 w-3 text-primary shrink-0 opacity-70" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Group 2: Tasks */}
          {tasks.length > 0 && (
            <div>
              <div className="px-2 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Tasks
              </div>
              <div className="space-y-1">
                {tasks.map((t) => {
                  const itemIndex = flatItems.findIndex(
                    (it) => it.type === "task" && it.data.id === t.id
                  );
                  const isSelected = itemIndex === selectedIndex;
                  return (
                    <div
                      key={t.id}
                      onClick={() => handleSelect({ type: "task", data: t })}
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                      className={cn(
                        "flex items-center justify-between rounded-lg px-3 py-2 text-xs cursor-pointer transition-colors",
                        isSelected
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-secondary/60"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="font-mono text-[11px] font-semibold text-primary shrink-0">
                          {t.issueKey}
                        </span>
                        <span className="font-medium truncate">{t.title}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ms-2">
                        {t.dueDate && (
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(t.dueDate).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        )}
                        <Badge
                          variant="outline"
                          className={cn("text-[10px] capitalize py-0", getPriorityBadgeClass(t.priority))}
                        >
                          {t.priority}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px] capitalize py-0">
                          {t.status.replace("_", " ")}
                        </Badge>
                        {isSelected && (
                          <CornerDownLeft className="h-3 w-3 text-primary shrink-0 opacity-70" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer shortcuts info */}
        <div className="flex items-center justify-between border-t border-border bg-muted/40 px-3 py-2 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>Navigation: <kbd className="rounded bg-background px-1 py-0.5 border">↑</kbd> <kbd className="rounded bg-background px-1 py-0.5 border">↓</kbd></span>
            <span>Select: <kbd className="rounded bg-background px-1 py-0.5 border">↵</kbd></span>
          </div>
          <span>TaskFlow Unified Search</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
