# Format: TikTok

Rewrite the input text into a single ready-to-post **TikTok** post using the
rules below. Keep the input's core message and facts; never invent stats.

## Hard limits (the validator enforces these)
- **Length:** 50-150 chars (hard cap **2200**).
- **Hashtags:** Use **3-6**, mixing broad + niche.
- **Media:** Video-first: the text is the caption for a vertical video; write a 3-second hook.
- **CTA:** End with one fitting call to action.
- **Best time:** Tue-Thu 6-10am & 7-11pm local  ·  **Cadence:** 1-4 posts/day

## Voice
Native, fast, trend-aware. The caption is for a vertical video.

## Structure
1. Write the spoken/on-screen hook for the first 3 seconds.
2. Keep the caption short and curiosity-driven.
3. Comment bait > hard CTA.

## Hook patterns
- "Wait for it..."
- "Things I wish I knew before ___"

## Output
Return the finished TikTok post (ready to paste) plus one alternate hook line.
Validate with: `python scripts/check.py --platform tiktok --text "<post>"`.
