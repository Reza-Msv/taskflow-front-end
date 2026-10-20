"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Search,
  Filter,
  X,
  Bookmark,
  BookmarkPlus,
  Trash2,
  Edit2,
  ChevronDown,
  RotateCcw,
  Check,
  Calendar,
  User as UserIcon,
  FolderKanban,
  AlertCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  savedFilterService,
  type TaskFilterCriteria,
  type SavedFilter,
} from "@/services/saved-filter-service";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface FilterOption {
  value: string;
  label: string;
}

export interface AdvancedTaskFiltersProps {
  filters: TaskFilterCriteria;
  onFiltersChange: (filters: TaskFilterCriteria) => void;
  statusOptions?: FilterOption[];
  priorityOptions?: FilterOption[];
  assigneeOptions?: FilterOption[];
  projectOptions?: FilterOption[];
  syncWithUrl?: boolean;
  showProjectFilter?: boolean;
  showAssigneeFilter?: boolean;
  showSavedFilters?: boolean;
  userId?: string;
  className?: string;
}

const DEFAULT_STATUS_OPTIONS: FilterOption[] = [
  { value: "all", label: "All Statuses" },
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "in_review", label: "In Review" },
  { value: "done", label: "Done" },
];

const DEFAULT_PRIORITY_OPTIONS: FilterOption[] = [
  { value: "all", label: "All Priorities" },
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const DEFAULT_DUE_OPTIONS: FilterOption[] = [
  { value: "all", label: "Any Due Date" },
  { value: "overdue", label: "Overdue" },
  { value: "due_soon", label: "Due Soon (7 days)" },
  { value: "no_due_date", label: "No Due Date" },
];

export function AdvancedTaskFilters({
  filters,
  onFiltersChange,
  statusOptions = DEFAULT_STATUS_OPTIONS,
  priorityOptions = DEFAULT_PRIORITY_OPTIONS,
  assigneeOptions = [],
  projectOptions = [],
  syncWithUrl = false,
  showProjectFilter = false,
  showAssigneeFilter = true,
  showSavedFilters = true,
  userId,
  className,
}: AdvancedTaskFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Saved filters state
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [activeSavedFilterId, setActiveSavedFilterId] = useState<string | null>(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [newFilterName, setNewFilterName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Filter deletion confirmation
  const [filterToDelete, setFilterToDelete] = useState<SavedFilter | null>(null);

  // Filter renaming state
  const [filterToRename, setFilterToRename] = useState<SavedFilter | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // Load saved filters on mount
  const loadSavedFilters = useCallback(async () => {
    try {
      const res = await savedFilterService.getSavedFilters(userId);
      setSavedFilters(res.items || []);
    } catch {
      // Ignored: silently handle fallback
    }
  }, [userId]);

  useEffect(() => {
    if (showSavedFilters) {
      loadSavedFilters();
    }
  }, [showSavedFilters, loadSavedFilters]);

  // URL sync handler
  const updateUrlParams = useCallback(
    (newFilters: TaskFilterCriteria) => {
      if (!syncWithUrl || typeof window === "undefined") return;

      const params = new URLSearchParams(searchParams?.toString() || "");
      
      if (newFilters.search) {
        params.set("search", newFilters.search);
      } else {
        params.delete("search");
      }

      if (newFilters.status && newFilters.status !== "all") {
        params.set("status", newFilters.status);
      } else {
        params.delete("status");
      }

      if (newFilters.priority && newFilters.priority !== "all") {
        params.set("priority", newFilters.priority);
      } else {
        params.delete("priority");
      }

      if (newFilters.assignee_id && newFilters.assignee_id !== "all") {
        params.set("assignee", newFilters.assignee_id);
      } else {
        params.delete("assignee");
      }

      if (newFilters.project_id && newFilters.project_id !== "all") {
        params.set("project", newFilters.project_id);
      } else {
        params.delete("project");
      }

      if (newFilters.due_preset && newFilters.due_preset !== "all") {
        params.set("due", newFilters.due_preset);
      } else {
        params.delete("due");
      }

      const queryString = params.toString();
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
      router.replace(newUrl, { scroll: false });
    },
    [syncWithUrl, pathname, router, searchParams]
  );

  const handleUpdate = (updated: Partial<TaskFilterCriteria>) => {
    const nextFilters = { ...filters, ...updated };
    setActiveSavedFilterId(null);
    onFiltersChange(nextFilters);
    updateUrlParams(nextFilters);
  };

  const handleClearAll = () => {
    const emptyFilters: TaskFilterCriteria = {
      search: "",
      status: "all",
      priority: "all",
      assignee_id: "all",
      project_id: "all",
      due_preset: "all",
    };
    setActiveSavedFilterId(null);
    onFiltersChange(emptyFilters);
    updateUrlParams(emptyFilters);
  };

  // Saved Filter Actions
  const handleApplySavedFilter = (saved: SavedFilter) => {
    setActiveSavedFilterId(saved.id);
    onFiltersChange(saved.filters);
    updateUrlParams(saved.filters);
    toast.success(`Applied view: ${saved.name}`);
  };

  const handleSaveCurrentFilter = async () => {
    if (!newFilterName.trim()) {
      setSaveError("Please provide a name for this saved filter.");
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    try {
      const created = await savedFilterService.createSavedFilter(
        newFilterName,
        filters,
        userId
      );
      setSavedFilters((prev) => [created, ...prev.filter((f) => f.id !== created.id)]);
      setActiveSavedFilterId(created.id);
      setIsSaveModalOpen(false);
      setNewFilterName("");
      toast.success(`Filter saved as "${created.name}"`);
    } catch (err: unknown) {
      setSaveError(
        err instanceof Error ? err.message : "Failed to save filter to backend"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmRename = async () => {
    if (!filterToRename || !renameValue.trim()) return;
    try {
      const updated = await savedFilterService.updateSavedFilter(
        filterToRename.id,
        renameValue,
        filterToRename.filters,
        userId
      );
      setSavedFilters((prev) =>
        prev.map((f) => (f.id === updated.id ? updated : f))
      );
      setFilterToRename(null);
      toast.success("Filter renamed successfully");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to rename filter");
    }
  };

  const handleConfirmDelete = async () => {
    if (!filterToDelete) return;
    try {
      await savedFilterService.deleteSavedFilter(filterToDelete.id, userId);
      setSavedFilters((prev) => prev.filter((f) => f.id !== filterToDelete.id));
      if (activeSavedFilterId === filterToDelete.id) {
        setActiveSavedFilterId(null);
      }
      toast.success(`Deleted saved filter "${filterToDelete.name}"`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete filter");
    } finally {
      setFilterToDelete(null);
    }
  };

  // Active filter checks
  const hasActiveFilters = Boolean(
    (filters.search && filters.search.trim() !== "") ||
    (filters.status && filters.status !== "all") ||
    (filters.priority && filters.priority !== "all") ||
    (filters.assignee_id && filters.assignee_id !== "all") ||
    (filters.project_id && filters.project_id !== "all") ||
    (filters.due_preset && filters.due_preset !== "all")
  );

  return (
    <div className={cn("space-y-2.5", className)}>
      {/* Primary Filter Controls Bar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search Input */}
        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tasks or keys..."
            value={filters.search || ""}
            onChange={(e) => handleUpdate({ search: e.target.value })}
            className="h-8 ps-8 text-xs bg-background"
            aria-label="Filter tasks search input"
          />
          {filters.search && (
            <button
              onClick={() => handleUpdate({ search: "" })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Status Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-8 gap-1.5 text-xs font-normal",
                filters.status && filters.status !== "all" && "border-primary text-primary"
              )}
            >
              <Filter className="h-3.5 w-3.5" />
              <span>
                {statusOptions.find((o) => o.value === filters.status)?.label ||
                  "Status"}
              </span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Task Status
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {statusOptions.map((opt) => (
              <DropdownMenuItem
                key={opt.value}
                onClick={() => handleUpdate({ status: opt.value })}
                className="flex items-center justify-between text-xs"
              >
                <span>{opt.label}</span>
                {filters.status === opt.value && (
                  <Check className="h-3.5 w-3.5 text-primary" />
                )}
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
              className={cn(
                "h-8 gap-1.5 text-xs font-normal",
                filters.priority && filters.priority !== "all" && "border-primary text-primary"
              )}
            >
              <span>
                {priorityOptions.find((o) => o.value === filters.priority)?.label ||
                  "Priority"}
              </span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40">
            <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Priority
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {priorityOptions.map((opt) => (
              <DropdownMenuItem
                key={opt.value}
                onClick={() => handleUpdate({ priority: opt.value })}
                className="flex items-center justify-between text-xs"
              >
                <span>{opt.label}</span>
                {filters.priority === opt.value && (
                  <Check className="h-3.5 w-3.5 text-primary" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Assignee Dropdown (when applicable) */}
        {showAssigneeFilter && assigneeOptions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-8 gap-1.5 text-xs font-normal",
                  filters.assignee_id && filters.assignee_id !== "all" && "border-primary text-primary"
                )}
              >
                <UserIcon className="h-3.5 w-3.5" />
                <span className="truncate max-w-[100px]">
                  {assigneeOptions.find((o) => o.value === filters.assignee_id)?.label ||
                    "Assignee"}
                </span>
                <ChevronDown className="h-3 w-3 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 max-h-56 overflow-y-auto">
              <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Assignee
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleUpdate({ assignee_id: "all" })}
                className="flex items-center justify-between text-xs"
              >
                <span>All Assignees</span>
                {(!filters.assignee_id || filters.assignee_id === "all") && (
                  <Check className="h-3.5 w-3.5 text-primary" />
                )}
              </DropdownMenuItem>
              {assigneeOptions.map((opt) => (
                <DropdownMenuItem
                  key={opt.value}
                  onClick={() => handleUpdate({ assignee_id: opt.value })}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="truncate">{opt.label}</span>
                  {filters.assignee_id === opt.value && (
                    <Check className="h-3.5 w-3.5 text-primary" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Project Dropdown (when cross-project view) */}
        {showProjectFilter && projectOptions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-8 gap-1.5 text-xs font-normal",
                  filters.project_id && filters.project_id !== "all" && "border-primary text-primary"
                )}
              >
                <FolderKanban className="h-3.5 w-3.5" />
                <span className="truncate max-w-[110px]">
                  {projectOptions.find((o) => o.value === filters.project_id)?.label ||
                    "Project"}
                </span>
                <ChevronDown className="h-3 w-3 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52 max-h-56 overflow-y-auto">
              <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Project
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleUpdate({ project_id: "all" })}
                className="flex items-center justify-between text-xs"
              >
                <span>All Projects</span>
                {(!filters.project_id || filters.project_id === "all") && (
                  <Check className="h-3.5 w-3.5 text-primary" />
                )}
              </DropdownMenuItem>
              {projectOptions.map((opt) => (
                <DropdownMenuItem
                  key={opt.value}
                  onClick={() => handleUpdate({ project_id: opt.value })}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="truncate">{opt.label}</span>
                  {filters.project_id === opt.value && (
                    <Check className="h-3.5 w-3.5 text-primary" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Due Date Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-8 gap-1.5 text-xs font-normal",
                filters.due_preset && filters.due_preset !== "all" && "border-primary text-primary"
              )}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>
                {DEFAULT_DUE_OPTIONS.find((o) => o.value === filters.due_preset)?.label ||
                  "Due Date"}
              </span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Due Date Preset
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {DEFAULT_DUE_OPTIONS.map((opt) => (
              <DropdownMenuItem
                key={opt.value}
                onClick={() =>
                  handleUpdate({
                    due_preset: opt.value as TaskFilterCriteria["due_preset"],
                  })
                }
                className="flex items-center justify-between text-xs"
              >
                <span>{opt.label}</span>
                {filters.due_preset === opt.value && (
                  <Check className="h-3.5 w-3.5 text-primary" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Saved Filters Dropdown */}
        {showSavedFilters && (
          <div className="flex items-center gap-1.5 ms-auto">
            {savedFilters.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                    <Bookmark className="h-3.5 w-3.5 text-primary" />
                    <span>
                      {activeSavedFilterId
                        ? savedFilters.find((f) => f.id === activeSavedFilterId)?.name ||
                          "Saved View"
                        : "Saved Views"}
                    </span>
                    <ChevronDown className="h-3 w-3 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Your Saved Filters
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {savedFilters.map((sf) => (
                    <div
                      key={sf.id}
                      className="flex items-center justify-between px-2 py-1.5 text-xs hover:bg-secondary/60 rounded"
                    >
                      <button
                        onClick={() => handleApplySavedFilter(sf)}
                        className="flex-1 text-start truncate font-medium flex items-center gap-1.5"
                      >
                        {sf.id === activeSavedFilterId && (
                          <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                        )}
                        <span className="truncate">{sf.name}</span>
                      </button>
                      <div className="flex items-center gap-1 ms-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setFilterToRename(sf);
                            setRenameValue(sf.name);
                          }}
                          className="p-1 text-muted-foreground hover:text-foreground rounded"
                          title="Rename saved filter"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setFilterToDelete(sf);
                          }}
                          className="p-1 text-muted-foreground hover:text-destructive rounded"
                          title="Delete saved filter"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Save Current View Action */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSaveError(null);
                setNewFilterName("");
                setIsSaveModalOpen(true);
              }}
              className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              title="Save current filter settings"
            >
              <BookmarkPlus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Save View</span>
            </Button>
          </div>
        )}
      </div>

      {/* Active Filter Chips / Clear All Row */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] text-muted-foreground me-1 font-medium">
            Active:
          </span>

          {filters.search && (
            <Badge
              variant="secondary"
              className="gap-1 py-0.5 px-2 text-[11px] font-normal"
            >
              <span>Search: &ldquo;{filters.search}&rdquo;</span>
              <button
                onClick={() => handleUpdate({ search: "" })}
                className="hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.status && filters.status !== "all" && (
            <Badge
              variant="secondary"
              className="gap-1 py-0.5 px-2 text-[11px] font-normal capitalize"
            >
              <span>Status: {filters.status.replace("_", " ")}</span>
              <button
                onClick={() => handleUpdate({ status: "all" })}
                className="hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.priority && filters.priority !== "all" && (
            <Badge
              variant="secondary"
              className="gap-1 py-0.5 px-2 text-[11px] font-normal capitalize"
            >
              <span>Priority: {filters.priority}</span>
              <button
                onClick={() => handleUpdate({ priority: "all" })}
                className="hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.assignee_id && filters.assignee_id !== "all" && (
            <Badge
              variant="secondary"
              className="gap-1 py-0.5 px-2 text-[11px] font-normal"
            >
              <span>
                Assignee:{" "}
                {assigneeOptions.find((o) => o.value === filters.assignee_id)
                  ?.label || "Selected"}
              </span>
              <button
                onClick={() => handleUpdate({ assignee_id: "all" })}
                className="hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.project_id && filters.project_id !== "all" && (
            <Badge
              variant="secondary"
              className="gap-1 py-0.5 px-2 text-[11px] font-normal"
            >
              <span>
                Project:{" "}
                {projectOptions.find((o) => o.value === filters.project_id)
                  ?.label || "Selected"}
              </span>
              <button
                onClick={() => handleUpdate({ project_id: "all" })}
                className="hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.due_preset && filters.due_preset !== "all" && (
            <Badge
              variant="secondary"
              className="gap-1 py-0.5 px-2 text-[11px] font-normal capitalize"
            >
              <span>Due: {filters.due_preset.replace("_", " ")}</span>
              <button
                onClick={() => handleUpdate({ due_preset: "all" })}
                className="hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground gap-1"
          >
            <RotateCcw className="h-2.5 w-2.5" />
            <span>Clear all</span>
          </Button>
        </div>
      )}

      {/* Save Filter Modal */}
      <Dialog open={isSaveModalOpen} onOpenChange={setIsSaveModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Save Current Filter View</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs text-muted-foreground">
              Save your current filter criteria to quickly reload this view in the future.
            </p>
            {saveError && (
              <div className="flex items-center gap-2 p-2.5 text-xs text-destructive bg-destructive/10 rounded-lg">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{saveError}</span>
              </div>
            )}
            <div className="space-y-1">
              <label htmlFor="filter-name-input" className="text-xs font-medium text-foreground">
                View Name
              </label>
              <Input
                id="filter-name-input"
                placeholder="e.g. Urgent Bug Triage"
                value={newFilterName}
                onChange={(e) => setNewFilterName(e.target.value)}
                className="h-9 text-xs"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSaveModalOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveCurrentFilter}
              disabled={isSaving || !newFilterName.trim()}
            >
              {isSaving ? "Saving..." : "Save View"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Filter Modal */}
      <Dialog
        open={Boolean(filterToRename)}
        onOpenChange={(open) => !open && setFilterToRename(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rename Saved View</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <label htmlFor="rename-filter-input" className="text-xs font-medium text-foreground">
                View Name
              </label>
              <Input
                id="rename-filter-input"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className="h-9 text-xs"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilterToRename(null)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmRename}
              disabled={!renameValue.trim()}
            >
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Filter Confirmation */}
      <ConfirmDialog
        open={Boolean(filterToDelete)}
        onOpenChange={(open) => !open && setFilterToDelete(null)}
        title="Delete Saved Filter View"
        description={`Are you sure you want to delete the saved filter "${filterToDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete View"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
