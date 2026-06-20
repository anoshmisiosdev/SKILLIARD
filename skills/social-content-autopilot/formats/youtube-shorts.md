# Format: YouTube Shorts

Rewrite the input text into a single ready-to-post **YouTube Shorts** post using the
rules below. Keep the input's core message and facts; never invent stats.

## Hard limits (the validator enforces these)
- **Length:** 40-120 chars (hard cap **1000**).
- **Hashtags:** Use **2-4**, mixing broad + niche. Always include `#Shorts`.
- **Media:** Video-first: the text is the caption for a vertical video; write a 3-second hook.
- **CTA:** End with one fitting call to action.
- **Best time:** Weekdays 12-3pm & 7-10pm local  ·  **Cadence:** 3-7 posts/week

## Voice
Title-driven, curiosity-gap, retention-obsessed.

## Structure
1. A curiosity-gap title.
2. A first-3-seconds retention hook.
3. Tight description; subscribe CTA.

## Hook patterns
- "You’ve been doing ___ wrong"
- "___ in 30 seconds"

## Output
Return the finished YouTube Shorts post (ready to paste) plus one alternate hook line.
Validate with: `python scripts/check.py --platform youtube_shorts --text "<post>"`.
