# CLI and data reference

This reference describes the included `summary.py`, input format version `1`, and report format version `1`. It is the example's local contract. It does not describe a live service or another provider's export format.

## Command

```text
python3 summary.py INPUT [--site SITE_ID] [--format {text,json}]
```

`INPUT` and `SITE_ID` are placeholders in this syntax line. For a literal command, see [the operation manual](operations.md).

| Argument | Meaning | Default or constraint |
| --- | --- | --- |
| `INPUT` | Path to a local JSON file | Required; resolved from the terminal's current directory if relative |
| `--site SITE_ID` | Include records whose `site_id` exactly matches this value | Omitted: include all records. Uses the identifier rules below |
| `--format text` | Print the human-readable report | Default |
| `--format json` | Print the report object as JSON | Same counts as text |
| `-h`, `--help` | Print command help | No input file required; exits with status `0` |

There is no stdin input, environment configuration, or built-in output file option. The command opens the input for reading. Shell redirection can save its stdout; the shell then owns the file-writing behavior.

## Input format version 1

Input is UTF-8 JSON without a byte-order mark, at most **1,048,576 bytes** (1 MiB). JSON object keys must be unique. The fields in each object must match the listed fields exactly; additional or missing fields are rejected. The JSON parser rejects invalid syntax, non-finite constants such as `NaN`, and unsupported numeric values.

```json
{
  "format_version": 1,
  "enquiries": [
    {
      "id": "enq-001",
      "site_id": "north-star",
      "saved_at": "2026-10-01T09:00:00Z",
      "notification": {"state": "delivered", "attempts": 1}
    }
  ]
}
```

| Field | Type | Contract |
| --- | --- | --- |
| `format_version` | Integer | Exactly `1`; Boolean `true` is rejected |
| `enquiries` | Array of objects | May be empty. Each object represents a saved enquiry according to the input producer |
| `enquiries[].id` | String | Unique across the entire file, including different sites; uses the identifier rules |
| `enquiries[].site_id` | String | Uses the identifier rules; repeated sites are allowed |
| `enquiries[].saved_at` | String | Valid UTC calendar timestamp in `YYYY-MM-DDTHH:MM:SSZ` form, with four-digit year and whole seconds |
| `enquiries[].notification` | Object | Exactly `state` and `attempts` |
| `notification.state` | String | One of the four values below |
| `notification.attempts` | Integer | At least `0`; at least `1` for `delivered` or `failed`. Booleans and fractions are rejected |

An identifier is 1–64 lowercase ASCII letters, digits, or hyphens. It starts with a letter or digit. For example, `north-star` is valid; `North Star` and `-site` are invalid.

`saved_at` records the producer's assertion that the enquiry was saved. The CLI checks timestamp syntax and calendar validity. It does not check a database, timestamp freshness, export completeness, or the truth of that assertion. Names, email addresses, and message bodies have no field in this example format. Valid syntax alone is not a privacy review of arbitrary input.

### Notification states

| Value | Meaning in this input format | Minimum attempts |
| --- | --- | --- |
| `queued` | The producer reports that a notification is waiting for an attempt or retry | `0` |
| `delivered` | The producer reports a successful delivery outcome | `1` |
| `failed` | The producer reports a failed notification attempt | `1` |
| `unknown` | The producer cannot establish the notification outcome | `0` |

The CLI counts these declarations. A `delivered` declaration is not an independent check of recipient receipt. `unknown` is a separate state, not a failure or a success. The tool does not enqueue work, retry a notification, or change a state.

## JSON output

For the valid fixture filtered to `north-star`:

```json
{
  "format_version": 1,
  "site_filter": "north-star",
  "saved_records": 2,
  "reported_notification_states": {
    "queued": 0,
    "delivered": 1,
    "failed": 1,
    "unknown": 0
  }
}
```

| Field | Meaning |
| --- | --- |
| `format_version` | Report format version, currently `1` |
| `site_filter` | The exact requested identifier, or JSON `null` when no filter is used |
| `saved_records` | Number of validated records selected from this input |
| `reported_notification_states` | Four non-negative integer counts, one per state, including zeros |

The state counts sum to `saved_records`. A valid empty array or a filter with no match returns zero counts and exit status `0`. Invalid input anywhere in the file returns an error, even when that record would be excluded by the filter. Reports contain no per-enquiry IDs or timestamps.

## Text output

Text output shows the site filter, saved-record count, all four state counts, and the origin of the status information. No filter appears as `Site filter: none (all records)`. The [tutorial](tutorial.md) provides complete text examples. Tools that need structured values should use `--format json`.

## Exit status and streams

| Status | Meaning | stdout | stderr |
| --- | --- | --- | --- |
| `0` | Valid report | Report followed by a newline | Empty |
| `0` | Help requested | Usage and help | Empty |
| `2` | Invalid arguments, unreadable input, or rejected input | Empty | Diagnostic; argument errors also include usage |

Input diagnostics identify an object or field when available. An array position such as `enquiries[1]` is zero-based, so it identifies the second record. Exact wording can change as diagnostics improve. A shell failure, interrupted process, or unavailable Python executable can produce other exit statuses; those are outside the CLI's own handled-input contract.

## Source basis

The implementation is [summary.py](../summary.py): `load_records` owns file and JSON handling; `validate_document` owns the record contract; `make_report` selects and counts; `main` owns CLI arguments and streams. [verify.py](../verify.py) exercises representative behavior. See the [explanation](explanation.md) for the rationale and [operation manual](operations.md) for recovery steps.
