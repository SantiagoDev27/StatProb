/**
 * Flag de pruebas: permite entrar a /main escribiendo "admin" como usuario y contraseña.
 *
 * Activa por defecto. Para desactivarla define en `.env.local`:
 *   NEXT_PUBLIC_ADMIN_TEST_LOGIN=false
 *
 * ⚠️ Eliminar (o desactivar) antes de conectar la autenticación real.
 */
export const ADMIN_TEST_LOGIN = {
  enabled: process.env.NEXT_PUBLIC_ADMIN_TEST_LOGIN !== "false",
  username: "admin",
  password: "admin",
} as const;

