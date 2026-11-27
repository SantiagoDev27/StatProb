"use client";

import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState, type ReactNode } from "react";
import { resetDatasetsClientState } from "@/entities/dataset";
import { firebaseAuth } from "@/shared/api";
import { ADMIN_TEST_LOGIN, ROUTES } from "@/shared/config";
import {
  clearAuthSessionCookie,
  hasLocalTestSession,
  setAuthSessionCookie,
} from "@/shared/lib";

/**
 * Guardia en cliente que verifica la sesión real en Firebase Auth o el ingreso
 * explícito con `local/local` antes de renderizar cualquier vista del workspace.
 */
export function WorkspaceAuthGuard({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<"checking" | "authorized">("checking");

  useEffect(() => {
    if (ADMIN_TEST_LOGIN.enabled && hasLocalTestSession()) {
      setAuthSessionCookie("local");
      const frame = window.requestAnimationFrame(() => setStatus("authorized"));
      return () => window.cancelAnimationFrame(frame);
    }

    const unsubscribe = onAuthStateChanged(firebaseAuth, (firebaseUser) => {
      if (firebaseUser) {
        setAuthSessionCookie("firebase");
        setStatus("authorized");
        return;
      }

      clearAuthSessionCookie();
      resetDatasetsClientState();
      window.location.replace(ROUTES.login);
    });

    return () => unsubscribe();
  }, []);

  if (status !== "authorized") {
    return (
      <div className="flex min-h-dvh flex-1 items-center justify-center bg-background px-4">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-5 py-3.5 font-mono text-xs text-muted shadow-lg">
          <span
            className="size-2 animate-pulse rounded-full bg-primary"
            aria-hidden
          />
          <span>Verificando sesión…</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
