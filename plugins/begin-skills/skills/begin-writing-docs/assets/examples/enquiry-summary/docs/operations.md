# Enquiry summary operation manual

Use this manual to summarize a local file, select a site, save a report, or diagnose an input error. For your first guided exercise, use the [tutorial](tutorial.md). Exact flags and data constraints are in the [reference](reference.md).

## Prerequisites and effects

- Python 3.10 or later.
- A terminal open in the `enquiry-summary` directory, containing `summary.py`.
- A readable UTF-8 JSON file in [input format version 1](reference.md#input-format-version-1).

Commands use `python3`. On Windows with the Python launcher, replace it with `py -3`. The report-saving recipe below uses a macOS/Linux shell.

The CLI reads the file and prints to stdout. It does not modify records or send notifications. Your operating system controls access to the file. `--site` changes which records appear in the report; it is a selection option, not an access control.

The supplied fixtures contain fictional metadata. This teaching CLI is not an adapter for arbitrary production exports. Before adapting it to another system, define that system's export contract and access rules.

## Count all records in a file

For the supplied sample, run:

```sh
python3 summary.py fixtures/valid.json
```

Confirm that the report shows `Saved records in input: 4` and a count of `1` for each state. The four state counts add up to the saved-record count.

For another compatible file, replace `fixtures/valid.json` with its path. Quote a path that contains spaces. The displayed values come from that file; a successfully parsed timestamp does not independently verify a database save.

## Count one site

Run:

```sh
python3 summary.py fixtures/valid.json --site north-star
```

Expected: two saved records, one `delivered`, one `failed`, and zero in the other states. Matching is exact and case-sensitive.

To inspect the other sample site, use `--site river-studio`. Its two records report one `queued` and one `unknown`. A valid site identifier with no matching records produces zero counts and exit status `0`. Check the identifier and file before interpreting zero as an absence of enquiries in a live system.

## Print JSON for another tool

Run:

```sh
python3 summary.py fixtures/valid.json --site north-star --format json
```

The output contains `"saved_records": 2` and `"site_filter": "north-star"`. The full output contract is in [JSON output](reference.md#json-output). An input error produces no JSON report; it appears on stderr with exit status `2`.

## Save a JSON report

This recipe creates `report.json` in the current directory. Shell redirection with `>` replaces an existing file even if the CLI later fails. The first command below enables the shell's no-clobber option so an existing report is preserved. Choose a new filename if the shell refuses to create it.

In a macOS/Linux shell, run:

```sh
set -C
python3 summary.py fixtures/valid.json --site north-star --format json > report.json
```

Immediately check the command's exit status:

```sh
echo $?
```

`0` means the CLI completed; another status requires diagnosis before you use the file. Check that the saved file contains valid JSON:

```sh
python3 -m json.tool report.json
```

Expected: a formatted JSON report with `"saved_records": 2`. The input file remains unchanged. If the CLI failed, a newly created output file can be empty; correct the input and use a new output filename. If you enabled no-clobber only for this task, restore the default afterward with `set +C`.

## Diagnose a failure

The CLI reports input errors on stderr and exits with status `2`. It validates the entire file before printing counts, including records outside a requested site filter.

| Symptom | Narrow check | Meaning and next action |
| --- | --- | --- |
| Python cannot open `summary.py` | Check that the terminal is in the folder containing `summary.py` | Move to that folder; keep the input path relative to it or use an absolute path |
| `cannot read the input file` | Check the path and whether your account can read the file | Correct the path or obtain legitimate file access; do not change access rules to bypass an owner |
| `invalid JSON at line …` | Run `python3 -m json.tool` with the input path | Locate the JSON syntax error; fix a copy or regenerate the export |
| `…id duplicates an earlier enquiry ID` | Compare IDs across the entire file | The same ID appears more than once. Determine why the export repeats it; do not silently delete a record just to get counts |
| `…state must be one of…` | Compare the value with the [state definitions](reference.md#notification-states) | An unsupported label needs a documented mapping from its producer. Do not guess that `sent` means `delivered` |
| `…attempts must be at least 1…` | Check the producer's delivery record | A successful or failed attempt cannot have zero reported attempts in this format; correct the inconsistency at its source |
| `input exceeds 1048576 bytes` | Check the file size | Produce a smaller compatible export. Counts from one part represent only that part; the CLI does not merge parts or check IDs across files |

The two supplied invalid files let you see failures without changing any real record:

```sh
python3 summary.py fixtures/invalid-duplicate.json
python3 summary.py fixtures/invalid-notification.json
```

The first identifies `enquiries[1].id`; the second identifies `enquiries[0].notification.state`. Array positions in these errors start at zero. Both commands produce no report and exit with status `2`.

## Recognize the limits of a completed task

A valid report confirms counts for the input and filter you used. It does not confirm that an export is complete, that a database still holds those records, or that a recipient received an email. `unknown` represents missing knowledge; it is not grouped with `failed`. See the [technical explanation](explanation.md) for the reason these distinctions matter.
