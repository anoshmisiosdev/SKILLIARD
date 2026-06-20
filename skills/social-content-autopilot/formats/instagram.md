# Format: Instagram

Rewrite the input text into a single ready-to-post **Instagram** post using the
rules below. Keep the input's core message and facts; never invent stats.

## Hard limits (the validator enforces these)
- **Length:** 125-600 chars (hard cap **2200**).
- **Hashtags:** Use **5-15**, mixing broad + niche.
- **Media:** Video-first: the text is the caption for a vertical video; write a 3-second hook.
- **CTA:** End with one fitting call to action.
- **Best time:** Weekdays 11am-1pm & 7-9pm local  ·  **Cadence:** 3-7 posts/week + daily stories

## Voice
Visual-first, aspirational, warm. The caption supports the image.

## Structure
1. Hook in line 1 (before the '...more' cut).
2. A few emoji-friendly lines.
3. Hashtags at the end or first comment.

## Hook patterns
- "Save this for later 📌"
- "POV: you finally ___"

## Output
Return the finished Instagram post (ready to paste) plus one alternate hook line.
Validate with: `python scripts/check.py --platform instagram --text "<post>"`.
