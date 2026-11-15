"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ROUTES } from "@/shared/config";
import { Alert } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { ArrowRightIcon, UserIcon } from "@/shared/ui/icons";
import { InputField, PasswordField } from "@/shared/ui/input-field";
import { isAdminTestLogin } from "../model/admin-test-login";
import { validateLogin, type LoginErrors } from "../model/validate-login";

export function LoginForm() {
  const router = useRouter();
  const [errors, setErrors] = useState<LoginErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");

    setMessage(null);

    if (isAdminTestLogin(email, password)) {
      setErrors({});
      setPending(true);
      router.push(ROUTES.main);
      return;
    }

    const nextErrors = validateLogin({ email, password });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    // TODO: conectar con la API de autenticación.
    setMessage("El inicio de sesión aún no está conectado al servidor.");
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <InputField
        label="Correo electrónico"
        name="email"
        type="email"
        autoComplete="username"
        placeholder="ejemplo@universidad.edu"
        icon={<UserIcon />}
        error={errors.email}
      />

      <PasswordField
        label="Contraseña"
        name="password"
        autoComplete="current-password"
        placeholder="••••••••••"
        error={errors.password}
        labelAside={
          <button
            type="button"
            title="Próximamente"
            className="text-xs font-medium text-primary hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </button>
        }
      />

      {message && <Alert>{message}</Alert>}

      <Button type="submit" size="lg" fullWidth disabled={pending} className="mt-2">
        {pending ? "Ingresando…" : "Iniciar Sesión en StatProb"}
        <ArrowRightIcon />
      </Button>
    </form>
  );
}

