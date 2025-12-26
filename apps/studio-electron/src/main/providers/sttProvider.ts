import type { SttStreamEvent, SttProviderId } from "@kidmodstudio/ipc-contracts";

export interface SttProvider {
  readonly providerId: SttProviderId;
  start(): Promise<void>;
  pushChunk(chunk: Uint8Array, chunkIndex: number): void;
  stop(): Promise<string>;
  cancel(): void;
  onEvent(handler: (event: Omit<SttStreamEvent, "streamId">) => void): void;
}
