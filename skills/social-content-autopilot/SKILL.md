---
name: social-content-autopilot
description: >-
  Rewrite any input text into ready-to-post copy for any social platform —
  X/Twitter, LinkedIn, Instagram, TikTok, YouTube Shorts, Threads, Facebook,
  Reddit, and Pinterest. The skill loads a small per-platform format file and
  adapts the hook, length, hashtags, tone, and CTA to that platform's native
  style (LinkedIn uses the over-the-top r/LinkedInLunatics influencer-broetry
  style), then outputs the finished post. Use when the user wants a post written
  or reformatted for one or more platforms, or wants to repurpose content across
  platforms.
license: MIT
allowed-tools: Read, Bash, WebSearch, WebFetch
---

# Social Content Autopilot

One skill. Give it text and a target platform; it loads that platform's **format
file** and returns ready-to-post copy. **You (the model running this skill) do the
rewriting** — guided by the format files below. There is no external AI service;
the bundled scripts only do search-planning and validation.

## Platform → format file

Read the matching file and follow it **exactly** when rewriting:

| Platform | Format file |
| --- | --- |
| X / Twitter | `formats/x.md` |
| LinkedIn | `formats/linkedin.md` *(r/LinkedInLunatics broetry style)* |
| Instagram | `formats/instagram.md` |
| TikTok | `formats/tiktok.md` |
| YouTube Shorts | `formats/youtube-shorts.md` |
| Threads | `formats/threads.md` |
| Facebook | `formats/facebook.md` |
| Reddit | `formats/reddit.md` |
| Pinterest | `formats/pinterest.md` |

## Workflow

1. **Get the inputs** (ask only for what's missing):
   - The text/idea to post.
   - Target platform(s). If none given, recommend a sensible 2-3 and say why.
   - Whether an image/video is available (TikTok/Shorts/Instagram assume a visual).
2. **(Optional) competitor research** — to make the copy land, see what
   competitors do: `python scripts/competitor_research.py --product "<x>"
   --platforms <list>` then run the printed searches with WebSearch/WebFetch and
   summarize. See `references/competitor-research.md`. Skip if not needed.
3. **Rewrite per platform** — for each target, **READ `formats/<platform>.md`**
   and follow it to produce the post (hook, length, hashtags, tone, CTA). Keep
   the input's core message and facts; never invent stats or fake hashtags.
4. **Validate** each draft against the platform's hard rules:
   ```bash
   python scripts/check.py --platform <key> --text "<your post>"   # --media if a visual is attached
   ```
   Platform keys: `x, linkedin, instagram, tiktok, youtube_shorts, threads,
   facebook, reddit, pinterest`. Fix any ✗ FAIL; address ▲ warnings where useful.
5. **Deliver in chat**, ready to paste. For each platform show: the post, one
   alternate hook, hashtags/media note, and best posting time. Don't post anything.

## Guardrails

- Output copy for the user to publish — never claim something was posted.
- Keep claims truthful to the product. The LinkedIn "lunatic" style satirizes the
  *form* (broetry, humble-brag, engagement bait) — never fabricate facts about
  the product.
- Reddit gets no hashtags and no salesy CTA; respect each platform's norms.
- Research uses public search only — no logged-in scraping.

## Bundled resources

- `formats/*.md` — per-platform writing rules (generated from `assets/platforms.json`).
- `scripts/check.py` — validates a post against a platform's rules (no AI).
- `scripts/competitor_research.py` — optional competitor search-query plan / SerpAPI.
- `assets/platforms.json` — per-platform limits, voice, and timing (source of truth).
- `references/competitor-research.md` — research method, ToS, plugging in APIs.
