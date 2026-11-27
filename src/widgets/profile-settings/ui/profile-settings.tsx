"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { getInitialsFromName, useCurrentUser } from "@/entities/user";
import { AvatarUploader } from "@/features/upload-avatar";
import { ROUTES } from "@/shared/config";
import { Alert } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import {
  ArrowLeftIcon,
  IdCardIcon,
  InfoIcon,
  LockIcon,
  SaveIcon,
} from "@/shared/ui/icons";
import { InputField } from "@/shared/ui/input-field";

export function ProfileSettings() {
  const { user, updateName, updatePhoto } = useCurrentUser();
  const [draftName, setDraftName] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    tone: "info" | "error";
    text: string;
  } | null>(null);

  const nameInput = draftName ?? user.fullName;
  const previewName = nameInput.trim() || user.fullName;
  const previewInitials = getInitialsFromName(previewName);
  const hasChanges = draftName !== null && draftName.trim() !== user.fullName;

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    const trimmed = nameInput.trim();
    if (!trimmed) {
      setNameError("El nombre no puede estar vacío.");
      return;
    }

    setNameError(undefined);
    setSaving(true);

    try {
      await updateName(trimmed);
      setDraftName(null);
      setFeedback({
        tone: "info",
        text: "Tu nombre fue actualizado correctamente en la base de datos.",
      });
    } catch {
      setFeedback({
        tone: "error",
        text: "No se pudo guardar el nombre. Verifica tu conexión e inténtalo de nuevo.",
      });
    } finally {
      setSaving(false);
    }
  }

  function handleDiscard() {
    setDraftName(null);
    setNameError(undefined);
    setFeedback(null);
  }

  return (
    <form
      onSubmit={handleSave}
      noValidate
      className="mx-auto flex w-full max-w-5xl flex-col gap-6"
    >
      {/* Navegación de regreso y encabezado */}
      <div className="flex flex-col gap-3">
        <Link
          href={ROUTES.main}
          className="inline-flex items-center gap-2 self-start font-mono text-[11px] uppercase tracking-[0.12em] text-muted transition-colors hover:text-primary"
        >
          <ArrowLeftIcon className="size-3.5" />
          Volver a datasets
        </Link>

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Personalizar Perfil
              </h1>
              <Badge>ID: {user.id}</Badge>
            </div>
            <p className="mt-1.5 text-sm text-muted">
              Actualiza tu identidad pública, foto de perfil y nombre de investigador en
              el entorno de análisis probabilístico.
            </p>
          </div>

        </div>
      </div>

      {/* Sección 1: Identidad visual y foto de perfil */}
      <AvatarUploader
        name={previewName}
        initials={previewInitials}
        photoUrl={user.photoUrl}
        onUpdatePhoto={updatePhoto}
      />

      {/* Sección 2: Nombre y datos personales */}
      <Card className="p-6">
        <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-4">
          <h2 className="flex items-center gap-2.5 text-sm font-semibold text-foreground">
            <IdCardIcon className="size-4.5 text-primary" />
            2. Nombre y Datos Personales
          </h2>
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-primary">
            Sincronizado en tiempo real
          </span>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5">
          <InputField
            label="Nombre de usuario *"
            name="name"
            variant="inset"
            value={nameInput}
            onChange={(event) => {
              setDraftName(event.target.value);
              if (nameError) setNameError(undefined);
            }}
            placeholder="Tu nombre"
            error={nameError}
            labelAside={
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
                Editable
              </span>
            }
          />

          {/* Campo de correo electrónico opaco y no editable */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="profile-readonly-email"
                className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted"
              >
                Correo electrónico
              </label>
              <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-muted">
                <LockIcon className="size-3" />
                No editable
              </span>
            </div>

            <div
              aria-disabled="true"
              className="flex h-11 cursor-not-allowed items-center justify-between gap-2.5 rounded-lg border border-border/60 bg-background/40 px-3 opacity-55 select-none"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="shrink-0 font-mono text-xs text-muted">@</span>
                <input
                  id="profile-readonly-email"
                  type="email"
                  value={user.email}
                  disabled
                  readOnly
                  tabIndex={-1}
                  className="h-full min-w-0 flex-1 cursor-not-allowed bg-transparent text-sm text-muted outline-none"
                />
              </div>

              <Badge className="shrink-0 gap-1 px-2 py-1 opacity-80">
                <LockIcon className="size-3" />
                Bloqueado
              </Badge>
            </div>

            <p className="flex items-center gap-1.5 text-xs text-muted">
              <InfoIcon className="size-3.5 shrink-0 text-muted" />
              El correo electrónico está vinculado a tu cuenta y no se puede editar.
            </p>
          </div>
        </div>

        {feedback && (
          <div className="mt-5">
            <Alert tone={feedback.tone}>{feedback.text}</Alert>
          </div>
        )}
      </Card>

      {/* Barra de acciones */}
      <Card className="flex flex-wrap items-center justify-end gap-3 px-6 py-4">
        <Button
          type="button"
          variant="outline"
          size="md"
          disabled={saving || !hasChanges}
          onClick={handleDiscard}
          className="text-xs"
        >
          Cancelar / Descartar
        </Button>
        <Button
          type="submit"
          size="md"
          disabled={saving || !hasChanges}
          className="text-xs font-semibold"
        >
          <SaveIcon className="size-3.5" />
          {saving ? "Guardando…" : "Guardar Cambios"}
        </Button>
      </Card>
    </form>
  );
}
