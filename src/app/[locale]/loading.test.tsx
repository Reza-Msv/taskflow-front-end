import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Loading from "./loading";
import DashboardLoading from "./(dashboard)/loading";

describe("Loading States", () => {
  it("renders global TaskFlow loading indicator", () => {
    render(<Loading />);

    expect(screen.getByText("TaskFlow")).toBeInTheDocument();
    expect(screen.getByText("Loading workspace...")).toBeInTheDocument();
  });

  it("renders dashboard skeleton loading placeholders", () => {
    const { container } = render(<DashboardLoading />);

    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(10);
  });
});
