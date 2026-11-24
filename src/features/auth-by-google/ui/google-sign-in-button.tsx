"use client";

import { signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ensureUserRecordInDb } from "@/entities/user";
import {
  firebaseAuth,
  getFirebaseAuthErrorMessage,
  googleAuthProvider,
} from "@/shared/api";
import { ROUTES } from "@/shared/config";
import { Alert } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { GoogleIcon } from "@/shared/ui/icons";

/** Botón de acceso y registro con Google mediante Firebase Authentication. */
export function GoogleSignInButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    function handlePageShow() {
      setPending(false);
    }
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  async function handleGoogleSignIn() {
    setErrorMessage(null);
    setPending(true);

    try {
      const credential = await signInWithPopup(firebaseAuth, googleAuthProvider);
      await ensureUserRecordInDb(credential.user);
      router.push(ROUTES.main);
    } catch (error) {
      setErrorMessage(getFirebaseAuthErrorMessage(error));
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Button
        type="button"
        variant="outline"
        disabled={pending}
        onClick={handleGoogleSignIn}
        className="self-start px-6"
      >
        <GoogleIcon />
        {pending ? "Conectando con Google…" : "Google"}
      </Button>
      {errorMessage && <Alert tone="error">{errorMessage}</Alert>}
    </div>
  );
}
