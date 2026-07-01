import { getRemoteConfigString } from "@/lib/firebase-admin";

/**
 * Resolve the Stripe secret key from env first, then Firebase Remote Config
 * (where the Drills Cloud Functions also read it from). Returns null if
 * neither source has it, so callers can fail gracefully without throwing.
 */
export async function resolveStripeKey(): Promise<string | null> {
  const fromEnv = process.env.STRIPE_SECRET_KEY;
  if (fromEnv && fromEnv.length > 0) return fromEnv;
  try {
    return await getRemoteConfigString("stripe_client_secret");
  } catch (e) {
    console.error("Failed to read Stripe key from Remote Config:", e);
    return null;
  }
}
