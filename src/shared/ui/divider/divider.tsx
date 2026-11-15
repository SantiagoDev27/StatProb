import { cn } from "@/shared/lib";

type DividerProps = {
  label?: string;
  className?: string;
};

export function Divider({ label, className }: DividerProps) {
  return (
    <div
      role="separator"
      className={cn(
        "flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.2em] text-muted",
        className,
      )}
    >
      <span className="h-px flex-1 bg-border" />
      {label && <span>{label}</span>}
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

