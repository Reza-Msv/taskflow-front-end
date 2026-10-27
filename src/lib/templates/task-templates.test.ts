import { describe, it, expect, beforeEach } from "vitest";
import {
  STANDARD_TASK_TEMPLATES,
  getCustomTemplates,
  saveCustomTemplate,
  deleteCustomTemplate,
  getAllTemplates,
} from "./task-templates";

describe("task-templates", () => {
  const projectId = "proj-templates-test";

  beforeEach(() => {
    localStorage.clear();
  });

  it("exports standard templates including bug, story, task, and milestone", () => {
    expect(STANDARD_TASK_TEMPLATES.length).toBeGreaterThanOrEqual(4);
    const types = STANDARD_TASK_TEMPLATES.map((t) => t.type);
    expect(types).toContain("bug");
    expect(types).toContain("story");
    expect(types).toContain("task");
    expect(types).toContain("milestone");
  });

  it("returns standard templates when no custom templates are saved", () => {
    const all = getAllTemplates(projectId);
    expect(all).toEqual(STANDARD_TASK_TEMPLATES);
  });

  it("saves and retrieves custom templates in localStorage", () => {
    const saved = saveCustomTemplate(projectId, {
      name: "Security Vulnerability",
      descriptionSnippet: "Report for security issues",
      type: "bug",
      priority: "urgent",
      titlePrefix: "[CVE]: ",
      descriptionTemplate: "CVE Details...",
    });

    expect(saved.id).toContain("custom-");
    expect(saved.isCustom).toBe(true);

    const custom = getCustomTemplates(projectId);
    expect(custom).toHaveLength(1);
    expect(custom[0].name).toBe("Security Vulnerability");

    const all = getAllTemplates(projectId);
    expect(all).toHaveLength(STANDARD_TASK_TEMPLATES.length + 1);
  });

  it("deletes a custom template", () => {
    const saved = saveCustomTemplate(projectId, {
      name: "To be deleted",
      descriptionSnippet: "Snippet",
      type: "task",
      priority: "low",
      titlePrefix: "[DeleteMe]: ",
      descriptionTemplate: "Details",
    });

    deleteCustomTemplate(projectId, saved.id);
    const custom = getCustomTemplates(projectId);
    expect(custom).toHaveLength(0);
  });
});
