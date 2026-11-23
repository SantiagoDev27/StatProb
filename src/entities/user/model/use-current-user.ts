"use client";

import { onAuthStateChanged } from "firebase/auth";
import { onValue, ref, set } from "firebase/database";
import { useCallback, useEffect, useState } from "react";
import { firebaseAuth, firebaseDb } from "@/shared/api";
import { MOCK_USER } from "./mock-user";
import type { UserProfile } from "./types";
import {
  getDefaultUserNameFromEmail,
  getInitialsFromName,
  updateUserNameInDb,
  updateUserPhotoInDb,
  type UserDatabaseRecord,
} from "./user-db";

const LOCAL_PHOTO_STORAGE_KEY = "statprob:local-profile-photo";
const LOCAL_PROFILE_EVENT = "statprob:local-profile-changed";

function readLocalPhoto(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(LOCAL_PHOTO_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeLocalPhoto(photoUrl: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (photoUrl) {
      window.localStorage.setItem(LOCAL_PHOTO_STORAGE_KEY, photoUrl);
    } else {
      window.localStorage.removeItem(LOCAL_PHOTO_STORAGE_KEY);
    }
    window.dispatchEvent(new Event(LOCAL_PROFILE_EVENT));
  } catch {
    // Ignorar si localStorage no está disponible
  }
}

export type CurrentUserState = {
  user: UserProfile;
  uid: string | null;
  loading: boolean;
  updateName: (newName: string) => Promise<void>;
  updatePhoto: (photoDataUrl: string | null) => Promise<void>;
};

function buildUserProfile(
  uid: string,
  name: string,
  email: string,
  photoUrl?: string | null,
): UserProfile {
  const resolvedName = name.trim() || getDefaultUserNameFromEmail(email);
  return {
    ...MOCK_USER,
    id: uid.slice(0, 8).toUpperCase(),
    titleName: resolvedName,
    fullName: resolvedName,
    alias: resolvedName,
    email,
    institutionalEmail: email,
    initials: getInitialsFromName(resolvedName),
    photoUrl: photoUrl ?? null,
  };
}

/**
 * Hook que sincroniza en tiempo real el perfil del usuario autenticado
 * con Firebase Authentication y Firebase Realtime Database (`users/{uid}`).
 * Si se ingresó con el flag `local/local` (sin sesión de Firebase), usa `MOCK_USER`
 * y sincroniza cambios locales en el navegador.
 */
export function useCurrentUser(): CurrentUserState {
  const [uid, setUid] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile>(MOCK_USER);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeDb: (() => void) | null = null;

    function syncLocalProfile() {
      const localPhoto = readLocalPhoto();
      setUser((prev) => ({
        ...MOCK_USER,
        titleName: prev.titleName || MOCK_USER.titleName,
        fullName: prev.fullName || MOCK_USER.fullName,
        alias: prev.alias || MOCK_USER.alias,
        initials: prev.initials || MOCK_USER.initials,
        photoUrl: localPhoto,
      }));
    }

    const unsubscribeAuth = onAuthStateChanged(firebaseAuth, (firebaseUser) => {
      if (unsubscribeDb) {
        unsubscribeDb();
        unsubscribeDb = null;
      }

      if (!firebaseUser) {
        setUid(null);
        setUser({ ...MOCK_USER, photoUrl: readLocalPhoto() });
        setLoading(false);
        return;
      }

      const currentUid = firebaseUser.uid;
      const fallbackEmail = (firebaseUser.email ?? "").trim();
      const defaultName = getDefaultUserNameFromEmail(fallbackEmail);

      setUid(currentUid);
      setUser(
        buildUserProfile(
          currentUid,
          defaultName,
          fallbackEmail,
          firebaseUser.photoURL,
        ),
      );

      const userRef = ref(firebaseDb, `users/${currentUid}`);
      unsubscribeDb = onValue(
        userRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val() as Partial<UserDatabaseRecord> | null;
            const dbEmail =
              typeof data?.email === "string" && data.email.trim().length > 0
                ? data.email.trim()
                : fallbackEmail;
            const dbName =
              typeof data?.name === "string" && data.name.trim().length > 0
                ? data.name.trim()
                : getDefaultUserNameFromEmail(dbEmail);
            const dbPhotoUrl =
              typeof data?.photoUrl === "string" &&
              data.photoUrl.trim().length > 0
                ? data.photoUrl.trim()
                : null;

            setUser(buildUserProfile(currentUid, dbName, dbEmail, dbPhotoUrl));
          } else {
            const initialRecord: UserDatabaseRecord = {
              name: defaultName,
              email: fallbackEmail,
              photoUrl: firebaseUser.photoURL ?? null,
            };
            void set(userRef, initialRecord).catch(() => {});
            setUser(
              buildUserProfile(
                currentUid,
                defaultName,
                fallbackEmail,
                initialRecord.photoUrl,
              ),
            );
          }
          setLoading(false);
        },
        () => {
          setLoading(false);
        },
      );
    });

    window.addEventListener(LOCAL_PROFILE_EVENT, syncLocalProfile);

    return () => {
      unsubscribeAuth();
      if (unsubscribeDb) unsubscribeDb();
      window.removeEventListener(LOCAL_PROFILE_EVENT, syncLocalProfile);
    };
  }, []);

  const updateName = useCallback(
    async (newName: string) => {
      const trimmed = newName.trim();
      if (!trimmed) {
        throw new Error("El nombre no puede estar vacío.");
      }

      if (uid) {
        await updateUserNameInDb(uid, trimmed);
      }

      setUser((prev) => ({
        ...prev,
        titleName: trimmed,
        fullName: trimmed,
        alias: trimmed,
        initials: getInitialsFromName(trimmed),
      }));
    },
    [uid],
  );

  const updatePhoto = useCallback(
    async (photoDataUrl: string | null) => {
      if (uid) {
        await updateUserPhotoInDb(uid, photoDataUrl);
      } else {
        writeLocalPhoto(photoDataUrl);
      }

      setUser((prev) => ({
        ...prev,
        photoUrl: photoDataUrl,
      }));
    },
    [uid],
  );

  return { user, uid, loading, updateName, updatePhoto };
}
