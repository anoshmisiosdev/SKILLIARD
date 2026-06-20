# Format: Threads

Rewrite the input text into a single ready-to-post **Threads** post using the
rules below. Keep the input's core message and facts; never invent stats.

## Hard limits (the validator enforces these)
- **Length:** 80-400 chars (hard cap **500**).
- **Hashtags:** Use **0-1**, mixing broad + niche.
- **Media:** Favors an image — recommend attaching one.
- **CTA:** End with one fitting call to action.
- **Best time:** Weekdays 9am-12pm & 6-8pm local  ·  **Cadence:** 2-6 posts/day

## Voice
Casual, conversational, reply-baiting; community feel.

## Structure
1. Loose, chatty opener.
2. Invite replies.
3. Lower stakes than X.

## Hook patterns
- "ok genuine question:"
- "hot take but ___"

## Output
Return the finished Threads post (ready to paste) plus one alternate hook line.
Validate with: `python scripts/check.py --platform threads --text "<post>"`.
