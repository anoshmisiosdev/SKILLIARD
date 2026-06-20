# Publishing — setup, scheduling, and safety

`scripts/publish.py` posts a validated bundle to the suggested platforms. It is
**dry-run by default** and only publishes when `--confirm` is passed.

## Provider: Ayrshare (recommended)

[Ayrshare](https://www.ayrshare.com) posts to X, LinkedIn, Instagram, TikTok,
YouTube, Facebook, Threads, Reddit, and Pinterest from a single API key, so you
don't manage nine separate OAuth flows.

1. Create an account and connect the user's social accounts in Ayrshare.
2. Copy the API key and export it:
   ```bash
   export AYRSHARE_API_KEY="xxxxxxxx"
   ```
3. The `ayrshare_key` field in `assets/platforms.json` maps each platform to
   Ayrshare's platform name.

## Provider: webhook (custom backends)

For a custom scheduler/queue, use `--provider webhook` and set:
```bash
export POST_WEBHOOK_URL="https://your-backend.example.com/social/post"
```
Each post is sent as `{platform, text, media_urls, schedule}`.

## Media rules
- TikTok, YouTube Shorts, and Instagram **require** media; put public URLs in
  `media_urls`. `compose_check.py` flags video-first platforms with no media.
- X / LinkedIn / Threads / Facebook accept text-only but perform better with media.

## Scheduling instead of posting now
Add a top-level `_schedule` (ISO-8601, UTC) to the bundle:
```json
{ "x": {"text": "..."}, "_schedule": "2026-06-21T14:00:00Z" }
```
publish.py forwards it as Ayrshare's `scheduleDate`.

## Safety checklist (do every time)
1. Run `compose_check.py` until there are no ✗ FAILs.
2. Run `publish.py` **without** `--confirm` and show the user the exact preview.
3. Get an explicit "yes, post it."
4. Only then re-run with `--confirm`.
5. Report back the per-platform HTTP result / post IDs.

Posting is hard to reverse (notifications fire, content gets indexed). When in
doubt, schedule a few minutes out so there's a cancel window.
