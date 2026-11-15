import { cn } from "@/shared/lib";

type AvatarSize = "sm" | "md" | "lg";

const sizeClasses: Record<AvatarSize, string> = {
  sm: "size-8 text-xs rounded-full",
  md: "size-11 text-sm rounded-xl",
  lg: "size-24 text-2xl rounded-2xl",
};

type AvatarProps = {
  name: string;
  initials: string;
  size?: AvatarSize;
  online?: boolean;
  className?: string;
};

export function Avatar({
  name,
  initials,
  size = "sm",
  online = false,
  className,
}: AvatarProps) {
  return (
    <span
      role="img"
      aria-label={name}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center border border-primary/30",
        "bg-linear-to-br from-primary/25 via-surface-hover to-accent/30 font-semibold text-foreground",
        sizeClasses[size],
        className,
      )}
    >
      <span aria-hidden>{initials}</span>
      {online && (
        <span
          aria-hidden
          className={cn(
            "absolute right-1 bottom-1 rounded-full border-2 border-surface bg-success",
            size === "lg" ? "size-3.5" : "size-2.5",
          )}
        />
      )}
    </span>
  );
}

