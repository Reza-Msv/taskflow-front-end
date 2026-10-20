import { z } from "zod";

export const taskPriorityEnum = z.enum([
  "lowest",
  "low",
  "medium",
  "high",
  "urgent",
]);

export const taskTypeEnum = z.enum(["task", "bug", "story", "epic", "subtask"]);

export const taskCreateSchema = z.object({
  title: z
    .string()
    .min(1, "Task title is required")
    .max(255, "Task title must be at most 255 characters"),
  description: z.string().max(10000).optional().nullable(),
  type: taskTypeEnum.default("task"),
  priority: taskPriorityEnum.default("medium"),
  status: z.string().optional().nullable(),
  assignee_id: z.string().uuid("Invalid assignee ID").optional().nullable(),
  due_date: z.string().optional().nullable(),
  estimated_points: z
    .number()
    .min(0, "Points must be positive")
    .optional()
    .nullable(),
  rank: z.string().optional().nullable(),
});

export type TaskCreateFormData = z.infer<typeof taskCreateSchema>;

export const taskUpdateSchema = z.object({
  title: z
    .string()
    .min(1, "Task title is required")
    .max(255, "Task title must be at most 255 characters")
    .optional(),
  description: z.string().max(10000).optional().nullable(),
  priority: taskPriorityEnum.optional().nullable(),
  assignee_id: z.string().uuid("Invalid assignee ID").optional().nullable(),
  due_date: z.string().optional().nullable(),
  estimated_points: z
    .number()
    .min(0, "Points must be positive")
    .optional()
    .nullable(),
  version: z.number().int().optional().nullable(),
});

export type TaskUpdateFormData = z.infer<typeof taskUpdateSchema>;

export const taskMoveSchema = z.object({
  status: z.string().min(1, "Status is required"),
  rank: z.string().optional().nullable(),
  version: z.number().int().optional().nullable(),
});

export const createTaskSchema = taskCreateSchema;
export const updateTaskSchema = taskUpdateSchema;
export const moveTaskSchema = taskMoveSchema;
