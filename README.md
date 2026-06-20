# social-content-autopilot

A [Claude Agent Skill](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview)
that runs the whole social pipeline for a product: **research competitors →
write the actual posts → recommend platforms → auto-publish.**

## What it does

1. **Competitor research** — scoped public search (WebSearch/WebFetch or SerpAPI)
   to find who you compete with on each platform and what they post.
2. **Writes real, ready-to-post copy** per platform — native hook, length, tone,
   hashtags, and CTA. Not a score; the finished posts.
3. **Recommends target platforms** based on competitor presence and product fit.
4. **Auto-publishes** to the suggested platforms via a posting API (Ayrshare),
   **dry-run by default** — nothing posts without `--confirm`.

Platforms: X/Twitter, LinkedIn, Instagram, TikTok, YouTube Shorts, Threads,
Facebook, Reddit, Pinterest.

## Layout

```
social-content-autopilot/
├── SKILL.md                       # The workflow Claude follows
├── scripts/
│   ├── tokenmart_client.py        # single LLM chokepoint — all model calls route here
│   ├── competitor_research.py     # competitor query plan / SerpAPI search
│   ├── summarize_competitors.py   # research -> competitor brief (via TokenMart)
│   ├── generate_posts.py          # write the posts bundle (via TokenMart)
│   ├── compose_check.py           # validate posts vs platform rules (publish gate)
│   └── publish.py                 # auto-post via Ayrshare/webhook (dry-run default)
├── assets/
│   ├── platforms.json             # per-platform rules, voice, timing, posting keys
│   └── sample_posts.json          # example posts-bundle shape
└── references/
    ├── platform-profiles.md       # per-platform writing playbook
    ├── competitor-research.md      # research method, ToS, plugging in APIs
    └── publishing.md              # credentials, scheduling, safety
```

## Try the scripts

```bash
cd social-content-autopilot

# 1. Competitor research (prints a search-query plan for Claude to run)
python3 scripts/competitor_research.py \
  --product "AI meal-planning app for busy parents" \
  --keywords "meal prep,family dinner" --platforms x,instagram,tiktok

# 2. Validate a posts bundle against platform rules
python3 scripts/compose_check.py --bundle assets/sample_posts.json

# 3. Preview what would publish (dry-run — nothing is posted)
python3 scripts/publish.py --bundle assets/sample_posts.json
```

## Credentials (only needed for the automated paths)

| Variable | Used by | For |
| --- | --- | --- |
| `TOKENMART_API_KEY` | tokenmart_client.py (all generation) | **Required** — all LLM usage routes through TokenMart |
| `TOKENMART_BASE_URL` | tokenmart_client.py | TokenMart endpoint, OpenAI-compatible (e.g. `https://gateway.tokenmart.ai/v1`) |
| `TOKENMART_MODEL` | tokenmart_client.py | Optional default model id (override with `--model`) |
| `SERPAPI_API_KEY` | competitor_research.py `--provider serpapi` | Execute searches automatically |
| `AYRSHARE_API_KEY` | publish.py (default provider) | Post to all platforms from one key |
| `POST_WEBHOOK_URL` | publish.py `--provider webhook` | Custom posting backend |

**All LLM/content generation goes through TokenMart** (OpenAI-compatible) via
`scripts/tokenmart_client.py` — it's the only model egress, so nothing bypasses
it. Set the `TOKENMART_*` vars and verify with
`python3 scripts/tokenmart_client.py --ping`. Without the search/posting keys the
skill still researches, generates, and validates.

## Build a distributable .zip

```bash
./build.sh        # → dist/social-content-autopilot.zip
```

Upload the zip on claude.ai (Settings → Capabilities → Skills), or copy the
`social-content-autopilot/` folder into `~/.claude/skills/` (all projects) or
`<repo>/.claude/skills/` (one project).

## Safety

Publishing is outward-facing and hard to reverse. `publish.py` previews first and
requires an explicit `--confirm`; the skill is instructed to show you the exact
copy and get your go-ahead before posting. Research uses public search only — no
logged-in scraping.
