import { useId, type ComponentPropsWithRef, type ReactNode } from "react";
import { cn } from "@/shared/lib";

export type InputFieldProps = ComponentPropsWithRef<"input"> & {
  label: string;
  /** Icono a la izquierda del input. */
  icon?: ReactNode;
  /** Contenido alineado a la derecha del label (p. ej. "¿Olvidaste tu contraseña?"). */
  labelAside?: ReactNode;
  /** Contenido a la derecha dentro del input (p. ej. botón de mostrar contraseña). */
  trailing?: ReactNode;
  /** Estilo de fondo del campo: "surface" por defecto o "inset" dentro de tarjetas. */
  variant?: "surface" | "inset";
  error?: string;
};

export function InputField({
  label,
  icon,
  labelAside,
  trailing,
  variant = "surface",
  error,
  id,
  className,
  ...inputProps
}: InputFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={inputId}
          className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted"
        >
          {label}
        </label>
        {labelAside}
      </div>

      <div
        className={cn(
          "group flex h-11 items-center gap-2.5 rounded-lg border px-3 transition-colors",
          variant === "inset" ? "bg-background/80" : "bg-surface",
          "focus-within:border-primary/70 focus-within:ring-2 focus-within:ring-primary/20",
          error ? "border-danger/70" : "border-border hover:border-border-strong",
        )}
      >
        {icon && (
          <span className="shrink-0 text-muted transition-colors group-focus-within:text-primary">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="h-full min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted/60"
          {...inputProps}
        />
        {trailing}
      </div>

      {error && (
        <p id={errorId} className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

