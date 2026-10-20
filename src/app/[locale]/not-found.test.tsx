import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import NotFound from "./not-found";

const mockBack = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    back: mockBack,
    push: vi.fn(),
  }),
  usePathname: () => "/en/some-missing-page",
}));

describe("NotFound Page", () => {
  it("renders 404 message and navigation links", () => {
    render(<NotFound />);

    expect(screen.getByText("404")).toBeInTheDocument();
    expect(screen.getByText("Page Not Found")).toBeInTheDocument();
    expect(
      screen.getByText(/The page you are looking for doesn't exist/i)
    ).toBeInTheDocument();

    const dashboardLink = screen.getByRole("link", {
      name: /back to dashboard/i,
    });
    expect(dashboardLink).toHaveAttribute("href", "/en/dashboard");

    const myTasksLink = screen.getByRole("link", { name: /my tasks/i });
    expect(myTasksLink).toHaveAttribute("href", "/en/my-tasks");
  });

  it("calls router.back when Go Back button is clicked", async () => {
    const user = userEvent.setup();
    render(<NotFound />);

    const backButton = screen.getByRole("button", { name: /go back/i });
    await user.click(backButton);

    expect(mockBack).toHaveBeenCalled();
  });
});
