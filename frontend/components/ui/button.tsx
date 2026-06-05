"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium tracking-wide ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-[0_0_24px_-4px_hsl(var(--primary)/0.6)] hover:shadow-[0_0_36px_-2px_hsl(var(--primary)/0.8)] hover:brightness-110",
        destructive:
          "bg-gradient-to-r from-destructive to-pink-500 text-destructive-foreground shadow-[0_0_24px_-4px_hsl(var(--destructive)/0.6)] hover:brightness-110",
        outline:
          "border border-primary/40 bg-background/40 backdrop-blur hover:bg-primary/10 hover:border-primary/70 text-foreground",
        secondary:
          "bg-secondary/20 border border-secondary/40 text-secondary-foreground hover:bg-secondary/30",
        ghost:
          "hover:bg-primary/10 hover:text-primary-foreground text-foreground/80",
        success:
          "bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 font-semibold shadow-[0_0_24px_-4px_rgba(52,211,153,0.6)] hover:brightness-110",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
