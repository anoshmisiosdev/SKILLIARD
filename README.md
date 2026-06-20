# social-content-autopilot

A single installable **Claude Code plugin** with one skill that rewrites any
input text into ready-to-post copy for any social platform. The main `SKILL.md`
dispatches to small per-platform **format files**.

Platforms: X/Twitter, LinkedIn, Instagram, TikTok, YouTube Shorts, Threads,
Facebook, Reddit, Pinterest. **LinkedIn uses the over-the-top r/LinkedInLunatics
influencer-broetry style.**

The rewriting is done by whatever model runs the skill — no external LLM service
or API key. The bundled scripts only do search-planning and validation.

## Layout (what's in the plugin zip)

```
.claude-plugin/
└── plugin.json                     # plugin manifest (zip root)
skills/
└── social-content-autopilot/
    ├── SKILL.md                    # the one skill: dispatches to format files
    ├── formats/
    │   ├── x.md
    │   ├── linkedin.md             # r/LinkedInLunatics broetry style
    │   ├── instagram.md
    │   ├── tiktok.md
    │   ├── youtube-shorts.md
    │   ├── threads.md
    │   ├── facebook.md
    │   ├── reddit.md
    │   └── pinterest.md
    ├── scripts/
    │   ├── check.py                # validate a post vs a platform's rules (no AI)
    │   └── competitor_research.py  # optional competitor search-query plan / SerpAPI
    ├── assets/platforms.json       # per-platform limits/voice/timing (source of truth)
    └── references/competitor-research.md
```

## How it works

1. You give it text + a target platform.
2. It reads `formats/<platform>.md` and rewrites the text to that platform's
   native style (hook, length, hashtags, tone, CTA).
3. It validates the draft: `python scripts/check.py --platform <key> --text "..."`.
4. It outputs the ready-to-paste post in chat (it never posts for you).

The format files are **generated** from `assets/platforms.json`. Edit that file
(or the styles in `build_formats.py`) and regenerate:

```bash
python3 build_formats.py
```

## Build the plugin zip

```bash
./build.sh        # → dist/social-content-autopilot.zip
```

The zip has `.claude-plugin/plugin.json` at its root and installs as one plugin.

## Try the scripts

```bash
cd skills/social-content-autopilot
python3 scripts/check.py --platform linkedin --text "I fired my best engineer. Best decision ever. Agree? #Leadership #Growth #Mindset"
python3 scripts/competitor_research.py --product "AI meal-planning app" --platforms x,tiktok
```

## Optional credentials

| Variable | Used by | For |
| --- | --- | --- |
| `SERPAPI_API_KEY` | competitor_research.py `--provider serpapi` | Run competitor searches automatically (optional) |

No other keys are needed — generation uses the running model.
