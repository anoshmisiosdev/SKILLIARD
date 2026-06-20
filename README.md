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

```text
skills/social-content-autopilot/
├── SKILL.md
├── agents/openai.yaml
├── formats/
│   ├── instagram.md
│   ├── linkedin.md
│   └── x.md
├── references/
│   ├── platform-research.md
│   └── competitor-research.md
├── scripts/
│   ├── check.py
│   └── competitor_research.py
└── assets/platforms.json
```

The repository still contains legacy format files for other platforms, but the
current skill scope and maintained strategy are Instagram, LinkedIn, and X.

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
