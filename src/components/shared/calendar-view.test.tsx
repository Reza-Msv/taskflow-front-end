import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { CalendarView } from "./calendar-view";
import type { WorkItemResponse } from "@/services/generated/api-types";

const mockTasks: WorkItemResponse[] = [
  {
    id: "task-1",
    project_id: "p-1",
    organization_id: "o-1",
    sequence_number: 1,
    issue_key: "TF-1",
    title: "Setup Calendar Component",
    status: "in_progress",
    priority: "urgent",
    type: "task",
    due_date: new Date().toISOString(),
    created_at: new Date().toISOString(),
    rank: "0|1000:",
    version: 1,
    updated_at: new Date().toISOString(),
  },
  {
    id: "task-2",
    project_id: "p-1",
    organization_id: "o-1",
    sequence_number: 2,
    issue_key: "TF-2",
    title: "Phase 8 Milestone Signoff",
    status: "todo",
    priority: "high",
    type: "milestone",
    due_date: new Date().toISOString(),
    created_at: new Date().toISOString(),
    rank: "0|2000:",
    version: 1,
    updated_at: new Date().toISOString(),
  },
  {
    id: "task-3",
    project_id: "p-1",
    organization_id: "o-1",
    sequence_number: 3,
    issue_key: "TF-3",
    title: "Unscheduled Backlog Item",
    status: "todo",
    priority: "medium",
    type: "story",
    due_date: null,
    created_at: new Date().toISOString(),
    rank: "0|3000:",
    version: 1,
    updated_at: new Date().toISOString(),
  },
];

describe("CalendarView Component", () => {
  it("renders month view with weekday headers and scheduled tasks", () => {
    const handleTaskClick = vi.fn();
    render(
      <CalendarView
        tasks={mockTasks}
        onTaskClick={handleTaskClick}
        assigneeMap={{}}
      />
    );

    expect(screen.getByTestId("calendar-view")).toBeInTheDocument();
    expect(screen.getByText("Sun")).toBeInTheDocument();
    expect(screen.getByText("Mon")).toBeInTheDocument();
    expect(screen.getByText("TF-1")).toBeInTheDocument();
    expect(screen.getByText("Setup Calendar Component")).toBeInTheDocument();
    expect(screen.getByText("Phase 8 Milestone Signoff")).toBeInTheDocument();
  });

  it("handles clicking on a scheduled task", async () => {
    const user = userEvent.setup();
    const handleTaskClick = vi.fn();
    render(<CalendarView tasks={mockTasks} onTaskClick={handleTaskClick} />);

    const taskItem = screen.getByText("Setup Calendar Component");
    await user.click(taskItem);
    expect(handleTaskClick).toHaveBeenCalledWith("task-1");
  });

  it("switches between Month, Week, and Day views", async () => {
    const user = userEvent.setup();
    render(
      <CalendarView
        tasks={mockTasks}
        onTaskClick={vi.fn()}
        onCreateTask={vi.fn()}
      />
    );

    // Switch to Week view
    const weekBtn = screen.getByRole("button", { name: "Week" });
    await user.click(weekBtn);
    expect(screen.getByText("Setup Calendar Component")).toBeInTheDocument();

    // Switch to Day view
    const dayBtn = screen.getByRole("button", { name: "Day" });
    await user.click(dayBtn);
    expect(screen.getByText("Schedule Task")).toBeInTheDocument();

    // Switch back to Month view
    const monthBtn = screen.getByRole("button", { name: "Month" });
    await user.click(monthBtn);
    expect(screen.getByText("Sun")).toBeInTheDocument();
  });

  it("navigates previous, next, and today", async () => {
    const user = userEvent.setup();
    render(<CalendarView tasks={mockTasks} onTaskClick={vi.fn()} />);

    const prevBtn = screen.getByLabelText("Previous period");
    const nextBtn = screen.getByLabelText("Next period");
    const todayBtn = screen.getByRole("button", { name: "Today" });

    await user.click(nextBtn);
    await user.click(prevBtn);
    await user.click(todayBtn);
  });

  it("toggles the unscheduled tasks drawer and displays unscheduled items", async () => {
    const user = userEvent.setup();
    const handleTaskClick = vi.fn();
    render(<CalendarView tasks={mockTasks} onTaskClick={handleTaskClick} />);

    const unscheduledToggle = screen.getByTitle("Toggle Unscheduled Tasks");
    await user.click(unscheduledToggle);

    expect(screen.getByText("Unscheduled Tasks")).toBeInTheDocument();
    expect(screen.getByText("Unscheduled Backlog Item")).toBeInTheDocument();

    await user.click(screen.getByText("Unscheduled Backlog Item"));
    expect(handleTaskClick).toHaveBeenCalledWith("task-3");
  });

  it("filters tasks by search query", async () => {
    const user = userEvent.setup();
    render(<CalendarView tasks={mockTasks} onTaskClick={vi.fn()} />);

    const searchInput = screen.getByPlaceholderText("Filter calendar tasks...");
    await user.type(searchInput, "Milestone");

    expect(
      screen.queryByText("Setup Calendar Component")
    ).not.toBeInTheDocument();
    expect(screen.getByText("Phase 8 Milestone Signoff")).toBeInTheDocument();
  });

  it("renders loading skeleton when isLoading is true", () => {
    const { container } = render(
      <CalendarView tasks={mockTasks} isLoading={true} onTaskClick={vi.fn()} />
    );

    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
      0
    );
  });
});
