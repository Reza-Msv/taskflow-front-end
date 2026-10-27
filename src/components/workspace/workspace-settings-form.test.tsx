import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WorkspaceSettingsForm } from "./workspace-settings-form";
import { organizationService } from "@/services/organization-service";
import { ApiClientError } from "@/services/api-client";
import type { OrganizationResponse } from "@/services/generated/api-types";

describe("WorkspaceSettingsForm", () => {
  const sampleOrg: OrganizationResponse = {
    id: "org-456",
    name: "Engineering Corp",
    slug: "engineering-corp",
    is_active: true,
    created_at: "2026-10-20T10:00:00Z",
    updated_at: "2026-10-20T12:00:00Z",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders workspace metadata in read-only mode for normal members", () => {
    render(
      <WorkspaceSettingsForm
        organization={sampleOrg}
        userRole="member"
      />
    );

    expect(screen.getByText("Workspace Metadata")).toBeInTheDocument();
    expect(screen.getByText("Read-Only")).toBeInTheDocument();

    const nameInput = screen.getByLabelText(/workspace display name/i) as HTMLInputElement;
    expect(nameInput).toBeDisabled();
    expect(nameInput.value).toBe("Engineering Corp");

    const slugInput = screen.getByLabelText(/workspace identifier/i) as HTMLInputElement;
    expect(slugInput).toBeDisabled();
    expect(slugInput.value).toBe("engineering-corp");

    // Danger zone should not be visible to normal members
    expect(screen.queryByText("Danger Zone")).not.toBeInTheDocument();
    // Save button should not exist
    expect(screen.queryByRole("button", { name: /save settings/i })).not.toBeInTheDocument();
  });

  it("allows admins to edit workspace name and status, but not delete workspace", async () => {
    const updateSpy = vi
      .spyOn(organizationService, "updateOrganization")
      .mockResolvedValueOnce({
        ...sampleOrg,
        name: "Renamed Corp",
      });

    const onUpdated = vi.fn();
    const user = userEvent.setup();

    render(
      <WorkspaceSettingsForm
        organization={sampleOrg}
        userRole="admin"
        onUpdated={onUpdated}
      />
    );

    expect(screen.queryByText("Read-Only")).not.toBeInTheDocument();
    expect(screen.queryByText("Danger Zone")).not.toBeInTheDocument();

    const nameInput = screen.getByLabelText(/workspace display name/i);
    expect(nameInput).not.toBeDisabled();

    await user.clear(nameInput);
    await user.type(nameInput, "Renamed Corp");

    const saveBtn = screen.getByRole("button", { name: /save settings/i });
    await user.click(saveBtn);

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith("org-456", {
        name: "Renamed Corp",
        is_active: true,
      });
      expect(onUpdated).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Renamed Corp" })
      );
    });
  });

  it("shows Danger Zone and handles workspace deletion for owners", async () => {
    const deleteSpy = vi
      .spyOn(organizationService, "deleteOrganization")
      .mockResolvedValueOnce({ message: "Workspace deleted" });

    const onDeleted = vi.fn();
    const user = userEvent.setup();

    render(
      <WorkspaceSettingsForm
        organization={sampleOrg}
        userRole="owner"
        onDeleted={onDeleted}
      />
    );

    expect(screen.getByText("Danger Zone")).toBeInTheDocument();
    const deleteBtn = screen.getByRole("button", { name: /delete workspace/i });
    await user.click(deleteBtn);

    // Confirm dialog should appear
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /permanently delete/i })).toBeInTheDocument();
    });

    const confirmBtn = screen.getByRole("button", { name: /permanently delete/i });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith("org-456");
      expect(onDeleted).toHaveBeenCalled();
    });
  });

  it("displays error alert when API update fails", async () => {
    vi.spyOn(organizationService, "updateOrganization").mockRejectedValueOnce(
      new ApiClientError(400, {
        error: {
          code: "VALIDATION_ERROR",
          message: "Organization name already in use",
          request_id: "req-123",
        },
      })
    );

    const user = userEvent.setup();

    render(
      <WorkspaceSettingsForm
        organization={sampleOrg}
        userRole="owner"
      />
    );

    const nameInput = screen.getByLabelText(/workspace display name/i);
    await user.clear(nameInput);
    await user.type(nameInput, "Duplicate Name");

    const saveBtn = screen.getByRole("button", { name: /save settings/i });
    await user.click(saveBtn);

    await waitFor(() => {
      expect(
        screen.getByText("Organization name already in use")
      ).toBeInTheDocument();
    });
  });
});
