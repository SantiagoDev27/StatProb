import type { HTMLAttributes } from "react";
import { cn } from "@/shared/lib";

export type BadgeVariant = "primary" | "accent" | "neutral" | "success";

const variantClasses: Record<BadgeVariant, string> = {
  primary: "border-primary/30 bg-primary/10 text-primary",
  accent: "border-accent/30 bg-accent/15 text-[#b5a7f8]",
  neutral: "border-border-strong bg-surface-hover text-muted",
  success: "border-success/30 bg-success/10 text-success",
};

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

export function Badge({ variant = "primary", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-1.5 py-0.5",
        "font-mono text-[10px] font-medium uppercase tracking-wider",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
