import type { Metadata } from "next";
import Link from "next/link";
import { GoogleSignInButton } from "@/features/auth-by-google";
import { RegisterForm } from "@/features/register-by-email";
import { ROUTES } from "@/shared/config";
import { Divider } from "@/shared/ui/divider";
import { AuthHeading } from "@/widgets/auth-layout";

export const metadata: Metadata = {
  title: "Registrarse",
};

export function RegisterPage() {
  return (
    <section className="flex flex-col gap-6">
      <AuthHeading
        title="¡Regístrate! Es gratis."
        description="Ingresa un correo y una contraseña para registrarte totalmente gratis."
      />
      <RegisterForm />
      <Divider label="O continúa con" />
      <GoogleSignInButton />
      <p className="text-center text-xs text-muted">
        ¿Ya tienes una cuenta?{" "}
        <Link href={ROUTES.login} className="font-medium text-primary hover:underline">
          Inicia sesión
        </Link>
      </p>
    </section>
  );
}

