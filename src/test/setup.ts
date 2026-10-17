/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import "@testing-library/jest-dom";

// Configure React 19 testing environment for act(...)
// @ts-expect-error - React 19 test environment flag
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
