import { NextResponse, type NextRequest } from "next/server";

const AUTH_SESSION_COOKIE = "statprob_session";

/**
 * Protección en servidor (Next.js 16 Proxy) para las rutas del espacio de trabajo.
 * Solo permite continuar si existe cookie de sesión válida (`firebase` o `local`).
 */
export function proxy(request: NextRequest) {
  const sessionMode = request.cookies.get(AUTH_SESSION_COOKIE)?.value;

  if (sessionMode !== "firebase" && sessionMode !== "local") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/main",
    "/main/:path*",
    "/datasets/:path*",
    "/grafos",
    "/grafos/:path*",
    "/perfil",
    "/perfil/:path*",
  ],
};
