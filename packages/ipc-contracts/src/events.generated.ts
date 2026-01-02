// AUTO-GENERATED. DO NOT EDIT.

export type Severity = "debug" | "info" | "warn" | "error";

export interface BaseEventEnvelope<TType extends string, TPayload> {
  type: TType;
  traceId: string;
  ts: string; // ISO-8601
  source: string;
  severity: Severity;
  payload: TPayload;
}


export interface StreamStartPayload {
  streamId: string;
  meta?: Record<string, unknown>;
}

export interface StreamChunkPayload {
  streamId: string;
  seq: number;
  data: Record<string, unknown>;
}

export interface StreamEndPayload {
  streamId: string;
  reason?: string;
}

export interface VoiceStartPayload {
  sampleRate: number;
  format: "pcm16" | "f32";
  channels: number;
}

export interface VoiceChunkPayload {
  seq: number;
  bytesB64: string;
  ms: number;
}

export interface VoiceEndPayload {
  totalMs: number;
}

export interface SttPartialPayload {
  text: string;
  confidence: number;
  final: false;
}

export interface SttFinalPayload {
  text: string;
  confidence: number;
  final: true;
}

export interface ChatQueryPayload {
  text: string;
  locale?: string;
  sessionId: string;
}

export interface ChatPromptPayload {
  messages: Array<unknown>;
  system?: string;
  tools?: Array<unknown>;
}

export interface LlmTokenPayload {
  text: string;
  seq: number;
}

export interface LlmTextPayload {
  text: string;
}

export interface LlmCompletePayload {
  text: string;
  usage?: Record<string, unknown>;
}

export interface TtsStartPayload {
  voice: string;
  format: "pcm16" | "wav" | "mp3";
  sampleRate: number;
}

export interface TtsAudioPayload {
  seq: number;
  bytesB64: string;
  ms: number;
}

export interface TtsVisemeTimingPayload {
  visemes: Array<unknown>;
  timingMs: Array<number>;
}

export interface TtsEndPayload {
  totalMs: number;
}

export interface AvatarStartPayload {
  fps: number;
  format: "rgb" | "yuv";
  resolution: string;
}

export interface AvatarFramePayload {
  seq: number;
  imageB64: string;
}

export interface AvatarEndPayload {
  totalFrames: number;
}

export interface RagQueryPayload {
  text: string;
  topK?: number;
}

export interface RagHit {
  sourceId: string;
  title?: string;
  snippet: string;
  score: number;
  loc?: Record<string, unknown>;
}

export interface RagContextPayload {
  hits: Array<RagHit>;
}

export interface ToolRequestPayload {
  tool: string;
  action: string;
  params: Record<string, unknown>;
  capabilityTier: "read_only" | "write_local_confirm" | "destructive_two_step" | "network_off_by_default";
  requiresConfirm: boolean;
}

export interface ToolResultPayload {
  ok: boolean;
  data?: Record<string, unknown>;
  error?: unknown;
}

export interface FsChangedPayload {
  path: string;
  kind: "create" | "modify" | "delete";
  ts: string;
}

export interface SystemHealthPayload {
  cpu: number;
  ram: number;
  vram: number;
  disk: number;
}

export interface GitBuildFailedPayload {
  project: string;
  logPath: string;
  exitCode: number;
}

export interface NudgeProposalPayload {
  title: string;
  reason: string;
  severity: "low" | "medium" | "high" | "critical";
  suggestedActions?: Array<unknown>;
  channel: "dashboard_only" | "toast" | "voice" | "avatar";
}

export interface NudgeDispatchPayload {
  proposalId: string;
  channel: "dashboard_only" | "toast" | "voice" | "avatar";
  rateLimited: boolean;
}

export interface UiCommandPayload {
  command: string;
  args?: Record<string, unknown>;
}

export interface UiFeedbackPayload {
  target: string;
  helpful: boolean;
  note?: string;
}

export interface UiInterruptibilityPayload {
  mode: "dnd" | "focus" | "available";
}

export interface TurnStartPayload {
  sessionId: string;
  inputType: "text" | "voice" | "event";
}

export interface TurnEndPayload {
  sessionId: string;
  outcome: "ok" | "error";
}

export interface PipelineStatusPayload {
  pipelineId: string;
  step: string;
  state: "start" | "done" | "error";
}

export interface LedgerEntryPayload {
  actorSkill: string;
  action: string;
  targets: Array<string>;
  beforeHash?: string;
  afterHash?: string;
  ts: string;
}

export interface ErrorRaisedPayload {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  recoverable: boolean;
}

export interface EventPayloadMap {
  "stream.start": StreamStartPayload;
  "stream.chunk": StreamChunkPayload;
  "stream.end": StreamEndPayload;
  "voice.start": VoiceStartPayload;
  "voice.chunk": VoiceChunkPayload;
  "voice.end": VoiceEndPayload;
  "stt.partial": SttPartialPayload;
  "stt.final": SttFinalPayload;
  "chat.query": ChatQueryPayload;
  "chat.prompt": ChatPromptPayload;
  "llm.token": LlmTokenPayload;
  "llm.text": LlmTextPayload;
  "llm.complete": LlmCompletePayload;
  "tts.start": TtsStartPayload;
  "tts.audio": TtsAudioPayload;
  "tts.viseme_timing": TtsVisemeTimingPayload;
  "tts.end": TtsEndPayload;
  "avatar.start": AvatarStartPayload;
  "avatar.frame": AvatarFramePayload;
  "avatar.end": AvatarEndPayload;
  "rag.query": RagQueryPayload;
  "rag.context": RagContextPayload;
  "tool.request": ToolRequestPayload;
  "tool.result": ToolResultPayload;
  "event.fs.changed": FsChangedPayload;
  "event.system.health": SystemHealthPayload;
  "event.git.build_failed": GitBuildFailedPayload;
  "nudge.proposal": NudgeProposalPayload;
  "nudge.dispatch": NudgeDispatchPayload;
  "ui.command": UiCommandPayload;
  "ui.feedback": UiFeedbackPayload;
  "ui.interruptibility": UiInterruptibilityPayload;
  "turn.start": TurnStartPayload;
  "turn.end": TurnEndPayload;
  "pipeline.status": PipelineStatusPayload;
  "ledger.entry": LedgerEntryPayload;
  "error.raised": ErrorRaisedPayload;
}

export type EventType = keyof EventPayloadMap;

export type EventEnvelope<T extends EventType = EventType> = BaseEventEnvelope<T, EventPayloadMap[T]>;

export type AnyEvent = { [K in EventType]: EventEnvelope<K> }[EventType];

export const makeEvent = <T extends EventType>(e: EventEnvelope<T>) => e;
