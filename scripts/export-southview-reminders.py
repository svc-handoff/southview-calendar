#!/usr/bin/env python3
"""Create small ICS import batches from the local South-View memorial index.

The source and generated ICS files contain person names and dates. Keep them
local; generated files belong in a temporary directory, never in the repository.
"""
from __future__ import annotations

import hashlib
import json
import re
import sys
import unicodedata
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

root = Path(__file__).resolve().parents[1]
source = Path(sys.argv[1]) if len(sys.argv) > 1 else root / ".local-data" / "memorials.json"
out = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("/private/tmp/southview-reminder-import")
batch_size = int(sys.argv[3]) if len(sys.argv) > 3 else 1000


def normalized(value: str) -> str:
    plain = unicodedata.normalize("NFKD", value)
    return re.sub(r"[^a-z0-9]+", " ", "".join(c for c in plain if not unicodedata.combining(c)).lower()).strip()


def escaped(value: str) -> str:
    return value.replace("\\", "\\\\").replace("\n", "\\n").replace(";", "\\;").replace(",", "\\,")


def fold(line: str) -> list[str]:
    chunks: list[str] = []
    current = ""
    for character in line:
        if len((current + character).encode("utf-8")) > 73:
            chunks.append(current)
            current = " "
        current += character
    chunks.append(current)
    return chunks


records = json.loads(source.read_text(encoding="utf-8"))
unique: dict[tuple[str, str], dict[str, str]] = {}
for record in records:
    death = record.get("DateOfDeath", "")
    try:
        day = date.fromisoformat(death)
    except ValueError:
        continue
    name = " ".join(part for part in (record.get("FirstName", ""), record.get("MiddleName", ""), record.get("LastName", "")) if part)
    name = re.sub(r"\s+", " ", name).strip()
    key = (normalized(name), day.strftime("%m-%d"))
    if name and key[0]:
        unique.setdefault(key, {"name": name, "date": death})

rows = list(unique.values())
if batch_size < 1:
    raise SystemExit("batch size must be positive")
out.mkdir(parents=True, exist_ok=True)
stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
for old in out.glob("remember-someone-*.ics"):
    old.unlink()

for batch_number, start in enumerate(range(0, len(rows), batch_size), 1):
    lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//South-View Cemetery//Remember Someone//EN", "CALSCALE:GREGORIAN", "X-WR-CALNAME:South-View Remember Someone"]
    for record in rows[start:start + batch_size]:
        name, death = record["name"], date.fromisoformat(record["date"])
        next_day = death + timedelta(days=1)
        fingerprint = hashlib.sha256(f"{normalized(name)}|{death.isoformat()}".encode()).hexdigest()
        lines.extend([
            "BEGIN:VEVENT",
            f"UID:{fingerprint}@southview-reminders",
            f"DTSTAMP:{stamp}",
            f"DTSTART;VALUE=DATE:{death:%Y%m%d}",
            f"DTEND;VALUE=DATE:{next_day:%Y%m%d}",
            "RRULE:FREQ=YEARLY",
            f"SUMMARY:{escaped(name)}",
            "CLASS:PUBLIC",
            "TRANSP:TRANSPARENT",
            "END:VEVENT",
        ])
    lines.append("END:VCALENDAR")
    content = "\r\n".join(part for line in lines for part in fold(line)) + "\r\n"
    path = out / f"remember-someone-{batch_number:02d}.ics"
    path.write_bytes(content.encode("utf-8"))
    print(f"{path}\t{len(rows[start:start + batch_size])}\t{path.stat().st_size}")

print(f"TOTAL\t{len(rows)}\t{len(list(out.glob('remember-someone-*.ics')))}")
