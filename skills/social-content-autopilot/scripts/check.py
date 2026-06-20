#!/usr/bin/env python3
"""Validate a single post against one platform's hard rules. No AI.

Reads assets/platforms.json and checks the drafted text for that platform:
length cap, hashtag count, media expectations, and common spam patterns. Exit code is non-zero on a
blocking FAIL.

Usage:
    python scripts/check.py --platform linkedin --text "<post>"
    python scripts/check.py --platform tiktok --file draft.txt --media
    python scripts/check.py --platform x --text "..." --json
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULT_CONFIG = os.path.join(HERE, "..", "assets", "platforms.json")

HASHTAG_RE = re.compile(r"(?<!\w)#\w+")
ENGAGEMENT_BAIT_RE = re.compile(
    r"\b(comment\s+(yes|below)|like\s+if|repost\s+(if|to)|share\s+this\s+to|"
    r"tag\s+(a|someone|three|3)|follow\s+for\s+more|agree\?|"
    r"agree\s+or\s+disagree|thoughts\?)\b",
    re.IGNORECASE,
)


def resolve_key(platforms, raw):
    """Accept both 'youtube_shorts' and 'youtube-shorts' etc."""
    k = raw.strip().lower().replace("-", "_")
    if k in platforms:
        return k
    raise SystemExit(f"error: unknown platform '{raw}'. "
                     f"Known: {', '.join(platforms)}")


def check(text, has_media, p):
    n = len(text)
    n_tags = len(HASHTAG_RE.findall(text))
    lo, hi = p["ideal_length"]
    h_lo, h_hi = p["hashtag_range"]
    errors, warnings = [], []

    if n == 0:
        errors.append("empty post")
    if n > p["max_length"]:
        errors.append(f"over hard cap: {n}/{p['max_length']} chars")
    if h_hi == 0 and n_tags > 0:
        errors.append(f"{n_tags} hashtag(s) but {p['name']} forbids them")
    if p.get("requires_media") and not has_media:
        errors.append("platform post requires a media asset")

    if n and n < lo:
        warnings.append(f"shorter than ideal ({n} < {lo})")
    if n > hi:
        warnings.append(f"longer than ideal ({n} > {hi})")
    if h_hi > 0 and n_tags < h_lo:
        warnings.append(f"few hashtags ({n_tags} < {h_lo})")
    if n_tags > h_hi:
        warnings.append(f"too many hashtags ({n_tags} > {h_hi})")
    if p.get("favors_media") and not p.get("favors_video") and not has_media:
        warnings.append("favors media; consider attaching an image")
    if ENGAGEMENT_BAIT_RE.search(text):
        warnings.append("possible generic engagement bait; use a substantive, objective-aligned CTA")
    letters = [c for c in text if c.isalpha()]
    if len(letters) >= 20:
        upper_ratio = sum(c.isupper() for c in letters) / len(letters)
        if upper_ratio > 0.45:
            warnings.append("copy is mostly all-caps; use natural casing")

    status = "FAIL" if errors else ("WARN" if warnings else "PASS")
    return {"status": status, "chars": n, "max": p["max_length"],
            "hashtags": n_tags, "errors": errors, "warnings": warnings}


def main(argv=None):
    ap = argparse.ArgumentParser(description="Validate a post against a platform's rules.")
    ap.add_argument("--platform", required=True)
    src = ap.add_mutually_exclusive_group(required=True)
    src.add_argument("--text")
    src.add_argument("--file")
    ap.add_argument("--media", action="store_true", help="A visual/video is attached.")
    ap.add_argument("--config", default=DEFAULT_CONFIG)
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args(argv)

    with open(args.config, encoding="utf-8") as fh:
        platforms = json.load(fh)
    key = resolve_key(platforms, args.platform)
    p = platforms[key]
    text = open(args.file, encoding="utf-8").read() if args.file else args.text

    res = check(text, args.media, p)
    if args.json:
        print(json.dumps({"platform": key, **res}, indent=2))
    else:
        mark = {"PASS": "✓", "WARN": "▲", "FAIL": "✗"}[res["status"]]
        print(f"{mark} {p['name']}: {res['status']} "
              f"({res['chars']}/{res['max']} chars, {res['hashtags']} hashtags)")
        for e in res["errors"]:
            print(f"   ✗ {e}")
        for w in res["warnings"]:
            print(f"   ▲ {w}")
    return 1 if res["status"] == "FAIL" else 0


if __name__ == "__main__":
    sys.exit(main())
