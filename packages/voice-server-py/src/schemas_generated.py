# AUTO-GENERATED. DO NOT EDIT.

from __future__ import annotations

from datetime import datetime

from typing import Any, Dict, List, Optional, Union, Literal, Annotated

from pydantic import BaseModel, Field, ConfigDict


Severity = Literal["debug", "info", "warn", "error"]


class EventEnvelopeBase(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    type: str
    trace_id: str = Field(alias='traceId')
    ts: datetime
    source: str
    severity: Severity
    payload: Any


class StreamStartPayload(BaseModel):
    streamId: str
    meta: Optional[Dict[str, Any]] = None

class StreamChunkPayload(BaseModel):
    streamId: str
    seq: int
    data: Dict[str, Any]

class StreamEndPayload(BaseModel):
    streamId: str
    reason: Optional[str] = None

class VoiceStartPayload(BaseModel):
    sampleRate: int
    format: Literal["pcm16", "f32"]
    channels: int

class VoiceChunkPayload(BaseModel):
    seq: int
    bytesB64: str
    ms: int

class VoiceEndPayload(BaseModel):
    totalMs: int

class SttPartialPayload(BaseModel):
    text: str
    confidence: float
    final: Literal[false]

class SttFinalPayload(BaseModel):
    text: str
    confidence: float
    final: Literal[true]

class ChatQueryPayload(BaseModel):
    text: str
    locale: Optional[str] = None
    sessionId: str

class ChatPromptPayload(BaseModel):
    messages: List[Any]
    system: Optional[str] = None
    tools: Optional[List[Any]] = None

class LlmTokenPayload(BaseModel):
    text: str
    seq: int

class LlmTextPayload(BaseModel):
    text: str

class LlmCompletePayload(BaseModel):
    text: str
    usage: Optional[Dict[str, Any]] = None

class TtsStartPayload(BaseModel):
    voice: str
    format: Literal["pcm16", "wav", "mp3"]
    sampleRate: int

class TtsAudioPayload(BaseModel):
    seq: int
    bytesB64: str
    ms: int

class TtsVisemeTimingPayload(BaseModel):
    visemes: List[Any]
    timingMs: List[int]

class TtsEndPayload(BaseModel):
    totalMs: int

class AvatarStartPayload(BaseModel):
    fps: int
    format: Literal["rgb", "yuv"]
    resolution: str

class AvatarFramePayload(BaseModel):
    seq: int
    imageB64: str

class AvatarEndPayload(BaseModel):
    totalFrames: int

class RagQueryPayload(BaseModel):
    text: str
    topK: Optional[int] = None

class RagHit(BaseModel):
    sourceId: str
    title: Optional[str] = None
    snippet: str
    score: float
    loc: Optional[Dict[str, Any]] = None

class RagContextPayload(BaseModel):
    hits: List[RagHit]

class ToolRequestPayload(BaseModel):
    tool: str
    action: str
    params: Dict[str, Any]
    capabilityTier: Literal["read_only", "write_local_confirm", "destructive_two_step", "network_off_by_default"]
    requiresConfirm: bool

class ToolResultPayload(BaseModel):
    ok: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[Any] = None

class FsChangedPayload(BaseModel):
    path: str
    kind: Literal["create", "modify", "delete"]
    ts: datetime

class SystemHealthPayload(BaseModel):
    cpu: float
    ram: float
    vram: float
    disk: float

class GitBuildFailedPayload(BaseModel):
    project: str
    logPath: str
    exitCode: int

class NudgeProposalPayload(BaseModel):
    title: str
    reason: str
    severity: Literal["low", "medium", "high", "critical"]
    suggestedActions: Optional[List[Any]] = None
    channel: Literal["dashboard_only", "toast", "voice", "avatar"]

class NudgeDispatchPayload(BaseModel):
    proposalId: str
    channel: Literal["dashboard_only", "toast", "voice", "avatar"]
    rateLimited: bool

class UiCommandPayload(BaseModel):
    command: str
    args: Optional[Dict[str, Any]] = None

class UiFeedbackPayload(BaseModel):
    target: str
    helpful: bool
    note: Optional[str] = None

class UiInterruptibilityPayload(BaseModel):
    mode: Literal["dnd", "focus", "available"]

class TurnStartPayload(BaseModel):
    sessionId: str
    inputType: Literal["text", "voice", "event"]

class TurnEndPayload(BaseModel):
    sessionId: str
    outcome: Literal["ok", "error"]

class PipelineStatusPayload(BaseModel):
    pipelineId: str
    step: str
    state: Literal["start", "done", "error"]

class LedgerEntryPayload(BaseModel):
    actorSkill: str
    action: str
    targets: List[str]
    beforeHash: Optional[str] = None
    afterHash: Optional[str] = None
    ts: datetime

class ErrorRaisedPayload(BaseModel):
    code: str
    message: str
    details: Optional[Dict[str, Any]] = None
    recoverable: bool

class StreamStartEvent(EventEnvelopeBase):
    type: Literal["stream.start"]
    payload: StreamStartPayload

class StreamChunkEvent(EventEnvelopeBase):
    type: Literal["stream.chunk"]
    payload: StreamChunkPayload

class StreamEndEvent(EventEnvelopeBase):
    type: Literal["stream.end"]
    payload: StreamEndPayload

class VoiceStartEvent(EventEnvelopeBase):
    type: Literal["voice.start"]
    payload: VoiceStartPayload

class VoiceChunkEvent(EventEnvelopeBase):
    type: Literal["voice.chunk"]
    payload: VoiceChunkPayload

class VoiceEndEvent(EventEnvelopeBase):
    type: Literal["voice.end"]
    payload: VoiceEndPayload

class SttPartialEvent(EventEnvelopeBase):
    type: Literal["stt.partial"]
    payload: SttPartialPayload

class SttFinalEvent(EventEnvelopeBase):
    type: Literal["stt.final"]
    payload: SttFinalPayload

class ChatQueryEvent(EventEnvelopeBase):
    type: Literal["chat.query"]
    payload: ChatQueryPayload

class ChatPromptEvent(EventEnvelopeBase):
    type: Literal["chat.prompt"]
    payload: ChatPromptPayload

class LlmTokenEvent(EventEnvelopeBase):
    type: Literal["llm.token"]
    payload: LlmTokenPayload

class LlmTextEvent(EventEnvelopeBase):
    type: Literal["llm.text"]
    payload: LlmTextPayload

class LlmCompleteEvent(EventEnvelopeBase):
    type: Literal["llm.complete"]
    payload: LlmCompletePayload

class TtsStartEvent(EventEnvelopeBase):
    type: Literal["tts.start"]
    payload: TtsStartPayload

class TtsAudioEvent(EventEnvelopeBase):
    type: Literal["tts.audio"]
    payload: TtsAudioPayload

class TtsVisemeTimingEvent(EventEnvelopeBase):
    type: Literal["tts.viseme_timing"]
    payload: TtsVisemeTimingPayload

class TtsEndEvent(EventEnvelopeBase):
    type: Literal["tts.end"]
    payload: TtsEndPayload

class AvatarStartEvent(EventEnvelopeBase):
    type: Literal["avatar.start"]
    payload: AvatarStartPayload

class AvatarFrameEvent(EventEnvelopeBase):
    type: Literal["avatar.frame"]
    payload: AvatarFramePayload

class AvatarEndEvent(EventEnvelopeBase):
    type: Literal["avatar.end"]
    payload: AvatarEndPayload

class RagQueryEvent(EventEnvelopeBase):
    type: Literal["rag.query"]
    payload: RagQueryPayload

class RagContextEvent(EventEnvelopeBase):
    type: Literal["rag.context"]
    payload: RagContextPayload

class ToolRequestEvent(EventEnvelopeBase):
    type: Literal["tool.request"]
    payload: ToolRequestPayload

class ToolResultEvent(EventEnvelopeBase):
    type: Literal["tool.result"]
    payload: ToolResultPayload

class EventFsChangedEvent(EventEnvelopeBase):
    type: Literal["event.fs.changed"]
    payload: FsChangedPayload

class EventSystemHealthEvent(EventEnvelopeBase):
    type: Literal["event.system.health"]
    payload: SystemHealthPayload

class EventGitBuildFailedEvent(EventEnvelopeBase):
    type: Literal["event.git.build_failed"]
    payload: GitBuildFailedPayload

class NudgeProposalEvent(EventEnvelopeBase):
    type: Literal["nudge.proposal"]
    payload: NudgeProposalPayload

class NudgeDispatchEvent(EventEnvelopeBase):
    type: Literal["nudge.dispatch"]
    payload: NudgeDispatchPayload

class UiCommandEvent(EventEnvelopeBase):
    type: Literal["ui.command"]
    payload: UiCommandPayload

class UiFeedbackEvent(EventEnvelopeBase):
    type: Literal["ui.feedback"]
    payload: UiFeedbackPayload

class UiInterruptibilityEvent(EventEnvelopeBase):
    type: Literal["ui.interruptibility"]
    payload: UiInterruptibilityPayload

class TurnStartEvent(EventEnvelopeBase):
    type: Literal["turn.start"]
    payload: TurnStartPayload

class TurnEndEvent(EventEnvelopeBase):
    type: Literal["turn.end"]
    payload: TurnEndPayload

class PipelineStatusEvent(EventEnvelopeBase):
    type: Literal["pipeline.status"]
    payload: PipelineStatusPayload

class LedgerEntryEvent(EventEnvelopeBase):
    type: Literal["ledger.entry"]
    payload: LedgerEntryPayload

class ErrorRaisedEvent(EventEnvelopeBase):
    type: Literal["error.raised"]
    payload: ErrorRaisedPayload

AnyEvent = Annotated[Union[
    StreamStartEvent,
    StreamChunkEvent,
    StreamEndEvent,
    VoiceStartEvent,
    VoiceChunkEvent,
    VoiceEndEvent,
    SttPartialEvent,
    SttFinalEvent,
    ChatQueryEvent,
    ChatPromptEvent,
    LlmTokenEvent,
    LlmTextEvent,
    LlmCompleteEvent,
    TtsStartEvent,
    TtsAudioEvent,
    TtsVisemeTimingEvent,
    TtsEndEvent,
    AvatarStartEvent,
    AvatarFrameEvent,
    AvatarEndEvent,
    RagQueryEvent,
    RagContextEvent,
    ToolRequestEvent,
    ToolResultEvent,
    EventFsChangedEvent,
    EventSystemHealthEvent,
    EventGitBuildFailedEvent,
    NudgeProposalEvent,
    NudgeDispatchEvent,
    UiCommandEvent,
    UiFeedbackEvent,
    UiInterruptibilityEvent,
    TurnStartEvent,
    TurnEndEvent,
    PipelineStatusEvent,
    LedgerEntryEvent,
    ErrorRaisedEvent
], Field(discriminator='type')]
