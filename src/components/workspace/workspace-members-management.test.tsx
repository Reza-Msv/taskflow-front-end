import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WorkspaceMembersManagement } from "./workspace-members-management";
import { organizationService } from "@/services/organization-service";
import type {
  OrganizationMembershipResponse,
  InvitationResponse,
} from "@/services/generated/api-types";

describe("WorkspaceMembersManagement", () => {
  const sampleMembers: OrganizationMembershipResponse[] = [
    {
      id: "mem-1",
      organization_id: "org-100",
      user_id: "user-owner",
      role: "owner",
      is_active: true,
      created_at: "2026-10-15T10:00:00Z",
      updated_at: "2026-10-15T10:00:00Z",
      user: {
        id: "user-owner",
        email: "alice@acme.com",
        full_name: "Alice Owner",
        is_active: true,
        is_superuser: false,
        created_at: "2026-10-15T10:00:00Z",
        updated_at: "2026-10-15T10:00:00Z",
      },
    },
    {
      id: "mem-2",
      organization_id: "org-100",
      user_id: "user-admin",
      role: "admin",
      is_active: true,
      created_at: "2026-10-16T10:00:00Z",
      updated_at: "2026-10-16T10:00:00Z",
      user: {
        id: "user-admin",
        email: "bob@acme.com",
        full_name: "Bob Admin",
        is_active: true,
        is_superuser: false,
        created_at: "2026-10-16T10:00:00Z",
        updated_at: "2026-10-16T10:00:00Z",
      },
    },
    {
      id: "mem-3",
      organization_id: "org-100",
      user_id: "user-member",
      role: "member",
      is_active: true,
      created_at: "2026-10-17T10:00:00Z",
      updated_at: "2026-10-17T10:00:00Z",
      user: {
        id: "user-member",
        email: "charlie@acme.com",
        full_name: "Charlie Contributor",
        is_active: true,
        is_superuser: false,
        created_at: "2026-10-17T10:00:00Z",
        updated_at: "2026-10-17T10:00:00Z",
      },
    },
  ];

  const sampleInvitations: InvitationResponse[] = [
    {
      id: "inv-10",
      organization_id: "org-100",
      email: "invited@acme.com",
      role: "member",
      token: "secure-inv-token-999",
      invited_by_id: "user-admin",
      expires_at: "2026-11-01T10:00:00Z",
      created_at: "2026-10-20T10:00:00Z",
      updated_at: "2026-10-20T10:00:00Z",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders member list, roles, and pending invitations", () => {
    render(
      <WorkspaceMembersManagement
        organizationId="org-100"
        members={sampleMembers}
        invitations={sampleInvitations}
        currentUserId="user-owner"
        currentUserRole="owner"
        onRefresh={vi.fn()}
      />
    );

    expect(screen.getByText("Active Members (3)")).toBeInTheDocument();
    expect(screen.getByText("Alice Owner")).toBeInTheDocument();
    expect(screen.getByText("Bob Admin")).toBeInTheDocument();
    expect(screen.getByText("Charlie Contributor")).toBeInTheDocument();

    // Check pending invitations section
    expect(screen.getByText("Pending Invitations (1)")).toBeInTheDocument();
    expect(screen.getByText("invited@acme.com")).toBeInTheDocument();
    expect(screen.getByText("secure-inv-token-999")).toBeInTheDocument();
  });

  it("filters members based on search input", async () => {
    const user = userEvent.setup();

    render(
      <WorkspaceMembersManagement
        organizationId="org-100"
        members={sampleMembers}
        invitations={[]}
        currentUserId="user-owner"
        currentUserRole="owner"
        onRefresh={vi.fn()}
      />
    );

    const searchInput = screen.getByPlaceholderText(/search members/i);
    await user.type(searchInput, "Charlie");

    expect(screen.getByText("Charlie Contributor")).toBeInTheDocument();
    expect(screen.queryByText("Bob Admin")).not.toBeInTheDocument();
    expect(screen.queryByText("Alice Owner")).not.toBeInTheDocument();
  });

  it("allows updating member roles and respects hierarchy", async () => {
    const updateSpy = vi
      .spyOn(organizationService, "updateMemberRole")
      .mockResolvedValueOnce({
        ...sampleMembers[2],
        role: "admin",
      });

    const onRefresh = vi.fn();
    const user = userEvent.setup();

    render(
      <WorkspaceMembersManagement
        organizationId="org-100"
        members={sampleMembers}
        invitations={[]}
        currentUserId="user-admin"
        currentUserRole="admin"
        onRefresh={onRefresh}
      />
    );

    // Admin should be able to change Charlie's role (member), but dropdown shouldn't include 'owner'
    const roleSelect = screen.getByLabelText("Change role for Charlie Contributor");
    expect(roleSelect).toBeInTheDocument();

    // Option 'owner' should not exist for admin actor
    const options = Array.from((roleSelect as HTMLSelectElement).options).map(
      (o) => o.value
    );
    expect(options).not.toContain("owner");

    await user.selectOptions(roleSelect, "admin");

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith("org-100", "user-member", {
        role: "admin",
      });
      expect(onRefresh).toHaveBeenCalled();
    });
  });

  it("allows removing a member with confirmation", async () => {
    const removeSpy = vi
      .spyOn(organizationService, "removeMember")
      .mockResolvedValueOnce({ message: "Member removed" });

    const onRefresh = vi.fn();
    const user = userEvent.setup();

    render(
      <WorkspaceMembersManagement
        organizationId="org-100"
        members={sampleMembers}
        invitations={[]}
        currentUserId="user-owner"
        currentUserRole="owner"
        onRefresh={onRefresh}
      />
    );

    // Click remove on Charlie
    const removeBtns = screen.getAllByTitle("Remove member");
    expect(removeBtns.length).toBeGreaterThan(0);
    await user.click(removeBtns[0]);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Remove Member" })).toBeInTheDocument();
    });

    const confirmBtn = screen.getByRole("button", { name: "Remove Member" });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(removeSpy).toHaveBeenCalled();
      expect(onRefresh).toHaveBeenCalled();
    });
  });

  it("allows directly adding a member by UUID", async () => {
    const addSpy = vi
      .spyOn(organizationService, "addMember")
      .mockResolvedValueOnce({
        id: "mem-4",
        organization_id: "org-100",
        user_id: "u-new-direct",
        role: "member",
        is_active: true,
        created_at: "2026-10-21T10:00:00Z",
        updated_at: "2026-10-21T10:00:00Z",
      });

    const onRefresh = vi.fn();
    const user = userEvent.setup();

    render(
      <WorkspaceMembersManagement
        organizationId="org-100"
        members={sampleMembers}
        invitations={[]}
        currentUserId="user-owner"
        currentUserRole="owner"
        onRefresh={onRefresh}
      />
    );

    const addBtn = screen.getByRole("button", { name: /add member/i });
    await user.click(addBtn);

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Add Member Directly")).toBeInTheDocument();
    });

    const uuidInput = screen.getByLabelText(/user uuid/i);
    await user.type(uuidInput, "u-new-direct");

    const submitBtn = screen.getByRole("button", { name: "Add Member" });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(addSpy).toHaveBeenCalledWith("org-100", {
        user_id: "u-new-direct",
        role: "member",
      });
      expect(onRefresh).toHaveBeenCalled();
    });
  });
});
