# Why saving and notification need separate facts

A website can save an enquiry successfully while its notification fails. If a report treats those outcomes as one success flag, an owner can mistake a failed notification for lost data or mistake a saved record for a received email. This example keeps the two facts visible.

The CLI is a local reader of fictional metadata. Its input declares that each enquiry was saved and reports a notification state. The tool summarizes those declarations. It neither implements the website's save-and-send flow nor verifies that any declared event happened.

## The path that exists in this example

The person running the command supplies a file path. The Python process reads that file, validates every record, selects records for the requested site, counts them, and prints a report.

| Responsibility | Owner in this example |
| --- | --- |
| State what happened before the export | The input producer; the supplied producer is an original fictional fixture |
| Permit or deny reading the file | The operating system and the caller's file access |
| Reject unsupported input | The CLI's validation functions |
| Select a site and calculate counts | The CLI's report function |
| Create a saved report through `>` | The caller's shell |

There is no database, email provider, background worker, server, or user session in this runtime path. Those components may exist in a real enquiry product; their behavior would need separate source and runtime evidence.

## What the two counts mean

`saved_records` counts selected records that have a valid `saved_at` value. This establishes how many records in the supplied file meet this format. It does not prove database persistence. A producer could supply incomplete or incorrect metadata.

The four notification counts describe the states reported by those same records. In the valid fixture, four records were declared saved, while one reports `delivered`, one `failed`, one `queued`, and one `unknown`.

| Question | Can this report answer it? |
| --- | --- |
| How many validated records in this file match the site? | Yes |
| How many matching records declare a failed notification? | Yes |
| Did the website keep every submitted enquiry? | No; the export could omit records |
| Did an email provider accept a request? | Only if an input contract defines that event; this format does not |
| Did a recipient receive or read an email? | No; the CLI does not independently observe receipt or reading |

In a real integration, a producer must define what its `delivered` event establishes. An API accepting a send request, a provider recording delivery, and a person receiving or reading an email are different observations. A concise document should preserve those differences.

## Why unknown stays separate

`unknown` describes a lack of reliable outcome information. `failed` reports an unsuccessful attempt. Combining them would raise the failure count without evidence. Treating `unknown` as success would hide uncertainty. Keeping it separate gives an owner a more accurate question to investigate: “What do we know about this notification?”

`attempts` makes an obvious contradiction rejectable: a reported delivered or failed attempt needs at least one declared attempt. It is not a retry schedule or a proof that an attempt occurred. The CLI never converts states or retries work.

## Why validate before filtering

The CLI validates the whole file before selecting a site. A duplicate ID across two sites is therefore rejected even if a report requests only one site. This avoids a partial report that quietly relies on malformed source data.

Rejecting the whole file can block a useful count when an unrelated record is bad. A more flexible tool might return partial counts with explicit rejected-record details. That design would need a clear completeness contract and reader-visible partial status. This teaching example chooses whole-file rejection so that a successful report has one simple interpretation: all input records passed validation.

The parser also rejects unknown fields and labels. This keeps the example's contract small and precise. It makes the tool unsuitable for arbitrary exports without an adapter. Loosening those rules could improve compatibility, but silently ignoring a changed field could hide a producer change that affects meaning.

## Why a site filter is not permission

By the time filtering occurs, the process has already read and validated all records. `--site north-star` controls the report's selection. It cannot protect other sites' records from a caller who can read the file. Any use with real multi-owner data would need legitimate access rules outside this CLI and a deliberate export design.

## Why file saving belongs to the shell

The CLI prints to stdout and has no output file argument. This keeps its own operation read-only. The shell can save stdout through redirection, which creates or replaces a different file before the command runs. A failed command can therefore leave an empty output file. The [operation manual](operations.md#save-a-json-report) uses no-clobber, exit-status checking, and a JSON check to make that effect visible and preserve an existing report.

An integrated file-writing feature could provide stronger guarantees for reports, such as a temporary file followed by atomic replacement. That would add a second file operation and a larger interface. It is a reasonable choice for another tool, but it is unnecessary for this local documentation exercise.

## Evidence and scope

The [implementation](../summary.py) establishes the declared interfaces and ordering. The [check script](../verify.py) exercises counts, invalid input, filtering, streams, and fixture preservation. Author-run checks confirm the exercised local behavior. They do not establish usability for an unfamiliar person, production readiness, live persistence, provider integration, or email delivery.

The four documents demonstrate different reader needs through one shared implementation: the tutorial gives a controlled exercise, the operation manual solves tasks, the reference defines exact behavior, and this explanation connects facts and choices. That division helps readers find the kind of help they need; another project can use a smaller structure.
