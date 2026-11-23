"use client";

import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { cn } from "@/shared/lib";
import { Alert } from "@/shared/ui/alert";
import { Avatar } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import {
  CloudUploadIcon,
  InfoIcon,
  TrashIcon,
  UploadIcon,
  UserCogIcon,
} from "@/shared/ui/icons";
import {
  AVATAR_ACCEPT_ATTRIBUTE,
  processAvatarImage,
} from "../lib/process-avatar-image";

interface AvatarUploaderProps {
  name: string;
  initials: string;
  photoUrl?: string | null;
  onUpdatePhoto: (photoDataUrl: string | null) => Promise<void>;
}

export function AvatarUploader({
  name,
  initials,
  photoUrl,
  onUpdatePhoto,
}: AvatarUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [feedback, setFeedback] = useState<{
    tone: "info" | "error";
    text: string;
  } | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setFeedback(null);
    setBusy(true);

    try {
      const compressedDataUrl = await processAvatarImage(file);
      await onUpdatePhoto(compressedDataUrl);
      setFeedback({
        tone: "info",
        text: "Tu foto de perfil fue actualizada y sincronizada en tiempo real.",
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo subir la foto de perfil. Inténtalo de nuevo.";
      setFeedback({ tone: "error", text: message });
    } finally {
      setBusy(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    void handleFile(file);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (!isDragging) setIsDragging(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    void handleFile(file);
  }

  async function handleRemovePhoto() {
    if (!photoUrl) return;
    setFeedback(null);
    setBusy(true);

    try {
      await onUpdatePhoto(null);
      setFeedback({
        tone: "info",
        text: "Tu foto de perfil fue eliminada. Ahora se muestran tus iniciales.",
      });
    } catch {
      setFeedback({
        tone: "error",
        text: "No se pudo eliminar la foto. Verifica tu conexión e inténtalo de nuevo.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-4">
        <h2 className="flex items-center gap-2.5 text-sm font-semibold text-foreground">
          <UserCogIcon className="size-4.5 text-primary" />
          1. Identidad Visual y Foto de Perfil
        </h2>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
          Avatar telemetry
        </span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={AVATAR_ACCEPT_ATTRIBUTE}
        onChange={handleInputChange}
        aria-label="Seleccionar foto de perfil"
        className="hidden"
      />

      <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center">
        <Avatar
          name={name}
          initials={initials}
          src={photoUrl}
          size="lg"
          online
        />

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              size="sm"
              disabled={busy}
              onClick={() => fileInputRef.current?.click()}
              className="h-9 px-4 text-xs font-semibold"
            >
              <UploadIcon className="size-3.5" />
              {busy ? "Procesando…" : "Subir Nueva Foto"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy || !photoUrl}
              onClick={handleRemovePhoto}
              className="h-9 px-4 text-xs"
            >
              <TrashIcon className="size-3.5 text-muted" />
              Eliminar foto
            </Button>
          </div>

          <div className="flex items-start gap-2 text-xs leading-5 text-muted">
            <InfoIcon className="mt-0.5 size-3.5 shrink-0 text-muted" />
            <p>
              Formatos admitidos:{" "}
              <span className="font-mono text-foreground">JPG, PNG o WEBP</span>.
              Máximo <span className="font-mono text-foreground">5 MB</span>.
              <br />
              Tamaño recomendado:{" "}
              <span className="font-mono text-primary">400×400 px</span> con
              encuadre centrado.
            </p>
          </div>
        </div>
      </div>

      {/* Zona de arrastre interactiva */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Arrastra y suelta o haz clic para subir una foto de perfil"
        onClick={() => {
          if (!busy) fileInputRef.current?.click();
        }}
        onKeyDown={(event) => {
          if (!busy && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "mt-6 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-6 py-8 text-center transition-colors",
          isDragging
            ? "border-primary bg-primary/10"
            : "border-border-strong bg-background/50 hover:border-primary/50 hover:bg-background/70",
          busy && "pointer-events-none opacity-60",
        )}
      >
        <CloudUploadIcon
          className={cn("size-6", isDragging ? "text-primary" : "text-muted")}
        />
        <p className="text-xs font-medium text-foreground">
          {isDragging
            ? "Suelta la imagen aquí para actualizar tu avatar"
            : "O arrastra y suelta un archivo de imagen aquí"}
        </p>
        <p className="font-mono text-[11px] text-muted">
          Compresión automática y recorte centrado de proporción 1:1
        </p>
      </div>

      {feedback && (
        <div className="mt-5">
          <Alert tone={feedback.tone}>{feedback.text}</Alert>
        </div>
      )}
    </Card>
  );
}
