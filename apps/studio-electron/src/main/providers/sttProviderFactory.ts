import log from "electron-log";
import type { SttProvider } from "./sttProvider.js";
import type { SttProviderId, SettingsConfig } from "@kidmodstudio/ipc-contracts";
import { EchoSttProvider } from "./echoSttProvider.js";
import { WebSpeechSttProvider } from "./webSpeechSttProvider.js";
import { VoiceServerSttProvider } from "./voiceServerSttProvider.js";

/**
 * Creates STT provider based on settings configuration
 */
export function createSttProvider(settings: SettingsConfig): SttProvider {
  const providerId = settings.stt.provider;

  log.info(`[STT Factory] Creating provider: ${providerId}`);

  switch (providerId) {
    case "webspeech":
      return new WebSpeechSttProvider();

    case "livekit":
      // VoiceServerSttProvider pretends to be "livekit" for backward compatibility
      // It actually connects to the local Python voice server
      return new VoiceServerSttProvider();

    case "manual_text":
      // Fallback to echo for manual text input mode
      log.warn("[STT Factory] manual_text mode - using EchoSttProvider");
      return new EchoSttProvider();

    default:
      log.warn(`[STT Factory] Unknown provider ${providerId}, falling back to webspeech`);
      return new WebSpeechSttProvider();
  }
}

/**
 * Get provider display name for UI
 */
export function getSttProviderDisplayName(providerId: SttProviderId): string {
  switch (providerId) {
    case "webspeech":
      return "Browser WebSpeech (Online)";
    case "livekit":
      return "Voice Server (Offline Whisper)";
    case "manual_text":
      return "Manual Text Input";
    default:
      return "Unknown";
  }
}

/**
 * Get provider description for UI
 */
export function getSttProviderDescription(providerId: SttProviderId): string {
  switch (providerId) {
    case "webspeech":
      return "Uses your browser's built-in speech recognition. Requires internet connection. Works immediately with no setup.";
    case "livekit":
      return "Offline speech recognition using Whisper AI. Requires Python voice server. More private and works without internet.";
    case "manual_text":
      return "Type text manually instead of speaking. Useful for testing or when microphone is not available.";
    default:
      return "";
  }
}

/**
 * Check if provider requires additional setup
 */
export function providerRequiresSetup(providerId: SttProviderId): { required: boolean; message?: string } {
  switch (providerId) {
    case "livekit":
      // VoiceServer requires Python and dependencies
      return {
        required: true,
        message: "Voice Server requires Python 3 and voice-server-py package installed. Run 'npm run setup:voice' first.",
      };
    case "webspeech":
      // WebSpeech only works in Chromium browsers
      return {
        required: true,
        message: "WebSpeech requires a Chromium-based browser (Chrome, Edge) and internet connection.",
      };
    case "manual_text":
      return { required: false };
    default:
      return { required: false };
  }
}
