import Link from "next/link";
import { cn } from "@/shared/lib";
import { Badge } from "@/shared/ui/badge";
import { ChartIcon } from "@/shared/ui/icons";

type LogoProps = {
  href?: string;
  showIcon?: boolean;
  showBadge?: boolean;
  className?: string;
};

export function Logo({
  href,
  showIcon = true,
  showBadge = true,
  className,
}: LogoProps) {
  const content = (
    <>
      {showIcon && (
        <span className="flex size-8 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
          <ChartIcon />
        </span>
      )}
      <span className="text-base font-bold tracking-tight text-foreground">
        StatProb
      </span>
      {showBadge && <Badge>Beta</Badge>}
    </>
  );

  const classes = cn("inline-flex items-center gap-2.5", className);

  if (href) {
    return (
      <Link href={href} className={classes} aria-label="StatProb, ir al inicio">
        {content}
      </Link>
    );
  }

  return <span className={classes}>{content}</span>;
}

