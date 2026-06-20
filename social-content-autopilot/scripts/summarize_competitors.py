#!/usr/bin/env python3
"""Summarize raw competitor research into a brief via TokenMart.

Takes the JSON output of competitor_research.py (or any collected results) and
produces a structured competitor brief. The summarization is an LLM call routed
through TokenMart (tokenmart_client), keeping all model usage on one metered path.

Usage:
    python competitor_research.py --product "..." --provider serpapi --json > research.json
    python summarize_competitors.py --research research.json --product "..." --out brief.json
"""

from __future__ import annotations

import argparse
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from tokenmart_client import complete_json, TokenMartError  # noqa: E402

SYSTEM = (
    "You are a social media competitive analyst. From raw search results you "
    "identify real competitors and summarize their content strategy honestly. "
    "You do not invent competitors or metrics. You return only valid JSON."
)


def build_prompt(product, research):
    instructions = {
        "product": product,
        "raw_research": research,
        "task": "For each platform, identify the top competitors present in the "
                "raw_research and summarize their content strategy.",
        "output_schema": {
            "<platform_key>": {
                "competitors": [
                    {"name": "", "angle": "", "formats": "", "hashtags": "", "cadence": ""}
                ],
                "content_gaps": ["openings the product can own"],
            }
        },
        "rules": [
            "Only include competitors actually evidenced in raw_research.",
            "If a platform has no useful results, return an empty competitors list.",
            "Do not fabricate follower counts or metrics.",
        ],
    }
    return (
        "Summarize the competitor landscape and return ONLY a JSON object keyed by "
        "platform.\n\n" + json.dumps(instructions, indent=2)
    )


def main(argv=None):
    ap = argparse.ArgumentParser(description="Summarize competitors via TokenMart.")
    ap.add_argument("--research", required=True, help="Path to research JSON.")
    ap.add_argument("--product", required=True)
    ap.add_argument("--model", help="Override TOKENMART_MODEL.")
    ap.add_argument("--out", help="Write the brief here (default: stdout).")
    args = ap.parse_args(argv)

    with open(args.research, encoding="utf-8") as fh:
        research = json.load(fh)

    prompt = build_prompt(args.product, research)
    try:
        brief = complete_json(prompt, system=SYSTEM, model=args.model, max_tokens=2500)
    except TokenMartError as e:
        print(f"error: {e}", file=sys.stderr)
        return 2

    output = json.dumps(brief, indent=2, ensure_ascii=False)
    if args.out:
        with open(args.out, "w", encoding="utf-8") as fh:
            fh.write(output + "\n")
        print(f"✓ wrote brief to {args.out}", file=sys.stderr)
    else:
        print(output)
    return 0


if __name__ == "__main__":
    sys.exit(main())
