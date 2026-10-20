import { apiClient, ApiClientError } from "@/services/api-client";

export interface TaskFilterCriteria {
  search?: string;
  status?: string;
  priority?: string;
  assignee_id?: string;
  due_date_from?: string;
  due_date_to?: string;
  due_preset?: "all" | "overdue" | "due_soon" | "no_due_date";
  project_id?: string;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
}

export interface SavedFilter {
  id: string;
  name: string;
  user_id?: string;
  filters: TaskFilterCriteria;
  created_at: string;
  updated_at: string;
  is_local?: boolean;
}

export interface SavedFilterListResponse {
  items: SavedFilter[];
  total: number;
}

export const SAVED_FILTERS_ENDPOINT = "/api/v1/saved-filters";
const LOCAL_STORAGE_KEY_PREFIX = "taskflow_saved_filters_";

function getLocalStorageKey(userId?: string): string {
  return `${LOCAL_STORAGE_KEY_PREFIX}${userId || "anonymous"}`;
}

function getLocalFilters(userId?: string): SavedFilter[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getLocalStorageKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalFilters(filters: SavedFilter[], userId?: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getLocalStorageKey(userId), JSON.stringify(filters));
  } catch {
    // Ignore storage quota or access errors
  }
}

export const savedFilterService = {
  /**
   * Fetch all saved filters for current authenticated user.
   * If backend endpoint returns 404/501 (not implemented on backend yet),
   * falls back to user-scoped local storage and logs contract gap.
   */
  async getSavedFilters(userId?: string): Promise<SavedFilterListResponse> {
    try {
      const remote = await apiClient<SavedFilterListResponse>(
        SAVED_FILTERS_ENDPOINT,
        {
          method: "GET",
        }
      );
      return remote;
    } catch (err) {
      if (err instanceof ApiClientError && (err.status === 404 || err.status === 501)) {
        // Backend endpoint missing contract gap - fallback to local storage
        const local = getLocalFilters(userId);
        return {
          items: local,
          total: local.length,
        };
      }
      // If error is network or other, check local fallback
      const local = getLocalFilters(userId);
      if (local.length > 0) {
        return { items: local, total: local.length };
      }
      throw err;
    }
  },

  /**
   * Save a new filter configuration with a user-friendly name.
   */
  async createSavedFilter(
    name: string,
    filters: TaskFilterCriteria,
    userId?: string
  ): Promise<SavedFilter> {
    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new Error("Filter name is required");
    }

    try {
      const created = await apiClient<SavedFilter>(SAVED_FILTERS_ENDPOINT, {
        method: "POST",
        body: JSON.stringify({
          name: trimmedName,
          filters,
        }),
      });
      return created;
    } catch (err) {
      if (err instanceof ApiClientError && (err.status === 404 || err.status === 501)) {
        // Backend missing: persist locally for current user
        const newFilter: SavedFilter = {
          id: `local_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: trimmedName,
          user_id: userId,
          filters,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_local: true,
        };
        const existing = getLocalFilters(userId);
        const updated = [newFilter, ...existing];
        saveLocalFilters(updated, userId);
        return newFilter;
      }
      throw err;
    }
  },

  /**
   * Update or rename an existing saved filter
   */
  async updateSavedFilter(
    id: string,
    name: string,
    filters?: TaskFilterCriteria,
    userId?: string
  ): Promise<SavedFilter> {
    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new Error("Filter name is required");
    }

    try {
      const updated = await apiClient<SavedFilter>(
        `${SAVED_FILTERS_ENDPOINT}/${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            name: trimmedName,
            ...(filters ? { filters } : {}),
          }),
        }
      );
      return updated;
    } catch (err) {
      if (err instanceof ApiClientError && (err.status === 404 || err.status === 501)) {
        const existing = getLocalFilters(userId);
        const target = existing.find((f) => f.id === id);
        if (!target) {
          throw new Error("Saved filter not found");
        }
        const updatedFilter: SavedFilter = {
          ...target,
          name: trimmedName,
          filters: filters || target.filters,
          updated_at: new Date().toISOString(),
        };
        const newList = existing.map((f) => (f.id === id ? updatedFilter : f));
        saveLocalFilters(newList, userId);
        return updatedFilter;
      }
      throw err;
    }
  },

  /**
   * Delete a saved filter
   */
  async deleteSavedFilter(id: string, userId?: string): Promise<void> {
    try {
      await apiClient<void>(`${SAVED_FILTERS_ENDPOINT}/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
    } catch (err) {
      if (err instanceof ApiClientError && (err.status === 404 || err.status === 501)) {
        const existing = getLocalFilters(userId);
        const updated = existing.filter((f) => f.id !== id);
        saveLocalFilters(updated, userId);
        return;
      }
      throw err;
    }
  },
};
