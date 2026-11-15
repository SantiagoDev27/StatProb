"use client";

import { useState } from "react";
import { EyeIcon, EyeOffIcon, LockIcon } from "@/shared/ui/icons";
import { InputField, type InputFieldProps } from "./input-field";

type PasswordFieldProps = Omit<InputFieldProps, "type" | "trailing">;

export function PasswordField({ icon, ...props }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <InputField
      {...props}
      type={visible ? "text" : "password"}
      icon={icon ?? <LockIcon />}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          aria-pressed={visible}
          className="shrink-0 rounded text-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      }
    />
  );
}

