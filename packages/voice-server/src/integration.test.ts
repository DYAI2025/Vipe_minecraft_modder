// Integration test - verifies server starts and responds
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import Fastify from "fastify";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import { chatRoutes } from "./routes/chat.js";
import { voiceRoutes } from "./routes/voice.js";
import WebSocket from "ws";

describe("Voice Server Integration", () => {
  let server: ReturnType<typeof Fastify>;
  const PORT = 3848; // Different port to avoid conflicts

  beforeAll(async () => {
    server = Fastify({ logger: false });
    await server.register(cors, { origin: true });
    await server.register(websocket);
    await server.register(chatRoutes);
    await server.register(voiceRoutes);

    // Add status endpoint for testing
    server.get("/status", async () => ({
      status: "ok",
      services: { ollama: false, piper: false, whisper: false },
    }));

    await server.listen({ port: PORT, host: "127.0.0.1" });
  });

  afterAll(async () => {
    await server.close();
  });

  it("should respond to /status endpoint", async () => {
    const response = await fetch(`http://127.0.0.1:${PORT}/status`);
    expect(response.ok).toBe(true);

    const data = await response.json();
    expect(data).toHaveProperty("status", "ok");
    expect(data).toHaveProperty("services");
  });

  it("should accept WebSocket connection on /chat", async () => {
    const ws = new WebSocket(`ws://127.0.0.1:${PORT}/chat`);

    const connected = await new Promise<boolean>((resolve) => {
      ws.on("open", () => resolve(true));
      ws.on("error", () => resolve(false));
      setTimeout(() => resolve(false), 2000);
    });

    expect(connected).toBe(true);
    ws.close();
  });

  it("should receive welcome message on /chat", async () => {
    const ws = new WebSocket(`ws://127.0.0.1:${PORT}/chat`);

    const message = await new Promise<string>((resolve, reject) => {
      ws.on("message", (data) => resolve(data.toString()));
      ws.on("error", reject);
      setTimeout(() => reject(new Error("Timeout")), 3000);
    });

    const parsed = JSON.parse(message);
    expect(parsed).toHaveProperty("type", "assistant");
    expect(parsed).toHaveProperty("content");

    ws.close();
  });

  it("should echo chat messages when Ollama unavailable", async () => {
    const ws = new WebSocket(`ws://127.0.0.1:${PORT}/chat`);

    // Wait for welcome
    await new Promise<void>((resolve) => {
      ws.on("open", () => {
        ws.once("message", () => resolve());
      });
    });

    // Send message
    ws.send(JSON.stringify({ action: "chat", payload: "Hallo Test" }));

    // Wait for response (either echo or streaming)
    const response = await new Promise<string>((resolve) => {
      ws.once("message", (data) => resolve(data.toString()));
    });

    const parsed = JSON.parse(response);
    expect(parsed).toHaveProperty("type");

    ws.close();
  });
});
