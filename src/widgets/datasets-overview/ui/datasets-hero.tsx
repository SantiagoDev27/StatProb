import Link from "next/link";
import { MOCK_WORKSPACE } from "@/entities/workspace";
import { ROUTES } from "@/shared/config";
import {
  ArrowRightIcon,
  FileEditIcon,
  ListIcon,
  PlusCircleIcon,
} from "@/shared/ui/icons";

export function DatasetsHero() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-surface p-6 sm:p-8">
      {/* Glows de fondo */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-24 size-72 rounded-full bg-primary/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-10 -right-16 size-64 rounded-full bg-accent/15 blur-3xl"
      />

      <div className="relative flex flex-col gap-6">
        {/* Cabecera */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div className="max-w-2xl">
            <p className="flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-primary">
              <span className="size-1.5 rounded-full bg-primary" aria-hidden />
              Panel principal de datos creados
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Mis Datasets &amp; Ingreso Manual
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted">
              Administra tus conjuntos de datos creados manualmente o captura
              observaciones directamente en el editor interactivo para calibrar modelos
              estadísticos.
            </p>
          </div>

          <div className="inline-flex shrink-0 items-center gap-2 self-start rounded-lg border border-border-strong bg-background/70 px-3 py-1.5 text-xs text-muted">
            <ListIcon className="size-3.5 text-primary" />
            <span>
              Datasets:{" "}
              <strong className="font-semibold text-foreground">
                {MOCK_WORKSPACE.datasetsCount} creados
              </strong>
            </span>
          </div>
        </div>

        {/* Tarjeta interna: Datos Individuales */}
        <div className="flex flex-col gap-5 rounded-xl border border-border-strong/70 bg-linear-to-br from-background/85 via-surface to-accent/10 p-5 sm:p-6">
          <span className="flex size-11 items-center justify-center rounded-xl border border-accent/30 bg-accent/15 text-[#b5a7f8]">
            <FileEditIcon className="size-5" />
          </span>

          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Datos Individuales
            </h2>
            <p className="mt-1 text-sm text-muted">
              Crea un dataset con columnas tipificadas y captura observaciones
              individuales una a una.
            </p>
          </div>

          <Link
            href={ROUTES.datasetNewParameter("muestreo-biometrico")}
            className="flex h-11 w-full items-center justify-between rounded-lg border border-border-strong bg-surface-hover/80 px-4 text-xs font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-surface-hover"
          >
            <span>Crear Dataset Individual</span>
            <ArrowRightIcon className="size-4 text-muted" />
          </Link>
        </div>

        {/* Pie de tarjeta */}
        <div className="flex flex-col justify-between gap-2 border-t border-border/60 pt-4 text-xs sm:flex-row sm:items-center">
          <p className="flex items-center gap-2 text-muted">
            <PlusCircleIcon className="size-3.5 shrink-0 text-success" />
            <span>
              Validación de tipos y cálculo de estadísticos descriptivos en tiempo real
            </span>
          </p>
          <span className="font-mono text-[11px] text-[#a78bfa]">
            Entorno local seguro
          </span>
        </div>
      </div>
    </section>
  );
}

