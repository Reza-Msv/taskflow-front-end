import { describe, it, expect } from "vitest";
import {
  sprintCreateSchema,
  sprintUpdateSchema,
  sprintStartSchema,
  sprintCompleteSchema,
  estimateTaskSchema,
  sprintRetrospectiveSchema,
} from "./scrum-schemas";

describe("Scrum Zod Validation Schemas", () => {
  describe("sprintCreateSchema", () => {
    it("validates valid sprint create payload", () => {
      const valid = {
        name: "Sprint 1",
        goal: "Foundation",
        start_date: "2026-10-01T00:00:00Z",
        end_date: "2026-10-15T00:00:00Z",
      };
      const res = sprintCreateSchema.safeParse(valid);
      expect(res.success).toBe(true);
    });

    it("rejects empty sprint name", () => {
      const res = sprintCreateSchema.safeParse({
        name: "   ",
      });
      expect(res.success).toBe(false);
    });

    it("rejects end_date less than or equal to start_date", () => {
      const res = sprintCreateSchema.safeParse({
        name: "Sprint 1",
        start_date: "2026-10-15T00:00:00Z",
        end_date: "2026-10-10T00:00:00Z",
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toContain("end date must be strictly after");
      }
    });
  });

  describe("sprintCompleteSchema", () => {
    it("validates completion with backlog rollover", () => {
      const res = sprintCompleteSchema.safeParse({
        move_unfinished_to: "backlog",
      });
      expect(res.success).toBe(true);
    });

    it("requires target_sprint_id when move_unfinished_to is next_sprint", () => {
      const invalid = sprintCompleteSchema.safeParse({
        move_unfinished_to: "next_sprint",
        target_sprint_id: "",
      });
      expect(invalid.success).toBe(false);

      const valid = sprintCompleteSchema.safeParse({
        move_unfinished_to: "next_sprint",
        target_sprint_id: "sprint-target-123",
      });
      expect(valid.success).toBe(true);
    });
  });

  describe("estimateTaskSchema", () => {
    it("allows valid non-negative story point values", () => {
      expect(estimateTaskSchema.safeParse({ estimated_points: 0 }).success).toBe(true);
      expect(estimateTaskSchema.safeParse({ estimated_points: 0.5 }).success).toBe(true);
      expect(estimateTaskSchema.safeParse({ estimated_points: 13 }).success).toBe(true);
      expect(estimateTaskSchema.safeParse({ estimated_points: null }).success).toBe(true);
    });

    it("rejects negative points and values exceeding 1000", () => {
      expect(estimateTaskSchema.safeParse({ estimated_points: -1 }).success).toBe(false);
      expect(estimateTaskSchema.safeParse({ estimated_points: 1001 }).success).toBe(false);
    });
  });
});
