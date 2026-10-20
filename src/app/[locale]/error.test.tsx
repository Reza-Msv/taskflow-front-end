import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import ErrorPage from "./error";

vi.mock("next/navigation", () => ({
  usePathname: () => "/en/projects",
}));

describe("Error Page", () => {
  it("renders error state with details and retry action", async () => {
    const user = userEvent.setup();
    const mockReset = vi.fn();
    const testError = new Error("Failed to load project metadata");
    (testError as any).digest = "DIGEST_12345";

    render(<ErrorPage error={testError} reset={mockReset} />);

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(
      screen.getByText("Failed to load project metadata")
    ).toBeInTheDocument();
    expect(screen.getByText(/Digest: DIGEST_12345/i)).toBeInTheDocument();

    const tryAgainBtn = screen.getByRole("button", { name: /try again/i });
    await user.click(tryAgainBtn);

    expect(mockReset).toHaveBeenCalledTimes(1);

    const dashboardLink = screen.getByRole("link", {
      name: /back to dashboard/i,
    });
    expect(dashboardLink).toHaveAttribute("href", "/en/dashboard");
  });
});
