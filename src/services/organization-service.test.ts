import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  organizationService,
  ORGANIZATION_ENDPOINTS,
} from "./organization-service";
import * as apiClientModule from "./api-client";

describe("organizationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls getMyOrganizations with query parameters", async () => {
    const spy = vi
      .spyOn(apiClientModule, "apiClient")
      .mockResolvedValueOnce({ items: [], page: 1, page_size: 10, total: 0 });

    await organizationService.getMyOrganizations({ page: 2, page_size: 10 });
    expect(spy).toHaveBeenCalledWith(
      `${ORGANIZATION_ENDPOINTS.organizations}?page=2&page_size=10`,
      { method: "GET" }
    );
  });

  it("creates an organization", async () => {
    const payload = { name: "Acme", slug: "acme" };
    const mockOrg = {
      id: "org-1",
      name: "Acme",
      slug: "acme",
      is_active: true,
      created_at: "2026-10-18T00:00:00Z",
      updated_at: "2026-10-18T00:00:00Z",
    };
    const spy = vi
      .spyOn(apiClientModule, "apiClient")
      .mockResolvedValueOnce(mockOrg);

    const result = await organizationService.createOrganization(payload);
    expect(spy).toHaveBeenCalledWith(ORGANIZATION_ENDPOINTS.organizations, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    expect(result).toEqual(mockOrg);
  });

  it("handles members list, add, role update, and remove", async () => {
    const spy = vi
      .spyOn(apiClientModule, "apiClient")
      .mockResolvedValue({ items: [], total: 0 });

    await organizationService.getMembers("org-1", { page: 1 });
    expect(spy).toHaveBeenCalledWith(
      `${ORGANIZATION_ENDPOINTS.members("org-1")}?page=1`,
      { method: "GET" }
    );

    spy.mockResolvedValueOnce({ id: "m-1" });
    await organizationService.addMember("org-1", {
      user_id: "u-1",
      role: "member",
    });
    expect(spy).toHaveBeenCalledWith(ORGANIZATION_ENDPOINTS.members("org-1"), {
      method: "POST",
      body: JSON.stringify({ user_id: "u-1", role: "member" }),
    });

    spy.mockResolvedValueOnce({ id: "m-1", role: "admin" });
    await organizationService.updateMemberRole("org-1", "u-1", {
      role: "admin",
    });
    expect(spy).toHaveBeenCalledWith(
      ORGANIZATION_ENDPOINTS.member("org-1", "u-1"),
      {
        method: "PATCH",
        body: JSON.stringify({ role: "admin" }),
      }
    );

    spy.mockResolvedValueOnce({ message: "Removed" });
    await organizationService.removeMember("org-1", "u-1");
    expect(spy).toHaveBeenCalledWith(
      ORGANIZATION_ENDPOINTS.member("org-1", "u-1"),
      {
        method: "DELETE",
      }
    );
  });

  it("handles invitations: list, create, and accept", async () => {
    const spy = vi
      .spyOn(apiClientModule, "apiClient")
      .mockResolvedValue({ items: [], total: 0 });

    await organizationService.getInvitations("org-1");
    expect(spy).toHaveBeenCalledWith(
      ORGANIZATION_ENDPOINTS.invitations("org-1"),
      {
        method: "GET",
      }
    );

    spy.mockResolvedValueOnce({ id: "inv-1" });
    await organizationService.createInvitation("org-1", {
      email: "test@example.com",
      role: "member",
    });
    expect(spy).toHaveBeenCalledWith(
      ORGANIZATION_ENDPOINTS.invitations("org-1"),
      {
        method: "POST",
        body: JSON.stringify({ email: "test@example.com", role: "member" }),
      }
    );

    spy.mockResolvedValueOnce({ id: "m-accepted" });
    await organizationService.acceptInvitation("token123");
    expect(spy).toHaveBeenCalledWith(
      ORGANIZATION_ENDPOINTS.acceptInvitation("token123"),
      { method: "POST" }
    );
  });
});
