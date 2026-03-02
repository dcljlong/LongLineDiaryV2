import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground border-border",
        success:
          "border-[hsl(var(--status-success)/0.28)] bg-[hsl(var(--status-success)/0.12)] text-[hsl(var(--status-success))]",
        warning:
          "border-[hsl(var(--status-warning)/0.28)] bg-[hsl(var(--status-warning)/0.12)] text-[hsl(var(--status-warning))]",
        info:
          "border-[hsl(var(--status-info)/0.28)] bg-[hsl(var(--status-info)/0.12)] text-[hsl(var(--status-info))]",
        danger:
          "border-[hsl(var(--status-danger)/0.28)] bg-[hsl(var(--status-danger)/0.12)] text-[hsl(var(--status-danger))]",
        neutral:
          "border-[hsl(var(--status-neutral)/0.28)] bg-[hsl(var(--status-neutral)/0.12)] text-[hsl(var(--status-neutral))]",
        success:
          "border-[hsl(var(--status-success)/0.28)] bg-[hsl(var(--status-success)/0.12)] text-[hsl(var(--status-success))]",
        warning:
          "border-[hsl(var(--status-warning)/0.28)] bg-[hsl(var(--status-warning)/0.12)] text-[hsl(var(--status-warning))]",
        info:
          "bg-[hsl(var(--status-info)/0.56)] text-[hsl(var(--status-info))] border border-[hsl(var(--status-info)/0.98)] font-bold shadow-[0_0_12px_currentColor/0.20]",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-[10px]",
        lg: "px-3 py-0.5 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  )
}

export { Badge, badgeVariants }





