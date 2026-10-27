import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { TimelineView } from "./timeline-view";
import type { WorkItemResponse } from "@/services/generated/api-types";

const mockTimelineTasks: WorkItemResponse[] = [
  {
    id: "parent-1",
    project_id: "p-1",
    organization_id: "o-1",
    sequence_number: 1,
    issue_key: "TF-10",
    title: "Core Architecture Setup",
    status: "in_progress",
    priority: "urgent",
    type: "epic",
    parent_id: null,
    due_date: new Date(Date.now() + 5 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    rank: "0|1000:",
    version: 1,
    updated_at: new Date().toISOString(),
  },
  {
    id: "child-1",
    project_id: "p-1",
    organization_id: "o-1",
    sequence_number: 2,
    issue_key: "TF-11",
    title: "Database Schemas & Models",
    status: "todo",
    priority: "high",
    type: "task",
    parent_id: "parent-1", // Dependency on parent-1
    due_date: new Date(Date.now() + 10 * 86400000).toISOString(),
    created_at: new Date(Date.now() + 5 * 86400000).toISOString(),
    rank: "0|2000:",
    version: 1,
    updated_at: new Date().toISOString(),
  },
  {
    id: "milestone-1",
    project_id: "p-1",
    organization_id: "o-1",
    sequence_number: 3,
    issue_key: "TF-12",
    title: "Architecture Milestone",
    status: "todo",
    priority: "high",
    type: "milestone",
    parent_id: null,
    due_date: new Date(Date.now() + 12 * 86400000).toISOString(),
    created_at: new Date(Date.now() + 12 * 86400000).toISOString(),
    rank: "0|3000:",
    version: 1,
    updated_at: new Date().toISOString(),
  },
];

describe("TimelineView Component", () => {
  it("renders timeline with task hierarchy and Gantt bars", () => {
    const handleTaskClick = vi.fn();
    render(
      <TimelineView tasks={mockTimelineTasks} onTaskClick={handleTaskClick} />
    );

    expect(screen.getByTestId("timeline-view")).toBeInTheDocument();
    expect(screen.getAllByText("TF-10").length).toBeGreaterThan(0);
    expect(
      screen.getAllByText("Core Architecture Setup").length
    ).toBeGreaterThan(0);
    expect(screen.getAllByText("TF-11").length).toBeGreaterThan(0);
    expect(
      screen.getAllByText("Database Schemas & Models").length
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText("Architecture Milestone").length
    ).toBeGreaterThan(0);
  });

  it("renders SVG dependency connector linking parent-1 to child-1", () => {
    const { container } = render(
      <TimelineView tasks={mockTimelineTasks} onTaskClick={vi.fn()} />
    );

    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    const path = container.querySelector('path[d^="M "]');
    expect(path).toBeInTheDocument();
  });

  it("handles clicking on a task to open details", async () => {
    const user = userEvent.setup();
    const handleTaskClick = vi.fn();
    render(
      <TimelineView tasks={mockTimelineTasks} onTaskClick={handleTaskClick} />
    );

    const taskText = screen.getAllByText("Core Architecture Setup")[0];
    await user.click(taskText);
    expect(handleTaskClick).toHaveBeenCalledWith("parent-1");
  });

  it("switches zoom levels between Days, Weeks, and Months", async () => {
    const user = userEvent.setup();
    render(<TimelineView tasks={mockTimelineTasks} onTaskClick={vi.fn()} />);

    const weeksBtn = screen.getByRole("button", { name: "Weeks" });
    await user.click(weeksBtn);

    const monthsBtn = screen.getByRole("button", { name: "Months" });
    await user.click(monthsBtn);

    const daysBtn = screen.getByRole("button", { name: "Days" });
    await user.click(daysBtn);
  });

  it("filters tasks by search query", async () => {
    const user = userEvent.setup();
    render(<TimelineView tasks={mockTimelineTasks} onTaskClick={vi.fn()} />);

    const input = screen.getByPlaceholderText("Filter timeline tasks...");
    await user.type(input, "Database");

    expect(
      screen.getAllByText("Database Schemas & Models").length
    ).toBeGreaterThan(0);
    expect(
      screen.queryByText("Architecture Milestone")
    ).not.toBeInTheDocument();
  });

  it("renders milestone creation button and triggers callback", async () => {
    const user = userEvent.setup();
    const handleCreateMilestone = vi.fn();
    render(
      <TimelineView
        tasks={mockTimelineTasks}
        onTaskClick={vi.fn()}
        onCreateMilestone={handleCreateMilestone}
      />
    );

    const milestoneBtn = screen.getByRole("button", { name: "Add Milestone" });
    await user.click(milestoneBtn);
    expect(handleCreateMilestone).toHaveBeenCalled();
  });

  it("renders loading skeleton when isLoading is true", () => {
    const { container } = render(
      <TimelineView
        tasks={mockTimelineTasks}
        isLoading={true}
        onTaskClick={vi.fn()}
      />
    );

    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
      0
    );
  });
});
