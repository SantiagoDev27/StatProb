import { isValidEmail, PASSWORD_MIN_LENGTH } from "@/shared/lib";

export type RegisterValues = {
  email: string;
  password: string;
};

export type RegisterErrors = Partial<Record<keyof RegisterValues, string>>;

export function validateRegister({ email, password }: RegisterValues): RegisterErrors {
  const errors: RegisterErrors = {};

  if (!email) errors.email = "Ingresa tu correo electrónico.";
  else if (!isValidEmail(email)) errors.email = "Ingresa un correo electrónico válido.";

  if (!password) errors.password = "Crea una contraseña.";
  else if (password.length < PASSWORD_MIN_LENGTH)
    errors.password = `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`;

  return errors;
}

