#!/usr/bin/env python3
"""Validate generated post copy against each platform's hard rules before posting.

This does NOT score or rank — it's a publish gate. It checks the actual text
Claude wrote for a platform and flags anything that would break or underperform:
over the character cap, wrong hashtag count, missing hook/CTA, hashtags on
Reddit, etc. Exit code is non-zero if any post has a blocking error.

Input is a posts bundle: a JSON object mapping platform key -> post object.

    {
      "x":       {"text": "...", "media": false},
      "linkedin":{"text": "...", "media": true}
    }

Usage:
    python compose_check.py --bundle posts.json
    python compose_check.py --bundle posts.json --json
    # single post on the fly:
    python compose_check.py --platform x --text "my post #launch"
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
CTA_RE = re.compile(
    r"\b(comment|share|follow|subscribe|like|save|tag|sign ?up|learn more|"
    r"read more|link in bio|dm|reply|repost|join|download|try|get started|click)\b",
    re.IGNORECASE,
)


def check_post(text: str, has_media: bool, profile: dict) -> dict:
    errors, warnings = [], []
    n = len(text)
    tags = HASHTAG_RE.findall(text)
    n_tags = len(tags)
    lo, hi = profile["ideal_length"]
    h_lo, h_hi = profile["hashtag_range"]

    # Blocking errors
    if n == 0:
        errors.append("empty post")
    if n > profile["max_length"]:
        errors.append(f"over hard cap: {n}/{profile['max_length']} chars")
    if h_hi == 0 and n_tags > 0:
        errors.append(f"{n_tags} hashtag(s) but this platform forbids them")
    if profile.get("favors_video") and not has_media:
        errors.append("video-first platform with no media attached")

    # Warnings (publishable but weaker)
    if n and n < lo:
        warnings.append(f"shorter than ideal ({n} < {lo})")
    if n > hi:
        warnings.append(f"longer than ideal ({n} > {hi})")
    if h_hi > 0 and n_tags < h_lo:
        warnings.append(f"few hashtags ({n_tags} < {h_lo})")
    if n_tags > h_hi:
        warnings.append(f"too many hashtags ({n_tags} > {h_hi})")
    if profile.get("favors_media") and not profile.get("favors_video") and not has_media:
        warnings.append("favors media; consider attaching an image")
    if not CTA_RE.search(text) and profile["name"] != "Reddit":
        warnings.append("no clear call to action detected")

    return {
        "chars": n, "max": profile["max_length"], "hashtags": n_tags,
        "errors": errors, "warnings": warnings,
        "status": "FAIL" if errors else ("WARN" if warnings else "PASS"),
    }


def main(argv=None):
    p = argparse.ArgumentParser(description="Validate posts against platform rules.")
    src = p.add_mutually_exclusive_group(required=True)
    src.add_argument("--bundle", help="Path to posts bundle JSON.")
    src.add_argument("--platform", help="Single platform key (use with --text).")
    p.add_argument("--text", help="Post text for --platform mode.")
    p.add_argument("--media", action="store_true", help="Media attached (--platform mode).")
    p.add_argument("--config", default=DEFAULT_CONFIG)
    p.add_argument("--json", action="store_true")
    args = p.parse_args(argv)

    with open(args.config, encoding="utf-8") as fh:
        platforms = json.load(fh)

    if args.bundle:
        with open(args.bundle, encoding="utf-8") as fh:
            bundle = json.load(fh)
    else:
        if not args.text:
            raise SystemExit("error: --platform requires --text")
        bundle = {args.platform: {"text": args.text, "media": args.media}}

    report, any_fail = {}, False
    for key, post in bundle.items():
        if key.startswith("_"):
            continue  # meta keys like _schedule are handled by publish.py
        if key not in platforms:
            report[key] = {"status": "FAIL", "errors": [f"unknown platform '{key}'"],
                           "warnings": []}
            any_fail = True
            continue
        res = check_post(post.get("text", ""), bool(post.get("media")), platforms[key])
        report[key] = res
        any_fail = any_fail or res["status"] == "FAIL"

    if args.json:
        print(json.dumps(report, indent=2))
    else:
        for key, r in report.items():
            mark = {"PASS": "✓", "WARN": "▲", "FAIL": "✗"}[r["status"]]
            head = f"{mark} {key:<15} {r['status']}"
            if "chars" in r:
                head += f"  ({r['chars']}/{r['max']} chars, {r['hashtags']} hashtags)"
            print(head)
            for e in r["errors"]:
                print(f"      ✗ {e}")
            for w in r["warnings"]:
                print(f"      ▲ {w}")
    return 1 if any_fail else 0


if __name__ == "__main__":
    sys.exit(main())
