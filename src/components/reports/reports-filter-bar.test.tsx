import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ReportsFilterBar } from "./reports-filter-bar";
import type { ProjectResponse } from "@/services/generated/api-types";

describe("ReportsFilterBar", () => {
  const sampleProjects: ProjectResponse[] = [
    {
      id: "p-1",
      organization_id: "o-1",
      name: "Alpha Project",
      key: "ALP",
      description: null,
      is_private: false,
      is_archived: false,
      created_at: "2026-10-01T00:00:00Z",
      updated_at: "2026-10-01T00:00:00Z",
    },
    {
      id: "p-2",
      organization_id: "o-1",
      name: "Beta Project",
      key: "BET",
      description: null,
      is_private: false,
      is_archived: false,
      created_at: "2026-10-01T00:00:00Z",
      updated_at: "2026-10-01T00:00:00Z",
    },
  ];

  it("renders projects and presets dropdowns", () => {
    const handleProjectChange = vi.fn();
    const handleDateRangeChange = vi.fn();

    render(
      <ReportsFilterBar
        projects={sampleProjects}
        selectedProjectId="p-1"
        onProjectChange={handleProjectChange}
        dateRange={{ preset: "30d" }}
        onDateRangeChange={handleDateRangeChange}
        onRefresh={vi.fn()}
        onExportOverview={vi.fn()}
        onExportWorkload={vi.fn()}
      />
    );

    const projectSelect = screen.getByLabelText("Select reporting project");
    expect(projectSelect).toHaveValue("p-1");

    fireEvent.change(projectSelect, { target: { value: "p-2" } });
    expect(handleProjectChange).toHaveBeenCalledWith("p-2");
  });

  it("calls onDateRangeChange when preset is selected", () => {
    const handleDateRangeChange = vi.fn();

    render(
      <ReportsFilterBar
        projects={sampleProjects}
        selectedProjectId="p-1"
        onProjectChange={vi.fn()}
        dateRange={{ preset: "30d" }}
        onDateRangeChange={handleDateRangeChange}
        onRefresh={vi.fn()}
        onExportOverview={vi.fn()}
        onExportWorkload={vi.fn()}
      />
    );

    const presetSelect = screen.getByLabelText("Select date range");
    fireEvent.change(presetSelect, { target: { value: "7d" } });
    expect(handleDateRangeChange).toHaveBeenCalledWith({ preset: "7d" });
  });

  it("validates contradictory custom date range (start after end)", () => {
    const handleDateRangeChange = vi.fn();

    render(
      <ReportsFilterBar
        projects={sampleProjects}
        selectedProjectId="p-1"
        onProjectChange={vi.fn()}
        dateRange={{ preset: "custom", from: "2026-10-25", to: "2026-10-10" }}
        onDateRangeChange={handleDateRangeChange}
        onRefresh={vi.fn()}
        onExportOverview={vi.fn()}
        onExportWorkload={vi.fn()}
      />
    );

    const applyButton = screen.getByRole("button", { name: "Apply Range" });
    fireEvent.click(applyButton);

    expect(
      screen.getByText("Start date cannot be after end date.")
    ).toBeInTheDocument();
    expect(handleDateRangeChange).not.toHaveBeenCalled();
  });
});
