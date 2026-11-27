export const AUTH_SESSION_COOKIE = "statprob_session";
export const LOCAL_TEST_SESSION_KEY = "statprob:local-test-session";

/**
 * Marca la sesión activa mediante cookie (`statprob_session`) para que
 * `proxy.ts` en Next.js 16 autorice las rutas protegidas del workspace.
 */
export function setAuthSessionCookie(mode: "firebase" | "local"): void {
  if (typeof document === "undefined") return;

  if (mode === "firebase") {
    document.cookie = `${AUTH_SESSION_COOKIE}=firebase; path=/; max-age=604800; SameSite=Lax`;
    try {
      window.sessionStorage.removeItem(LOCAL_TEST_SESSION_KEY);
    } catch {
      // Ignorar si sessionStorage no está disponible
    }
    return;
  }

  document.cookie = `${AUTH_SESSION_COOKIE}=local; path=/; SameSite=Lax`;
  try {
    window.sessionStorage.setItem(LOCAL_TEST_SESSION_KEY, "1");
  } catch {
    // Ignorar si sessionStorage no está disponible
  }
}

/**
 * Limpia la cookie de sesión y el marcador del modo de prueba local.
 */
export function clearAuthSessionCookie(): void {
  if (typeof document !== "undefined") {
    document.cookie = `${AUTH_SESSION_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
  }
  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.removeItem(LOCAL_TEST_SESSION_KEY);
    } catch {
      // Ignorar si sessionStorage no está disponible
    }
  }
}

/**
 * Indica si el usuario inició sesión explícitamente con la cuenta de prueba `local/local`.
 */
export function hasLocalTestSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(LOCAL_TEST_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}
