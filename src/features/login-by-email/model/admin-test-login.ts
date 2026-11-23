import { ADMIN_TEST_LOGIN } from "@/shared/config";

/** Devuelve true si las credenciales coinciden con la flag de pruebas local/local. */
export function isAdminTestLogin(username: string, password: string): boolean {
  return (
    ADMIN_TEST_LOGIN.enabled &&
    username === ADMIN_TEST_LOGIN.username &&
    password === ADMIN_TEST_LOGIN.password
  );
}

