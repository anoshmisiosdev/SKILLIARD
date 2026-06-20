#!/usr/bin/env python3
"""Generate the per-platform format files for the social-content-autopilot skill.

This is ONE skill: skills/social-content-autopilot/SKILL.md dispatches to the
small format files generated here (skills/social-content-autopilot/formats/*.md).
Each format file tells the running model how to rewrite input text into a
ready-to-post post for that platform.

Source of truth for legacy platform files:
skills/social-content-autopilot/assets/platforms.json. Instagram, LinkedIn, and X
are research-backed curated files and are intentionally not generated here.

Usage:
    python3 build_formats.py
"""

from __future__ import annotations

import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
SKILL = os.path.join(HERE, "skills", "social-content-autopilot")
PLATFORMS = os.path.join(SKILL, "assets", "platforms.json")
OUT = os.path.join(SKILL, "formats")
CURATED = {"x", "linkedin", "instagram"}


def slug(key: str) -> str:
    return key.replace("_", "-")


# Per-platform voice/structure guidance. LinkedIn is the r/LinkedInLunatics style.
STYLES = {
    "x": {
        "voice": "Punchy and opinionated. One idea. Sound like a smart person "
                 "talking, not a brand. Contractions, no corporate filler.",
        "structure": [
            "Line 1 is a scroll-stopping claim, hot take, or number.",
            "1-3 short lines of payoff.",
            "Optional: a thread if it needs more than one idea.",
        ],
        "hooks": ['"Unpopular opinion:"', '"X cost me $Y. Here’s the lesson:"',
                  '"Nobody tells you this about ___"'],
    },
    "linkedin": {
        "voice": "Full r/LinkedInLunatics influencer mode. Sincere-sounding "
                 "engagement bait. Broetry. Humble-brag wrapped in fake "
                 "vulnerability. Inspirational to the point of parody — but "
                 "keep it coherent and on-message for the product.",
        "structure": [
            "BROETRY: one short sentence per line. A blank line between almost "
            "every line. White space is the whole aesthetic.",
            "Open with a jarring confession or flex disguised as vulnerability "
            '("I fired my best employee today." / "I cried in the parking lot.").',
            "Tell a tiny parable: a chance encounter (an Uber driver, a barista, "
            "a 7-year-old, a janitor, a homeless man) drops profound business "
            "wisdom. It probably never happened. That’s fine.",
            "Hard pivot to a Leadership / Growth / Mindset / Hustle lesson.",
            "Stack 2-4 ultra-short affirmations. ('Rejection is redirection.')",
            "Drop ONE humble-brag metric, then dismiss it "
            '("We hit $4M ARR. But that’s not the point.").',
            "End with blatant engagement bait: 'Agree?' / 'Thoughts? 👇' "
            "/ 'Repost ♻️ if this resonated.'",
        ],
        "hooks": ['"I fired my top performer.\\n\\nBest decision I ever made."',
                  '"A homeless man asked me for $1.\\n\\nWhat he said next changed my business forever."',
                  '"Got rejected 47 times.\\n\\nThen everything changed."'],
        "extra": "Emoji: a tasteful sprinkle (🚀 💡 🙏 "
                 "👇 ♻️). Hashtags are buzzwords "
                 "(#Leadership #Growth #Mindset #Hustle #Grateful). Never be mean "
                 "or untruthful about the actual product — satirize the FORM, "
                 "not the facts.",
    },
    "instagram": {
        "voice": "Visual-first, aspirational, warm. The caption supports the image.",
        "structure": ["Hook in line 1 (before the '...more' cut).",
                      "A few emoji-friendly lines.",
                      "Hashtags at the end or first comment."],
        "hooks": ['"Save this for later 📌"', '"POV: you finally ___"'],
    },
    "tiktok": {
        "voice": "Native, fast, trend-aware. The caption is for a vertical video.",
        "structure": ["Write the spoken/on-screen hook for the first 3 seconds.",
                      "Keep the caption short and curiosity-driven.",
                      "Comment bait > hard CTA."],
        "hooks": ['"Wait for it..."', '"Things I wish I knew before ___"'],
    },
    "youtube_shorts": {
        "voice": "Title-driven, curiosity-gap, retention-obsessed.",
        "structure": ["A curiosity-gap title.",
                      "A first-3-seconds retention hook.",
                      "Tight description; subscribe CTA."],
        "hooks": ['"You’ve been doing ___ wrong"', '"___ in 30 seconds"'],
    },
    "threads": {
        "voice": "Casual, conversational, reply-baiting; community feel.",
        "structure": ["Loose, chatty opener.",
                      "Invite replies.",
                      "Lower stakes than X."],
        "hooks": ['"ok genuine question:"', '"hot take but ___"'],
    },
    "facebook": {
        "voice": "Relatable, story-led; great for Groups.",
        "structure": ["Warm, human opener.",
                      "A short story or relatable moment.",
                      "Ask for shares/comments."],
        "hooks": ['"Can we talk about ___ for a sec?"', '"This made my whole week."'],
    },
    "reddit": {
        "voice": "Authentic, non-promotional, subreddit-native. Redditors smell "
                 "marketing instantly — don’t market.",
        "structure": ["A plain, honest title that fits the subreddit.",
                      "Value-first, well-structured body.",
                      "Disclose any affiliation; no salesy CTA."],
        "hooks": ['"I spent 6 months doing ___. Here’s what I learned."',
                  '"[honest] what nobody tells you about ___"'],
    },
    "pinterest": {
        "voice": "Keyword-rich, evergreen, how-to / inspiration.",
        "structure": ["Front-load searchable keywords.",
                      "Describe the value of the pin.",
                      "Soft 'save for later' CTA."],
        "hooks": ['"How to ___ (step by step)"', '"___ ideas you’ll want to save"'],
    },
}


def hashtag_rule(hlo, hhi, key):
    if hhi == 0:
        return "Do **NOT** use hashtags — they reduce reach here."
    extra = " Always include `#Shorts`." if key == "youtube_shorts" else ""
    if hlo == hhi:
        return f"Use exactly **{hhi}**.{extra}"
    return f"Use **{hlo}-{hhi}**, mixing broad + niche.{extra}"


def media_rule(p):
    if p.get("favors_video"):
        return "Video-first: the text is the caption for a vertical video; write a 3-second hook."
    if p.get("favors_media"):
        return "Favors an image — recommend attaching one."
    return "Text-first — no media needed."


def format_md(key, p):
    name = p["name"]
    lo, hi = p["ideal_length"]
    hlo, hhi = p["hashtag_range"]
    st = STYLES[key]
    structure = "\n".join(f"{i}. {s}" for i, s in enumerate(st["structure"], 1))
    hooks = "\n".join(f"- {h}" for h in st["hooks"])
    extra = f"\n\n{st['extra']}" if st.get("extra") else ""
    cta = ("Soft or none — overt CTAs get downvoted." if name == "Reddit"
           else "End with one fitting call to action.")
    return f"""# Format: {name}

Rewrite the input text into a single ready-to-post **{name}** post using the
rules below. Keep the input's core message and facts; never invent stats.

## Hard limits (the validator enforces these)
- **Length:** {lo}-{hi} chars (hard cap **{p['max_length']}**).
- **Hashtags:** {hashtag_rule(hlo, hhi, key)}
- **Media:** {media_rule(p)}
- **CTA:** {cta}
- **Best time:** {p['best_times']}  ·  **Cadence:** {p['cadence']}

## Voice
{st['voice']}{extra}

## Structure
{structure}

## Hook patterns
{hooks}

## Output
Return the finished {name} post (ready to paste) plus one alternate hook line.
Validate with: `python scripts/check.py --platform {key} --text "<post>"`.
"""


def main():
    with open(PLATFORMS, encoding="utf-8") as fh:
        platforms = json.load(fh)
    os.makedirs(OUT, exist_ok=True)
    written = []
    for key, p in platforms.items():
        if key in CURATED:
            continue
        if key not in STYLES:
            print(f"warning: no STYLES entry for '{key}', skipping")
            continue
        path = os.path.join(OUT, f"{slug(key)}.md")
        with open(path, "w", encoding="utf-8") as fh:
            fh.write(format_md(key, p))
        written.append(f"formats/{slug(key)}.md")
    print(f"Preserved curated files: {', '.join(sorted(CURATED))}")
    print(f"Generated {len(written)} legacy format files:")
    for w in written:
        print(f"  - {w}")


if __name__ == "__main__":
    main()
