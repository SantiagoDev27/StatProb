"use client";

import { signOut } from "firebase/auth";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { resetDatasetsClientState } from "@/entities/dataset";
import { useCurrentUser } from "@/entities/user";
import { firebaseAuth } from "@/shared/api";
import { ROUTES } from "@/shared/config";
import { clearAuthSessionCookie, cn } from "@/shared/lib";
import { Avatar } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import {
  ChevronRightIcon,
  LogOutIcon,
  UserCogIcon,
} from "@/shared/ui/icons";

export function ProfileMenu() {
  const { user } = useCurrentUser();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  async function handleLogout() {
    setOpen(false);
    try {
      await signOut(firebaseAuth);
    } catch {
      // Ignora errores de cierre de sesión si se entró con el flag local de pruebas
    }
    clearAuthSessionCookie();
    resetDatasetsClientState();
    // Recarga completa hacia /login para limpiar caché del Router, pilas Undo/Redo y estados de React
    window.location.replace(ROUTES.login);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Abrir menú de perfil"
        className={cn(
          "flex rounded-full p-0.5 transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
          open
            ? "ring-2 ring-primary/70"
            : "ring-1 ring-border-strong hover:ring-primary/50",
        )}
      >
        <Avatar
          name={user.titleName}
          initials={user.initials}
          src={user.photoUrl}
          size="sm"
        />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Menú de usuario"
          className="absolute right-0 z-50 mt-2.5 w-80 overflow-hidden rounded-xl border border-border-strong bg-surface shadow-[0_24px_60px_-15px_rgba(0,0,0,0.85)]"
        >
          {/* Cabecera del usuario */}
          <div className="flex items-center justify-between gap-3 border-b border-border bg-linear-to-r from-primary/15 via-surface to-surface px-4 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar
                name={user.titleName}
                initials={user.initials}
                src={user.photoUrl}
                size="md"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {user.titleName}
                </p>
                <p className="truncate font-mono text-[11px] text-muted">
                  {user.email}
                </p>
              </div>
            </div>
          </div>

          {/* Opciones de cuenta */}
          <div className="p-2">
            <p className="px-2 pt-1.5 pb-2 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
              Gestión de cuenta &amp; cálculo
            </p>

            <Link
              href={ROUTES.profile}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between gap-3 rounded-lg border border-border-strong/60 bg-surface-hover/70 px-3 py-2.5 transition-colors hover:border-primary/40 hover:bg-surface-hover"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
                  <UserCogIcon className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground">
                    Personalizar Perfil
                  </p>
                  <p className="truncate text-[11px] text-muted">
                    Modificar foto, nombre y credenciales
                  </p>
                </div>
              </div>
              <Badge className="shrink-0">EDITAR</Badge>
            </Link>

            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="mt-1.5 flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-danger/10"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-danger/25 bg-danger/10 text-danger">
                  <LogOutIcon className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-danger">Cerrar Sesión</p>
                  <p className="truncate text-[11px] text-muted">
                    Finalizar sesión computacional de forma segura
                  </p>
                </div>
              </div>
              <ChevronRightIcon className="size-4 shrink-0 text-muted" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
