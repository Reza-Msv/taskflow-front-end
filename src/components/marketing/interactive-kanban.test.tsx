import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { InteractiveKanban } from "./interactive-kanban";

describe("InteractiveKanban Component", () => {
  it("renders kanban columns and initial tasks", () => {
    render(<InteractiveKanban />);

    expect(screen.getByText("TO DO")).toBeInTheDocument();
    expect(screen.getByText("IN PROGRESS")).toBeInTheDocument();
    expect(screen.getByText("DONE")).toBeInTheDocument();
    expect(screen.getByText("DEMO-01")).toBeInTheDocument();
    expect(screen.getByText("DEMO-02")).toBeInTheDocument();
    expect(screen.getByText("DEMO-03")).toBeInTheDocument();
  });

  it("moves a task between columns when target button is clicked", () => {
    render(<InteractiveKanban />);

    // In initial state, DEMO-01 is in todo, so it should have an "In Progress" button
    const inProgressButtons = screen.getAllByRole("button", {
      name: "In Progress",
    });
    expect(inProgressButtons.length).toBeGreaterThan(0);

    fireEvent.click(inProgressButtons[0]);

    // After moving, DEMO-01 now offers "To Do" and "Done" actions
    expect(
      screen.getAllByRole("button", { name: "Done" }).length
    ).toBeGreaterThan(0);
  });
});
