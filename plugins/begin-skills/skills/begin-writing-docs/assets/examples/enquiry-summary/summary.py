#!/usr/bin/env python3
"""Summarize fictional enquiry metadata from a local JSON file."""

import argparse
import json
import re
import sys
from datetime import datetime
from pathlib import Path


FORMAT_VERSION = 1
MAX_INPUT_BYTES = 1_048_576
STATES = ("queued", "delivered", "failed", "unknown")
IDENTIFIER = re.compile(r"[a-z0-9][a-z0-9-]{0,63}\Z")
UTC_TIMESTAMP = re.compile(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z\Z", re.ASCII)


class InputError(ValueError):
    """An input does not meet the documented contract."""


def unique_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise InputError("JSON object keys must be unique")
        result[key] = value
    return result


def reject_constant(_value):
    raise InputError("JSON numbers must be finite")


def require_keys(value, keys, location):
    if not isinstance(value, dict) or set(value) != set(keys):
        raise InputError(f"{location} must be an object with exactly: {', '.join(keys)}")


def valid_identifier(value):
    return isinstance(value, str) and IDENTIFIER.fullmatch(value) is not None


def validate_document(document):
    require_keys(document, ("format_version", "enquiries"), "input")
    if type(document["format_version"]) is not int or document["format_version"] != FORMAT_VERSION:
        raise InputError("format_version must be the integer 1")
    records = document["enquiries"]
    if not isinstance(records, list):
        raise InputError("enquiries must be an array")
    seen_ids = set()
    for index, record in enumerate(records):
        location = f"enquiries[{index}]"
        require_keys(record, ("id", "site_id", "saved_at", "notification"), location)
        for key in ("id", "site_id"):
            if not valid_identifier(record[key]):
                raise InputError(f"{location}.{key} must be 1-64 lowercase letters, digits, or hyphens; start with a letter or digit")
        if record["id"] in seen_ids:
            raise InputError(f"{location}.id duplicates an earlier enquiry ID")
        seen_ids.add(record["id"])
        timestamp = record["saved_at"]
        if not isinstance(timestamp, str) or UTC_TIMESTAMP.fullmatch(timestamp) is None:
            raise InputError(f"{location}.saved_at must use YYYY-MM-DDTHH:MM:SSZ")
        try:
            datetime.strptime(timestamp, "%Y-%m-%dT%H:%M:%SZ")
        except ValueError as error:
            raise InputError(f"{location}.saved_at must be a valid UTC calendar timestamp") from error
        notification = record["notification"]
        require_keys(notification, ("state", "attempts"), f"{location}.notification")
        state = notification["state"]
        if not isinstance(state, str) or state not in STATES:
            raise InputError(f"{location}.notification.state must be one of: {', '.join(STATES)}")
        attempts = notification["attempts"]
        if type(attempts) is not int or attempts < 0:
            raise InputError(f"{location}.notification.attempts must be a non-negative integer")
        if state in ("delivered", "failed") and attempts == 0:
            raise InputError(f"{location}.notification.attempts must be at least 1 for {state}")
    return records


def load_records(path):
    try:
        with path.open("rb") as source:
            raw = source.read(MAX_INPUT_BYTES + 1)
    except OSError as error:
        raise InputError("cannot read the input file; check the path and file permissions") from error
    if len(raw) > MAX_INPUT_BYTES:
        raise InputError(f"input exceeds {MAX_INPUT_BYTES} bytes; use a smaller export")
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError as error:
        raise InputError("input must be UTF-8 text") from error
    try:
        document = json.loads(text, object_pairs_hook=unique_object, parse_constant=reject_constant)
    except json.JSONDecodeError as error:
        raise InputError(f"invalid JSON at line {error.lineno}, column {error.colno}") from error
    except InputError:
        raise
    except ValueError as error:
        raise InputError("JSON contains an unsupported numeric value") from error
    except RecursionError as error:
        raise InputError("input is nested too deeply; use the documented record shape") from error
    return validate_document(document)


def make_report(records, site_filter):
    selected = [record for record in records if site_filter is None or record["site_id"] == site_filter]
    counts = {state: 0 for state in STATES}
    for record in selected:
        counts[record["notification"]["state"]] += 1
    return {
        "format_version": FORMAT_VERSION,
        "site_filter": site_filter,
        "saved_records": len(selected),
        "reported_notification_states": counts,
    }


def render_text(report):
    site = report["site_filter"] if report["site_filter"] is not None else "none (all records)"
    lines = [f"Site filter: {site}", f"Saved records in input: {report['saved_records']}"]
    lines.append("Notification states reported by input:")
    for state, count in report["reported_notification_states"].items():
        lines.append(f"  {state}: {count}")
    lines.append("Status origin: input records; recipient receipt was not independently checked.")
    return "\n".join(lines)


def main(argv=None):
    parser = argparse.ArgumentParser(
        description="Count saved enquiry records and their reported notification states in a local JSON file."
    )
    parser.add_argument("input", type=Path, help="UTF-8 JSON file in format version 1")
    parser.add_argument("--site", help="include only records with this site_id")
    parser.add_argument("--format", choices=("text", "json"), default="text", help="output format (default: text)")
    args = parser.parse_args(argv)
    if args.site is not None and not valid_identifier(args.site):
        parser.error("--site must be a valid identifier; see the input reference")
    try:
        records = load_records(args.input)
    except InputError as error:
        print(f"error: {error}", file=sys.stderr)
        return 2
    report = make_report(records, args.site)
    output = json.dumps(report, indent=2) if args.format == "json" else render_text(report)
    print(output)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
