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
  type UserDatabaseRecord,
} from "./user-db";

export type CurrentUserState = {
  user: UserProfile;
  uid: string | null;
  loading: boolean;
  updateName: (newName: string) => Promise<void>;
};

function buildUserProfile(
  uid: string,
  name: string,
  email: string,
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
  };
}

/**
 * Hook que sincroniza en tiempo real el perfil del usuario autenticado
 * con Firebase Authentication y Firebase Realtime Database (`users/{uid}`).
 * Si se ingresó con el flag `local/local` (sin sesión de Firebase), usa `MOCK_USER`.
 */
export function useCurrentUser(): CurrentUserState {
  const [uid, setUid] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile>(MOCK_USER);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeDb: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(firebaseAuth, (firebaseUser) => {
      if (unsubscribeDb) {
        unsubscribeDb();
        unsubscribeDb = null;
      }

      if (!firebaseUser) {
        setUid(null);
        setUser(MOCK_USER);
        setLoading(false);
        return;
      }

      const currentUid = firebaseUser.uid;
      const fallbackEmail = (firebaseUser.email ?? "").trim();
      const defaultName = getDefaultUserNameFromEmail(fallbackEmail);

      setUid(currentUid);
      setUser(buildUserProfile(currentUid, defaultName, fallbackEmail));

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

            setUser(buildUserProfile(currentUid, dbName, dbEmail));
          } else {
            const initialRecord: UserDatabaseRecord = {
              name: defaultName,
              email: fallbackEmail,
            };
            void set(userRef, initialRecord).catch(() => {});
            setUser(buildUserProfile(currentUid, defaultName, fallbackEmail));
          }
          setLoading(false);
        },
        () => {
          setLoading(false);
        },
      );
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDb) unsubscribeDb();
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

  return { user, uid, loading, updateName };
}
