import { describe, it, expect, vi, beforeEach } from "vitest";
import { savedFilterService } from "./saved-filter-service";
import { apiClient, ApiClientError } from "@/services/api-client";

vi.mock("@/services/api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/api-client")>();
  return {
    ...actual,
    apiClient: vi.fn(),
  };
});

describe("savedFilterService", () => {
  const userId = "user-123";

  beforeEach(() => {
    vi.clearAllMocks();
    if (typeof window !== "undefined") {
      window.localStorage.clear();
    }
  });

  it("creates and retrieves a saved filter via remote API when supported", async () => {
    const mockFilter = {
      id: "filter-1",
      name: "High Priority Bugs",
      filters: { priority: "high", status: "todo" },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    vi.mocked(apiClient).mockResolvedValueOnce(mockFilter);

    const created = await savedFilterService.createSavedFilter(
      "High Priority Bugs",
      { priority: "high", status: "todo" },
      userId
    );

    expect(created.name).toBe("High Priority Bugs");
    expect(apiClient).toHaveBeenCalledWith(
      "/api/v1/saved-filters",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("gracefully falls back to local user-scoped storage when backend returns 404", async () => {
    const notFoundError = new ApiClientError(404, {
      error: { code: "NOT_FOUND", message: "Not Found", request_id: "req_1" },
    });
    vi.mocked(apiClient).mockRejectedValueOnce(notFoundError);

    const created = await savedFilterService.createSavedFilter(
      "My Custom View",
      { status: "in_progress" },
      userId
    );

    expect(created.name).toBe("My Custom View");
    expect(created.is_local).toBe(true);
    expect(created.filters.status).toBe("in_progress");

    // Fetching filters when backend is 404 returns the local list
    vi.mocked(apiClient).mockRejectedValueOnce(notFoundError);

    const list = await savedFilterService.getSavedFilters(userId);
    expect(list.items).toHaveLength(1);
    expect(list.items[0].name).toBe("My Custom View");
  });

  it("updates and renames a saved filter", async () => {
    const notFoundError = new ApiClientError(404, {
      error: { code: "NOT_FOUND", message: "Not Found", request_id: "req_1" },
    });
    vi.mocked(apiClient).mockRejectedValueOnce(notFoundError);

    const created = await savedFilterService.createSavedFilter(
      "Initial Name",
      { priority: "urgent" },
      userId
    );

    vi.mocked(apiClient).mockRejectedValueOnce(notFoundError);

    const updated = await savedFilterService.updateSavedFilter(
      created.id,
      "Renamed View",
      undefined,
      userId
    );

    expect(updated.name).toBe("Renamed View");
    expect(updated.filters.priority).toBe("urgent");
  });

  it("deletes a saved filter", async () => {
    const notFoundError = new ApiClientError(404, {
      error: { code: "NOT_FOUND", message: "Not Found", request_id: "req_1" },
    });
    vi.mocked(apiClient).mockRejectedValueOnce(notFoundError);

    const created = await savedFilterService.createSavedFilter(
      "To Be Deleted",
      {},
      userId
    );

    vi.mocked(apiClient).mockRejectedValueOnce(notFoundError);

    await savedFilterService.deleteSavedFilter(created.id, userId);

    vi.mocked(apiClient).mockRejectedValueOnce(notFoundError);

    const list = await savedFilterService.getSavedFilters(userId);
    expect(list.items.find((f) => f.id === created.id)).toBeUndefined();
  });

  it("throws an error when attempting to create a filter with empty name", async () => {
    await expect(
      savedFilterService.createSavedFilter("   ", {}, userId)
    ).rejects.toThrow("Filter name is required");
  });
});
