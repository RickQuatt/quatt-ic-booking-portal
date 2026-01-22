import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-quatt-primary text-quatt-dark font-semibold hover:brightness-95",
        destructive:
          "bg-red-600 text-white font-semibold hover:bg-red-700 focus-visible:ring-red-500/20 dark:bg-red-700 dark:hover:bg-red-800",
        outline:
          "border-2 border-quatt-secondary bg-white text-gray-900 shadow-sm dark:border-quatt-primary hover:bg-gray-100 dark:bg-dark-foreground dark:text-gray-100 dark:hover:bg-gray-700 dark:hover:brightness-110",
        secondary:
          "bg-quatt-secondary text-white font-semibold hover:brightness-90",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100",
        link: "text-primary underline-offset-4 hover:underline dark:text-blue-400 dark:hover:text-blue-300",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> &
    VariantProps<typeof buttonVariants> & {
      asChild?: boolean;
    }
>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      ref={ref}
      data-slot="button"
      className={cn(
        "cursor-pointer",
        buttonVariants({ variant, size, className }),
      )}
      {...props}
    />
  );
});

Button.displayName = "Button";

export { Button, buttonVariants };
