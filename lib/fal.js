import { fal } from "@fal-ai/client";

export function getFalCredentials() {
  return process.env.FAL_KEY || process.env.FAL_API_KEY || "";
}

export function assertFalCredentials() {
  const credentials = getFalCredentials();
  if (!credentials) {
    throw new Error("Fal.ai API key missing. Please set FAL_KEY or FAL_API_KEY in your environment.");
  }
  return credentials;
}

if (typeof window === "undefined") {
  const credentials = getFalCredentials();
  if (credentials) {
    fal.config({ credentials });
  }
} else {
  fal.config({
    proxyUrl: "/api/fal/proxy",
  });
}

export { fal };
