import { ROUTES } from "@/shared/config";
import { ButtonLink } from "@/shared/ui/button";
import { Logo } from "@/shared/ui/logo";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-4xl items-center justify-between px-6">
        <Logo href={ROUTES.home} showIcon={false} />
        <nav className="flex items-center gap-2">
          <ButtonLink href={ROUTES.login} variant="ghost" size="sm">
            Iniciar Sesión
          </ButtonLink>
          <ButtonLink href={ROUTES.register} size="sm">
            Registrarse
          </ButtonLink>
        </nav>
      </div>
    </header>
  );
}

