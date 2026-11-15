import type { HTMLAttributes } from "react";
import { cn } from "@/shared/lib";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border border-primary/30 bg-primary/10 px-1.5 py-0.5",
        "font-mono text-[10px] font-medium uppercase tracking-wider text-primary",
        className,
      )}
      {...props}
    />
  );
}

