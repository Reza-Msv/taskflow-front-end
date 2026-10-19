import { describe, it, expect, vi, beforeEach } from "vitest";
import { projectService, PROJECT_ENDPOINTS } from "./project-service";
import * as apiClientModule from "./api-client";

describe("projectService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls getProjects with query parameters", async () => {
    const spy = vi
      .spyOn(apiClientModule, "apiClient")
      .mockResolvedValueOnce({ items: [], page: 1, page_size: 10, total: 0 });

    await projectService.getProjects("org-1", {
      page: 1,
      page_size: 10,
      search: "Core",
      is_archived: false,
    });
    expect(spy).toHaveBeenCalledWith(
      `${PROJECT_ENDPOINTS.projects("org-1")}?page=1&page_size=10&search=Core&is_archived=false`,
      { method: "GET" }
    );
  });

  it("creates a project", async () => {
    const payload = {
      name: "TaskFlow Core",
      key: "TF",
      description: "Core backend",
      is_private: false,
    };
    const mockProject = {
      id: "p-1",
      organization_id: "org-1",
      name: "TaskFlow Core",
      key: "TF",
      is_private: false,
      is_archived: false,
      created_at: "2026-10-18T00:00:00Z",
      updated_at: "2026-10-18T00:00:00Z",
    };
    const spy = vi
      .spyOn(apiClientModule, "apiClient")
      .mockResolvedValueOnce(mockProject);

    const result = await projectService.createProject("org-1", payload);
    expect(spy).toHaveBeenCalledWith(PROJECT_ENDPOINTS.projects("org-1"), {
      method: "POST",
      body: JSON.stringify(payload),
    });
    expect(result).toEqual(mockProject);
  });

  it("handles project members list, add, update, and remove", async () => {
    const spy = vi
      .spyOn(apiClientModule, "apiClient")
      .mockResolvedValue({ items: [], total: 0 });

    await projectService.getMembers("org-1", "p-1", { page: 1 });
    expect(spy).toHaveBeenCalledWith(
      `${PROJECT_ENDPOINTS.members("org-1", "p-1")}?page=1`,
      { method: "GET" }
    );

    spy.mockResolvedValueOnce({ id: "pm-1" });
    await projectService.addMember("org-1", "p-1", {
      user_id: "u-1",
      role: "viewer",
    });
    expect(spy).toHaveBeenCalledWith(
      PROJECT_ENDPOINTS.members("org-1", "p-1"),
      {
        method: "POST",
        body: JSON.stringify({ user_id: "u-1", role: "viewer" }),
      }
    );

    spy.mockResolvedValueOnce({ id: "pm-1", role: "admin" });
    await projectService.updateMemberRole("org-1", "p-1", "u-1", {
      role: "admin",
    });
    expect(spy).toHaveBeenCalledWith(
      PROJECT_ENDPOINTS.member("org-1", "p-1", "u-1"),
      {
        method: "PATCH",
        body: JSON.stringify({ role: "admin" }),
      }
    );

    spy.mockResolvedValueOnce({ message: "Removed" });
    await projectService.removeMember("org-1", "p-1", "u-1");
    expect(spy).toHaveBeenCalledWith(
      PROJECT_ENDPOINTS.member("org-1", "p-1", "u-1"),
      {
        method: "DELETE",
      }
    );
  });
});
