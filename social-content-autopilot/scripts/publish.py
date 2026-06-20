#!/usr/bin/env python3
"""Auto-post generated content to the suggested platforms.

SAFETY: dry-run by default. Nothing is published unless you pass --confirm.
Posting is outward-facing and hard to reverse, so the gate is explicit and the
script prints exactly what it will send before sending it.

Provider: Ayrshare (https://www.ayrshare.com) — one API key posts to X,
LinkedIn, Instagram, TikTok, YouTube, Facebook, Threads, Reddit, Pinterest.
Set AYRSHARE_API_KEY in the environment. (A generic webhook provider is included
for custom backends / queuing.)

Input is the same posts bundle compose_check.py validates:

    {
      "x":        {"text": "...", "media_urls": []},
      "instagram":{"text": "...", "media_urls": ["https://.../img.jpg"]},
      "_schedule": "2026-06-21T14:00:00Z"   # optional ISO time -> schedule instead of now
    }

Usage:
    python publish.py --bundle posts.json                      # dry-run preview
    python publish.py --bundle posts.json --platforms x,linkedin
    AYRSHARE_API_KEY=... python publish.py --bundle posts.json --confirm
    python publish.py --bundle posts.json --provider webhook --confirm   # uses POST_WEBHOOK_URL
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULT_CONFIG = os.path.join(HERE, "..", "assets", "platforms.json")
AYRSHARE_URL = "https://api.ayrshare.com/api/post"


def http_post_json(url: str, payload: dict, headers: dict) -> dict:
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header("Content-Type", "application/json")
    for k, v in headers.items():
        req.add_header(k, v)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return {"ok": True, "status": resp.status, "body": json.load(resp)}
    except urllib.error.HTTPError as e:
        return {"ok": False, "status": e.code, "body": e.read().decode("utf-8", "ignore")}
    except Exception as e:
        return {"ok": False, "status": None, "body": str(e)}


def send_ayrshare(platform_keys, post, schedule):
    api_key = os.environ.get("AYRSHARE_API_KEY")
    if not api_key:
        return {"ok": False, "status": None, "body": "AYRSHARE_API_KEY not set"}
    payload = {"post": post["text"], "platforms": platform_keys}
    if post.get("media_urls"):
        payload["mediaUrls"] = post["media_urls"]
    if schedule:
        payload["scheduleDate"] = schedule
    return http_post_json(AYRSHARE_URL, payload, {"Authorization": f"Bearer {api_key}"})


def send_webhook(platform_key, post, schedule):
    url = os.environ.get("POST_WEBHOOK_URL")
    if not url:
        return {"ok": False, "status": None, "body": "POST_WEBHOOK_URL not set"}
    payload = {"platform": platform_key, "text": post["text"],
               "media_urls": post.get("media_urls", []), "schedule": schedule}
    return http_post_json(url, payload, {})


def main(argv=None):
    p = argparse.ArgumentParser(description="Auto-post content to social platforms.")
    p.add_argument("--bundle", required=True, help="Posts bundle JSON.")
    p.add_argument("--platforms", help="Comma-separated subset to actually post.")
    p.add_argument("--provider", choices=["ayrshare", "webhook"], default="ayrshare")
    p.add_argument("--config", default=DEFAULT_CONFIG)
    p.add_argument("--confirm", action="store_true",
                   help="REQUIRED to actually publish. Without it, dry-run only.")
    args = p.parse_args(argv)

    with open(args.config, encoding="utf-8") as fh:
        platforms = json.load(fh)
    with open(args.bundle, encoding="utf-8") as fh:
        bundle = json.load(fh)

    schedule = bundle.pop("_schedule", None)
    subset = {p.strip() for p in args.platforms.split(",")} if args.platforms else None
    targets = {k: v for k, v in bundle.items()
               if (subset is None or k in subset)}

    if not targets:
        raise SystemExit("error: no posts selected to publish")

    # Preview every post first.
    print("=" * 60)
    print(f"PUBLISH PLAN  ·  provider={args.provider}  ·  "
          f"{'SCHEDULED ' + schedule if schedule else 'POST NOW'}")
    print("=" * 60)
    for key, post in targets.items():
        name = platforms.get(key, {}).get("name", key)
        ayr = platforms.get(key, {}).get("ayrshare_key", key)
        print(f"\n● {name}  [{ayr}]")
        print(f"  media: {post.get('media_urls') or 'none'}")
        print("  ---")
        for line in post["text"].splitlines() or [""]:
            print(f"  {line}")

    if not args.confirm:
        print("\n" + "-" * 60)
        print("DRY RUN — nothing was published. Re-run with --confirm to post.")
        return 0

    # Actually publish.
    print("\n" + "-" * 60)
    print("PUBLISHING...")
    results, any_fail = {}, False
    for key, post in targets.items():
        if args.provider == "ayrshare":
            ayr = platforms.get(key, {}).get("ayrshare_key", key)
            res = send_ayrshare([ayr], post, schedule)
        else:
            res = send_webhook(key, post, schedule)
        results[key] = res
        ok = res.get("ok")
        any_fail = any_fail or not ok
        print(f"  {'✓' if ok else '✗'} {key}: HTTP {res.get('status')} {('' if ok else res.get('body'))}")
    return 1 if any_fail else 0


if __name__ == "__main__":
    sys.exit(main())
