#!/usr/bin/env python3
"""Exercise the documented CLI contract with fictional files and subprocesses."""

import copy
import hashlib
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parent
CLI = ROOT / "summary.py"
FIXTURES = ROOT / "fixtures"
EXPECTED_COUNTS = {"queued": 1, "delivered": 1, "failed": 1, "unknown": 1}


class SummaryContract(unittest.TestCase):
    def run_cli(self, *arguments):
        return subprocess.run(
            [sys.executable, str(CLI), *map(str, arguments)],
            cwd=ROOT,
            capture_output=True,
            text=True,
            timeout=5,
            check=False,
        )

    def run_document(self, document, *arguments):
        with tempfile.TemporaryDirectory(prefix="enquiry-summary-check-") as directory:
            path = Path(directory) / "input.json"
            path.write_text(json.dumps(document), encoding="utf-8")
            return self.run_cli(path, *arguments)

    def valid_document(self):
        return json.loads((FIXTURES / "valid.json").read_text(encoding="utf-8"))

    def assert_rejected(self, result):
        self.assertEqual(result.returncode, 2)
        self.assertEqual(result.stdout, "")
        self.assertIn("error:", result.stderr)
        self.assertNotIn("Traceback", result.stderr)

    def test_complete_json_report_and_input_preservation(self):
        path = FIXTURES / "valid.json"
        before = hashlib.sha256(path.read_bytes()).hexdigest()
        result = self.run_cli(path, "--format", "json")
        self.assertEqual(result.returncode, 0)
        self.assertEqual(result.stderr, "")
        report = json.loads(result.stdout)
        self.assertEqual(report["format_version"], 1)
        self.assertIsNone(report["site_filter"])
        self.assertEqual(report["saved_records"], 4)
        self.assertEqual(report["reported_notification_states"], EXPECTED_COUNTS)
        self.assertEqual(before, hashlib.sha256(path.read_bytes()).hexdigest())

    def test_site_filter(self):
        result = self.run_cli(FIXTURES / "valid.json", "--site", "north-star", "--format", "json")
        self.assertEqual(result.returncode, 0)
        report = json.loads(result.stdout)
        self.assertEqual(report["site_filter"], "north-star")
        self.assertEqual(report["saved_records"], 2)
        self.assertEqual(report["reported_notification_states"], {"queued": 0, "delivered": 1, "failed": 1, "unknown": 0})

    def test_empty_array_and_no_matching_site(self):
        for result in (
            self.run_document({"format_version": 1, "enquiries": []}, "--format", "json"),
            self.run_cli(FIXTURES / "valid.json", "--site", "absent-site", "--format", "json"),
        ):
            with self.subTest(output=result.stdout):
                self.assertEqual(result.returncode, 0)
                report = json.loads(result.stdout)
                self.assertEqual(report["saved_records"], 0)
                self.assertEqual(report["reported_notification_states"], dict.fromkeys(EXPECTED_COUNTS, 0))

    def test_saved_count_is_separate_from_delivery_count(self):
        result = self.run_cli(FIXTURES / "valid.json")
        self.assertEqual(result.returncode, 0)
        self.assertIn("Saved records in input: 4", result.stdout)
        self.assertIn("  delivered: 1", result.stdout)
        self.assertIn("recipient receipt was not independently checked", result.stdout)

    def test_invalid_fixtures_produce_no_partial_report(self):
        for name in ("invalid-duplicate.json", "invalid-notification.json"):
            with self.subTest(fixture=name):
                self.assert_rejected(self.run_cli(FIXTURES / name))
        self.assert_rejected(self.run_cli(FIXTURES / "invalid-duplicate.json", "--site", "north-star"))

    def test_schema_rejects_loss_of_meaning(self):
        original = self.valid_document()
        variants = []
        boolean_version = copy.deepcopy(original)
        boolean_version["format_version"] = True
        variants.append(boolean_version)
        missing_status = copy.deepcopy(original)
        del missing_status["enquiries"][0]["notification"]["state"]
        variants.append(missing_status)
        invalid_calendar = copy.deepcopy(original)
        invalid_calendar["enquiries"][0]["saved_at"] = "2026-02-30T09:00:00Z"
        variants.append(invalid_calendar)
        false_attempts = copy.deepcopy(original)
        false_attempts["enquiries"][0]["notification"]["attempts"] = True
        variants.append(false_attempts)
        zero_attempts = copy.deepcopy(original)
        zero_attempts["enquiries"][0]["notification"]["attempts"] = 0
        variants.append(zero_attempts)
        extra_field = copy.deepcopy(original)
        extra_field["enquiries"][0]["message"] = "fictional extra content"
        variants.append(extra_field)
        for index, document in enumerate(variants):
            with self.subTest(variant=index):
                self.assert_rejected(self.run_document(document))

    def test_invalid_json_encoding_duplicate_keys_and_size(self):
        samples = (
            b'{"format_version": 1,',
            b'{"format_version": 1, "format_version": 1, "enquiries": []}',
            b'{"format_version": NaN, "enquiries": []}',
            b'\xff',
            b' ' * 1_048_577,
        )
        with tempfile.TemporaryDirectory(prefix="enquiry-summary-check-") as directory:
            path = Path(directory) / "input.json"
            for index, raw in enumerate(samples):
                with self.subTest(sample=index):
                    path.write_bytes(raw)
                    self.assert_rejected(self.run_cli(path))

    def test_help_and_usage_errors(self):
        help_result = self.run_cli("--help")
        self.assertEqual(help_result.returncode, 0)
        self.assertIn("--format", help_result.stdout)
        self.assertEqual(help_result.stderr, "")
        for arguments in (
            (),
            ("missing-file.json",),
            (FIXTURES / "valid.json", "--format", "yaml"),
            (FIXTURES / "valid.json", "--site", "North Star"),
        ):
            with self.subTest(arguments=arguments):
                self.assert_rejected(self.run_cli(*arguments))


if __name__ == "__main__":
    unittest.main(verbosity=2)
