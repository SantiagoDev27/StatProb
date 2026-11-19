"use client";

import { createUserWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createUserRecordInDb } from "@/entities/user";
import { firebaseAuth, getFirebaseAuthErrorMessage } from "@/shared/api";
import { ROUTES } from "@/shared/config";
import { Alert } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { ArrowRightIcon, UserIcon } from "@/shared/ui/icons";
import { InputField, PasswordField } from "@/shared/ui/input-field";
import { validateRegister, type RegisterErrors } from "../model/validate-register";

export function RegisterForm() {
  const router = useRouter();
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");

    setErrorMessage(null);

    const nextErrors = validateRegister({ email, password });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      setPending(true);
      const credential = await createUserWithEmailAndPassword(
        firebaseAuth,
        email,
        password,
      );
      await createUserRecordInDb(credential.user, email);
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

      {errorMessage && <Alert tone="error">{errorMessage}</Alert>}

      <Button type="submit" size="lg" fullWidth disabled={pending} className="mt-2">
        {pending ? "Creando cuenta…" : "Registrarse en StatProb"}
        <ArrowRightIcon />
      </Button>
    </form>
  );
}
