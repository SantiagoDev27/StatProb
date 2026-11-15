"use client";

import { useState, type FormEvent } from "react";
import { Alert } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { ArrowRightIcon, UserIcon } from "@/shared/ui/icons";
import { InputField, PasswordField } from "@/shared/ui/input-field";
import { validateRegister, type RegisterErrors } from "../model/validate-register";

export function RegisterForm() {
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [message, setMessage] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");

    setMessage(null);

    const nextErrors = validateRegister({ email, password });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    // TODO: conectar con la API de registro.
    setMessage("El registro aún no está disponible. Muy pronto podrás crear tu cuenta.");
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <InputField
        label="Correo electrónico"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="ejemplo@universidad.edu"
        icon={<UserIcon />}
        error={errors.email}
      />

      <PasswordField
        label="Contraseña"
        name="password"
        autoComplete="new-password"
        placeholder="••••••••••"
        error={errors.password}
      />

      {message && <Alert>{message}</Alert>}

      <Button type="submit" size="lg" fullWidth className="mt-2">
        Registrarse en StatProb
        <ArrowRightIcon />
      </Button>
    </form>
  );
}

