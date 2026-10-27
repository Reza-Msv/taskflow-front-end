import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TeamWorkloadTable } from "./team-workload-table";
import type { WorkloadReport } from "@/services/reports-service";

describe("TeamWorkloadTable", () => {
  const sampleWorkload: WorkloadReport = {
    unassignedTasks: 3,
    members: [
      {
        userId: "u-1",
        name: "Alice Engineer",
        email: "alice@taskflow.dev",
        role: "admin",
        assignedTasks: 10,
        inProgressTasks: 4,
        overdueTasks: 2,
        completedTasks: 4,
      },
      {
        userId: "u-2",
        name: "Bob Developer",
        email: "bob@taskflow.dev",
        role: "member",
        assignedTasks: 5,
        inProgressTasks: 1,
        overdueTasks: 0,
        completedTasks: 3,
      },
    ],
  };

  it("renders members table and unassigned banner", () => {
    render(<TeamWorkloadTable workload={sampleWorkload} />);

    expect(
      screen.getByText(/tasks are currently unassigned to any team member/i)
    ).toBeInTheDocument();

    expect(screen.getByText("Alice Engineer")).toBeInTheDocument();
    expect(screen.getByText("Bob Developer")).toBeInTheDocument();

    // Check counts
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("displays neutral disclaimer", () => {
    render(<TeamWorkloadTable workload={sampleWorkload} />);
    expect(
      screen.getByText(
        /not individual performance or productivity conclusively/i
      )
    ).toBeInTheDocument();
  });

  it("handles zero members state cleanly", () => {
    render(
      <TeamWorkloadTable workload={{ members: [], unassignedTasks: 0 }} />
    );
    expect(screen.getByText("No project members found")).toBeInTheDocument();
  });
});
