"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/shared/config";
import { cn } from "@/shared/lib";

const TABS = [
  { href: ROUTES.login, label: "Iniciar Sesión" },
  { href: ROUTES.register, label: "Registrarse" },
] as const;

export function AuthTabs() {
  const pathname = usePathname();

  return (
    <nav aria-label="Autenticación" className="border-b border-border pb-5">
      <div className="inline-flex rounded-lg border border-border bg-surface p-1">
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-md px-4 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted hover:text-foreground",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

