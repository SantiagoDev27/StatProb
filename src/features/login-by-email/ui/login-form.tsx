"use client";

import {
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { resetDatasetsClientState } from "@/entities/dataset";
import { ensureUserRecordInDb } from "@/entities/user";
import { firebaseAuth, getFirebaseAuthErrorMessage } from "@/shared/api";
import { ROUTES } from "@/shared/config";
import { isValidEmail, setAuthSessionCookie } from "@/shared/lib";
import { Alert } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { ArrowRightIcon, UserIcon } from "@/shared/ui/icons";
import { InputField, PasswordField } from "@/shared/ui/input-field";
import { isAdminTestLogin } from "../model/admin-test-login";
import { validateLogin, type LoginErrors } from "../model/validate-login";

export function LoginForm() {
  const router = useRouter();
  const emailInputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    function handlePageShow() {
      setPending(false);
    }
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  async function handleForgotPassword() {
    setErrorMessage(null);
    setInfoMessage(null);

    const email = emailInputRef.current?.value.trim() ?? "";
    if (!isValidEmail(email)) {
      setErrors({
        email:
          "Ingresa un correo electrónico válido para enviar el enlace de recuperación.",
      });
      emailInputRef.current?.focus();
      return;
    }

    setErrors({});
    try {
      await sendPasswordResetEmail(firebaseAuth, email);
      setInfoMessage(
        `Si existe una cuenta asociada a ${email}, enviamos un correo para restablecer tu contraseña.`,
      );
    } catch (error) {
      setErrorMessage(getFirebaseAuthErrorMessage(error));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");

    setErrorMessage(null);
    setInfoMessage(null);

    if (isAdminTestLogin(email, password)) {
      setErrors({});
      setPending(true);
      try {
        await signOut(firebaseAuth);
      } catch {
        // Ignorar si no había sesión activa
      }
      resetDatasetsClientState();
      setAuthSessionCookie("local");
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
      setAuthSessionCookie("firebase");
      router.push(ROUTES.main);
    } catch (error) {
      setErrorMessage(getFirebaseAuthErrorMessage(error));
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <InputField
        ref={emailInputRef}
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
            onClick={handleForgotPassword}
            className="text-xs font-medium text-primary hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </button>
        }
      />

      {errorMessage && <Alert tone="error">{errorMessage}</Alert>}
      {infoMessage && <Alert tone="info">{infoMessage}</Alert>}

      <Button type="submit" size="lg" fullWidth disabled={pending} className="mt-2">
        {pending ? "Ingresando…" : "Iniciar Sesión en StatProb"}
        <ArrowRightIcon />
      </Button>
    </form>
  );
}
