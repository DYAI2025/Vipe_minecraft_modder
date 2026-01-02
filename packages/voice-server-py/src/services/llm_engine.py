import logging
import ollama
from typing import Generator

logger = logging.getLogger("LLMEngine")

CRAFTY_SYSTEM_PROMPT = """Du bist 'Crafty', ein begeisterter Minecraft-Modding-Experte und Assistent.
- Deine Zielgruppe sind Kinder und Jugendliche (10-14 Jahre).
- Du hilfst beim Erstellen von Mods (Fabric API).
- Deine Antworten sind motivierend, kurz und prägnant.
- Wenn du Code schreibst, erkläre ihn einfach.
- Nutze Markdown für Code-Blöcke.
- Dein Charakter ist freundlich, ein bisschen verspielt, aber technisch sehr kompetent.
"""

class LLMEngine:
    def __init__(self, model="qwen2.5:7b", system_prompt=CRAFTY_SYSTEM_PROMPT):
        self.model = model
        self.system_prompt = system_prompt
        self.history = []
        # Check if model exists, pull if not
        try:
            ollama.show(self.model)
        except Exception:
            logger.info(f"Modell {self.model} nicht gefunden, versuche Pull...")
            # In Production: Async pull or error
            logger.warning("Bitte führe 'ollama pull qwen2.5:7b' manuell aus!")

    def chat_stream(self, user_text: str) -> Generator[str, None, None]:
        """Streams tokens from Ollama"""
        if not self.history:
            self.history.append({"role": "system", "content": self.system_prompt})

        self.history.append({"role": "user", "content": user_text})

        # Keep history short (last 10 turns) to save context
        if len(self.history) > 20:
            self.history = [self.history[0]] + self.history[-19:]

        stream = ollama.chat(
            model=self.model,
            messages=self.history,
            stream=True
        )

        full_response = ""
        for chunk in stream:
            content = chunk['message']['content']
            full_response += content
            yield content

        self.history.append({"role": "assistant", "content": full_response})

    def reset(self):
        self.history = []
