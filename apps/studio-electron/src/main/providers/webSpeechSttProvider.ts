import log from "electron-log";
import type { SttProvider } from "./sttProvider.js";
import type { SttStreamEvent, SttProviderId } from "@kidmodstudio/ipc-contracts";

/**
 * WebSpeech STT Provider
 *
 * NOTE: WebSpeech API runs in the RENDERER process, not Main!
 * This provider acts as a coordinator that signals the renderer to use WebSpeech.
 *
 * The actual SpeechRecognition API is accessed via the renderer's window.SpeechRecognition.
 *
 * Flow:
 * 1. start() → emits "ready" state
 * 2. Renderer uses Web Speech API directly
 * 3. Renderer sends transcripts via IPC or events
 * 4. stop() → returns final transcript
 */
export class WebSpeechSttProvider implements SttProvider {
  readonly providerId: SttProviderId = "webspeech";
  private eventHandler?: (event: Omit<SttStreamEvent, "streamId">) => void;
  private transcript: string = "";
  private isListening: boolean = false;

  async start(): Promise<void> {
    log.info("[WebSpeechSTT] Starting (coordinator mode)");
    this.transcript = "";
    this.isListening = true;

    this.emit({ type: "state", state: "ready", tMs: Date.now() });
    this.emit({ type: "state", state: "listening", tMs: Date.now() });
  }

  pushChunk(chunk: Uint8Array, chunkIndex: number): void {
    // WebSpeech doesn't use audio chunks from Main process
    // Audio is captured directly in renderer via getUserMedia()
    // This method is a no-op for WebSpeech
  }

  async stop(): Promise<string> {
    log.info("[WebSpeechSTT] Stopping");
    this.isListening = false;

    if (this.transcript) {
      this.emit({
        type: "final",
        text: this.transcript,
        confidence: 1.0,
        tMs: Date.now(),
      });
    }

    this.emit({ type: "state", state: "done", tMs: Date.now() });

    return this.transcript;
  }

  cancel(): void {
    log.info("[WebSpeechSTT] Cancelled");
    this.isListening = false;
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

  /**
   * Called by renderer to update transcript
   * This allows renderer to push transcripts to Main process
   */
  updateTranscript(text: string, isFinal: boolean, confidence?: number): void {
    this.transcript = text;

    if (isFinal) {
      this.emit({
        type: "final",
        text,
        confidence: confidence ?? 1.0,
        tMs: Date.now(),
      });
    } else {
      this.emit({
        type: "interim",
        text,
        confidence: confidence ?? 0.8,
        tMs: Date.now(),
      });
    }
  }

  private emit(event: Omit<SttStreamEvent, "streamId">): void {
    this.eventHandler?.(event);
  }
}
