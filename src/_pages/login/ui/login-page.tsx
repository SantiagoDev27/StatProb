import type { Metadata } from "next";
import Link from "next/link";
import { GoogleSignInButton } from "@/features/auth-by-google";
import { LoginForm } from "@/features/login-by-email";
import { ROUTES } from "@/shared/config";
import { Divider } from "@/shared/ui/divider";
import { AuthHeading } from "@/widgets/auth-layout";

export const metadata: Metadata = {
  title: "Iniciar sesión",
};

export function LoginPage() {
  return (
    <section className="flex flex-col gap-6">
      <AuthHeading
        title="Bienvenido de nuevo"
        description="Ingresa tus credenciales para acceder a tus informes y tableros analíticos."
      />
      <LoginForm />
      <Divider label="O continúa con" />
      <GoogleSignInButton />
      <p className="text-center text-xs text-muted">
        ¿No tienes una cuenta?{" "}
        <Link href={ROUTES.register} className="font-medium text-primary hover:underline">
          Regístrate gratis
        </Link>
      </p>
    </section>
  );
}

