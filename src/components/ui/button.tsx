import React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors duration-150 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-none hover:bg-primary-hover active:bg-primary-active",
        secondary:
          "border border-secondary-border bg-secondary text-secondary-foreground shadow-none hover:bg-secondary-hover active:bg-secondary-active",
        outline:
          "border border-input bg-background text-foreground shadow-none hover:bg-secondary hover:text-foreground active:bg-muted",
        ghost:
          "text-foreground hover:bg-secondary hover:text-foreground active:bg-muted",
        destructive:
          "bg-destructive text-destructive-foreground shadow-none hover:bg-destructive/90 active:bg-destructive/95",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2 gap-2 text-sm min-h-[40px] sm:min-h-[40px]",
        sm: "h-8 rounded-md px-3 text-xs gap-1.5",
        lg: "h-11 rounded-lg px-6 text-sm gap-2",
        icon: "h-10 w-10 min-h-[40px] min-w-[40px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isActuallyDisabled = disabled || isLoading;

    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          aria-disabled={isActuallyDisabled}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isActuallyDisabled}
        aria-busy={isLoading ? "true" : undefined}
        {...props}
      >
        {isLoading && (
          <Loader2
            className="h-4 w-4 shrink-0 animate-spin text-current"
            aria-hidden="true"
          />
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
