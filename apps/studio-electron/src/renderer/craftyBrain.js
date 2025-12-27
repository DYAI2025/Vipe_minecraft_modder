// CraftyBrain - Gesprächsmanager für Crafty Voice Assistant
// Persona: Ruhiger, geduldiger Creeper-Helfer der Kindern Minecraft Modding beibringt

const CRAFTY_SYSTEM_PROMPT = `Du bist Crafty, ein freundlicher grüner Creeper-Helfer in KidModStudio.
Du hilfst Kindern (6-12 Jahre) dabei, ihre ersten Minecraft Mods zu erstellen.

DEINE PERSÖNLICHKEIT:
- Du bist ruhig und geduldig, nie genervt
- Du machst gelegentlich lustige Creeper-Witze ("Ssssehr gut gemacht!")
- Du kennst beliebte Minecraft YouTuber wie GustafGG und SparkofPhoenix
- Du sprichst auf Deutsch, einfach und kindgerecht
- Du ermutigst und lobst, aber übertreibe nicht

ANTWORTSTIL:
- Halte Antworten KURZ: 1-2 Sätze maximal
- Verwende manchmal passende Emojis 🎮⛏️💎
- Bei Fragen zum Modding: Gib konkrete, einfache Tipps
- Bei Smalltalk: Sei freundlich aber lenke sanft zum Modding zurück

DEIN WISSEN:
- Du weißt wie Minecraft funktioniert
- Du kennst Blöcke, Items, Mobs und Crafting
- Du kannst einfach erklären was ein "Mod" ist
- Du hilfst beim Bauen von Blöcken, Items und Kreaturen

BEISPIELE:
Kind: "Was ist ein Mod?"
Du: "Ein Mod ist wie ein Zaubertrick für Minecraft! Damit kannst du neue Blöcke erfinden! 🪄"

Kind: "Ich mag Diamanten"
Du: "Ssssehr guter Geschmack! Willst du einen eigenen Diamantblock bauen? 💎"

Kind: "Wer ist GustafGG?"
Du: "Gustaf baut mega coole Sachen! Hat dich sein Stil inspiriert? Was möchtest du bauen?"`;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    response: {
      type: "string",
      description: "Crafty's Antwort (1-2 Sätze, deutsch, kindgerecht)"
    },
    emotion: {
      type: "string",
      enum: ["neutral", "happy", "thinking", "excited"],
      description: "Crafty's Emotion für Animation"
    },
    suggestedAction: {
      type: "string",
      enum: ["none", "place_block", "create_mod", "show_tutorial"],
      description: "Optionale UI-Aktion"
    }
  },
  required: ["response", "emotion"]
};

class CraftyBrain {
  constructor() {
    this.conversationHistory = [];
    this.maxHistoryLength = 10;
    this.onResponse = null;
    this.onSpeaking = null;
    this.onStateChange = null;
    this.currentRequestId = null;
    this.currentUtterance = null;
  }

  init() {
    // WebSpeech TTS - no IPC needed
    console.log('[CraftyBrain] Initialized with WebSpeech TTS');
  }

  destroy() {
    this.stopSpeaking();
  }

  async processInput(userText) {
    if (!userText?.trim()) return null;

    this.onStateChange?.("thinking");

    // Add user message to history
    this.conversationHistory.push({
      role: "user",
      content: userText.trim()
    });

    // Trim history if too long
    if (this.conversationHistory.length > this.maxHistoryLength) {
      this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength);
    }

    try {
      const requestId = "crafty-" + Date.now();
      this.currentRequestId = requestId;

      const messages = [
        { role: "system", content: CRAFTY_SYSTEM_PROMPT },
        ...this.conversationHistory
      ];

      const result = await window.kidmod.llm.completeJSON({
        requestId,
        messages,
        jsonSchema: RESPONSE_SCHEMA,
        maxResponseBytes: 2048
      });

      if (!result.ok || !result.json) {
        console.error("[CraftyBrain] LLM error:", result.error);
        return this.getFallbackResponse();
      }

      const { response, emotion, suggestedAction } = result.json;

      // Add assistant response to history
      this.conversationHistory.push({
        role: "assistant",
        content: response
      });

      // Notify callback with response
      this.onResponse?.({
        text: response,
        emotion: emotion || "neutral",
        suggestedAction: suggestedAction || "none"
      });

      // Speak the response
      await this.speak(response);

      return { text: response, emotion, suggestedAction };

    } catch (error) {
      console.error("[CraftyBrain] Error:", error);
      return this.getFallbackResponse();
    }
  }

  async speak(text) {
    if (!text || !('speechSynthesis' in window)) {
      console.warn('[CraftyBrain] WebSpeech not available');
      return;
    }

    // Cancel any ongoing speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'de-DE';
    utterance.rate = 0.9;

    // Try to find a German voice
    const voices = speechSynthesis.getVoices();
    const germanVoice = voices.find(v => v.lang.startsWith('de'));
    if (germanVoice) {
      utterance.voice = germanVoice;
    }

    utterance.onstart = () => {
      this.onSpeaking?.(true);
      this.onStateChange?.('speaking');
    };

    utterance.onend = () => {
      this.onSpeaking?.(false);
      this.onStateChange?.('idle');
      this.currentUtterance = null;
    };

    utterance.onerror = (event) => {
      console.error('[CraftyBrain] TTS error:', event.error);
      this.onSpeaking?.(false);
      this.onStateChange?.('idle');
    };

    this.currentUtterance = utterance;
    speechSynthesis.speak(utterance);
    console.log('[CraftyBrain] Speaking:', text);
  }

  async stopSpeaking() {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
    this.onSpeaking?.(false);
    this.currentUtterance = null;
  }

  getFallbackResponse() {
    const fallbacks = [
      { text: "Hmm, lass uns das nochmal versuchen!", emotion: "thinking" },
      { text: "Sssag das nochmal? Ich war kurz abgelenkt.", emotion: "neutral" },
      { text: "Moment mal... was meintest du?", emotion: "thinking" }
    ];
    const fallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
    this.onResponse?.(fallback);
    return fallback;
  }

  getGreeting() {
    const greetings = [
      "Hallo! Ich bin Crafty! 🎮 Was bauen wir heute?",
      "Ssssalut! Bereit für Mod-Abenteuer? ⛏️",
      "Hi! Schön dass du da bist! 💚 Lass uns loslegen!"
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  // Für kontextbezogene Hilfe
  async getContextualHelp(context) {
    const contextPrompts = {
      empty_grid: "Das Kind hat noch nichts in die Werkbank gelegt.",
      block_placed: "Das Kind hat einen Block platziert.",
      mod_created: "Das Kind hat gerade einen Mod erstellt!",
      idle: "Das Kind hat eine Weile nichts gemacht."
    };

    const contextMessage = contextPrompts[context] || "";

    return this.processInput(
      `[Kontext: ${contextMessage}] Gib einen kurzen, ermutigenden Tipp.`
    );
  }

  clearHistory() {
    this.conversationHistory = [];
  }
}

// Singleton instance
const craftyBrain = new CraftyBrain();

// Export for use in app.js
window.craftyBrain = craftyBrain;
