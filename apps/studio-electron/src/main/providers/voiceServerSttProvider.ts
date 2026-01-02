import log from "electron-log";
import WebSocket from "ws";
import type { SttProvider } from "./sttProvider.js";
import type { SttStreamEvent, SttProviderId } from "@kidmodstudio/ipc-contracts";

/**
 * VoiceServer STT Provider
 *
 * Connects to the Python Voice Server WebSocket and forwards audio chunks.
 * Uses Whisper via RealtimeSTT for offline speech recognition.
 *
 * Server: ws://127.0.0.1:3850/ws/control
 * Protocol: Jarvis Event Protocol + Binary Audio
 */
export class VoiceServerSttProvider implements SttProvider {
  readonly providerId: SttProviderId = "livekit"; // Pretends to be livekit for compatibility
  private eventHandler?: (event: Omit<SttStreamEvent, "streamId">) => void;
  private ws?: WebSocket;
  private transcript: string = "";
  private connecting: boolean = false;
  private connected: boolean = false;

  private readonly serverUrl = "ws://127.0.0.1:3850/ws/control";
  private readonly reconnectDelay = 2000;
  private readonly maxReconnectAttempts = 3;
  private reconnectAttempts = 0;

  async start(): Promise<void> {
    log.info("[VoiceServerSTT] Starting connection to voice server");
    this.transcript = "";

    this.emit({ type: "state", state: "ready", tMs: Date.now() });

    await this.connect();

    if (this.connected) {
      this.emit({ type: "state", state: "listening", tMs: Date.now() });
    } else {
      throw new Error("Failed to connect to voice server");
    }
  }

  private async connect(): Promise<void> {
    if (this.connecting || this.connected) {
      return;
    }

    this.connecting = true;

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.serverUrl);

        const timeout = setTimeout(() => {
          if (!this.connected) {
            log.error("[VoiceServerSTT] Connection timeout");
            this.ws?.close();
            reject(new Error("Connection timeout"));
          }
        }, 5000);

        this.ws.on("open", () => {
          clearTimeout(timeout);
          this.connected = true;
          this.connecting = false;
          this.reconnectAttempts = 0;
          log.info("[VoiceServerSTT] Connected to voice server");
          resolve();
        });

        this.ws.on("message", (data: WebSocket.Data) => {
          this.handleMessage(data);
        });

        this.ws.on("error", (error) => {
          clearTimeout(timeout);
          log.error("[VoiceServerSTT] WebSocket error:", error);
          this.connected = false;
          this.connecting = false;

          this.emit({
            type: "error",
            message: `Voice server error: ${error.message}`,
            code: "WS_ERROR",
            tMs: Date.now(),
          });

          reject(error);
        });

        this.ws.on("close", () => {
          clearTimeout(timeout);
          log.warn("[VoiceServerSTT] Connection closed");
          this.connected = false;
          this.connecting = false;

          // Auto-reconnect logic
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            log.info(`[VoiceServerSTT] Reconnecting (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            setTimeout(() => this.connect(), this.reconnectDelay);
          }
        });
      } catch (error) {
        this.connecting = false;
        log.error("[VoiceServerSTT] Failed to create WebSocket:", error);
        reject(error);
      }
    });
  }

  private handleMessage(data: WebSocket.Data): void {
    try {
      const message = JSON.parse(data.toString());

      // Handle Jarvis Protocol events
      if (message.type === "stt.partial") {
        const text = message.payload?.text;
        if (text) {
          this.emit({
            type: "interim",
            text,
            confidence: message.payload?.confidence ?? 0.8,
            tMs: Date.now(),
          });
        }
      } else if (message.type === "stt.final") {
        const text = message.payload?.text;
        if (text) {
          this.transcript = text;
          this.emit({
            type: "final",
            text,
            confidence: message.payload?.confidence ?? 1.0,
            tMs: Date.now(),
          });
        }
      } else if (message.type === "error.raised") {
        log.error("[VoiceServerSTT] Server error:", message.payload);
        this.emit({
          type: "error",
          message: message.payload?.message ?? "Unknown error",
          code: message.payload?.code ?? "E_SERVER",
          tMs: Date.now(),
        });
      }
    } catch (error) {
      log.warn("[VoiceServerSTT] Failed to parse message:", error);
    }
  }

  pushChunk(chunk: Uint8Array, chunkIndex: number): void {
    if (!this.connected || !this.ws) {
      log.warn("[VoiceServerSTT] Cannot push chunk: not connected");
      return;
    }

    try {
      // Send binary audio directly (PCM 16-bit mono 16kHz)
      this.ws.send(chunk);
    } catch (error) {
      log.error("[VoiceServerSTT] Failed to send chunk:", error);
    }
  }

  async stop(): Promise<string> {
    log.info("[VoiceServerSTT] Stopping");

    this.emit({ type: "state", state: "processing", tMs: Date.now() });

    // Give server a moment to finalize transcription
    await new Promise((resolve) => setTimeout(resolve, 500));

    this.emit({ type: "state", state: "done", tMs: Date.now() });

    // Close WebSocket
    if (this.ws) {
      this.ws.close();
      this.ws = undefined;
      this.connected = false;
    }

    return this.transcript;
  }

  cancel(): void {
    log.info("[VoiceServerSTT] Cancelled");

    this.emit({
      type: "error",
      message: "Stream cancelled",
      code: "CANCELLED",
      tMs: Date.now(),
    });

    if (this.ws) {
      this.ws.close();
      this.ws = undefined;
      this.connected = false;
    }
  }

  onEvent(handler: (event: Omit<SttStreamEvent, "streamId">) => void): void {
    this.eventHandler = handler;
  }

  private emit(event: Omit<SttStreamEvent, "streamId">): void {
    this.eventHandler?.(event);
  }
}
