"use client";

import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ensureUserRecordInDb } from "@/entities/user";
import { firebaseAuth, getFirebaseAuthErrorMessage } from "@/shared/api";
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");

    setErrorMessage(null);

    if (isAdminTestLogin(email, password)) {
      setErrors({});
      setPending(true);
      router.push(ROUTES.main);
      return;
    }

    const nextErrors = validateLogin({ email, password });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      setPending(true);
      const credential = await signInWithEmailAndPassword(
        firebaseAuth,
        email,
        password,
      );
      await ensureUserRecordInDb(credential.user);
      router.push(ROUTES.main);
    } catch (error) {
      setErrorMessage(getFirebaseAuthErrorMessage(error));
      setPending(false);
    }
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

      {errorMessage && <Alert tone="error">{errorMessage}</Alert>}

      <Button type="submit" size="lg" fullWidth disabled={pending} className="mt-2">
        {pending ? "Ingresando…" : "Iniciar Sesión en StatProb"}
        <ArrowRightIcon />
      </Button>
    </form>
  );
}
