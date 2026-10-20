import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoadingPage } from "./loading-page";

let mockPathname = "/en/dashboard";

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

describe("LoadingPage", () => {
  beforeEach(() => {
    mockPathname = "/en/dashboard";
    vi.clearAllMocks();
  });

  it("renders with status role and aria attributes", () => {
    render(<LoadingPage />);
    const statusRegion = screen.getByRole("status");
    expect(statusRegion).toBeInTheDocument();
    expect(statusRegion).toHaveAttribute("aria-live", "polite");
  });

  it("displays default English title and subtitle", () => {
    render(<LoadingPage />);
    expect(screen.getByText("Loading TaskFlow")).toBeInTheDocument();
    expect(
      screen.getByText("Preparing your workspace and syncing data...")
    ).toBeInTheDocument();
  });

  it("renders custom message and subMessage when provided", () => {
    render(
      <LoadingPage
        message="Syncing Projects..."
        subMessage="Fetching latest updates"
      />
    );
    expect(screen.getByText("Syncing Projects...")).toBeInTheDocument();
    expect(screen.getByText("Fetching latest updates")).toBeInTheDocument();
  });

  it("renders Persian text and RTL direction when locale is fa", () => {
    mockPathname = "/fa/projects";
    render(<LoadingPage />);
    expect(screen.getByText("در حال بارگذاری تسک‌فلو")).toBeInTheDocument();
    const statusRegion = screen.getByRole("status");
    expect(statusRegion).toHaveAttribute("dir", "rtl");
  });
});
