import type { SttProvider } from "./sttProvider.js";
import type { SttStreamEvent, SttProviderId } from "@kidmodstudio/ipc-contracts";

type SttEventWithoutStreamId =
  | { type: "interim"; text: string; confidence?: number; tMs: number }
  | { type: "final"; text: string; confidence?: number; tMs: number }
  | { type: "state"; state: "ready" | "listening" | "processing" | "done"; tMs: number }
  | { type: "error"; message: string; code?: string; tMs: number };

export class EchoSttProvider implements SttProvider {
  readonly providerId: SttProviderId = "livekit"; // Stub pretends to be livekit
  private chunks = 0;
  private eventHandler?: (event: SttEventWithoutStreamId) => void;

  async start(): Promise<void> {
    this.chunks = 0;
    this.emit({ type: "state", state: "ready", tMs: Date.now() });
    this.emit({ type: "state", state: "listening", tMs: Date.now() });
  }

  pushChunk(chunk: Uint8Array, chunkIndex: number): void {
    this.chunks++;

    // After 5 chunks, emit interim result
    if (this.chunks === 5) {
      this.emit({
        type: "interim",
        text: "Hallo...",
        confidence: 0.8,
        tMs: Date.now(),
      });
    }

    // After 10 chunks, emit another interim
    if (this.chunks === 10) {
      this.emit({
        type: "interim",
        text: "Hallo, ich bin...",
        confidence: 0.85,
        tMs: Date.now(),
      });
    }
  }

  async stop(): Promise<string> {
    const transcript = "Hallo, ich bin ein Test";

    this.emit({
      type: "final",
      text: transcript,
      confidence: 0.95,
      tMs: Date.now(),
    });

    this.emit({ type: "state", state: "done", tMs: Date.now() });

    return transcript;
  }

  cancel(): void {
    this.emit({
      type: "error",
      message: "Stream cancelled",
      code: "CANCELLED",
      tMs: Date.now(),
    });
  }

  onEvent(handler: (event: Omit<SttStreamEvent, "streamId">) => void): void {
    this.eventHandler = handler;
  }

  private emit(event: SttEventWithoutStreamId): void {
    this.eventHandler?.(event);
  }
}
