#!/usr/bin/env python3
"""Find who a product competes with on social platforms, and what they post.

Two modes:

1. PLAN (default, no network): given a product description / niche keywords,
   build a per-platform search-query plan. Claude then runs these queries with
   its own WebSearch/WebFetch tools and feeds results back. This is the reliable
   path — direct social scraping is auth-gated and against most platforms' ToS.

2. SERPAPI (optional): if SERPAPI_API_KEY is set and --provider serpapi is
   passed, it executes the queries via SerpAPI's Google engine and returns the
   organic results (titles + links + snippets) per platform.

Usage:
    python competitor_research.py --product "AI meal-planning app for busy parents"
    python competitor_research.py --product "..." --keywords "meal prep,macros" \
        --platforms x,instagram,tiktok
    SERPAPI_API_KEY=... python competitor_research.py --product "..." \
        --provider serpapi --json
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULT_CONFIG = os.path.join(HERE, "..", "assets", "platforms.json")


def load_platforms(path, only):
    with open(path, encoding="utf-8") as fh:
        platforms = json.load(fh)
    if only:
        wanted = {p.strip() for p in only.split(",")}
        platforms = {k: v for k, v in platforms.items() if k in wanted}
        if not platforms:
            raise SystemExit(f"error: no matching platforms in {sorted(wanted)}")
    return platforms


def build_queries(product: str, keywords: list[str], profile: dict) -> list[str]:
    """Search queries that surface competitor accounts/posts on one platform."""
    domain = profile["search_domain"]
    terms = [product] + keywords
    queries = []
    for t in terms:
        if not t:
            continue
        queries.append(f'site:{domain} {t}')
        queries.append(f'site:{domain} "{t}" (alternative OR competitor OR vs)')
    # De-dup, keep order.
    seen, out = set(), []
    for q in queries:
        if q not in seen:
            seen.add(q)
            out.append(q)
    return out


def serpapi_search(query: str, api_key: str, num: int = 5) -> list[dict]:
    params = {
        "engine": "google", "q": query, "api_key": api_key, "num": num,
    }
    url = "https://serpapi.com/search.json?" + urllib.parse.urlencode(params)
    with urllib.request.urlopen(url, timeout=30) as resp:
        data = json.load(resp)
    results = []
    for r in data.get("organic_results", [])[:num]:
        results.append({
            "title": r.get("title"),
            "link": r.get("link"),
            "snippet": r.get("snippet"),
        })
    return results


def main(argv=None):
    p = argparse.ArgumentParser(description="Competitor research across social platforms.")
    p.add_argument("--product", required=True, help="What the product is / does.")
    p.add_argument("--keywords", default="", help="Comma-separated extra niche keywords.")
    p.add_argument("--platforms", help="Comma-separated subset (default: all).")
    p.add_argument("--provider", choices=["plan", "serpapi"], default="plan",
                   help="'plan' emits queries for Claude to run; 'serpapi' executes them.")
    p.add_argument("--config", default=DEFAULT_CONFIG)
    p.add_argument("--num", type=int, default=5, help="Results per query (serpapi).")
    p.add_argument("--json", action="store_true")
    args = p.parse_args(argv)

    keywords = [k.strip() for k in args.keywords.split(",") if k.strip()]
    platforms = load_platforms(args.config, args.platforms)

    api_key = os.environ.get("SERPAPI_API_KEY")
    if args.provider == "serpapi" and not api_key:
        raise SystemExit("error: --provider serpapi requires SERPAPI_API_KEY in the environment")

    out = {"product": args.product, "keywords": keywords, "platforms": {}}
    for key, profile in platforms.items():
        queries = build_queries(args.product, keywords, profile)
        entry = {"name": profile["name"], "queries": queries}
        if args.provider == "serpapi":
            results = []
            for q in queries:
                try:
                    results.extend(serpapi_search(q, api_key, args.num))
                except Exception as e:  # keep going across queries
                    entry.setdefault("errors", []).append(f"{q}: {e}")
            # De-dup by link.
            seen, deduped = set(), []
            for r in results:
                if r["link"] and r["link"] not in seen:
                    seen.add(r["link"])
                    deduped.append(r)
            entry["results"] = deduped
        out["platforms"][key] = entry

    if args.json:
        print(json.dumps(out, indent=2))
        return 0

    # Human-readable
    print(f"COMPETITOR RESEARCH  ·  product: {args.product}")
    if keywords:
        print(f"keywords: {', '.join(keywords)}")
    print("=" * 60)
    for key, entry in out["platforms"].items():
        print(f"\n● {entry['name']}")
        if args.provider == "plan":
            print("  run these searches (WebSearch/WebFetch), then return competitors:")
            for q in entry["queries"]:
                print(f"    - {q}")
        else:
            if not entry.get("results"):
                print("  (no results)")
            for r in entry.get("results", []):
                print(f"    • {r['title']}\n      {r['link']}")
                if r.get("snippet"):
                    print(f"      {r['snippet']}")
            for err in entry.get("errors", []):
                print(f"    ! {err}")
    if args.provider == "plan":
        print("\nNext: Claude runs these queries, identifies the top 3-5 competitors per\n"
              "platform, and summarizes their angle, post formats, hashtags, and cadence.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
