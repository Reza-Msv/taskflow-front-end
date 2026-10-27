import { z } from "zod";

export const sprintCreateSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Sprint name is required.")
      .max(255, "Sprint name must not exceed 255 characters."),
    goal: z
      .string()
      .trim()
      .max(2000, "Goal must not exceed 2000 characters.")
      .optional()
      .or(z.literal("")),
    start_date: z.string().optional().or(z.literal("")),
    end_date: z.string().optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      if (data.start_date && data.end_date) {
        const start = new Date(data.start_date).getTime();
        const end = new Date(data.end_date).getTime();
        return end > start;
      }
      return true;
    },
    {
      message: "Sprint end date must be strictly after the start date.",
      path: ["end_date"],
    }
  );

export const sprintUpdateSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Sprint name cannot be empty.")
      .max(255, "Sprint name must not exceed 255 characters.")
      .optional(),
    goal: z
      .string()
      .trim()
      .max(2000, "Goal must not exceed 2000 characters.")
      .optional()
      .or(z.literal("")),
    start_date: z.string().optional().or(z.literal("")),
    end_date: z.string().optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      if (data.start_date && data.end_date) {
        const start = new Date(data.start_date).getTime();
        const end = new Date(data.end_date).getTime();
        return end > start;
      }
      return true;
    },
    {
      message: "Sprint end date must be strictly after the start date.",
      path: ["end_date"],
    }
  );

export const sprintStartSchema = z
  .object({
    goal: z
      .string()
      .trim()
      .max(2000, "Goal must not exceed 2000 characters.")
      .optional()
      .or(z.literal("")),
    start_date: z.string().optional().or(z.literal("")),
    end_date: z.string().optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      if (data.start_date && data.end_date) {
        const start = new Date(data.start_date).getTime();
        const end = new Date(data.end_date).getTime();
        return end > start;
      }
      return true;
    },
    {
      message: "Sprint end date must be strictly after the start date.",
      path: ["end_date"],
    }
  );

export const sprintCompleteSchema = z
  .object({
    move_unfinished_to: z.enum(["backlog", "next_sprint"]),
    target_sprint_id: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.move_unfinished_to === "next_sprint" && !data.target_sprint_id) {
        return false;
      }
      return true;
    },
    {
      message: "Please select a target sprint to rollover unfinished tasks.",
      path: ["target_sprint_id"],
    }
  );

export const estimateTaskSchema = z.object({
  estimated_points: z
    .number()
    .min(0, "Points must be non-negative.")
    .max(1000, "Points cannot exceed 1000.")
    .nullable(),
});

export const sprintRetrospectiveSchema = z.object({
  what_went_well: z.string().trim().max(5000).optional().or(z.literal("")),
  what_could_be_improved: z.string().trim().max(5000).optional().or(z.literal("")),
  action_items: z.string().trim().max(5000).optional().or(z.literal("")),
});

export type SprintCreateFormData = z.infer<typeof sprintCreateSchema>;
export type SprintUpdateFormData = z.infer<typeof sprintUpdateSchema>;
export type SprintStartFormData = z.infer<typeof sprintStartSchema>;
export type SprintCompleteFormData = z.infer<typeof sprintCompleteSchema>;
export type EstimateTaskFormData = z.infer<typeof estimateTaskSchema>;
export type SprintRetrospectiveFormData = z.infer<typeof sprintRetrospectiveSchema>;
