# social-content-autopilot

A social-content skill focused on Instagram image posts, LinkedIn, and X. It
turns verified product context into a distinct native post for each platform,
plus a creative brief, controlled-test hook, publishing handoff, and measurement
plan. Instagram produces only single-image or image-carousel feed posts with
descriptions; it does not propose Reels or video.

The skill optimizes for qualified organic reach rather than promising
“virality.” LinkedIn defaults to a high-drama, r/LinkedInLunatics-inspired
presentation while requiring truthful proof and a substantive debate prompt.
It avoids fabricated stories, universal posting-time claims, rigid hashtag
quotas, direct engagement requests, and copy-paste cross-posting.

## Layout

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
└── social-content-publisher/
    ├── SKILL.md                    # uploads via Claude in Chrome (model-agnostic)
    ├── scripts/prepare_upload.py   # validates content + emits the browser upload plan (no posting)
    ├── assets/publish_map.json     # per-platform composer URL + semantic upload steps
    └── references/browser-control.md
```

## Publishing with Claude in Chrome

The `social-content-publisher` skill turns a finished post into an ordered
**upload plan** and executes it against your *logged-in* browser tab via the
Claude in Chrome extension (or a browser MCP / computer-use):

```bash
cd skills/social-content-publisher
python3 scripts/prepare_upload.py --platform x --text "<final post>"
python3 scripts/prepare_upload.py --platform reddit --title "..." --subreddit r/startups --text "..."
python3 scripts/prepare_upload.py --platform instagram --text "<caption>" --media ./hero.png
```

The script never posts — it only validates and prints the steps. The running
model performs them and **must get your explicit confirmation before the final
submit click**. You must already be signed in to the platform; the skill never
handles passwords, 2FA, or CAPTCHAs.

## How it works

## Validation

```bash
python3 skills/social-content-autopilot/scripts/check.py \
  --platform x --text "Your draft"

python3 skills/social-content-autopilot/scripts/check.py \
  --platform instagram --text "Your caption" --media
```

`build_formats.py` regenerates only the legacy platform files and preserves the
three curated, research-backed formats.

## Build

```bash
./build.sh
```

The archive is written to `dist/social-content-autopilot.zip`.
