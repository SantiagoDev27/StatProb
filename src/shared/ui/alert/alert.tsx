import type { ReactNode } from "react";
import { cn } from "@/shared/lib";

type AlertTone = "info" | "error";

type AlertProps = {
  tone?: AlertTone;
  children: ReactNode;
  className?: string;
};

const toneClasses: Record<AlertTone, string> = {
  info: "border-primary/30 bg-primary/10 text-primary",
  error: "border-danger/30 bg-danger/10 text-danger",
};

export function Alert({ tone = "info", children, className }: AlertProps) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("rounded-lg border px-3 py-2.5 text-xs leading-5", toneClasses[tone], className)}
    >
      {children}
    </div>
  );
}

