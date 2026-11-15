"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SIDEBAR_DATASETS } from "@/entities/dataset";
import { MOCK_WORKSPACE } from "@/entities/workspace";
import { ROUTES } from "@/shared/config";
import { cn } from "@/shared/lib";
import { Badge } from "@/shared/ui/badge";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronsUpDownIcon,
  FileTableIcon,
  FolderIcon,
  NetworkIcon,
} from "@/shared/ui/icons";

export function WorkspaceSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col overflow-y-auto border-r border-border bg-[#06090f] lg:flex">
      {/* Marca */}
      <div className="flex h-16 items-center justify-center border-b border-border/60 px-5">
        <Link
          href={ROUTES.main}
          className="text-lg font-bold tracking-tight text-foreground"
        >
          StatProb
        </Link>
      </div>

      {/* Selector de workspace */}
      <div className="p-3">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2.5 text-left transition-colors hover:border-border-strong"
        >
          <div className="min-w-0">
            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
              Espacio de trabajo
            </p>
            <p className="mt-0.5 truncate text-xs font-medium text-foreground">
              {MOCK_WORKSPACE.name}
            </p>
          </div>
          <ChevronsUpDownIcon className="size-3.5 shrink-0 text-muted" />
        </button>
      </div>

      {/* Navegación lateral */}
      <nav aria-label="Espacio privado" className="flex flex-1 flex-col gap-1 px-3 py-2">
        <p className="px-2 pb-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
          Espacio privado
        </p>

        {/* Carpeta activa: Mis Datasets */}
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-lg bg-primary px-2.5 py-2 text-xs font-semibold text-primary-foreground shadow-[0_0_20px_-8px_var(--color-primary)]"
        >
          <span className="flex items-center gap-2">
            <ChevronDownIcon className="size-3.5" />
            <FolderIcon className="size-4" />
            <span>Mis Datasets</span>
          </span>
          <span className="rounded bg-primary-foreground/15 px-1.5 py-0.5 font-mono text-[10px] font-bold">
            {MOCK_WORKSPACE.datasetsCount}
          </span>
        </button>

        {/* Lista de datasets en barra lateral */}
        <ul className="mt-1 ml-3 flex flex-col gap-0.5 border-l border-border/70 pl-2.5">
          {SIDEBAR_DATASETS.map((item) => {
            const href = ROUTES.datasetDetail(item.id);
            const active = pathname.startsWith(href);
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

        {/* Carpeta colapsada: Grafos */}
        <button
          type="button"
          className="mt-2 flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium text-muted transition-colors hover:bg-surface hover:text-foreground"
        >
          <span className="flex items-center gap-2">
            <ChevronRightIcon className="size-3.5" />
            <NetworkIcon className="size-4" />
            <span>Grafos</span>
          </span>
          <span className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] text-muted">
            {MOCK_WORKSPACE.graphsCount}
          </span>
        </button>
      </nav>

      {/* Indicador de almacenamiento */}
      <div className="p-3">
        <div className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2.5 font-mono text-[11px]">
          <span className="flex items-center gap-2 text-muted">
            <span className="size-2 rounded-full bg-success" aria-hidden />
            Almacenamiento:
          </span>
          <span className="font-medium text-primary">
            {MOCK_WORKSPACE.storageUsed} / {MOCK_WORKSPACE.storageLimit}
          </span>
        </div>
      </div>
    </aside>
  );
}

