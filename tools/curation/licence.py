#!/usr/bin/env python3
"""Licence gate for found audio.

The rule in `AGENTS.md` is that Birdie ships `public-domain`, `cc0`, `cc-by-*` and
`cc-by-sa-*` clips and never NC or ND: the first would block a paid tier, the second
would block the trimming every clip goes through. This module turns that sentence
into code that runs **before a download**, so a forbidden file never lands in the
corpus in the first place — and gives the manifests an audit command, so files that
arrived before the gate existed can be checked.

The policy itself lives in `web/src/species/licence-policy.json`, which the app and
its build read too. One list, three consumers: browser bundle, build check, ingest.

    python3 tools/curation/licence.py --check-manifest ~/projects/birdie-curation/american-robin/manifest.json

Exit codes: 0 all permitted, 1 at least one file refused.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from pathlib import Path
from typing import NamedTuple

POLICY_PATH = (
    Path(__file__).resolve().parents[2] / "web" / "src" / "species" / "licence-policy.json"
)


class Verdict(NamedTuple):
    allowed: bool
    licence: str | None  # canonical id, e.g. "cc-by-sa-4.0"; None when refused
    reason: str


def load_policy(path: Path | None = None) -> dict:
    override = os.environ.get("BIRDIE_LICENCE_POLICY")
    p = Path(override) if override else (path or POLICY_PATH)
    with open(p) as f:
        return json.load(f)


_FORBIDDEN = [
    re.compile(r"\bnc\b", re.I),
    re.compile(r"non[\s-]?commercial", re.I),
    re.compile(r"\bnd\b", re.I),
    re.compile(r"no[\s-]?deriv", re.I),
]

_FAMILIES = [
    # order matters: share-alike before plain attribution
    ("cc-by-sa", [re.compile(r"\bcc[\s-]?by[\s-]?sa\b", re.I), re.compile(r"attribution[\s-]?share[\s-]?alike", re.I)]),
    ("cc-by", [re.compile(r"\bcc[\s-]?by\b", re.I), re.compile(r"\battribution\b", re.I)]),
    ("cc0", [re.compile(r"\bcc[\s-]?zero\b", re.I), re.compile(r"\bcc0\b", re.I)]),
    ("public-domain", [re.compile(r"public[\s-]?domain", re.I), re.compile(r"\bpd\b", re.I)]),
]

_VERSION = re.compile(r"(\d\.\d)")
_CC_DEED = re.compile(
    r"^/licenses/(?P<code>by(?:-nc)?(?:-sa)?(?:-nd)?)/(?P<version>\d\.\d)/?$", re.I
)


def _from_url(url: str) -> Verdict | None:
    """The deed URL is structured, so it wins when it resolves."""
    if not url:
        return None
    if "creativecommons.org" not in url:
        return None
    m = re.search(r"creativecommons\.org(/[^?#]*)", url)
    path = m.group(1) if m else ""
    if re.match(r"^/publicdomain/zero/\d\.\d", path):
        return Verdict(True, "cc0", "CC0 deed")
    if re.match(r"^/publicdomain/mark/\d\.\d", path):
        return Verdict(True, "public-domain", "public domain mark")
    d = _CC_DEED.match(path)
    if not d:
        return Verdict(False, None, f"unrecognised Creative Commons deed path {path!r}")
    code, version = d.group("code").lower(), d.group("version")
    if "nc" in code or "nd" in code:
        return Verdict(False, None, f"{code.upper()} {version} — non-commercial/no-derivatives is forbidden")
    return Verdict(True, f"cc-{code}-{version}", f"{code.upper()} {version} deed")


def classify(name: str, url: str = "") -> Verdict:
    """Decide whether a licence *is permitted*, and name it canonically.

    Fails closed: a name nobody recognises is refused, because an unrecognised
    licence is all-rights-reserved until someone proves otherwise. A dual-licensed
    file passes if any one branch is permitted — that is how `{{Self|GFDL|Cc-by-sa-3.0-migrated}}`
    is used, by taking the CC BY-SA branch and ignoring the rest.
    """
    policy = load_policy()
    permitted = policy["licences"]

    from_url = _from_url(url)
    if from_url is not None:
        if not from_url.allowed:
            return from_url
        if from_url.licence in permitted:
            return from_url
        return Verdict(
            False,
            None,
            f"{from_url.licence} is a permitted licence class but the app cannot name it yet; "
            "add it to web/src/species/licence-policy.json first",
        )

    if not name or name.strip() in {"", "?"}:
        return Verdict(False, None, "no licence recorded — fails closed")

    refused: list[str] = []
    for branch in re.split(r"[|;]", name):
        blockers = [m for m in _FORBIDDEN if m.search(branch)]
        if blockers:
            # Name the obligation that killed it: "NC" and "ND" block different
            # futures (a paid tier, and trimming), and the fix differs too.
            what = "non-commercial" if any("nc" in m.pattern or "commercial" in m.pattern for m in blockers) else "no-derivatives"
            if len(blockers) > 1 or what == "non-commercial" and any("nd" in m.pattern for m in blockers):
                what = "non-commercial and no-derivatives"
            refused.append(f"{branch.strip()!r} is {what}")
            continue
        for family, patterns in _FAMILIES:
            if not any(p.search(branch) for p in patterns):
                continue
            if family == "public-domain":
                return Verdict(True, "public-domain", "public domain")
            if family == "cc0":
                return Verdict(True, "cc0", "CC0")
            version = _VERSION.search(branch)
            if not version:
                refused.append(f"{branch.strip()!r} has no licence version, so the obligation is unverifiable")
                break
            candidate = f"{family}-{version.group(1)}"
            if candidate in permitted:
                return Verdict(True, candidate, f"{candidate} ({branch.strip()})")
            refused.append(
                f"{candidate} is permitted by Creative Commons but not by the policy — add it to "
                "web/src/species/licence-policy.json (the app's License type derives from it)"
            )
            break

    if refused:
        return Verdict(False, None, "; ".join(refused))
    return Verdict(False, None, f"{name!r} is not a licence the policy recognises")


def check_manifest(path: str) -> int:
    """Audit a whole manifest. Files predating the gate are listed, not assumed."""
    with open(path) as f:
        manifest = json.load(f)
    files = manifest.get("files", [])
    allowed, refused = [], []
    for entry in files:
        verdict = classify(entry.get("license", ""), entry.get("licenseUrl", ""))
        label = entry.get("license") or "(none)"
        (allowed if verdict.allowed else refused).append((entry, verdict))
        mark = "ok  " if verdict.allowed else "DENY"
        print(f"{mark} {label:<18} {verdict.licence or '-':<14} {entry.get('title', '')[:58]}")
        if not verdict.allowed:
            print(f"       -> {verdict.reason}")

    print(f"\n{len(allowed)} permitted, {len(refused)} refused  ({path})")
    if refused:
        print("Refused files must not be shipped, trimmed, or used to derive a figure.", file=sys.stderr)
    return 0 if not refused else 1


def stamp_manifest(path: str) -> int:
    """Re-check a manifest and write the canonical licence id into each entry.

    For manifests that predate the gate: the bytes are already on disk, so this
    records the verdict rather than re-deciding whether to download. It refuses to
    write anything if a file is forbidden — a stamped manifest is a claim that every
    entry was permitted.
    """
    with open(path) as f:
        manifest = json.load(f)
    files = manifest.get("files", [])
    refused = []
    for entry in files:
        verdict = classify(entry.get("license", ""), entry.get("licenseUrl", ""))
        if verdict.allowed:
            entry["appLicense"] = verdict.licence
        else:
            refused.append((entry, verdict))
    if refused:
        for entry, verdict in refused:
            print(f"DENY {entry.get('title', '')}: {verdict.reason}", file=sys.stderr)
        print(f"\nnot written: {len(refused)} file(s) in {path} are not permitted", file=sys.stderr)
        return 1
    manifest["policy"] = "web/src/species/licence-policy.json"
    manifest.setdefault("rejected", [])
    with open(path, "w") as f:
        json.dump(manifest, f, indent=1)
    print(f"stamped {len(files)} entries with their canonical licence ({path})")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--check-manifest", metavar="PATH", help="audit a fetch_audio.py manifest")
    ap.add_argument("--stamp-manifest", metavar="PATH", help="re-check a manifest and record appLicense per entry")
    ap.add_argument("--classify", nargs="+", metavar="LICENCE", help="classify one or more licence names")
    ap.add_argument("--url", default="", help="deed URL for --classify")
    args = ap.parse_args()

    if args.check_manifest:
        return check_manifest(args.check_manifest)
    if args.stamp_manifest:
        return stamp_manifest(args.stamp_manifest)
    if args.classify:
        refused = 0
        for name in args.classify:
            v = classify(name, args.url)
            print(f"{'ALLOW' if v.allowed else 'DENY '} {name:<40} -> {v.licence or '-'}  ({v.reason})")
            refused += 0 if v.allowed else 1
        return 1 if refused else 0
    ap.print_help()
    return 0


if __name__ == "__main__":
    sys.exit(main())
