import { ROUTES } from "@/shared/config";
import { ButtonLink } from "@/shared/ui/button";

export function GetStartedBanner() {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-foreground">
          ¿Listo para comenzar a calcular?
        </h2>
        <p className="text-xs text-muted">
          Crea tu cuenta gratuita y guarda tus análisis estadísticos en la nube.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <ButtonLink href={ROUTES.login} variant="ghost" size="sm">
          Iniciar Sesión
        </ButtonLink>
        <ButtonLink href={ROUTES.register} size="sm">
          Registrarse
        </ButtonLink>
      </div>
    </section>
  );
}

