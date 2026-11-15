"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MOCK_WORKSPACE } from "@/entities/workspace";
import { ProfileMenu } from "@/features/profile-menu";
import { ROUTES } from "@/shared/config";
import { Button } from "@/shared/ui/button";
import { DownloadIcon, SearchIcon } from "@/shared/ui/icons";

export function WorkspaceTopbar() {
  const pathname = usePathname();
  let sectionTitle = "Gestión de Datasets";
  if (pathname === ROUTES.profile) {
    sectionTitle = "Personalizar Perfil";
  } else if (pathname.endsWith("/nuevo-parametro")) {
    sectionTitle = "Nuevo Parámetro";
  } else if (pathname.startsWith("/datasets/")) {
    sectionTitle = "Panel Estadístico Principal";
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border/70 bg-background/85 px-4 backdrop-blur sm:px-6">
      {/* Izquierda: marca en móvil + migas de pan + búsqueda */}
      <div className="flex min-w-0 items-center gap-4 lg:gap-6">
        <Link
          href={ROUTES.main}
          className="text-base font-bold tracking-tight text-foreground lg:hidden"
        >
          StatProb
        </Link>

        <nav
          aria-label="Ruta actual"
          className="hidden items-center gap-1.5 text-xs text-muted md:flex"
        >
          <span>Espacio de Trabajo</span>
          <span aria-hidden>/</span>
          <span>{MOCK_WORKSPACE.shortName}</span>
          <span aria-hidden>/</span>
          <span className="font-semibold text-foreground">{sectionTitle}</span>
        </nav>

        <div className="hidden h-9 w-56 items-center gap-2 rounded-lg border border-border bg-surface px-3 sm:flex">
          <SearchIcon className="size-3.5 shrink-0 text-muted" />
          <input
            type="search"
            placeholder="Buscar datasets"
            aria-label="Buscar datasets"
            className="w-full bg-transparent text-xs text-foreground outline-none placeholder:text-muted/70"
          />
        </div>
      </div>

      {/* Derecha: exportar y menú funcional de perfil */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" className="hidden text-xs sm:inline-flex">
          <DownloadIcon className="size-3.5" />
          Exportar Todo
        </Button>

        <ProfileMenu />
      </div>
    </header>
  );
}

