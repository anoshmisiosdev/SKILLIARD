# Competitor research — method, limits, and APIs

The goal of step 1 is to learn **who the product competes with on each platform**
and **what those competitors post** (angle, formats, hashtags, cadence), so the
generated content can differentiate instead of echo.

## Why we search instead of scrape

Logging into X / Instagram / TikTok / LinkedIn and scraping their feeds violates
their Terms of Service and breaks constantly (auth walls, anti-bot, rate limits).
The durable, compliant approach is:

1. **Public web search scoped to each platform's domain** (`site:tiktok.com ...`).
2. **Fetching public profile/post pages** that search returns.
3. **Official APIs** where the user has access and a key.

`competitor_research.py` builds the query plan; Claude runs it with its
**WebSearch** and **WebFetch** tools, or the script runs it via SerpAPI.

## Running it

```bash
# 1) Plan mode (default) — emits queries for Claude to execute:
python scripts/competitor_research.py --product "AI meal-planning app for busy parents" \
  --keywords "meal prep,family dinner,macros" --platforms x,instagram,tiktok

# 2) Auto mode — execute via SerpAPI (Google):
SERPAPI_API_KEY=sk_xxx python scripts/competitor_research.py \
  --product "..." --provider serpapi --json
```

After gathering results, summarize per platform:
- Top 3-5 competitor accounts and their positioning.
- Recurring post formats (carousel, talking-head video, listicle, meme…).
- Hashtags they lean on and rough posting cadence.
- Gaps / angles they're NOT covering → the product's opening.

## Plugging in official / better data sources

Swap or add providers by editing `competitor_research.py`:

| Source | Good for | Notes |
| --- | --- | --- |
| SerpAPI / Serper | Google-scoped `site:` searches (built in) | Needs `SERPAPI_API_KEY`. |
| YouTube Data API | Channels, video titles, view counts | Official, free quota. |
| Reddit API (PRAW) | Subreddit posts & comments | Official, generous. |
| X API v2 | Recent posts by query/handle | Paid tiers. |
| Apify / Bright Data actors | Instagram/TikTok public data | Managed, check each platform's ToS. |

Keep all keys in environment variables, never in the repo.

## Guardrails
- Public data only; no auth-walled scraping.
- Don't copy competitor copy — analyze it, then differentiate.
- Attribute any quoted competitor claim; don't present it as the user's.
