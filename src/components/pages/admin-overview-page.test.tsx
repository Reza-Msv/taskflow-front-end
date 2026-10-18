import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminOverviewPage } from "./admin-overview-page";
import { adminService } from "@/services/admin-service";
import { ApiClientError } from "@/services/api-client";

describe("AdminOverviewPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders metrics from backend API", async () => {
    vi.spyOn(adminService, "getOverview").mockResolvedValueOnce({
      total_users: 42,
      active_users: 38,
      total_organizations: 5,
      active_organizations: 4,
      total_projects: 12,
    });

    render(<AdminOverviewPage />);

    await waitFor(() => {
      expect(screen.getByText("Total Users")).toBeInTheDocument();
      expect(screen.getByText("42")).toBeInTheDocument();
      expect(screen.getByText("Active Users")).toBeInTheDocument();
      expect(screen.getByText("38")).toBeInTheDocument();
      expect(screen.getByText("Total Organizations")).toBeInTheDocument();
      expect(screen.getByText("5")).toBeInTheDocument();
      expect(screen.getByText("Active Organizations")).toBeInTheDocument();
      expect(screen.getByText("4")).toBeInTheDocument();
      expect(screen.getByText("Total Projects")).toBeInTheDocument();
      expect(screen.getByText("12")).toBeInTheDocument();
    });
  });

  it("renders error state when backend API call fails and allows retry", async () => {
    const error = new ApiClientError(500, {
      error: {
        code: "SERVER_ERROR",
        message: "Failed to calculate metrics",
        request_id: "req_error_test",
      },
    });

    const getOverviewSpy = vi
      .spyOn(adminService, "getOverview")
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce({
        total_users: 10,
        active_users: 10,
        total_organizations: 1,
        active_organizations: 1,
        total_projects: 2,
      });

    const user = userEvent.setup();
    render(<AdminOverviewPage />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(
        screen.getByText("Failed to calculate metrics")
      ).toBeInTheDocument();
    });

    // Click Try Again
    await user.click(screen.getByRole("button", { name: "Try Again" }));

    await waitFor(() => {
      expect(getOverviewSpy).toHaveBeenCalledTimes(2);
      expect(screen.getAllByText("10").length).toBeGreaterThan(0);
    });
  });
});
