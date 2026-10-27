import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReportsOverviewCards } from "./reports-overview-cards";
import type { OverviewMetrics } from "@/services/reports-service";

describe("ReportsOverviewCards", () => {
  const sampleMetrics: OverviewMetrics = {
    totalTasks: 25,
    completedTasks: 15,
    openTasks: 4,
    inProgressTasks: 6,
    overdueTasks: 3,
    unassignedTasks: 2,
    completionPercentage: 60,
  };

  it("renders all 6 metric cards accurately", () => {
    render(<ReportsOverviewCards metrics={sampleMetrics} />);

    expect(screen.getByText("Total Tasks")).toBeInTheDocument();
    expect(screen.getByText("25")).toBeInTheDocument();

    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument();

    expect(screen.getByText("In Progress & Open")).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();

    expect(screen.getByText("Overdue")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();

    expect(screen.getByText("Unassigned")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();

    expect(screen.getByText("Completion Rate")).toBeInTheDocument();
    expect(screen.getByText("60%")).toBeInTheDocument();
  });

  it("handles zero tasks edge case cleanly", () => {
    const zeroMetrics: OverviewMetrics = {
      totalTasks: 0,
      completedTasks: 0,
      openTasks: 0,
      inProgressTasks: 0,
      overdueTasks: 0,
      unassignedTasks: 0,
      completionPercentage: 0,
    };
    render(<ReportsOverviewCards metrics={zeroMetrics} />);
    expect(screen.getByText("0%")).toBeInTheDocument();
    expect(screen.getByText("No overdue tasks")).toBeInTheDocument();
  });
});
