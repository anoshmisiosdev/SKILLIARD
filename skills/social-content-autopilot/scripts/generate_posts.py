#!/usr/bin/env python3
"""Generate platform-native posts via TokenMart -> a posts bundle JSON.

All copy is written by an LLM call routed through TokenMart (tokenmart_client),
so post generation is explicit, in-code, and provably metered through TokenMart
rather than improvised by the agent.

Output is the bundle shape consumed by compose_check.py and shown in chat:
    { "<platform>": {"text": "...", "media_urls": []}, ... }

Usage:
    python generate_posts.py --product "AI meal-planning app for busy parents" \
        --platforms x,linkedin,tiktok --goal "drive signups for the beta" \
        --brief competitor_brief.json --out posts.json
"""

from __future__ import annotations

import argparse
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)  # ensure tokenmart_client is importable from anywhere
from tokenmart_client import complete_json, TokenMartError  # noqa: E402

DEFAULT_CONFIG = os.path.join(HERE, "..", "assets", "platforms.json")

SYSTEM = (
    "You are a senior social media copywriter. You write finished, ready-to-post "
    "copy that is native to each platform. You never invent statistics, reviews, "
    "or fake trending hashtags. You differentiate from competitors rather than "
    "echoing them. You return only valid JSON."
)


def load_platforms(path, only):
    with open(path, encoding="utf-8") as fh:
        platforms = json.load(fh)
    if only:
        wanted = [p.strip() for p in only.split(",")]
        platforms = {k: platforms[k] for k in wanted if k in platforms}
        missing = [k for k in wanted if k not in platforms]
        if missing:
            print(f"warning: unknown platform(s) ignored: {missing}", file=sys.stderr)
    if not platforms:
        raise SystemExit("error: no valid platforms selected")
    return platforms


def build_prompt(product, goal, brief, platforms, media_urls):
    specs = {}
    for key, p in platforms.items():
        specs[key] = {
            "name": p["name"],
            "ideal_length_chars": p["ideal_length"],
            "max_length_chars": p["max_length"],
            "hashtag_count": p["hashtag_range"],
            "tone": p["tone"],
            "needs_media": p.get("favors_video", False),
        }
    instructions = {
        "product": product,
        "goal": goal or "maximize relevant reach and engagement",
        "competitor_brief": brief or "none provided",
        "platform_specs": specs,
        "media_available_for": sorted(media_urls.keys()),
        "rules": [
            "Write ONE finished post per platform, fully ready to publish.",
            "Respect each platform's ideal_length_chars and hashtag_count exactly.",
            "Reddit must contain NO hashtags.",
            "Lead with a strong, platform-appropriate hook.",
            "Include a fitting call to action (except Reddit, where it stays soft).",
            "Differentiate from the competitor_brief; do not copy competitor phrasing.",
            "Do not fabricate numbers, awards, or hashtags.",
        ],
        "output_schema": {
            "<platform_key>": {"text": "the full post", "hook_variant": "an alt opening line"}
        },
    }
    return (
        "Write platform-native social posts from this spec and return ONLY a JSON "
        "object keyed by the exact platform keys provided. Each value must be "
        '{"text": "...", "hook_variant": "..."}.\n\n'
        + json.dumps(instructions, indent=2)
    )


def main(argv=None):
    ap = argparse.ArgumentParser(description="Generate posts via TokenMart.")
    ap.add_argument("--product", required=True)
    ap.add_argument("--platforms", required=True, help="Comma-separated platform keys.")
    ap.add_argument("--goal", default="", help="What this content should achieve.")
    ap.add_argument("--brief", help="Path to a competitor brief (json or text).")
    ap.add_argument("--media", help="JSON map {platform: [url,...]} of available media.")
    ap.add_argument("--config", default=DEFAULT_CONFIG)
    ap.add_argument("--model", help="Override TOKENMART_MODEL.")
    ap.add_argument("--out", help="Write the posts bundle here (default: stdout).")
    args = ap.parse_args(argv)

    platforms = load_platforms(args.config, args.platforms)

    brief = None
    if args.brief:
        with open(args.brief, encoding="utf-8") as fh:
            brief = fh.read()
    media_urls = json.loads(args.media) if args.media else {}

    prompt = build_prompt(args.product, args.goal, brief, platforms, media_urls)
    try:
        drafted = complete_json(prompt, system=SYSTEM, model=args.model, max_tokens=2500)
    except TokenMartError as e:
        print(f"error: {e}", file=sys.stderr)
        return 2

    # Assemble the bundle in the shape compose_check expects.
    bundle = {}
    for key in platforms:
        post = drafted.get(key) or {}
        text = post.get("text", "").strip()
        if not text:
            print(f"warning: model returned no text for '{key}'", file=sys.stderr)
            continue
        bundle[key] = {
            "text": text,
            "media_urls": media_urls.get(key, []),
        }
        if post.get("hook_variant"):
            bundle[key]["hook_variant"] = post["hook_variant"].strip()

    output = json.dumps(bundle, indent=2, ensure_ascii=False)
    if args.out:
        with open(args.out, "w", encoding="utf-8") as fh:
            fh.write(output + "\n")
        print(f"✓ wrote {len(bundle)} posts to {args.out}", file=sys.stderr)
    else:
        print(output)
    return 0


if __name__ == "__main__":
    sys.exit(main())
