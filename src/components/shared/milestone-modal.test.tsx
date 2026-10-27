import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { MilestoneModal } from "./milestone-modal";

describe("MilestoneModal Component", () => {
  it("renders modal form when open", () => {
    render(
      <MilestoneModal isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} />
    );

    expect(
      screen.getByRole("heading", { name: "Create Milestone" })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Milestone Title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Target Date/i)).toBeInTheDocument();
  });

  it("submits valid milestone data", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn().mockResolvedValue(undefined);
    const handleClose = vi.fn();

    render(
      <MilestoneModal
        isOpen={true}
        onClose={handleClose}
        onSubmit={handleSubmit}
        defaultDate={new Date("2026-11-15T00:00:00Z")}
      />
    );

    const titleInput = screen.getByLabelText(/Milestone Title/i);
    await user.type(titleInput, "Beta Launch");

    const submitBtn = screen.getByRole("button", { name: "Create Milestone" });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Beta Launch",
        })
      );
      expect(handleClose).toHaveBeenCalled();
    });
  });

  it("shows error alert on submit rejection", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi
      .fn()
      .mockRejectedValue(new Error("Milestone already exists"));

    render(
      <MilestoneModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={handleSubmit}
        defaultDate={new Date("2026-11-15T00:00:00Z")}
      />
    );

    const titleInput = screen.getByLabelText(/Milestone Title/i);
    await user.type(titleInput, "Duplicate Milestone");

    const submitBtn = screen.getByRole("button", { name: "Create Milestone" });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Milestone already exists")).toBeInTheDocument();
    });
  });
});
