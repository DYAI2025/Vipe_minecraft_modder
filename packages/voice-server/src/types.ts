export interface ChatMessage {
  type: 'user' | 'assistant' | 'system' | 'error';
  content: string;
  timestamp: number;
  streaming?: boolean;
  done?: boolean;
  fullContent?: string;
}

export interface WebSocketMessage {
  action: 'chat' | 'voice_start' | 'voice_stop' | 'voice_data';
  payload?: string | ArrayBuffer;
}
