#!/usr/bin/env python3
"""Build reproducible local candidate archives using Python's standard library."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import posixpath
import re
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parents[1]
SKILLS = (
    "begin-website", "begin-design", "begin-content", "begin-frontend", "begin-backend",
    "begin-data", "begin-security", "begin-services", "begin-publish", "begin-quality",
    "begin-setup", "begin-architecture", "begin-learn-products", "begin-writing-docs", "begin-diagrams",
)
EXCLUDED = {"node_modules", ".review", ".qa", ".begin-preview", ".git", "__pycache__", ".local", ".data", "data", "pgdata", "dist"}
# Raw product research includes captures, extracted packs, and nested archives.
# Curated references/examples belong in Skills and must remain portable resources.
RESEARCH_DIRS = {("docs", "design-trials"), ("docs", "evidence")}
ROOT_FILES = ("README.md", "CONTENTS.md", "SUPPORT.md", "STATUS.md", "CHANGELOG.md",
              "LICENSE", "LICENSE_STATUS.md", "CONTRIBUTING.md", "SECURITY.md",
              "plugin.json", ".claude-plugin/plugin.json", ".codex-plugin/plugin.json", "scripts/bundle.py")
PORTABLE_METADATA = (
    "skills/begin-design/assets/fieldnotes/art-provenance.json",
    "skills/begin-design/assets/contrast-cases/night-signal/site/FONT_SOURCES.json",
    "skills/begin-design/assets/contrast-cases/signal-desk/site/FONT_SOURCES.json",
    "skills/begin-design/assets/contrast-cases/form-bureau/site/FONT_PROVENANCE.json",
)
PORTABLE_MANIFESTS = (
    "skills/begin-design/assets/fieldnotes/PROVENANCE.json",
    "skills/begin-design/assets/contrast-cases/PROVENANCE.json",
)


def eligible(relative):
    return (
        relative.parts[:2] not in RESEARCH_DIRS
        and not any(p in EXCLUDED or p.startswith(".env") for p in relative.parts)
        and not relative.name.endswith((".log", ".pyc", ".db", ".sqlite", ".sqlite3"))
    )


def source_files():
    result = {}
    for folder in (ROOT / "skills", ROOT / "docs"):
        if folder.is_symlink():
            raise ValueError(f"Do not package symlinks: {folder.relative_to(ROOT)}")
        for file in sorted(folder.rglob("*")):
            relative = file.relative_to(ROOT)
            if not eligible(relative):
                continue
            if file.is_symlink():
                raise ValueError(f"Do not package symlinks: {relative}")
            if file.is_file():
                result[relative.as_posix()] = file.read_bytes()
    for name in ROOT_FILES:
        file = ROOT
        for part in Path(name).parts:
            file = file / part
            if file.is_symlink():
                raise ValueError(f"Do not package symlinks: {file.relative_to(ROOT)}")
        result[name] = file.read_bytes()
    return result


def json_bytes(value):
    return (json.dumps(value, indent=2) + "\n").encode()


def portable_metadata(source):
    """Derive six delivery JSONs; retain every source and other payload byte."""
    files = dict(source)
    relay = "begin-design/assets/type-transfer-cases/relay/site"

    def frozen_reference(value, relative, digest=None):
        if not isinstance(value, str) or not value.endswith("/" + relative):
            raise ValueError(f"Unexpected historical origin for {relative}")
        target = "skills/" + relative
        if digest is None:
            exists = target in source or any(name.startswith(target + "/") for name in source)
        else:
            exists = target in source and hashlib.sha256(source[target]).hexdigest() == digest
        if not exists:
            raise ValueError(f"Frozen origin has no matching delivered resource: {relative}")
        return relative

    for name in PORTABLE_METADATA:
        metadata = json.loads(source[name])
        if name == PORTABLE_METADATA[0]:
            output = metadata["source_output"]
            if not isinstance(output, str) or not output.startswith("/Users/") or not output.endswith(".png"):
                raise ValueError("Unexpected historical Fieldnotes image output")
            metadata["source_output"] = "Local research output excluded from delivery: " + posixpath.basename(output)
        elif name == PORTABLE_METADATA[1]:
            metadata["copied_from_frozen_pack"] = frozen_reference(metadata["copied_from_frozen_pack"], relay)
            metadata["source_record"] = frozen_reference(metadata["source_record"], relay + "/FONT_SOURCES.json")
        else:
            for entry in metadata["files"]:
                if name == PORTABLE_METADATA[2]:
                    relative = relay + "/" + entry["path"]
                    entry["frozen_input_relative_path"] = frozen_reference(entry.pop("frozen_input_absolute_path"), relative, entry["sha256"])
                else:
                    relative = relay + "/" + entry["site_path"]
                    entry["source_path"] = frozen_reference(entry["source_path"], relative, entry["sha256"])
        files[name] = json_bytes(metadata)

    flagged = set()
    for name in PORTABLE_MANIFESTS:
        manifest = json.loads(source[name])
        for entry in manifest["files"]:
            relative = ("skills/begin-design/" + entry["skill_relative_path"]
                        if "skill_relative_path" in entry else posixpath.dirname(name) + "/" + entry["path"])
            if relative not in PORTABLE_METADATA:
                continue
            original = source[relative]
            original_sha = hashlib.sha256(original).hexdigest()
            if entry["bytes"] != len(original) or entry["sha256"] != original_sha:
                raise ValueError(f"Historical metadata receipt disagrees: {relative}")
            if entry.get("original_sha256", original_sha) != original_sha:
                raise ValueError(f"Historical metadata source hash disagrees: {relative}")
            entry["original_sha256"] = original_sha
            entry["original_bytes"] = len(original)
            entry["bytes"] = len(files[relative])
            entry["sha256"] = hashlib.sha256(files[relative]).hexdigest()
            entry["portable_metadata"] = True
            flagged.add(relative)
        manifest["original_provenance_sha256"] = hashlib.sha256(source[name]).hexdigest()
        manifest["delivery_note"] = "Only records marked portable_metadata derive local origin paths for delivery. All other resources retain their original bytes."
        files[name] = json_bytes(manifest)
    if flagged != set(PORTABLE_METADATA):
        raise ValueError("Portable metadata does not have complete historical provenance coverage")
    return files


def verify_portable_json(files):
    """Reject an unhandled personal filesystem origin instead of rewriting it."""
    def inspect(value, name):
        if isinstance(value, str):
            if re.search(r"/(?:Users|home)/[^/\s]+(?:/|$)", value) or re.search(r"[A-Za-z]:\\Users\\", value):
                raise ValueError(f"Personal absolute path remains in delivered JSON: {name}")
        elif isinstance(value, dict):
            for child in value.values():
                inspect(child, name)
        elif isinstance(value, list):
            for child in value:
                inspect(child, name)
    for name, data in files.items():
        if name.endswith(".json"):
            inspect(json.loads(data), name)


def verify_sources(files):
    for skill in SKILLS:
        name = f"skills/{skill}/SKILL.md"
        if name not in files or f"name: {skill}" not in files[name].decode():
            raise ValueError(f"Missing or mismatched Skill: {skill}")
    for template in ("service", "portfolio", "product", "editorial"):
        prefix = f"skills/begin-website/assets/starters/{template}/"
        for name in ("index.html", "styles.css", "README.md", "template.json"):
            if prefix + name not in files:
                raise ValueError(f"Missing starter resource: {prefix + name}")
    for name in ("AGENTS.md", "CLAUDE.md", "BEGIN.md"):
        if f"skills/begin-website/assets/project-guidance/{name}" not in files:
            raise ValueError(f"Missing project guidance: {name}")
    for name in ("scripts/create-site.mjs", "scripts/preview.mjs", "assets/components/index.html"):
        if "skills/begin-website/" + name not in files:
            raise ValueError(f"Missing entry resource: {name}")
    for name in ("README.md", "package.json", "package-lock.json"):
        if "skills/begin-backend/assets/enquiry/" + name not in files:
            raise ValueError(f"Missing backend resource: {name}")
    manifests = [json.loads(files[p]) for p in ("plugin.json", ".claude-plugin/plugin.json", ".codex-plugin/plugin.json")]
    if len({(m["name"], m["version"]) for m in manifests}) != 1:
        raise ValueError("Host manifests disagree about identity or version")
    return manifests[0]["version"]


def release_entries(entries, version, kind):
    """Return one complete release payload for ZIP and Git distribution."""
    receipt = {
        "name": "begin-skills", "version": version, "kind": kind,
        "files": {name: hashlib.sha256(data).hexdigest() for name, data in sorted(entries.items())},
        "notes": "Alpha evaluation build; inspect STATUS.md and LICENSE_STATUS.md. No runtime telemetry.",
    }
    return {**entries, "RELEASE.json": (json.dumps(receipt, indent=2, sort_keys=True) + "\n").encode()}


def write_zip(output, entries):
    """Write fixed metadata and ordering for every Begin delivery ZIP."""
    with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for name, data in sorted(entries.items()):
            info = zipfile.ZipInfo(name, date_time=(1980, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.create_system = 3
            info.external_attr = 0o100644 << 16
            archive.writestr(info, data)


def archive_bytes(output, entries, version, kind):
    entries = release_entries(entries, version, kind)
    receipt = json.loads(entries["RELEASE.json"])
    with tempfile.NamedTemporaryFile(dir=output.parent, suffix=".zip", delete=False) as temp:
        temp_path = Path(temp.name)
    try:
        write_zip(temp_path, entries)
        with zipfile.ZipFile(temp_path) as archive:
            if archive.testzip() is not None:
                raise ValueError("Archive checksum failed")
            for name, expected in receipt["files"].items():
                if hashlib.sha256(archive.read(name)).hexdigest() != expected:
                    raise ValueError(f"Archive content changed: {name}")
        finished = temp_path.read_bytes()
        digest = hashlib.sha256(finished).hexdigest()
        # Publish the complete verified file exclusively. Another build cannot
        # replace an existing version between an existence check and a rename.
        try:
            os.link(temp_path, output)
        except FileExistsError:
            if output.is_symlink() or not output.is_file():
                raise ValueError(f"Existing release is not a plain ZIP file: {output.name}; it was preserved")
            if output.read_bytes() != finished:
                raise ValueError(f"Existing release {output.name} has different bytes; it was preserved. Use a new release version or a fresh evaluation output directory")
    finally:
        temp_path.unlink(missing_ok=True)
    return {"file": output.name, "bytes": len(finished), "sha256": digest}


def guide_bytes(source, destination, data, copied_guides, files):
    """Retain working product links when guides move into the portable Skill."""
    def rewrite(match):
        target = match.group(1)
        if target.startswith(("https://", "http://", "#", "/")):
            return match.group(0)
        path, separator, fragment = target.partition("#")
        resolved = posixpath.normpath(posixpath.join(posixpath.dirname(source), path))
        mapped = copied_guides.get(resolved, resolved)
        if mapped not in files and resolved not in copied_guides:
            return match.group(0)
        relative = posixpath.relpath(mapped, posixpath.dirname(destination))
        return "](" + relative + (separator + fragment if separator else "") + ")"
    return re.sub(r"\]\(([^\s)]+)\)", rewrite, data.decode()).encode()


def prepare_payload(source=None):
    """Prepare the same sanitized plugin bytes for every delivery format."""
    files = source_files() if source is None else dict(source)
    version = verify_sources(files)
    if not re.fullmatch(r"[0-9]+\.[0-9]+\.[0-9]+(?:-[a-z0-9.]+)?", version):
        raise ValueError("Invalid candidate version")
    files = portable_metadata(files)
    # An individual Skill installation must retain the original-content license
    # as well as the boundary with third-party fonts, photos and dependencies.
    for skill in SKILLS:
        license_path = f"skills/{skill}/LICENSE"
        if license_path in files and files[license_path] != files["LICENSE"]:
            raise ValueError(f"Skill license differs from the pack license; preserve and resolve it before packaging: {skill}")
        files[license_path] = files["LICENSE"]
        files[f"skills/{skill}/LICENSE_STATUS.md"] = files["LICENSE_STATUS.md"]
    guides = {name: "skills/begin-website/assets/guides/" + name.removeprefix("docs/")
              for name in files if name.startswith("docs/") and name.endswith((".md", ".json"))}
    guides.update({name: "skills/begin-website/assets/guides/" + name
                   for name in ("CONTENTS.md", "SUPPORT.md", "STATUS.md", "CHANGELOG.md",
                                "LICENSE", "LICENSE_STATUS.md", "CONTRIBUTING.md", "SECURITY.md")})
    for source, destination in guides.items():
        files[destination] = guide_bytes(source, destination, files[source], guides, files) if source.endswith(".md") else files[source]
    verify_portable_json(files)
    return version, files


def build(output, source=None):
    version, files = prepare_payload(source)
    output.mkdir(parents=True, exist_ok=True)
    plugin = archive_bytes(output / f"begin-skills-{version}-plugin.zip", files, version, "plugin")
    portable = {name.removeprefix("skills/"): data for name, data in files.items() if name.startswith("skills/")}
    skills = archive_bytes(output / f"begin-skills-{version}-skills.zip", portable, version, "skills")
    result = {"version": version, "skills": len(SKILLS), "archives": [plugin, skills]}
    print(json.dumps(result, indent=2))
    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=ROOT / "dist")
    args = parser.parse_args()
    build(args.output.resolve())
