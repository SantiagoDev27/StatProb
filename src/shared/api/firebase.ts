import {
  FirebaseError,
  getApp,
  getApps,
  initializeApp,
  type FirebaseApp,
  type FirebaseOptions,
} from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getDatabase, type Database } from "firebase/database";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL:
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ??
    "https://statprob-84270-default-rtdb.firebaseio.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/**
 * Instancia singleton de la aplicación Firebase.
 * Evita re-inicializaciones durante Hot Module Replacement (HMR) en Next.js.
 */
export const firebaseApp: FirebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

/** Instancia de Firebase Authentication. */
export const firebaseAuth: Auth = getAuth(firebaseApp);

/** Instancia de Firebase Realtime Database. */
export const firebaseDb: Database = getDatabase(firebaseApp);

/** Proveedor de autenticación con Google. */
export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({ prompt: "select_account" });

/** Traduce errores de Firebase Auth a mensajes legibles en español. */
export function getFirebaseAuthErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/invalid-credential":
      case "auth/user-not-found":
      case "auth/wrong-password":
        return "Correo electrónico o contraseña incorrectos.";
      case "auth/invalid-email":
        return "El formato del correo electrónico no es válido.";
      case "auth/user-disabled":
        return "Esta cuenta ha sido deshabilitada.";
      case "auth/email-already-in-use":
        return "Este correo electrónico ya está registrado. Intenta iniciar sesión.";
      case "auth/weak-password":
        return "La contraseña es demasiado débil. Usa al menos 8 caracteres.";
      case "auth/too-many-requests":
        return "Demasiados intentos fallidos. Espera unos minutos e inténtalo de nuevo.";
      case "auth/popup-closed-by-user":
      case "auth/cancelled-popup-request":
        return "Se canceló el inicio de sesión con Google.";
      case "auth/popup-blocked":
        return "El navegador bloqueó la ventana emergente. Permite los pop-ups e inténtalo de nuevo.";
      case "auth/account-exists-with-different-credential":
        return "Ya existe una cuenta asociada a este correo con otro método de acceso.";
      case "auth/network-request-failed":
        return "Error de conexión de red. Verifica tu conexión a internet.";
      default:
        return "Ocurrió un error al autenticar. Por favor inténtalo de nuevo.";
    }
  }

  return "Ocurrió un error inesperado. Por favor inténtalo de nuevo.";
}
