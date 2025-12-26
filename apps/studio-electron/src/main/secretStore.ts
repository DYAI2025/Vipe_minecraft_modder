import keytar from "keytar";
import type { SecretRef } from "@kidmodstudio/ipc-contracts";

const SERVICE_NAME = "kidmodstudio";

function extractSecretName(ref: SecretRef): string {
  if (!ref.startsWith("secret:")) {
    throw new Error(`Invalid SecretRef: ${ref}`);
  }
  return ref.slice(7); // Remove "secret:" prefix
}

export class SecretStore {
  async get(ref: SecretRef): Promise<string | null> {
    const name = extractSecretName(ref);
    return keytar.getPassword(SERVICE_NAME, name);
  }

  async set(ref: SecretRef, value: string): Promise<void> {
    const name = extractSecretName(ref);
    await keytar.setPassword(SERVICE_NAME, name, value);
  }

  async delete(ref: SecretRef): Promise<void> {
    const name = extractSecretName(ref);
    await keytar.deletePassword(SERVICE_NAME, name);
  }

  async isConfigured(ref: SecretRef): Promise<boolean> {
    const value = await this.get(ref);
    return value !== null && value.length > 0;
  }
}

export const secretStore = new SecretStore();
