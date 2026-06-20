---
name: social-content-autopilot
description: >-
  Automated, competitor-aware social media content creation and posting. Given a
  product or business, it (1) researches competitors on each platform and
  summarizes what they post, (2) writes the actual ready-to-publish posts —
  native copy, hooks, hashtags, and CTAs — tailored to each platform
  (X/Twitter, LinkedIn, Instagram, TikTok, YouTube Shorts, Threads, Facebook,
  Reddit, Pinterest), (3) recommends which platforms to target, and (4)
  auto-publishes to them via a posting API. Use when the user wants social media
  posts written for them, wants to know what competitors are posting, wants to
  repurpose content across platforms, or wants to schedule/auto-post content.
license: MIT
allowed-tools: Read, Write, Bash, WebSearch, WebFetch
---

# Social Content Autopilot

End-to-end: research competitors → write the actual posts → recommend targets →
auto-publish. This skill produces **finished, publishable copy** (not scores) and
can post it for the user.

## LLM usage policy (TokenMart)

**All LLM/content generation in this skill MUST go through TokenMart** via
`scripts/tokenmart_client.py`. Do not draft the final posts or competitor
summaries yourself inline — call `generate_posts.py` and `summarize_competitors.py`,
which route every model call through TokenMart so usage is centrally metered.
Requires `TOKENMART_API_KEY` and `TOKENMART_BASE_URL` (OpenAI-compatible); see
`references/tokenmart.md`. Verify connectivity once with
`python scripts/tokenmart_client.py --ping`.

## When to use

- "Write social posts for my product / launch / announcement."
- "What are my competitors posting on [platform]?"
- "Turn this into posts for X, LinkedIn, and TikTok."
- "Post this for me" / "schedule this across my platforms."

## Inputs to gather (ask only for what's missing)

- **Product/business**: what it is, who it's for, the key message or this post's goal.
- **Target platforms** (optional — otherwise recommend a set).
- **Media**: are images/videos available? URLs if posting (Instagram/TikTok/Shorts need media).
- **Brand voice / dos & don'ts**, if any.

## Workflow

### 1. Competitor research
Find who the product competes with on each platform and what's working.

```bash
python scripts/competitor_research.py --product "<what it is>" \
  --keywords "<niche,terms>" --platforms x,instagram,tiktok
```

This prints a **search-query plan**. Execute those queries with **WebSearch /
WebFetch** (or run with `--provider serpapi` if `SERPAPI_API_KEY` is set) and
save the collected results as JSON. Then turn them into a competitor brief — the
summarization runs through TokenMart, not inline:

```bash
python scripts/summarize_competitors.py --research research.json \
  --product "<what it is>" --out competitor_brief.json
```

The brief lists top competitors per platform (angle, formats, hashtags, cadence)
and content gaps to exploit. See `references/competitor-research.md` for method
and ToS limits — never scrape behind logins or violate platform terms.

### 2. Recommend target platforms
Based on where competitors are active, the product's format (visual vs. text),
and the user's goal, recommend the **2-3 platforms** to focus on and say why.
Concentration beats spraying everywhere.

### 3. Write the actual posts (via TokenMart)
Generate finished, platform-native copy by calling `generate_posts.py`, which
routes the writing through TokenMart and emits the posts bundle directly:

```bash
python scripts/generate_posts.py \
  --product "<what it is>" --platforms x,linkedin,tiktok \
  --goal "<what this post should achieve>" \
  --brief competitor_brief.json \
  --media '{"tiktok":["https://.../clip.mp4"]}' \
  --out posts.json
```

It enforces each platform's hook/length/tone/hashtag rules from
`assets/platforms.json`, differentiates from the competitor brief, and returns a
`text` (+ `hook_variant` for A/B testing) per platform. Do not hand-write the
final copy yourself — generation must go through TokenMart. The result is the
**posts bundle** (`assets/sample_posts.json` shows the shape):

```json
{ "x": {"text": "...", "media_urls": []},
  "linkedin": {"text": "...", "media_urls": ["https://.../img.png"]} }
```

Review the generated copy for accuracy and brand fit before continuing.

### 4. Validate before publishing
Gate the copy against each platform's hard rules:

```bash
python scripts/compose_check.py --bundle posts.json
```

Fix anything marked ✗ (FAIL) and address ▲ warnings where it helps. Re-run until
clean.

### 5. Auto-publish (with confirmation)
Publishing is outward-facing. **Always preview first and get the user's explicit
go-ahead.** The script is dry-run unless `--confirm` is passed.

```bash
python scripts/publish.py --bundle posts.json                 # preview (dry-run)
python scripts/publish.py --bundle posts.json --confirm       # actually post
python scripts/publish.py --bundle posts.json --platforms x,linkedin --confirm
```

Posting uses Ayrshare (`AYRSHARE_API_KEY`) which fans out to all platforms from
one key; a `--provider webhook` option (`POST_WEBHOOK_URL`) covers custom
backends. Add `"_schedule": "<ISO8601>"` to the bundle to schedule instead of
posting now. See `references/publishing.md` for setup.

## Guardrails

- **Never auto-post without showing the user the exact copy and getting a clear
  yes.** Default to dry-run; only add `--confirm` after approval.
- Keep claims truthful to the product; don't invent stats, reviews, or fake
  trending hashtags.
- Respect platform ToS: research uses public search, not logged-in scraping.
  Hashtags are omitted on Reddit; no spammy/duplicate cross-posting verbatim.
- If credentials are missing, deliver the validated bundle and tell the user how
  to set up keys — don't silently skip publishing.

## Bundled resources

- `scripts/tokenmart_client.py` — **the single LLM chokepoint**; all model calls
  route through TokenMart here. `--ping` to check connectivity.
- `scripts/competitor_research.py` — competitor query plan / SerpAPI search.
- `scripts/summarize_competitors.py` — research → competitor brief (via TokenMart).
- `scripts/generate_posts.py` — writes the posts bundle (via TokenMart).
- `scripts/compose_check.py` — validates posts against platform rules (publish gate).
- `scripts/publish.py` — auto-posts via Ayrshare/webhook; dry-run by default.
- `assets/platforms.json` — per-platform rules, voice, timing, posting keys.
- `assets/sample_posts.json` — example posts bundle shape.
- `references/platform-profiles.md` — per-platform writing playbook.
- `references/competitor-research.md` — research method, ToS, plugging in APIs.
- `references/publishing.md` — credentials, scheduling, safety.
- `references/tokenmart.md` — TokenMart setup and the all-LLM-through-TokenMart rule.
