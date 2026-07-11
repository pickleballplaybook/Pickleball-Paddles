import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage, type Storage } from "firebase-admin/storage";
import { getRemoteConfig, type RemoteConfig } from "firebase-admin/remote-config";

let cachedApp: App | null = null;

function getApp(): App {
  if (cachedApp) return cachedApp;
  const existing = getApps()[0];
  if (existing) {
    cachedApp = existing;
    return cachedApp;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // Vercel stores newlines as literal "\n" sequences in env vars.
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin SDK env vars missing: set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY."
    );
  }

  cachedApp = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    storageBucket,
  });
  return cachedApp;
}

export function getFirebaseFirestore(): Firestore {
  return getFirestore(getApp());
}

export function getFirebaseStorage(): Storage {
  return getStorage(getApp());
}

export function getFirebaseRemoteConfig(): RemoteConfig {
  return getRemoteConfig(getApp());
}

/**
 * Fetches a string parameter from the Firebase Remote Config template.
 * Reused by the comeback-checkout flow so the Stripe secret can live in
 * Remote Config (same place the Drills app reads `stripe_client_secret`
 * from) instead of forcing a duplicate Vercel env var.
 *
 * Returns null if the key is missing or set to a non-string explicit
 * value — callers fall back to env vars in that case.
 */
let _remoteConfigCache: { fetchedAt: number; values: Record<string, string> } | null = null;
const REMOTE_CONFIG_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function getRemoteConfigString(key: string): Promise<string | null> {
  const now = Date.now();
  if (!_remoteConfigCache || now - _remoteConfigCache.fetchedAt > REMOTE_CONFIG_TTL_MS) {
    const template = await getFirebaseRemoteConfig().getTemplate();
    const values: Record<string, string> = {};
    for (const [k, p] of Object.entries(template.parameters)) {
      const v = p.defaultValue;
      if (v && "value" in v && typeof v.value === "string") {
        values[k] = v.value;
      }
    }
    _remoteConfigCache = { fetchedAt: now, values };
  }
  return _remoteConfigCache.values[key] ?? null;
}
