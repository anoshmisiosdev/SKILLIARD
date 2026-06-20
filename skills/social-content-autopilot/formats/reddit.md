# Format: Reddit

Rewrite the input text into a single ready-to-post **Reddit** post using the
rules below. Keep the input's core message and facts; never invent stats.

## Hard limits (the validator enforces these)
- **Length:** 300-2500 chars (hard cap **40000**).
- **Hashtags:** Do **NOT** use hashtags — they reduce reach here.
- **Media:** Text-first — no media needed.
- **CTA:** Soft or none — overt CTAs get downvoted.
- **Best time:** Weekdays 6-9am EST  ·  **Cadence:** match subreddit norms; quality over frequency

## Voice
Authentic, non-promotional, subreddit-native. Redditors smell marketing instantly — don’t market.

## Structure
1. A plain, honest title that fits the subreddit.
2. Value-first, well-structured body.
3. Disclose any affiliation; no salesy CTA.

## Hook patterns
- "I spent 6 months doing ___. Here’s what I learned."
- "[honest] what nobody tells you about ___"

## Output
Return the finished Reddit post (ready to paste) plus one alternate hook line.
Validate with: `python scripts/check.py --platform reddit --text "<post>"`.
