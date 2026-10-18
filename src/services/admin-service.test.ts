import { describe, it, expect, vi, beforeEach } from "vitest";
import { adminService, ADMIN_ENDPOINTS } from "./admin-service";
import * as apiClientModule from "./api-client";

describe("adminService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("calls getOverview on the correct endpoint", async () => {
    const mockOverview = {
      total_users: 10,
      active_users: 8,
      total_organizations: 2,
      active_organizations: 2,
      total_projects: 5,
    };
    const apiClientSpy = vi
      .spyOn(apiClientModule, "apiClient")
      .mockResolvedValueOnce(mockOverview);

    const result = await adminService.getOverview();

    expect(apiClientSpy).toHaveBeenCalledWith(ADMIN_ENDPOINTS.overview, {
      method: "GET",
    });
    expect(result).toEqual(mockOverview);
  });

  it("calls getUsers with query parameters formatted correctly", async () => {
    const mockUsers = {
      items: [],
      page: 2,
      page_size: 10,
      total: 0,
    };
    const apiClientSpy = vi
      .spyOn(apiClientModule, "apiClient")
      .mockResolvedValueOnce(mockUsers);

    const result = await adminService.getUsers({
      page: 2,
      page_size: 10,
      search: "alice",
      is_active: true,
      is_superuser: false,
    });

    expect(apiClientSpy).toHaveBeenCalledWith(
      `${ADMIN_ENDPOINTS.users}?page=2&page_size=10&search=alice&is_active=true&is_superuser=false`,
      { method: "GET" }
    );
    expect(result).toEqual(mockUsers);
  });

  it("calls updateUser with PATCH method and payload", async () => {
    const mockUser = {
      id: "u-123",
      email: "test@example.com",
      full_name: "Updated Name",
      is_active: false,
      is_superuser: false,
      created_at: "2026-10-18T00:00:00Z",
      updated_at: "2026-10-18T01:00:00Z",
    };
    const apiClientSpy = vi
      .spyOn(apiClientModule, "apiClient")
      .mockResolvedValueOnce(mockUser);

    const result = await adminService.updateUser("u-123", {
      is_active: false,
    });

    expect(apiClientSpy).toHaveBeenCalledWith(ADMIN_ENDPOINTS.user("u-123"), {
      method: "PATCH",
      body: JSON.stringify({ is_active: false }),
    });
    expect(result).toEqual(mockUser);
  });

  it("calls organization CRUD and member endpoints properly", async () => {
    const orgSpy = vi
      .spyOn(apiClientModule, "apiClient")
      .mockResolvedValue({ id: "org-1" });

    await adminService.createOrganization({ name: "Acme", slug: "acme" });
    expect(orgSpy).toHaveBeenCalledWith(ADMIN_ENDPOINTS.organizations, {
      method: "POST",
      body: JSON.stringify({ name: "Acme", slug: "acme" }),
    });

    await adminService.getOrganizationMembers("org-1");
    expect(orgSpy).toHaveBeenCalledWith(ADMIN_ENDPOINTS.members("org-1"), {
      method: "GET",
    });

    await adminService.removeOrganizationMember("org-1", "user-1");
    expect(orgSpy).toHaveBeenCalledWith(
      ADMIN_ENDPOINTS.member("org-1", "user-1"),
      { method: "DELETE" }
    );
  });
});
