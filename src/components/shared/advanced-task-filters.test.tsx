import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AdvancedTaskFilters } from "./advanced-task-filters";
import { savedFilterService } from "@/services/saved-filter-service";

const mockReplace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
  usePathname: () => "/en/projects/default/board",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/services/saved-filter-service");

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("AdvancedTaskFilters", () => {
  const onFiltersChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(savedFilterService.getSavedFilters).mockResolvedValue({
      items: [],
      total: 0,
    });
  });

  it("renders search input, status, priority, and due date filter controls", () => {
    render(
      <AdvancedTaskFilters
        filters={{ status: "all", priority: "all" }}
        onFiltersChange={onFiltersChange}
      />
    );

    expect(
      screen.getByPlaceholderText(/search tasks or keys/i)
    ).toBeInTheDocument();
    expect(screen.getByText("All Statuses")).toBeInTheDocument();
    expect(screen.getByText("All Priorities")).toBeInTheDocument();
    expect(screen.getByText("Due Date")).toBeInTheDocument();
  });

  it("triggers onFiltersChange when search query is typed", async () => {
    const user = userEvent.setup();

    render(
      <AdvancedTaskFilters
        filters={{ search: "", status: "all" }}
        onFiltersChange={onFiltersChange}
      />
    );

    const input = screen.getByPlaceholderText(/search tasks or keys/i);
    await user.type(input, "Bug");

    expect(onFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({ search: "B" })
    );
  });

  it("displays active filter chips and handles clearing a specific filter", async () => {
    const user = userEvent.setup();

    render(
      <AdvancedTaskFilters
        filters={{
          search: "Login",
          status: "in_progress",
          priority: "urgent",
        }}
        onFiltersChange={onFiltersChange}
      />
    );

    expect(screen.getByText(/Search: “Login”/i)).toBeInTheDocument();
    expect(screen.getByText(/Status: in progress/i)).toBeInTheDocument();
    expect(screen.getByText(/Priority: urgent/i)).toBeInTheDocument();

    // Click remove on search chip
    const clearSearchBtn = screen.getByRole("button", { name: /Clear search/i });
    await user.click(clearSearchBtn);

    expect(onFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({ search: "" })
    );
  });

  it("clears all active filters when Clear all button is clicked", async () => {
    const user = userEvent.setup();

    render(
      <AdvancedTaskFilters
        filters={{
          search: "Payment",
          status: "todo",
          priority: "high",
        }}
        onFiltersChange={onFiltersChange}
      />
    );

    const clearAllBtn = screen.getByRole("button", { name: /clear all/i });
    await user.click(clearAllBtn);

    expect(onFiltersChange).toHaveBeenCalledWith({
      search: "",
      status: "all",
      priority: "all",
      assignee_id: "all",
      project_id: "all",
      due_preset: "all",
    });
  });

  it("opens save filter modal and creates saved filter", async () => {
    const user = userEvent.setup();

    vi.mocked(savedFilterService.createSavedFilter).mockResolvedValue({
      id: "sf-1",
      name: "Triage View",
      filters: { status: "todo", priority: "urgent" },
      created_at: "",
      updated_at: "",
    });

    render(
      <AdvancedTaskFilters
        filters={{ status: "todo", priority: "urgent" }}
        onFiltersChange={onFiltersChange}
        showSavedFilters={true}
        userId="user-1"
      />
    );

    const saveViewBtn = screen.getByRole("button", { name: /save view/i });
    await user.click(saveViewBtn);

    const nameInput = screen.getByPlaceholderText(/e\.g\. urgent bug triage/i);
    await user.type(nameInput, "Triage View");

    const confirmSaveBtn = screen.getByRole("button", { name: /^save view$/i });
    await user.click(confirmSaveBtn);

    await waitFor(() => {
      expect(savedFilterService.createSavedFilter).toHaveBeenCalledWith(
        "Triage View",
        { status: "todo", priority: "urgent" },
        "user-1"
      );
    });
  });
});
