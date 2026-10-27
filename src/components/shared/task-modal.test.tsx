import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TaskModal } from "./task-modal";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("TaskModal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    projectId: "proj-123",
    members: [{ userId: "u-1", name: "Bob" }],
    availableStatuses: [
      { id: "todo", name: "To Do" },
      { id: "in_progress", name: "In Progress" },
    ],
    onSubmitCreate: vi.fn().mockResolvedValue(undefined),
    onSubmitUpdate: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renders create task modal with template selector", () => {
    render(<TaskModal {...defaultProps} />);

    expect(screen.getByText("Create New Task")).toBeInTheDocument();
    expect(screen.getByLabelText(/Start with a Template/i)).toBeInTheDocument();
    expect(screen.getByText("Blank Task (No template)")).toBeInTheDocument();
  });

  it("applies a standard template and populates title, description, and priority", async () => {
    const user = userEvent.setup();
    render(<TaskModal {...defaultProps} />);

    const templateSelect = screen.getByLabelText(/Start with a Template/i);
    await user.selectOptions(templateSelect, "standard-bug");

    const titleInput = screen.getByLabelText(/Title \*/i) as HTMLInputElement;
    expect(titleInput.value).toBe("[Bug]: ");

    const descInput = screen.getByLabelText(/Description/i) as HTMLTextAreaElement;
    expect(descInput.value).toContain("### Steps to Reproduce");

    const prioritySelect = screen.getByLabelText(/Priority/i) as HTMLSelectElement;
    expect(prioritySelect.value).toBe("high");

    const typeSelect = screen.getByLabelText(/Type/i) as HTMLSelectElement;
    expect(typeSelect.value).toBe("bug");
  });

  it("allows saving a custom template", async () => {
    const user = userEvent.setup();
    render(<TaskModal {...defaultProps} />);

    const saveTemplateBtn = screen.getByText("Save as template");
    await user.click(saveTemplateBtn);

    const nameInput = screen.getByPlaceholderText(/Template name/i);
    await user.type(nameInput, "Incident Triage");

    const titleInput = screen.getByLabelText(/Title \*/i);
    await user.type(titleInput, "[INC]: Major Outage");

    const descInput = screen.getByLabelText(/Description/i);
    await user.type(descInput, "Incident details and timeline...");

    const saveBtn = screen.getByRole("button", { name: "Save" });
    await user.click(saveBtn);

    // Cancel / save state should close
    expect(screen.queryByPlaceholderText(/Template name/i)).not.toBeInTheDocument();
  });

  it("submits the created task with prefilled template data", async () => {
    const user = userEvent.setup();
    render(<TaskModal {...defaultProps} />);

    const templateSelect = screen.getByLabelText(/Start with a Template/i);
    await user.selectOptions(templateSelect, "standard-story");

    const titleInput = screen.getByLabelText(/Title \*/i);
    await user.type(titleInput, "Checkout payment options");

    const submitBtn = screen.getByRole("button", { name: /Create Task/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(defaultProps.onSubmitCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "[Story]: Checkout payment options",
          type: "story",
          priority: "medium",
        })
      );
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });
});
