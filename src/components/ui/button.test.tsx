import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { Button } from "./button";

describe("Button component", () => {
  it("renders with default styles and children", () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("bg-primary");
    expect(button).toHaveClass("text-primary-foreground");
    expect(button).toHaveClass("h-10");
  });

  it("applies secondary variant classes properly", () => {
    render(<Button variant="secondary">Cancel</Button>);
    const button = screen.getByRole("button", { name: /cancel/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("bg-secondary");
    expect(button).toHaveClass("text-secondary-foreground");
  });

  it("renders disabled state correctly without reacting to hover", () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole("button", { name: /disabled/i });
    expect(button).toBeDisabled();
    expect(button).toHaveClass("disabled:opacity-50");
    expect(button).toHaveClass("disabled:pointer-events-none");
  });

  it("renders loading state correctly, preventing duplicate submissions", () => {
    render(<Button isLoading>Submit</Button>);
    const button = screen.getByRole("button", { name: /submit/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });
});
