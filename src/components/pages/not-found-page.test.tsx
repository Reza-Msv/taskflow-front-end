import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotFoundPage } from "./not-found-page";

let mockPathname = "/en/unknown-route";
const backMock = vi.fn();
const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({
    back: backMock,
    push: pushMock,
  }),
}));

describe("NotFoundPage", () => {
  beforeEach(() => {
    mockPathname = "/en/unknown-route";
    vi.clearAllMocks();
  });

  it("renders 404 and page not found title", () => {
    render(<NotFoundPage />);
    expect(screen.getByText("404")).toBeInTheDocument();
    expect(screen.getByText("Page not found")).toBeInTheDocument();
  });

  it("calls router.back when Go Back button is clicked", async () => {
    const user = userEvent.setup();
    render(<NotFoundPage />);

    const goBackButton = screen.getByRole("button", { name: /go back/i });
    expect(goBackButton).toBeInTheDocument();

    await user.click(goBackButton);
    expect(backMock).toHaveBeenCalledTimes(1);
  });

  it("renders navigation links to dashboard and projects", () => {
    render(<NotFoundPage />);
    const dashboardLink = screen.getByRole("link", {
      name: /go to dashboard/i,
    });
    const projectsLink = screen.getByRole("link", { name: /view projects/i });

    expect(dashboardLink).toHaveAttribute("href", "/en/dashboard");
    expect(projectsLink).toHaveAttribute("href", "/en/projects");
  });

  it("renders Persian translation and RTL when locale is fa", () => {
    mockPathname = "/fa/unknown-route";
    render(<NotFoundPage />);

    expect(screen.getByText("۴۰۴")).toBeInTheDocument();
    expect(screen.getByText("صفحه مورد نظر پیدا نشد")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /ورود به داشبورد/i })
    ).toHaveAttribute("href", "/fa/dashboard");
  });
});
