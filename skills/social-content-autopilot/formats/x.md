# Format: X / Twitter

Rewrite the input text into a single ready-to-post **X / Twitter** post using the
rules below. Keep the input's core message and facts; never invent stats.

## Hard limits (the validator enforces these)
- **Length:** 80-240 chars (hard cap **280**).
- **Hashtags:** Use **0-2**, mixing broad + niche.
- **Media:** Favors an image — recommend attaching one.
- **CTA:** End with one fitting call to action.
- **Best time:** Weekdays 9-11am & 6-9pm local  ·  **Cadence:** 1-5 posts/day

## Voice
Punchy and opinionated. One idea. Sound like a smart person talking, not a brand. Contractions, no corporate filler.

## Structure
1. Line 1 is a scroll-stopping claim, hot take, or number.
2. 1-3 short lines of payoff.
3. Optional: a thread if it needs more than one idea.

## Hook patterns
- "Unpopular opinion:"
- "X cost me $Y. Here’s the lesson:"
- "Nobody tells you this about ___"

## Output
Return the finished X / Twitter post (ready to paste) plus one alternate hook line.
Validate with: `python scripts/check.py --platform x --text "<post>"`.
