import { z } from "zod";

export const organizationCreateSchema = z.object({
  name: z
    .string()
    .min(1, "Organization name is required")
    .max(255, "Organization name must be at most 255 characters"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(100, "Slug must be at most 100 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must contain only lowercase alphanumeric characters and single hyphens (e.g. acme-corp)"
    ),
});

export type OrganizationCreateFormData = z.infer<
  typeof organizationCreateSchema
>;

export const organizationUpdateSchema = z.object({
  name: z
    .string()
    .min(1, "Organization name is required")
    .max(255, "Organization name must be at most 255 characters")
    .optional(),
  is_active: z.boolean().optional(),
});

export type OrganizationUpdateFormData = z.infer<
  typeof organizationUpdateSchema
>;

export const addMemberSchema = z.object({
  user_id: z.string().min(1, "User ID is required"),
  role: z.enum(["admin", "member", "guest", "viewer"]),
});

export type AddMemberFormData = z.infer<typeof addMemberSchema>;

export const inviteMemberSchema = z.object({
  email: z.string().email("Invalid email address").max(255),
  role: z.enum(["admin", "member", "guest", "viewer"]),
});

export type InviteMemberFormData = z.infer<typeof inviteMemberSchema>;

export const projectCreateSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(255, "Project name must be at most 255 characters"),
  key: z
    .string()
    .min(2, "Key must be at least 2 characters")
    .max(20, "Key must be at most 20 characters")
    .regex(
      /^[A-Z0-9]+$/,
      "Project key must be uppercase alphanumeric (e.g. TF, CORE)"
    ),
  description: z.string().max(2000).optional().nullable(),
  is_private: z.boolean().default(false),
});

export type ProjectCreateFormData = z.infer<typeof projectCreateSchema>;

export const projectUpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional().nullable(),
  is_private: z.boolean().optional(),
  is_archived: z.boolean().optional(),
});

export type ProjectUpdateFormData = z.infer<typeof projectUpdateSchema>;

export const addProjectMemberSchema = z.object({
  user_id: z.string().min(1, "User ID is required"),
  role: z.enum(["admin", "member", "viewer"]),
});

export type AddProjectMemberFormData = z.infer<typeof addProjectMemberSchema>;
