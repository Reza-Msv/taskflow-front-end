import { describe, it, expect } from "vitest";
import {
  organizationCreateSchema,
  projectCreateSchema,
  inviteMemberSchema,
  addMemberSchema,
  addProjectMemberSchema,
} from "./org-project-schemas";

describe("org-project-schemas", () => {
  it("validates organizationCreateSchema", () => {
    expect(
      organizationCreateSchema.safeParse({ name: "Acme", slug: "acme-corp" })
        .success
    ).toBe(true);

    // Invalid slug with uppercase or spaces
    expect(
      organizationCreateSchema.safeParse({ name: "Acme", slug: "Acme Corp" })
        .success
    ).toBe(false);

    // Empty name
    expect(
      organizationCreateSchema.safeParse({ name: "", slug: "acme" }).success
    ).toBe(false);
  });

  it("validates projectCreateSchema", () => {
    expect(
      projectCreateSchema.safeParse({
        name: "TaskFlow Core",
        key: "TF",
        description: "Backend core",
        is_private: false,
      }).success
    ).toBe(true);

    // Lowercase key should fail
    expect(
      projectCreateSchema.safeParse({
        name: "TaskFlow Core",
        key: "tf",
      }).success
    ).toBe(false);

    // Key too short
    expect(
      projectCreateSchema.safeParse({
        name: "TaskFlow Core",
        key: "T",
      }).success
    ).toBe(false);
  });

  it("validates inviteMemberSchema", () => {
    expect(
      inviteMemberSchema.safeParse({
        email: "member@example.com",
        role: "admin",
      }).success
    ).toBe(true);

    expect(
      inviteMemberSchema.safeParse({
        email: "invalid-email",
        role: "member",
      }).success
    ).toBe(false);
  });

  it("validates addProjectMemberSchema", () => {
    expect(
      addProjectMemberSchema.safeParse({
        user_id: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
        role: "viewer",
      }).success
    ).toBe(true);

    // owner role is forbidden in projects
    expect(
      addProjectMemberSchema.safeParse({
        user_id: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
        role: "owner" as unknown as "admin",
      }).success
    ).toBe(false);
  });
});
