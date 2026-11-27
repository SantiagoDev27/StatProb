"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  formatStorageBytes,
  getJsonByteSize,
  MAX_STORAGE_BYTES,
  MAX_STORAGE_LABEL,
  useAllDatasets,
  useDatasetsStorageBytes,
} from "@/entities/dataset";
import { useCurrentUser } from "@/entities/user";
import { ROUTES } from "@/shared/config";
import { cn } from "@/shared/lib";
import { Badge } from "@/shared/ui/badge";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  FileTableIcon,
  FolderIcon,
  NetworkIcon,
  StatProbIcon,
} from "@/shared/ui/icons";

export function WorkspaceSidebar() {
  const pathname = usePathname();
  const allDatasets = useAllDatasets();
  const datasetsBytes = useDatasetsStorageBytes();
  const { user } = useCurrentUser();
  const [isDatasetsOpen, setIsDatasetsOpen] = useState(true);
  const recentSidebarDatasets = allDatasets.slice(0, 4);

  const photoBytes = user.photoUrl ? getJsonByteSize(user.photoUrl) : 0;
  const totalUsedBytes = datasetsBytes + photoBytes;
  const usagePct = Math.min(100, (totalUsedBytes / MAX_STORAGE_BYTES) * 100);
  const formattedUsed = formatStorageBytes(totalUsedBytes);

  const statusLevel =
    usagePct >= 90 ? "danger" : usagePct >= 70 ? "warning" : "normal";

  const isGraphsActive =
    pathname === ROUTES.graphs || pathname.startsWith(`${ROUTES.graphs}/`);
  const isDatasetsSectionActive = !isGraphsActive && pathname !== ROUTES.profile;

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col overflow-y-auto border-r border-border bg-[#06090f] lg:flex">
      {/* Marca con icono de la aplicación a la izquierda */}
      <div className="flex h-16 items-center justify-center border-b border-border/60 px-5">
        <Link
          href={ROUTES.main}
          className="inline-flex items-center gap-2.5 text-lg font-bold tracking-tight text-foreground"
        >
          <StatProbIcon className="size-7 shrink-0" />
          <span>StatProb</span>
        </Link>
      </div>

      {/* Navegación lateral */}
      <nav aria-label="Espacio privado" className="flex flex-1 flex-col gap-1 px-3 py-2">
        <p className="px-2 pb-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
          Espacio privado
        </p>

        {/* Carpeta desplegable: Mis Datasets */}
        <button
          type="button"
          onClick={() => setIsDatasetsOpen((prev) => !prev)}
          aria-expanded={isDatasetsOpen}
          aria-controls="sidebar-recent-datasets"
          className={cn(
            "flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs transition-colors",
            isDatasetsSectionActive
              ? "bg-primary font-semibold text-primary-foreground shadow-[0_0_20px_-8px_var(--color-primary)] hover:opacity-95"
              : "font-medium text-muted hover:bg-surface hover:text-foreground",
          )}
        >
          <span className="flex items-center gap-2">
            {isDatasetsOpen ? (
              <ChevronDownIcon className="size-3.5" />
            ) : (
              <ChevronRightIcon className="size-3.5" />
            )}
            <FolderIcon className="size-4" />
            <span>Mis Datasets</span>
          </span>
          <span
            className={cn(
              "rounded px-1.5 py-0.5 font-mono text-[10px]",
              isDatasetsSectionActive
                ? "bg-primary-foreground/15 font-bold"
                : "border border-border bg-surface text-muted",
            )}
          >
            {allDatasets.length}
          </span>
        </button>

        {/* Lista de los 4 datasets más recientes en barra lateral */}
        {isDatasetsOpen && (
          <ul
            id="sidebar-recent-datasets"
            className="mt-1 ml-3 flex flex-col gap-0.5 border-l border-border/70 pl-2.5"
          >
            {recentSidebarDatasets.map((item) => {
              const href = ROUTES.datasetDetail(item.id);
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <li key={item.id}>
                  <Link
                    href={href}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-[11px] transition-colors",
                      active
                        ? "bg-surface-hover font-medium text-foreground ring-1 ring-primary/30"
                        : "text-muted hover:bg-surface hover:text-foreground",
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <FileTableIcon className="size-3.5 shrink-0 opacity-70" />
                      <span className="truncate">{item.sidebarName}</span>
                    </span>
                    <Badge
                      variant={item.format === "XLSX" ? "success" : "primary"}
                      className="shrink-0 px-1 py-0 text-[9px]"
                    >
                      {item.format}
                    </Badge>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        {/* Sección: Grafos */}
        <Link
          href={ROUTES.graphs}
          className={cn(
            "mt-2 flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs transition-colors",
            isGraphsActive
              ? "bg-primary font-semibold text-primary-foreground shadow-[0_0_20px_-8px_var(--color-primary)] hover:opacity-95"
              : "font-medium text-muted hover:bg-surface hover:text-foreground",
          )}
        >
          <span className="flex items-center gap-2">
            {isGraphsActive ? (
              <ChevronDownIcon className="size-3.5" />
            ) : (
              <ChevronRightIcon className="size-3.5" />
            )}
            <NetworkIcon className="size-4" />
            <span>Grafos</span>
          </span>
          <span
            className={cn(
              "rounded px-1.5 py-0.5 font-mono text-[10px]",
              isGraphsActive
                ? "bg-primary-foreground/15 font-bold"
                : "border border-border bg-surface text-muted",
            )}
          >
            {allDatasets.length}
          </span>
        </Link>
      </nav>

      {/* Indicador funcional de almacenamiento (límite 10 MB) */}
      <div className="p-3">
        <div
          title={`Datasets: ${formatStorageBytes(datasetsBytes)} · Perfil: ${formatStorageBytes(photoBytes)} (${usagePct.toFixed(1)}% de ${MAX_STORAGE_LABEL})`}
          className="flex flex-col gap-2 rounded-lg border border-border bg-surface px-3 py-2.5 font-mono text-[11px]"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-muted">
              <span
                className={cn(
                  "size-2 rounded-full",
                  statusLevel === "danger"
                    ? "bg-danger"
                    : statusLevel === "warning"
                      ? "bg-amber-400"
                      : "bg-success",
                )}
                aria-hidden
              />
              Almacenamiento:
            </span>
            <span
              className={cn(
                "font-medium",
                statusLevel === "danger"
                  ? "text-danger"
                  : statusLevel === "warning"
                    ? "text-amber-400"
                    : "text-primary",
              )}
            >
              {formattedUsed} / {MAX_STORAGE_LABEL}
            </span>
          </div>

          <div
            role="progressbar"
            aria-label="Uso de almacenamiento"
            aria-valuenow={Math.round(usagePct)}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-1.5 w-full overflow-hidden rounded-full bg-background/80"
          >
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300",
                statusLevel === "danger"
                  ? "bg-danger"
                  : statusLevel === "warning"
                    ? "bg-amber-400"
                    : "bg-primary",
              )}
              style={{
                width: `${totalUsedBytes > 0 ? Math.max(2, usagePct) : 0}%`,
              }}
            />
          </div>

          {statusLevel === "danger" && (
            <p className="text-[10px] text-danger">
              {totalUsedBytes >= MAX_STORAGE_BYTES
                ? "Límite de 10 MB alcanzado. Elimina un dataset para liberar espacio."
                : "Espacio casi lleno (> 90 % usado)."}
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
