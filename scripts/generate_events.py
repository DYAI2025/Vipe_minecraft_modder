#!/usr/bin/env python3
"""
Generate TypeScript + Python (Pydantic v2) types from a single source of truth event catalog.

Usage:
  python3 scripts/generate_events.py docs/contracts/event-catalog.json --out-ts packages/ipc-contracts/src --out-py packages/voice-server-py
"""
from __future__ import annotations

import argparse, json, os, re
from typing import Any, Dict, List

def pascal(s: str) -> str:
    # "voice.chunk" -> "VoiceChunk"
    parts = re.split(r'[^a-zA-Z0-9]+', s)
    return "".join(p[:1].upper() + p[1:] for p in parts if p)

# -------------------------
# TS mapping
# -------------------------
def ts_type(spec: Dict[str, Any]) -> str:
    t = spec["type"]
    if t == "string": return "string"
    if t in ("int","float"): return "number"
    if t == "boolean": return "boolean"
    if t == "datetime": return "string"  # ISO string
    if t == "any": return "unknown"
    if t == "record":
        v = ts_type(spec.get("values", {"type":"any"}))
        return f"Record<string, {v}>"
    if t == "array":
        it = ts_type(spec["items"])
        return f"Array<{it}>"
    if t == "enum":
        vals = spec["values"]
        return " | ".join([json.dumps(v) for v in vals])
    if t == "literal":
        return json.dumps(spec["value"])
    if t == "ref":
        return spec["name"]
    raise ValueError(f"Unknown type spec: {spec}")

def is_optional(spec: Dict[str, Any]) -> bool:
    return bool(spec.get("optional", False))

def write_file(path: str, content: str) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

def gen_ts(catalog: Dict[str, Any]) -> str:
    payload_types = catalog["payloadTypes"]
    events = catalog["events"]

    lines: List[str] = []
    lines.append("// AUTO-GENERATED. DO NOT EDIT.\n")

    # Shared contracts
    sev = catalog["envelope"]["severityEnum"]
    lines.append(f'export type Severity = {" | ".join([json.dumps(s) for s in sev])};\n')
    lines.append('export interface BaseEventEnvelope<TType extends string, TPayload> {\n'
                 '  type: TType;\n'
                 '  traceId: string;\n'
                 '  ts: string; // ISO-8601\n'
                 '  source: string;\n'
                 '  severity: Severity;\n'
                 '  payload: TPayload;\n'
                 '}\n\n')

    # Payload interfaces
    for name, fields in payload_types.items():
        lines.append(f"export interface {name} {{")
        for fname, spec in fields.items():
            opt = "?" if is_optional(spec) else ""
            lines.append(f"  {fname}{opt}: {ts_type(spec)};")
        lines.append("}\n")

    # EventPayloadMap
    lines.append("export interface EventPayloadMap {")
    for etype, meta in events.items():
        payload = meta["payload"]
        lines.append(f"  {json.dumps(etype)}: {payload};")
    lines.append("}\n")

    lines.append("export type EventType = keyof EventPayloadMap;\n")
    lines.append("export type EventEnvelope<T extends EventType = EventType> = BaseEventEnvelope<T, EventPayloadMap[T]>;\n")
    lines.append("export type AnyEvent = { [K in EventType]: EventEnvelope<K> }[EventType];\n")
    lines.append("export const makeEvent = <T extends EventType>(e: EventEnvelope<T>) => e;\n")
    return "\n".join(lines)

# -------------------------
# PY mapping (Pydantic v2)
# -------------------------
def py_type(spec: Dict[str, Any]) -> str:
    t = spec["type"]
    if t == "string": return "str"
    if t == "int": return "int"
    if t == "float": return "float"
    if t == "boolean": return "bool"
    if t == "datetime": return "datetime"
    if t == "any": return "Any"
    if t == "record":
        v = py_type(spec.get("values", {"type":"any"}))
        return f"Dict[str, {v}]"
    if t == "array":
        it = py_type(spec["items"])
        return f"List[{it}]"
    if t == "enum":
        vals = spec["values"]
        return f"Literal[{', '.join([json.dumps(v) for v in vals])}]"
    if t == "literal":
        return f"Literal[{json.dumps(spec['value'])}]"
    if t == "ref":
        return spec["name"]
    raise ValueError(f"Unknown type spec: {spec}")

def gen_py(catalog: Dict[str, Any]) -> str:
    payload_types = catalog["payloadTypes"]
    events = catalog["events"]

    lines: List[str] = []
    lines.append("# AUTO-GENERATED. DO NOT EDIT.\n")
    lines.append("from __future__ import annotations\n")
    lines.append("from datetime import datetime\n")
    lines.append("from typing import Any, Dict, List, Optional, Union, Literal, Annotated\n")
    lines.append("from pydantic import BaseModel, Field, ConfigDict\n\n")

    # Envelope base
    lines.append("Severity = Literal[" + ", ".join([json.dumps(s) for s in catalog["envelope"]["severityEnum"]]) + "]\n\n")

    lines.append("class EventEnvelopeBase(BaseModel):\n"
                 "    model_config = ConfigDict(populate_by_name=True)\n\n"
                 "    type: str\n"
                 "    trace_id: str = Field(alias='traceId')\n"
                 "    ts: datetime\n"
                 "    source: str\n"
                 "    severity: Severity\n"
                 "    payload: Any\n\n")

    # Payload models
    for name, fields in payload_types.items():
        lines.append(f"class {name}(BaseModel):")
        if not fields:
            lines.append("    pass\n")
            continue
        for fname, spec in fields.items():
            t = py_type(spec)
            if is_optional(spec):
                lines.append(f"    {fname}: Optional[{t}] = None")
            else:
                lines.append(f"    {fname}: {t}")
        lines.append("")

    # Event models
    event_class_names: List[str] = []
    for etype, meta in events.items():
        payload = meta["payload"]
        cname = pascal(etype) + "Event"
        event_class_names.append(cname)
        lines.append(f"class {cname}(EventEnvelopeBase):")
        lines.append(f"    type: Literal[{json.dumps(etype)}]")
        lines.append(f"    payload: {payload}\n")

    # Discriminated union
    lines.append("AnyEvent = Annotated[Union[")
    for i, cname in enumerate(event_class_names):
        comma = "," if i < len(event_class_names) - 1 else ""
        lines.append(f"    {cname}{comma}")
    lines.append("], Field(discriminator='type')]\n")
    return "\n".join(lines)

def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("catalog", help="Path to event_catalog.json")
    ap.add_argument("--out-ts", dest="out_ts", help="Output directory for TS")
    ap.add_argument("--out-py", dest="out_py", help="Output directory for Python")
    args = ap.parse_args()

    with open(args.catalog, "r", encoding="utf-8") as f:
        catalog = json.load(f)

    if args.out_ts:
        ts_out = os.path.join(args.out_ts, "events.generated.ts")
        write_file(ts_out, gen_ts(catalog))
        print(f"Wrote TS: {ts_out}")

    if args.out_py:
        py_out = os.path.join(args.out_py, "schemas_generated.py")
        write_file(py_out, gen_py(catalog))
        print(f"Wrote Py: {py_out}")

if __name__ == "__main__":
    main()
