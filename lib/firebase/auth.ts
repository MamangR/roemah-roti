import { FirebaseError } from "firebase/app";
import { onAuthStateChanged, signInAnonymously, type User } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";

export async function ensureAnonymousFirebaseUser(): Promise<User | null> {
  const auth = getFirebaseAuth();
  if (!auth) {
    return null;
  }

  if (auth.currentUser) {
    return auth.currentUser;
  }

  try {
    const credential = await signInAnonymously(auth);
    return credential.user;
  } catch (error) {
    if (error instanceof FirebaseError && error.code === "auth/admin-restricted-operation") {
      return null;
    }

    throw error;
  }
}

export function waitForFirebaseUser(): Promise<User | null> {
  const auth = getFirebaseAuth();
  if (!auth) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}
