import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CompletionTrendsChart } from "./completion-trends-chart";
import type { TrendDataPoint } from "@/services/reports-service";

describe("CompletionTrendsChart", () => {
  const sampleTrends: TrendDataPoint[] = [
    {
      key: "2026-10-20",
      label: "Oct 20",
      timestamp: 1792454400000,
      created: 3,
      completed: 1,
      cumulativeCompleted: 1,
    },
    {
      key: "2026-10-21",
      label: "Oct 21",
      timestamp: 1792540800000,
      created: 2,
      completed: 2,
      cumulativeCompleted: 3,
    },
    {
      key: "2026-10-22",
      label: "Oct 22",
      timestamp: 1792627200000,
      created: 0,
      completed: 4,
      cumulativeCompleted: 7,
    },
  ];

  it("renders SVG chart elements and legends", () => {
    const handleIntervalChange = vi.fn();
    render(
      <CompletionTrendsChart
        trends={sampleTrends}
        interval="daily"
        onIntervalChange={handleIntervalChange}
      />
    );

    expect(
      screen.getByText("Task Velocity & Completion Trends")
    ).toBeInTheDocument();
    expect(screen.getByText("Tasks Completed")).toBeInTheDocument();
    expect(screen.getByText("Tasks Created")).toBeInTheDocument();
    expect(screen.getByText("Cumulative Delivered")).toBeInTheDocument();

    const chartSvg = screen.getByRole("img");
    expect(chartSvg).toBeInTheDocument();
  });

  it("calls onIntervalChange when interval buttons are clicked", () => {
    const handleIntervalChange = vi.fn();
    render(
      <CompletionTrendsChart
        trends={sampleTrends}
        interval="daily"
        onIntervalChange={handleIntervalChange}
      />
    );

    const weeklyButton = screen.getByRole("button", { name: "weekly" });
    fireEvent.click(weeklyButton);
    expect(handleIntervalChange).toHaveBeenCalledWith("weekly");

    const monthlyButton = screen.getByRole("button", { name: "monthly" });
    fireEvent.click(monthlyButton);
    expect(handleIntervalChange).toHaveBeenCalledWith("monthly");
  });

  it("toggles accessible table view", () => {
    render(
      <CompletionTrendsChart
        trends={sampleTrends}
        interval="daily"
        onIntervalChange={vi.fn()}
      />
    );

    const toggleButton = screen.getByRole("button", {
      name: /show table view/i,
    });
    fireEvent.click(toggleButton);

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("Period")).toBeInTheDocument();
    expect(screen.getByText("Oct 20")).toBeInTheDocument();
    expect(screen.getByText("Oct 22")).toBeInTheDocument();
  });

  it("displays empty state message when trends array is empty", () => {
    render(
      <CompletionTrendsChart
        trends={[]}
        interval="daily"
        onIntervalChange={vi.fn()}
      />
    );

    expect(
      screen.getByText("No task activity recorded in this date range")
    ).toBeInTheDocument();
  });
});
