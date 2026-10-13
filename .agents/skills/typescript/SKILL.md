---
name: typescript
description: Strict TypeScript rules, discriminated unions, and generated OpenAPI contracts.
---

# TypeScript Skill

## Rules

1. **Strict Mode**: `noImplicitAny: true`, strict null checks, no loose casts (`as any`).
2. **Contract-Driven**: Derive remote data shapes from `src/services/generated/api-types.ts`.
3. **Discriminated Unions**: Use discriminated unions for status types (e.g. `type WorkItem = Task | Bug | Story`).
4. **Zod Validation**: Use Zod to infer form input types (`z.infer<typeof schema>`).
