# Format: Pinterest

Rewrite the input text into a single ready-to-post **Pinterest** post using the
rules below. Keep the input's core message and facts; never invent stats.

## Hard limits (the validator enforces these)
- **Length:** 100-500 chars (hard cap **500**).
- **Hashtags:** Use **2-5**, mixing broad + niche.
- **Media:** Favors an image — recommend attaching one.
- **CTA:** End with one fitting call to action.
- **Best time:** Evenings 8-11pm & weekends  ·  **Cadence:** 5-15 pins/week

## Voice
Keyword-rich, evergreen, how-to / inspiration.

## Structure
1. Front-load searchable keywords.
2. Describe the value of the pin.
3. Soft 'save for later' CTA.

## Hook patterns
- "How to ___ (step by step)"
- "___ ideas you’ll want to save"

## Output
Return the finished Pinterest post (ready to paste) plus one alternate hook line.
Validate with: `python scripts/check.py --platform pinterest --text "<post>"`.
