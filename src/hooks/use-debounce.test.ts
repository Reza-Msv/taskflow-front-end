import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useDebounce } from "./use-debounce";

describe("useDebounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("initial", 300));
    expect(result.current).toBe("initial");
  });

  it("updates debounced value after the specified delay", () => {
    const { result, rerender } = renderHook(
      ({ val, delay }) => useDebounce(val, delay),
      { initialProps: { val: "first", delay: 300 } }
    );

    expect(result.current).toBe("first");

    // Change prop
    rerender({ val: "second", delay: 300 });
    // Still old value before timer expires
    expect(result.current).toBe("first");

    // Advance halfway
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(result.current).toBe("first");

    // Advance rest of delay
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(result.current).toBe("second");
  });

  it("cancels pending timer if value updates before delay expires", () => {
    const { result, rerender } = renderHook(
      ({ val }) => useDebounce(val, 300),
      { initialProps: { val: "first" } }
    );

    rerender({ val: "second" });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toBe("first");

    // Rapid second change
    rerender({ val: "third" });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    // Should still be 'first' because 300ms has not passed since 'third'
    expect(result.current).toBe("first");

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe("third");
  });
});
