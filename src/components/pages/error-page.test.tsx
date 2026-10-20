import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorPage } from "./error-page";

let mockPathname = "/en/dashboard";
const pushMock = vi.fn();
const backMock = vi.fn();
const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({
    push: pushMock,
    back: backMock,
    refresh: refreshMock,
  }),
}));

describe("ErrorPage", () => {
  beforeEach(() => {
    mockPathname = "/en/dashboard";
    vi.clearAllMocks();
  });

  it("renders with alert role and standard error copy", () => {
    render(<ErrorPage />);
    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("System Error")).toBeInTheDocument();
  });

  it("triggers reset callback when Try again is clicked", async () => {
    const user = userEvent.setup();
    const resetMock = vi.fn();
    render(<ErrorPage reset={resetMock} />);

    const tryAgainButton = screen.getByRole("button", { name: /try again/i });
    expect(tryAgainButton).toBeInTheDocument();

    await user.click(tryAgainButton);
    expect(resetMock).toHaveBeenCalledTimes(1);
  });

  it("navigates to dashboard and clears error state when Go to Dashboard is clicked", async () => {
    const user = userEvent.setup();
    const resetMock = vi.fn();
    render(<ErrorPage reset={resetMock} />);

    const dashboardBtn = screen.getByRole("button", {
      name: /go to dashboard/i,
    });
    expect(dashboardBtn).toBeInTheDocument();

    await user.click(dashboardBtn);
    expect(resetMock).toHaveBeenCalledTimes(1);
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it("navigates back and clears error state when Go Back is clicked", async () => {
    const user = userEvent.setup();
    const resetMock = vi.fn();
    render(<ErrorPage reset={resetMock} />);

    const goBackBtn = screen.getByRole("button", { name: /go back/i });
    expect(goBackBtn).toBeInTheDocument();

    await user.click(goBackBtn);
    expect(resetMock).toHaveBeenCalledTimes(1);
    expect(backMock).toHaveBeenCalledTimes(1);
  });

  it("displays error digest when available", () => {
    const sampleError = Object.assign(new Error("Database connection failed"), {
      digest: "ERR_987654",
    });
    render(<ErrorPage error={sampleError} />);

    expect(screen.getByText("ERR_987654")).toBeInTheDocument();
    expect(screen.getByText("Error Reference:")).toBeInTheDocument();
  });

  it("toggles technical details section and shows error message", async () => {
    const user = userEvent.setup();
    const sampleError = new Error("Failed to load sprint metrics");
    render(<ErrorPage error={sampleError} />);

    const detailsToggle = screen.getByRole("button", {
      name: /technical details/i,
    });
    expect(detailsToggle).toBeInTheDocument();

    await user.click(detailsToggle);
    expect(
      screen.getByText("Failed to load sprint metrics")
    ).toBeInTheDocument();
  });

  it("renders Persian translation and RTL when locale is fa", () => {
    mockPathname = "/fa/organizations";
    render(<ErrorPage />);

    expect(screen.getByText("مشکلی در سامانه پیش آمد")).toBeInTheDocument();
    expect(screen.getByText("خطای سیستمی")).toBeInTheDocument();
    const alert = screen.getByRole("alert");
    expect(alert).toHaveAttribute("dir", "rtl");
  });
});
