import Link from "next/link";
import type { ReactNode } from "react";
import { ROUTES } from "@/shared/config";
import { Logo } from "@/shared/ui/logo";
import { AuthHero } from "./auth-hero";
import { AuthTabs } from "./auth-tabs";

const legalLinkClass = "transition-colors hover:text-foreground";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-1 items-center justify-center overflow-hidden px-4 py-10 sm:px-8">
      {/* Glows decorativos */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-40 size-[480px] rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 -bottom-40 size-[480px] rounded-full bg-accent/10 blur-3xl"
      />

      <div className="relative grid w-full max-w-5xl items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <AuthHero className="hidden lg:flex" />

        <div className="mx-auto flex w-full max-w-md flex-col gap-7">
          <Logo className="lg:hidden" />
          <AuthTabs />
          {children}
          <footer className="flex items-center justify-center gap-3 text-[11px] text-muted">
            <Link href={ROUTES.terms} className={legalLinkClass}>
              Términos de servicio
            </Link>
            <span aria-hidden>·</span>
            <Link href={ROUTES.privacy} className={legalLinkClass}>
              Privacidad de datos
            </Link>
          </footer>
        </div>
      </div>
    </div>
  );
}

