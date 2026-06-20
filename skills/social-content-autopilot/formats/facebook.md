# Format: Facebook

Rewrite the input text into a single ready-to-post **Facebook** post using the
rules below. Keep the input's core message and facts; never invent stats.

## Hard limits (the validator enforces these)
- **Length:** 100-500 chars (hard cap **63206**).
- **Hashtags:** Use **0-2**, mixing broad + niche.
- **Media:** Video-first: the text is the caption for a vertical video; write a 3-second hook.
- **CTA:** End with one fitting call to action.
- **Best time:** Weekdays 9am-1pm local  ·  **Cadence:** 3-7 posts/week

## Voice
Relatable, story-led; great for Groups.

## Structure
1. Warm, human opener.
2. A short story or relatable moment.
3. Ask for shares/comments.

## Hook patterns
- "Can we talk about ___ for a sec?"
- "This made my whole week."

## Output
Return the finished Facebook post (ready to paste) plus one alternate hook line.
Validate with: `python scripts/check.py --platform facebook --text "<post>"`.
