import { describe, it, expect } from "vitest";
import {
  taskCreateSchema,
  taskUpdateSchema,
  taskMoveSchema,
} from "./task-schemas";

describe("task-schemas", () => {
  describe("taskCreateSchema", () => {
    it("validates valid task creation payload", () => {
      const valid = {
        title: "Build Kanban Board",
        description: "Accessible column reordering",
        type: "task",
        priority: "high",
        status: "todo",
        estimated_points: 3.5,
      };
      const res = taskCreateSchema.safeParse(valid);
      expect(res.success).toBe(true);
    });

    it("fails when title is empty", () => {
      const invalid = {
        title: "",
      };
      const res = taskCreateSchema.safeParse(invalid);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toContain("Task title is required");
      }
    });

    it("fails when assignee_id is not a valid uuid", () => {
      const invalid = {
        title: "Fix bug",
        assignee_id: "not-a-uuid",
      };
      const res = taskCreateSchema.safeParse(invalid);
      expect(res.success).toBe(false);
    });
  });

  describe("taskUpdateSchema", () => {
    it("validates partial update with optimistic lock version", () => {
      const valid = {
        title: "Updated Bug Title",
        priority: "urgent",
        version: 2,
      };
      const res = taskUpdateSchema.safeParse(valid);
      expect(res.success).toBe(true);
    });
  });

  describe("taskMoveSchema", () => {
    it("validates target status and rank with version lock", () => {
      const valid = {
        status: "in_progress",
        rank: "0|000005:",
        version: 1,
      };
      const res = taskMoveSchema.safeParse(valid);
      expect(res.success).toBe(true);
    });

    it("fails when status is missing", () => {
      const invalid = {
        rank: "0|000005:",
      };
      const res = taskMoveSchema.safeParse(invalid);
      expect(res.success).toBe(false);
    });
  });
});
