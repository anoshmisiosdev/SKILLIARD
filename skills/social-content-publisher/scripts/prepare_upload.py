#!/usr/bin/env python3
"""
prepare_upload.py — turn a finished post + target platform into a deterministic,
browser-tool-agnostic UPLOAD PLAN that the running model executes via whatever
browser-control capability it has (Claude in Chrome page actions, a browser MCP,
or computer-use).

This script does NOT touch the network and does NOT post anything. It only:
  1. re-validates the post against the platform's hard rules (length/media/extras),
  2. emits the ordered browser steps to perform, ending in a step that REQUIRES
     explicit human confirmation before the final submit.

Usage:
  python3 scripts/prepare_upload.py --platform x --text "..."
  python3 scripts/prepare_upload.py --platform reddit --title "..." --subreddit r/foo --text "..."
  python3 scripts/prepare_upload.py --platform instagram --text "..." --media ./hero.png
  python3 scripts/prepare_upload.py --platform x --text "..." --json   # machine-readable plan

Platform keys: x, linkedin, instagram, tiktok, youtube_shorts, threads,
               facebook, reddit, pinterest
"""
from __future__ import annotations

import argparse
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
SKILL_ROOT = os.path.dirname(HERE)
PLUGIN_ROOT = os.path.dirname(os.path.dirname(SKILL_ROOT))

PUBLISH_MAP = os.path.join(SKILL_ROOT, "assets", "publish_map.json")
# Reuse the autopilot skill's platform limits as the single source of truth.
PLATFORMS_JSON = os.path.join(
    PLUGIN_ROOT, "skills", "social-content-autopilot", "assets", "platforms.json"
)


def _load(path: str) -> dict:
    with open(path, "r", encoding="utf-8") as fh:
        return json.load(fh)


def build_plan(args) -> dict:
    pub_map = _load(PUBLISH_MAP)
    limits = _load(PLATFORMS_JSON) if os.path.exists(PLATFORMS_JSON) else {}

    key = args.platform
    if key not in pub_map or key.startswith("_"):
        valid = [k for k in pub_map if not k.startswith("_")]
        raise SystemExit(f"error: unknown platform '{key}'. valid: {', '.join(valid)}")

    pm = pub_map[key]
    lim = limits.get(key, {})
    errors: list[str] = []
    warnings: list[str] = []

    text = (args.text or "").strip()
    if not text and key not in ("pinterest",):
        errors.append("post text is empty (--text)")

    # --- length check (mirror check.py's contract) -------------------------
    max_len = lim.get("max_length")
    if max_len and len(text) > max_len:
        errors.append(f"text is {len(text)} chars; {pm['name']} max is {max_len}")
    ideal = lim.get("ideal_length")
    if ideal and isinstance(ideal, list) and len(ideal) == 2 and text:
        lo, hi = ideal
        if len(text) < lo:
            warnings.append(f"text ({len(text)}) is below the ideal {lo}-{hi} for {pm['name']}")

    # --- media requirement -------------------------------------------------
    media = args.media
    if media:
        if not (media.startswith("http://") or media.startswith("https://")):
            if not os.path.exists(media):
                errors.append(f"--media path not found: {media}")
    if pm.get("requires_media") and not media:
        errors.append(f"{pm['name']} requires an image/video — pass --media")

    # --- per-platform required extras --------------------------------------
    extras: dict[str, str | None] = {}
    for field in pm.get("needs_extra", []):
        val = getattr(args, field, None)
        extras[field] = val
        if field in ("subreddit", "title") and not val:
            errors.append(f"{pm['name']} requires --{field}")
        elif not val:
            warnings.append(f"{pm['name']} usually needs --{field}; none provided")

    # --- assemble the ordered steps ----------------------------------------
    steps: list[str] = list(pm["compose_steps"])
    submit = pm["submit"]
    steps.append(
        f"STOP. Show the user the final draft + target ({pm['name']}) and ask for "
        f"explicit confirmation to publish. Only after the user says yes, click "
        f"{submit['label']}."
    )
    steps.append(pm["verify"])

    return {
        "platform": key,
        "platform_name": pm["name"],
        "entry_url": pm["entry_url"],
        "requires_login": pm.get("requires_login", True),
        "requires_media": pm.get("requires_media", False),
        "media": media,
        "text": text,
        "extras": extras,
        "submit": submit,
        "steps": steps,
        "errors": errors,
        "warnings": warnings,
        "ready": not errors,
    }


def render(plan: dict) -> str:
    out = []
    out.append(f"UPLOAD PLAN — {plan['platform_name']} ({plan['platform']})")
    out.append("=" * 56)
    out.append(f"Open: {plan['entry_url']}")
    if plan["requires_login"]:
        out.append("Login: requires the user to already be signed in to this Chrome profile.")
    if plan["media"]:
        out.append(f"Media: {plan['media']}")
    for field, val in plan["extras"].items():
        out.append(f"{field}: {val if val else '(MISSING — ask the user)'}")
    out.append("")
    out.append("Steps (execute with the available browser-control tool):")
    for i, step in enumerate(plan["steps"], 1):
        out.append(f"  {i}. {step}")
    if plan["warnings"]:
        out.append("")
        for w in plan["warnings"]:
            out.append(f"  ▲ WARN: {w}")
    if plan["errors"]:
        out.append("")
        for e in plan["errors"]:
            out.append(f"  ✗ FAIL: {e}")
        out.append("")
        out.append("NOT READY — fix the FAILs above before driving the browser.")
    else:
        out.append("")
        out.append("✓ READY — proceed, but DO NOT click the submit button until the user confirms.")
    return "\n".join(out)


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--platform", required=True)
    p.add_argument("--text", default="")
    p.add_argument("--media", default=None, help="local path or URL to image/video")
    p.add_argument("--title", default=None, help="required for reddit/pinterest")
    p.add_argument("--subreddit", default=None, help="required for reddit, e.g. r/startups")
    p.add_argument("--destination-link", dest="destination_link", default=None)
    p.add_argument("--json", action="store_true", help="emit machine-readable JSON")
    args = p.parse_args()

    plan = build_plan(args)
    if args.json:
        print(json.dumps(plan, indent=2))
    else:
        print(render(plan))
    return 0 if plan["ready"] else 1


if __name__ == "__main__":
    sys.exit(main())
