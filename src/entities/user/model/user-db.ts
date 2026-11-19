import { updateProfile, type User } from "firebase/auth";
import { get, ref, set, update } from "firebase/database";
import { firebaseAuth, firebaseDb } from "@/shared/api";

export type UserDatabaseRecord = {
  name: string;
  email: string;
};

/**
 * Obtiene el nombre por defecto de un usuario tomando todo el texto antes del "@" en su correo.
 */
export function getDefaultUserNameFromEmail(email: string): string {
  const localPart = email.split("@")[0]?.trim();
  return localPart || "usuario";
}

/**
 * Calcula las iniciales (2 caracteres) a partir del nombre del usuario.
 */
export function getInitialsFromName(name: string): string {
  const cleaned = name.trim();
  if (!cleaned) return "US";

  const parts = cleaned.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return cleaned.slice(0, 2).toUpperCase();
}

/**
 * Crea el registro inicial del usuario en Firebase Realtime Database (`users/{uid}`)
 * con su correo y el nombre derivado del texto previo al "@".
 */
export async function createUserRecordInDb(
  user: User,
  fallbackEmail?: string,
): Promise<UserDatabaseRecord> {
  const email = (user.email ?? fallbackEmail ?? "").trim();
  const name = getDefaultUserNameFromEmail(email);
  const record: UserDatabaseRecord = {
    name,
    email,
  };

  await set(ref(firebaseDb, `users/${user.uid}`), record);

  if (user.displayName !== name) {
    await updateProfile(user, { displayName: name }).catch(() => {});
  }

  return record;
}

/**
 * Garantiza que el usuario tenga su registro en `users/{uid}` en Realtime Database.
 * Si no existe aún (p. ej. primer ingreso con Google), lo crea con el texto antes del "@".
 */
export async function ensureUserRecordInDb(
  user: User,
): Promise<UserDatabaseRecord> {
  const userRef = ref(firebaseDb, `users/${user.uid}`);
  const snapshot = await get(userRef);
  const email = (user.email ?? "").trim();
  const defaultName = getDefaultUserNameFromEmail(email);

  if (snapshot.exists()) {
    const data = snapshot.val() as Partial<UserDatabaseRecord> | null;
    const existingName =
      typeof data?.name === "string" && data.name.trim().length > 0
        ? data.name.trim()
        : defaultName;
    const existingEmail =
      typeof data?.email === "string" && data.email.trim().length > 0
        ? data.email.trim()
        : email;

    if (data?.name !== existingName || data?.email !== existingEmail) {
      await update(userRef, { name: existingName, email: existingEmail });
    }

    return { name: existingName, email: existingEmail };
  }

  return createUserRecordInDb(user, email);
}

/**
 * Actualiza únicamente el nombre del usuario en Firebase Realtime Database (`users/{uid}`).
 */
export async function updateUserNameInDb(
  uid: string,
  newName: string,
): Promise<void> {
  const trimmedName = newName.trim();
  if (!trimmedName) {
    throw new Error("El nombre no puede estar vacío.");
  }

  await update(ref(firebaseDb, `users/${uid}`), {
    name: trimmedName,
  });

  if (firebaseAuth.currentUser && firebaseAuth.currentUser.uid === uid) {
    await updateProfile(firebaseAuth.currentUser, {
      displayName: trimmedName,
    }).catch(() => {});
  }
}
