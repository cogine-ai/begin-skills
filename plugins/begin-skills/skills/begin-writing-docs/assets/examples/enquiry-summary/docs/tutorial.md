# Try an enquiry summary

In this exercise, you will count four fictional enquiries, select one site, and recognize a rejected input. The tool reads the supplied files and prints results. It does not change those files or send email.

## Before you start

You need Python 3.10 or later and a terminal open in the `enquiry-summary` directory. This directory contains `summary.py` and the `fixtures` folder. Commands below use `python3`; on Windows with the Python launcher, replace it with `py -3`.

Run:

```sh
python3 --version
```

The version should be 3.10 or later. If the command is unavailable, use your installed Python launcher or install Python before continuing.

## 1. Count the records

Run:

```sh
python3 summary.py fixtures/valid.json
```

You should see:

```text
Site filter: none (all records)
Saved records in input: 4
Notification states reported by input:
  queued: 1
  delivered: 1
  failed: 1
  unknown: 1
Status origin: input records; recipient receipt was not independently checked.
```

Notice the two counts: four saved records and one reported delivery. A failed notification does not remove a saved record from this summary.

## 2. Select one site

Run:

```sh
python3 summary.py fixtures/valid.json --site north-star
```

You should see:

```text
Site filter: north-star
Saved records in input: 2
Notification states reported by input:
  queued: 0
  delivered: 1
  failed: 1
  unknown: 0
Status origin: input records; recipient receipt was not independently checked.
```

The selected site has two saved records. One reports a successful notification, and one reports a failed notification. The tool selected data already present in the file; it did not request access to a site.

## 3. Recognize a rejected input

Run the supplied invalid sample:

```sh
python3 summary.py fixtures/invalid-notification.json
```

The command prints this error to stderr and exits with status `2`:

```text
error: enquiries[0].notification.state must be one of: queued, delivered, failed, unknown
```

No summary is printed. The sample uses `sent`, which this format does not define. Keep the sample unchanged. An input error means the file does not satisfy the contract; it does not establish a real notification failure.

## 4. Check the example

Run:

```sh
python3 verify.py
```

The output lists the behavioral checks and ends with `OK` when they pass. The number of checks and elapsed time may change as the example is maintained.

You have now recognized a complete report, a filtered report, and an input error. To count another site or save JSON, use the [operation manual](operations.md). To understand what these counts establish, read the [technical explanation](explanation.md).
