"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAllDatasets } from "@/entities/dataset";
import { MOCK_WORKSPACE } from "@/entities/workspace";
import { ProfileMenu } from "@/features/profile-menu";
import { DatasetSearchBar } from "@/features/search-datasets";
import { ROUTES } from "@/shared/config";
import { Button } from "@/shared/ui/button";
import { DownloadIcon } from "@/shared/ui/icons";

type BreadcrumbItem = {
  label: string;
  href: string;
  current?: boolean;
};

export function WorkspaceTopbar() {
  const pathname = usePathname();
  const allDatasets = useAllDatasets();

  const breadcrumbs: BreadcrumbItem[] = [
    { label: "Espacio de Trabajo", href: ROUTES.main },
    { label: MOCK_WORKSPACE.shortName, href: ROUTES.main },
  ];

  if (pathname === ROUTES.profile) {
    breadcrumbs.push(
      { label: "Gestión de Datasets", href: ROUTES.main },
      { label: "Personalizar Perfil", href: ROUTES.profile, current: true },
    );
  } else if (pathname === ROUTES.graphs) {
    breadcrumbs.push(
      { label: "Gestión de Datasets", href: ROUTES.main },
      {
        label: "Mapa de Relaciones (Grafos)",
        href: ROUTES.graphs,
        current: true,
      },
    );
  } else if (pathname === ROUTES.datasetCreate) {
    breadcrumbs.push(
      { label: "Gestión de Datasets", href: ROUTES.main },
      {
        label: "Ingreso Manual de Datos",
        href: ROUTES.datasetCreate,
        current: true,
      },
    );
  } else if (pathname.startsWith("/datasets/")) {
    const segments = pathname.split("/").filter(Boolean);
    const datasetId = segments[1] ?? "";
    const dataset = allDatasets.find((d) => d.id === datasetId);
    const datasetLabel = dataset?.name ?? "Panel Estadístico Principal";
    const datasetHref = ROUTES.datasetDetail(datasetId);

    breadcrumbs.push({ label: "Gestión de Datasets", href: ROUTES.main });

    if (pathname.endsWith("/nuevo-parametro")) {
      breadcrumbs.push(
        { label: datasetLabel, href: datasetHref },
        {
          label: "Ingreso Manual de Datos",
          href: ROUTES.datasetNewParameter(datasetId),
          current: true,
        },
      );
    } else {
      breadcrumbs.push({
        label: datasetLabel,
        href: datasetHref,
        current: true,
      });
    }
  } else {
    breadcrumbs.push({
      label: "Gestión de Datasets",
      href: ROUTES.main,
      current: true,
    });
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border/70 bg-background/85 px-4 backdrop-blur sm:px-6">
      {/* Izquierda: marca en móvil + barra de direcciones unificada con Links + búsqueda */}
      <div className="flex min-w-0 flex-1 items-center gap-4 lg:gap-6">
        <Link
          href={ROUTES.main}
          className="text-base font-bold tracking-tight text-foreground lg:hidden"
        >
          StatProb
        </Link>

        <nav
          aria-label="Ruta actual"
          className="flex min-w-0 flex-wrap items-center gap-1.5 text-xs text-muted"
        >
          {breadcrumbs.map((item, idx) => (
            <span key={`${item.href}-${item.label}`} className="flex items-center gap-1.5 min-w-0">
              {idx > 0 && (
                <span aria-hidden className="text-muted/60">
                  /
                </span>
              )}
              <Link
                href={item.href}
                aria-current={item.current ? "page" : undefined}
                className={
                  item.current
                    ? "truncate font-semibold text-primary transition-colors hover:underline"
                    : "truncate transition-colors hover:text-foreground hover:underline"
                }
              >
                {item.label}
              </Link>
            </span>
          ))}
        </nav>

        <DatasetSearchBar />
      </div>

      {/* Derecha: exportar y menú funcional de perfil */}
      <div className="flex shrink-0 items-center gap-3">
        <ProfileMenu />
      </div>
    </header>
  );
}

