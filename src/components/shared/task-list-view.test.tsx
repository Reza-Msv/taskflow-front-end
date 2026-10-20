import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { TaskListView } from "./task-list-view";
import type { WorkItemResponse } from "@/services/generated/api-types";

describe("TaskListView", () => {
  const onTaskClick = vi.fn();
  const onSortChange = vi.fn();
  const onPageChange = vi.fn();

  const mockTasks: WorkItemResponse[] = [
    {
      id: "task-1",
      project_id: "proj-1",
      organization_id: "org-1",
      sequence_number: 1,
      issue_key: "PROJ-1",
      type: "task",
      title: "Implement SSO login flow",
      status: "in_progress",
      priority: "urgent",
      rank: "0|hzzzzz:",
      assignee_id: "user-1",
      due_date: "2026-11-20T10:00:00Z",
      version: 1,
      created_at: "2026-10-18T10:00:00Z",
      updated_at: "2026-10-19T10:00:00Z",
    },
    {
      id: "task-2",
      project_id: "proj-1",
      organization_id: "org-1",
      sequence_number: 2,
      issue_key: "PROJ-2",
      type: "bug",
      title: "Fix responsive table overflow",
      status: "todo",
      priority: "medium",
      rank: "0|hzzzzz:",
      assignee_id: null,
      due_date: "2026-10-01T10:00:00Z", // Past due (overdue)
      version: 1,
      created_at: "2026-10-18T10:00:00Z",
      updated_at: "2026-10-19T10:00:00Z",
    },
  ];

  const assigneeMap = {
    "user-1": "Sarah Connor",
  };

  it("renders table with task keys, titles, status, priority, and assignees", () => {
    render(
      <TaskListView
        tasks={mockTasks}
        onTaskClick={onTaskClick}
        assigneeMap={assigneeMap}
      />
    );

    expect(screen.getByText("PROJ-1")).toBeInTheDocument();
    expect(screen.getByText("Implement SSO login flow")).toBeInTheDocument();
    expect(screen.getByText("urgent")).toBeInTheDocument();
    expect(screen.getByText("Sarah Connor")).toBeInTheDocument();

    expect(screen.getByText("PROJ-2")).toBeInTheDocument();
    expect(screen.getByText("Fix responsive table overflow")).toBeInTheDocument();
    expect(screen.getByText("Unassigned")).toBeInTheDocument();
  });

  it("renders overdue badge for tasks with due date in the past", () => {
    render(
      <TaskListView
        tasks={mockTasks}
        onTaskClick={onTaskClick}
        assigneeMap={assigneeMap}
      />
    );

    expect(screen.getByText(/overdue/i)).toBeInTheDocument();
  });

  it("triggers onTaskClick when a row is clicked or activated with Enter", async () => {
    const user = userEvent.setup();

    render(
      <TaskListView
        tasks={mockTasks}
        onTaskClick={onTaskClick}
        assigneeMap={assigneeMap}
      />
    );

    const row = screen.getByText("Implement SSO login flow");
    await user.click(row);

    expect(onTaskClick).toHaveBeenCalledWith("task-1");

    // Keyboard activation
    const row2 = screen.getByText("Fix responsive table overflow").closest("tr");
    if (row2) {
      fireEvent.keyDown(row2, { key: "Enter" });
      expect(onTaskClick).toHaveBeenCalledWith("task-2");
    }
  });

  it("triggers onSortChange when column headers are clicked", async () => {
    const user = userEvent.setup();

    render(
      <TaskListView
        tasks={mockTasks}
        onTaskClick={onTaskClick}
        onSortChange={onSortChange}
        sortField="title"
        sortDirection="asc"
      />
    );

    const titleHeader = screen.getByText("Title");
    await user.click(titleHeader);

    expect(onSortChange).toHaveBeenCalledWith("title");
  });

  it("renders pagination controls and triggers onPageChange", async () => {
    const user = userEvent.setup();

    render(
      <TaskListView
        tasks={mockTasks}
        onTaskClick={onTaskClick}
        currentPage={1}
        totalPages={3}
        totalItems={50}
        pageSize={25}
        onPageChange={onPageChange}
      />
    );

    expect(screen.getByText("1 / 3")).toBeInTheDocument();
    const nextBtn = screen.getByRole("button", { name: /next/i });
    await user.click(nextBtn);

    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("renders empty state when tasks array is empty", () => {
    render(
      <TaskListView
        tasks={[]}
        onTaskClick={onTaskClick}
      />
    );

    expect(screen.getByText(/no tasks found/i)).toBeInTheDocument();
  });

  it("renders loading skeleton state", () => {
    const { container } = render(
      <TaskListView
        tasks={[]}
        isLoading={true}
        onTaskClick={onTaskClick}
      />
    );

    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });
});
