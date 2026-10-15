# Enquiry summary: a documentation example

Count fictional saved enquiry records and their reported notification states from a local JSON file. This small Python project exists so a reader can run the documentation, inspect a failure, and check the result.

It reads an input file and prints a summary. It has no database, account, network request, email sender, or third-party dependency. A `delivered` value is a claim in the input; this tool does not independently check recipient receipt.

## Choose a document by your task

| I want to… | Start here |
| --- | --- |
| Try the tool and recognize its results | [Tutorial](docs/tutorial.md) |
| Count one site, save a report, or resolve an input error | [Operation manual](docs/operations.md) |
| Look up flags, JSON fields, output, or exit status | [CLI and data reference](docs/reference.md) |
| Understand why saving and notification are separate | [Technical explanation](docs/explanation.md) |

Each document can be used directly. Reading all four is optional.

## Run the example

You need Python 3.10 or later and a terminal. Open the terminal in this `enquiry-summary` directory, which contains `summary.py` and `fixtures/`. No installation step is required.

```sh
python3 summary.py fixtures/valid.json
```

The result includes `Saved records in input: 4` and one record in each notification state. The [tutorial](docs/tutorial.md) shows the complete expected result.

Commands use `python3`, as commonly available on macOS and Linux. If your Windows installation provides the Python launcher, use `py -3` in place of `python3`. The CLI and check script use the standard library; author checks ran on macOS with Python 3.14.6, and a separate reader task ran with Python 3.12.10. Other operating systems and the minimum Python version have not been exercised here.

## Check behavior

```sh
python3 verify.py
```

The check script runs the CLI in subprocesses with fictional files. It checks counts, filtering, empty results, malformed input, schema constraints, stdout/stderr, exit status, and preservation of the valid fixture. Its temporary inputs are removed after each check. `OK` means these checks passed in that environment. It does not establish that an unfamiliar reader can follow the manual or that a real email was delivered.

## Files to inspect

- [summary.py](summary.py): the complete command implementation.
- [verify.py](verify.py): behavioral checks with no external test runner.
- [valid.json](fixtures/valid.json): four original fictional records across two sites.
- [invalid-duplicate.json](fixtures/invalid-duplicate.json): an ID repeated across two sites.
- [invalid-notification.json](fixtures/invalid-notification.json): an unsupported state, `sent`.

The docs and fixtures are original teaching material. They describe this example's behavior, not a live website or a database export format supplied by another service. For the writing methods and primary sources behind the document choices, see [technical writing methods](../../../references/technical-writing.md).
