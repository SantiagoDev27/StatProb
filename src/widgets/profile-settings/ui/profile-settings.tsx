import Link from "next/link";
import { MOCK_USER } from "@/entities/user";
import { ROUTES } from "@/shared/config";
import { Avatar } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  CloudUploadIcon,
  IdCardIcon,
  InfoIcon,
  SaveIcon,
  TrashIcon,
  UploadIcon,
  UserCogIcon,
} from "@/shared/ui/icons";
import { InputField } from "@/shared/ui/input-field";

export function ProfileSettings() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
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
              <Badge>ID: {MOCK_USER.id}</Badge>
            </div>
            <p className="mt-1.5 text-sm text-muted">
              Actualiza tu identidad pública, foto de perfil y nombre de investigador en
              el entorno de análisis probabilístico.
            </p>
          </div>

          <div className="inline-flex shrink-0 items-center gap-2 self-start rounded-lg border border-border bg-surface px-3 py-1.5 font-mono text-[11px] text-muted">
            <span className="size-2 rounded-full bg-success" aria-hidden />
            <span>Entorno sinc: {MOCK_USER.syncEnvironment}</span>
          </div>
        </div>
      </div>

      {/* Sección 1: Identidad visual y foto de perfil */}
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

        <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center">
          <Avatar
            name={MOCK_USER.fullName}
            initials={MOCK_USER.initials}
            size="lg"
            online
          />

          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm" className="h-9 px-4 text-xs font-semibold">
                <UploadIcon className="size-3.5" />
                Subir Nueva Foto
              </Button>
              <Button variant="outline" size="sm" className="h-9 px-4 text-xs">
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
                <span className="font-mono text-primary">400×400 px</span> con encuadre
                centrado.
              </p>
            </div>
          </div>
        </div>

        {/* Zona de arrastre */}
        <div className="mt-6 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border-strong bg-background/50 px-6 py-8 text-center">
          <CloudUploadIcon className="size-6 text-muted" />
          <p className="text-xs font-medium text-foreground">
            O arrastra y suelta un archivo de imagen aquí
          </p>
          <p className="font-mono text-[11px] text-muted">
            Detecta compresión alfa y recorte de proporción 1:1
          </p>
        </div>
      </Card>

      {/* Sección 2: Nombre y datos personales */}
      <Card className="p-6">
        <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-4">
          <h2 className="flex items-center gap-2.5 text-sm font-semibold text-foreground">
            <IdCardIcon className="size-4.5 text-primary" />
            2. Nombre y Datos Personales
          </h2>
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-primary">
            Activo en workspace
          </span>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
          <InputField
            label="Nombre completo *"
            variant="inset"
            defaultValue={MOCK_USER.fullName}
            labelAside={
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
                Obligatorio
              </span>
            }
          />

          <InputField
            label="Nombre para mostrar / alias"
            variant="inset"
            defaultValue={MOCK_USER.alias}
            icon={<span className="font-mono text-xs">@</span>}
            labelAside={
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
                Público
              </span>
            }
          />

          <InputField
            label="Correo electrónico institucional"
            variant="inset"
            type="email"
            defaultValue={MOCK_USER.institutionalEmail}
            readOnly
            icon={<span className="font-mono text-xs">@</span>}
            className="md:col-span-2"
            trailing={
              <Badge variant="success" className="gap-1 px-2 py-1">
                <CheckCircleIcon className="size-3" />
                Verificado
              </Badge>
            }
          />
        </div>
      </Card>

      {/* Barra de acciones */}
      <Card className="flex flex-wrap items-center justify-end gap-3 px-6 py-4">
        <Button variant="outline" size="md" className="text-xs">
          Cancelar / Descartar
        </Button>
        <Button size="md" className="text-xs font-semibold">
          <SaveIcon className="size-3.5" />
          Guardar Cambios
        </Button>
      </Card>
    </div>
  );
}

