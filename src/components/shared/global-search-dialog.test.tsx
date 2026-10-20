import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GlobalSearchDialog } from "./global-search-dialog";
import { searchService } from "@/services/search-service";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => "/en/dashboard",
}));

vi.mock("@/services/search-service");

describe("GlobalSearchDialog", () => {
  const onClose = vi.fn();
  const onSelectTask = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders search prompt when opened and input is focused", () => {
    render(
      <GlobalSearchDialog
        isOpen={true}
        onClose={onClose}
        organizationId="org-1"
      />
    );

    expect(
      screen.getByPlaceholderText(/search projects, tasks, or issue keys/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/type a project title, task name, or issue key/i)
    ).toBeInTheDocument();
  });

  it("performs search and displays grouped results for projects and tasks", async () => {
    const user = userEvent.setup();

    vi.mocked(searchService.globalSearch).mockResolvedValue({
      projects: [
        {
          id: "proj-1",
          name: "Website Redesign",
          key: "WEB",
          organizationId: "org-1",
          isPrivate: false,
        },
      ],
      tasks: [
        {
          id: "task-1",
          title: "Setup Analytics",
          issueKey: "WEB-12",
          status: "in_progress",
          priority: "high",
          projectId: "proj-1",
          organizationId: "org-1",
          dueDate: "2026-11-15T00:00:00Z",
        },
      ],
    });

    render(
      <GlobalSearchDialog
        isOpen={true}
        onClose={onClose}
        organizationId="org-1"
        onSelectTask={onSelectTask}
      />
    );

    const input = screen.getByPlaceholderText(
      /search projects, tasks, or issue keys/i
    );
    await user.type(input, "Analytics");

    await waitFor(() => {
      expect(searchService.globalSearch).toHaveBeenCalledWith(
        "Analytics",
        expect.objectContaining({ organizationId: "org-1" })
      );
    });

    expect(await screen.findByText("Website Redesign")).toBeInTheDocument();
    expect(screen.getByText("Setup Analytics")).toBeInTheDocument();
    expect(screen.getByText("WEB-12")).toBeInTheDocument();
  });

  it("calls onSelectTask when a task result is clicked", async () => {
    const user = userEvent.setup();

    vi.mocked(searchService.globalSearch).mockResolvedValue({
      projects: [],
      tasks: [
        {
          id: "task-99",
          title: "Database Migration",
          issueKey: "DB-99",
          status: "todo",
          priority: "urgent",
          projectId: "proj-db",
          organizationId: "org-1",
        },
      ],
    });

    render(
      <GlobalSearchDialog
        isOpen={true}
        onClose={onClose}
        organizationId="org-1"
        onSelectTask={onSelectTask}
      />
    );

    const input = screen.getByPlaceholderText(
      /search projects, tasks, or issue keys/i
    );
    await user.type(input, "Migration");

    const taskRow = await screen.findByText("Database Migration");
    await user.click(taskRow);

    expect(onSelectTask).toHaveBeenCalledWith(
      expect.objectContaining({ id: "task-99", title: "Database Migration" })
    );
    expect(onClose).toHaveBeenCalled();
  });

  it("handles keyboard navigation using ArrowDown, ArrowUp, and Enter", async () => {
    const user = userEvent.setup();

    vi.mocked(searchService.globalSearch).mockResolvedValue({
      projects: [
        {
          id: "proj-1",
          name: "Project Alpha",
          key: "PA",
          organizationId: "org-1",
        },
        {
          id: "proj-2",
          name: "Project Beta",
          key: "PB",
          organizationId: "org-1",
        },
      ],
      tasks: [],
    });

    render(
      <GlobalSearchDialog
        isOpen={true}
        onClose={onClose}
        organizationId="org-1"
      />
    );

    const input = screen.getByPlaceholderText(
      /search projects, tasks, or issue keys/i
    );
    await user.type(input, "Alpha");

    await screen.findByText("Project Alpha");

    // Navigate to second item and press Enter
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(mockPush).toHaveBeenCalledWith(
      "/en/organizations/org-1/projects/proj-2/board"
    );
    expect(onClose).toHaveBeenCalled();
  });

  it("displays no results message when query returns no items", async () => {
    const user = userEvent.setup();

    vi.mocked(searchService.globalSearch).mockResolvedValue({
      projects: [],
      tasks: [],
    });

    render(
      <GlobalSearchDialog
        isOpen={true}
        onClose={onClose}
        organizationId="org-1"
      />
    );

    const input = screen.getByPlaceholderText(
      /search projects, tasks, or issue keys/i
    );
    await user.type(input, "NonExistentThing");

    expect(
      await screen.findByText(/no results found for/i)
    ).toBeInTheDocument();
  });

  it("displays error message when searchService rejects", async () => {
    const user = userEvent.setup();

    vi.mocked(searchService.globalSearch).mockRejectedValue(
      new Error("Search server connection timed out")
    );

    render(
      <GlobalSearchDialog
        isOpen={true}
        onClose={onClose}
        organizationId="org-1"
      />
    );

    const input = screen.getByPlaceholderText(
      /search projects, tasks, or issue keys/i
    );
    await user.type(input, "Crash");

    expect(
      await screen.findByText(/search server connection timed out/i)
    ).toBeInTheDocument();
  });
});
