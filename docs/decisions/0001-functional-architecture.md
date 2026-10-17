# ADR 0001: Functional Programming Architecture & Zero Custom Classes

## Status

Accepted

## Context

Frontend applications using object-oriented abstractions often suffer from hidden mutable state, tight coupling, prototype inheritance complexities, and context binding issues with `this`. In modern Next.js App Router and React 19 environments, functional composition, hooks, and immutable state transforms yield higher predictability, better tree-shaking, and simpler unit testing.

We need a clear architectural guideline defining our functional programming principles, service interface patterns, and allowable exceptions.

## Decision

We adopt a strict **Functional Programming (Zero Custom OOP Classes)** convention across the TaskFlow frontend codebase:

1. **Plain Functions and Closures**:
   - Prefer standalone pure functions, factory functions, and closure-scoped state over stateful class instances.
   - For utility operations and data transformations, use pure, deterministic functions without side effects.

2. **Plain-Object Service Exports**:
   - API and domain services must be exported as frozen or plain objects containing functional methods rather than instantiated class singletons.
   - Example (as implemented in `src/modules/auth/services/auth-service.ts`):
     ```typescript
     export const authService = {
       login,
       register,
       getCurrentUser,
       logout,
     };
     ```

3. **Factory Functions Over OOP Builders**:
   - When generating complex objects or configurations, use factory functions (e.g., `createApiError()`, `createColumnDefs()`) rather than class constructors or builder patterns.

4. **Legitimate Exceptions**:
   - **Custom Errors**: Subclassing the native JavaScript `Error` (e.g., `class ApiClientError extends Error` in `src/services/api-client.ts`) is explicitly permitted to preserve native stack traces, runtime `instanceof` semantics, and HTTP error payload handling.
   - **Third-Party & Framework APIs**: Where Next.js, React, or third-party libraries mandate class usage or prototype methods, use them without unnatural workarounds.
   - **No Dogmatic Rewrites**: Do not rewrite stable third-party or framework constructs simply to eliminate the `class` keyword.

## Consequences

### Positive

- **Predictable Data Flow**: Eliminates unintended state mutation across component renders.
- **Improved Testability**: Plain functions with explicit inputs and outputs are trivial to mock and test in Vitest without managing class instantiation lifecycles.
- **Tree-Shaking**: Bundlers can eliminate unused functions more effectively than class methods.
- **No `this` Binding Issues**: Eliminates bugs related to losing execution context when passing methods as callbacks.

### Trade-offs & Mitigations

- Developers with traditional OOP backgrounds must adapt to functional patterns; this ADR and `docs/frontend-guidelines.md` serve as the mandatory onboarding reference.
- Custom error hierarchy requires extending `Error`; documented as an explicit, safe exception.
