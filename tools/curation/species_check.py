#!/usr/bin/env python3
"""Record a BirdNET species verdict for a file that will ship.

This is the last gate before a clip may be used in the game: the species the
archive labels it as must be the species the model hears in the bytes that ship.
The result is written to `docs/curation/species-checks.json` and bound to the
file's SHA-256, so a rebuilt clip cannot inherit an old verdict.

    ~/.venvs/birdnet3/bin/python tools/curation/species_check.py \
        web/public/audio/american-robin/pillar-carol-01.mp3 \
        --expect "American Robin"

The `birdnet` package (1.5.1, ONNX backend) lives in `~/.venvs/birdnet3` because
it is the only ML dependency in the project. The rest of the curation tools are
stdlib-only; this one is run by hand, not by the build.

A check passes when the expected species scores at or above `--min-confidence`
in every *complete* 3 s window. A final partial window (a 10 s clip leaves a 1 s
tail) is recorded but not required to contain song.
"""

from __future__ import annotations

import argparse
import datetime
import hashlib
import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
OUT = REPO / "docs" / "curation" / "species-checks.json"


def sha256_of(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("files", nargs="+", type=Path)
    ap.add_argument("--expect", required=True, help='e.g. "American Robin"')
    ap.add_argument("--min-confidence", type=float, default=0.1)
    ap.add_argument("--top-k", type=int, default=25)
    ap.add_argument("--out", type=Path, default=OUT)
    args = ap.parse_args()

    import numpy as np  # numpy lives in the BirdNET venv
    import birdnet

    model = birdnet.load("acoustic", "3.0", "onnx", precision="fp32")
    out_path = args.out if args.out.is_absolute() else REPO / args.out
    doc = {"version": 1, "checks": {}}
    if out_path.exists():
        doc = json.loads(out_path.read_text())

    for path in args.files:
        if not path.is_absolute():
            path = REPO / path
        res = model.predict([path], top_k=args.top_k,
                            default_confidence_threshold=0.0, show_stats="minimal")
        names = list(res.species_list)
        probs = np.asarray(res.species_probs)
        ids = np.asarray(res.species_ids)
        scores: list[float | None] = []
        for s in range(probs.shape[1]):
            score = None
            for k in range(probs.shape[2]):
                name = names[int(ids[0, s, k])]
                # BirdNET v3 labels are "Scientific name_Common name".
                common = name.split("_", 1)[-1] if "_" in name else name
                if name == args.expect or common == args.expect:
                    score = round(float(probs[0, s, k]), 3)
            scores.append(score)
        complete = int(float(np.asarray(res.input_durations)[0]) // 3)
        positive = [s for s, score in enumerate(scores[:complete])
                    if score is not None and score >= args.min_confidence]
        verdict = "pass" if complete and len(positive) == complete else "fail"
        key = path.stem
        doc["checks"][key] = {
            "path": str(path.relative_to(REPO)),
            "sha256": sha256_of(path),
            "expected": args.expect,
            "model": "BirdNET 3.0, ONNX fp32 (birdnet 1.5.1)",
            "minConfidence": args.min_confidence,
            "windows": len(scores),
            "completeWindows": complete,
            "positiveCompleteWindows": len(positive),
            "scores": scores,
            "verdict": verdict,
            "checkedOn": datetime.date.today().isoformat(),
        }
        print(f"{key}: {len(positive)}/{complete} complete windows >= {args.min_confidence} "
              f"for {args.expect} -> {verdict}")
        for i, score in enumerate(scores):
            label = "tail" if i >= complete else "window"
            print(f"  {label} {i + 1}: {args.expect} = {score}")

    doc["why"] = ("The last gate before a clip may be used in the game: the species the "
                  "archive labels it as must be the species BirdNET hears in the bytes "
                  "that ship. Each check is bound to the file's SHA-256, so a rebuilt clip "
                  "cannot inherit an old verdict.")
    doc["command"] = ("~/.venvs/birdnet3/bin/python tools/curation/species_check.py "
                      "<file> --expect '<species>'")
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(doc, indent=1, ensure_ascii=False) + "\n")
    print(f"wrote {out_path.relative_to(REPO)}")
    return 0 if all(c["verdict"] == "pass" for c in doc["checks"].values()) else 1


if __name__ == "__main__":
    sys.exit(main())
