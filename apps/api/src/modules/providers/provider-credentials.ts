/**
 * Shared placeholder crypto for ProviderConnection.credentialsEnc — production replaces this with
 * a KMS envelope. Centralized here so providers.service.ts, enrollment.service.ts, and the
 * progress-poll job all decrypt the same way instead of each carrying its own copy.
 */
export function encryptProviderCredentials(creds: Record<string, string>): string {
  return Buffer.from(JSON.stringify(creds)).toString("base64");
}

export function decryptProviderCredentials(enc: string): Record<string, string> {
  try {
    return JSON.parse(Buffer.from(enc, "base64").toString("utf8"));
  } catch {
    return {};
  }
}
