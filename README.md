# social-content-autopilot

A [Claude Agent Skill](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview)
that runs the social content pipeline for a product: **research competitors →
write the actual posts → recommend platforms → output the copy in chat.**

## What it does

1. **Competitor research** — scoped public search (WebSearch/WebFetch or SerpAPI)
   to find who you compete with on each platform and what they post.
2. **Writes real, ready-to-post copy** per platform — native hook, length, tone,
   hashtags, and CTA. Not a score; the finished posts.
3. **Recommends target platforms** based on competitor presence and product fit.
4. **Delivers the posts in chat** for you to review and post yourself — it does
   not auto-publish.

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
│   └── compose_check.py           # validate posts vs platform rules
├── assets/
│   ├── platforms.json             # per-platform rules, voice, timing
│   └── sample_posts.json          # example posts-bundle shape
└── references/
    ├── platform-profiles.md       # per-platform writing playbook
    ├── competitor-research.md      # research method, ToS, plugging in APIs
    └── tokenmart.md               # TokenMart setup; all-LLM-through-TokenMart rule
```

## Try the scripts

```bash
cd social-content-autopilot

# 1. Competitor research (prints a search-query plan for Claude to run)
python3 scripts/competitor_research.py \
  --product "AI meal-planning app for busy parents" \
  --keywords "meal prep,family dinner" --platforms x,instagram,tiktok

# 2. Generate posts via TokenMart (needs TOKENMART_* set; see below)
python3 scripts/generate_posts.py \
  --product "AI meal-planning app for busy parents" \
  --platforms x,linkedin --goal "drive beta signups" --out posts.json

# 3. Validate the generated posts against platform rules
python3 scripts/compose_check.py --bundle posts.json
```

## Credentials

| Variable | Used by | For |
| --- | --- | --- |
| `TOKENMART_API_KEY` | tokenmart_client.py (all generation) | **Required** — all LLM usage routes through TokenMart |
| `TOKENMART_BASE_URL` | tokenmart_client.py | TokenMart endpoint, OpenAI-compatible (e.g. `https://model.service-inference.ai/v1`) |
| `TOKENMART_MODEL` | tokenmart_client.py | Optional default model id (override with `--model`) |
| `SERPAPI_API_KEY` | competitor_research.py `--provider serpapi` | Execute searches automatically (optional) |

Put these in a git-ignored `.env` (see `.env.example`); `tokenmart_client.py`
auto-loads it. **All LLM/content generation goes through TokenMart** (the only
model egress, so nothing bypasses it). Verify with
`python3 scripts/tokenmart_client.py --ping`. Without `SERPAPI_API_KEY` the skill
still does research-planning, generation, and validation.

## Build a distributable .zip

```bash
./build.sh        # → dist/social-content-autopilot.zip
```

Upload the zip on claude.ai (Settings → Capabilities → Skills), or copy the
`social-content-autopilot/` folder into `~/.claude/skills/` (all projects) or
`<repo>/.claude/skills/` (one project).

## Notes

- This skill **does not post anything** — it outputs finished copy for you to
  publish. No platform write-access or posting credentials are needed.
- Research uses public search only — no logged-in scraping.
- Secrets live in `.env` (git-ignored); never commit real keys.
