#!/usr/bin/env python3
from __future__ import annotations
"""Create a minimized, local-only reminder lookup dataset from SouthViewData.csv.

The output is git-ignored. It contains only names and validated dates for records
with a valid past death date; it must not be published as a client-side asset.
"""
import csv
import json
import sys
from datetime import date, datetime
from pathlib import Path

source = Path(sys.argv[1]) if len(sys.argv) > 1 else Path.home() / "Downloads" / "SouthViewData.csv"
output = Path(__file__).resolve().parents[1] / ".local-data" / "memorials.json"
today = date.today()


def parse_date(value: str, min_year: int) -> str | None:
    try:
        parsed = datetime.strptime(value.strip(), "%m/%d/%Y").date()
    except (ValueError, AttributeError):
        return None
    if parsed.year < min_year or parsed.year > today.year:
        return None
    return parsed.isoformat()


records = []
seen = set()
with source.open(newline="", encoding="utf-8-sig") as handle:
    for row in csv.DictReader(handle):
        death = parse_date(row.get("DateOfDeath", ""), 1800)
        if not death:
            continue
        record = {
            "DateOfBirth": parse_date(row.get("DateOfBirth", ""), 1700) or "",
            "DateOfDeath": death,
            "FirstName": (row.get("FirstName") or "").strip(),
            "LastName": (row.get("LastName") or "").strip(),
            "MiddleName": (row.get("MiddleName") or "").strip(),
        }
        key = tuple(record.values())
        if key not in seen:
            records.append(record)
            seen.add(key)

output.parent.mkdir(exist_ok=True)
output.write_text(json.dumps(records, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print(f"Prepared {len(records)} validated deceased records in git-ignored local data.")
