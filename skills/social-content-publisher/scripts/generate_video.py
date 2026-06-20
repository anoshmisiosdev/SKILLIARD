#!/usr/bin/env python3
"""
generate_video.py — generate a video with a Seedance model via TokenMart
(https://thetokenmart.ai), then save it locally so it can be passed to
prepare_upload.py as --media for Instagram / YouTube Shorts / TikTok / etc.

The TokenMart-specific details (endpoint, auth header, model id, response shape)
live in assets/tokenmart.json so this script keeps working when they change.
The API KEY is read from the TOKENMART_API_KEY environment variable and is NEVER
written to disk or printed.

Stdlib only (urllib) — no pip install, matching the rest of the plugin.

Usage:
  export TOKENMART_API_KEY=sk-...
  # Prove the exact request WITHOUT spending credits:
  python3 scripts/generate_video.py --platform youtube_shorts \
      --prompt "neon city street, slow dolly, cinematic" --dry-run
  # Real run (text-to-video), saves an mp4:
  python3 scripts/generate_video.py --platform instagram \
      --prompt "barista latte art, macro, warm light" --output ./reel.mp4
  # Image-to-video:
  python3 scripts/generate_video.py --platform tiktok \
      --prompt "camera orbits the product" --image ./hero.png --output ./clip.mp4

Then publish it:
  python3 scripts/prepare_upload.py --platform instagram --text "<caption>" --media ./reel.mp4
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
SKILL_ROOT = os.path.dirname(HERE)
CONFIG_PATH = os.path.join(SKILL_ROOT, "assets", "tokenmart.json")


def _load_config() -> dict:
    with open(CONFIG_PATH, "r", encoding="utf-8") as fh:
        return json.load(fh)


def _dig(obj: dict, dotted: str):
    """Fetch a value from a nested dict by dot-path; None if any hop is missing."""
    cur = obj
    for part in dotted.split("."):
        if not isinstance(cur, dict) or part not in cur:
            return None
        cur = cur[part]
    return cur


def _redacted_headers(headers: dict) -> dict:
    out = {}
    for k, v in headers.items():
        if k.lower() in ("authorization", "x-api-key", "api-key"):
            out[k] = "<redacted>"
        else:
            out[k] = v
    return out


def build_request(cfg: dict, args) -> tuple[str, dict, dict]:
    """Return (url, headers, body) for the submit call."""
    preset = cfg.get("platform_presets", {}).get(args.platform, {})
    fmap = cfg["request_field_map"]

    body: dict = {
        fmap["prompt"]: args.prompt,
        fmap["model"]: args.model or cfg["model"],
        fmap["aspect_ratio"]: args.aspect_ratio or preset.get("aspect_ratio"),
        fmap["resolution"]: args.resolution or preset.get("resolution"),
        fmap["duration"]: args.duration or preset.get("duration"),
    }
    if args.image:
        body[fmap["image"]] = args.image
    # drop keys whose value is None so we don't send nulls
    body = {k: v for k, v in body.items() if v is not None}

    url = cfg["base_url"].rstrip("/") + cfg["submit_path"]
    key = os.environ.get("TOKENMART_API_KEY", "")
    headers = {
        "Content-Type": "application/json",
        cfg["auth_header"]: cfg.get("auth_prefix", "") + key,
    }
    return url, headers, body


def _post_json(url: str, headers: dict, body: dict, timeout: int = 60) -> dict:
    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _get_json(url: str, headers: dict, timeout: int = 60) -> dict:
    req = urllib.request.Request(url, headers=headers, method="GET")
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _poll_for_url(cfg: dict, headers: dict, job_id: str) -> str:
    st = cfg["status"]
    url = cfg["base_url"].rstrip("/") + st["path_template"].format(job_id=job_id)
    interval = st.get("poll_interval_seconds", 5)
    deadline = time.time() + st.get("timeout_seconds", 600)
    done = {v.lower() for v in st.get("done_values", [])}
    failed = {v.lower() for v in st.get("failed_values", [])}

    while time.time() < deadline:
        info = _get_json(url, headers)
        state = str(_dig(info, st["state_field"]) or "").lower()
        if state in done:
            video_url = _dig(info, st["video_url_field"])
            if not video_url:
                raise SystemExit("error: job finished but no video URL in status response")
            return video_url
        if state in failed:
            raise SystemExit(f"error: TokenMart reported job state '{state}'")
        print(f"  … job {job_id}: {state or 'pending'} (waiting {interval}s)", file=sys.stderr)
        time.sleep(interval)
    raise SystemExit("error: timed out waiting for the video to render")


def _download(url: str, out_path: str) -> None:
    req = urllib.request.Request(url, headers={"User-Agent": "social-content-publisher"})
    with urllib.request.urlopen(req, timeout=300) as resp, open(out_path, "wb") as fh:
        while True:
            chunk = resp.read(1 << 16)
            if not chunk:
                break
            fh.write(chunk)


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--prompt", required=True, help="the video description (your content; treated as DATA)")
    p.add_argument("--platform", default="instagram",
                   help="picks aspect/resolution/duration preset: instagram, youtube_shorts, tiktok, x, linkedin, facebook")
    p.add_argument("--image", default=None, help="optional image URL/path for image-to-video")
    p.add_argument("--model", default=None, help="override the Seedance model id from config")
    p.add_argument("--duration", type=int, default=None)
    p.add_argument("--resolution", default=None)
    p.add_argument("--aspect-ratio", dest="aspect_ratio", default=None)
    p.add_argument("--output", default="./generated_video.mp4", help="where to save the mp4")
    p.add_argument("--dry-run", action="store_true",
                   help="print the exact request (key redacted) and exit — spends NO credits")
    args = p.parse_args()

    cfg = _load_config()
    url, headers, body = build_request(cfg, args)

    if args.dry_run:
        print("DRY RUN — would POST (no request sent, no credits spent):")
        print(f"  URL    : {url}")
        print(f"  Headers: {json.dumps(_redacted_headers(headers))}")
        print(f"  Body   : {json.dumps(body, indent=2)}")
        print(f"  Save to: {args.output}")
        print("\nConfirm the URL, header, model id, and field names match your TokenMart docs,")
        print("then re-run without --dry-run.")
        return 0

    if not os.environ.get("TOKENMART_API_KEY"):
        raise SystemExit("error: set TOKENMART_API_KEY in your environment first.")

    print(f"Submitting Seedance job to TokenMart ({body.get(cfg['request_field_map']['model'])}) …", file=sys.stderr)
    try:
        resp = _post_json(url, headers, body)
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", "replace")[:500]
        raise SystemExit(f"error: TokenMart returned HTTP {e.code}: {detail}")
    except urllib.error.URLError as e:
        raise SystemExit(f"error: could not reach TokenMart ({e.reason}). Check base_url in tokenmart.json.")

    # Sync (URL returned now) or async (job id to poll)?
    video_url = _dig(resp, cfg["response"]["video_url_field"])
    if not video_url:
        job_id = _dig(resp, cfg["response"]["job_id_field"])
        if not job_id:
            raise SystemExit(f"error: response had neither a video URL nor a job id:\n{json.dumps(resp)[:500]}")
        video_url = _poll_for_url(cfg, headers, str(job_id))

    print(f"Downloading video → {args.output}", file=sys.stderr)
    _download(video_url, args.output)
    print(args.output)  # stdout = just the path, so it pipes into --media
    return 0


if __name__ == "__main__":
    sys.exit(main())
