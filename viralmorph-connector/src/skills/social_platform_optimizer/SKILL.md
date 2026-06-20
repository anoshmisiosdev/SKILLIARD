---
name: social_platform_optimizer
description: Transform one user-provided context block into platform-native social posts (Instagram, LinkedIn, X) optimized for organic reach, engagement, and audience fit — without fabrication, spam, or engagement bait.
---

# Social Platform Optimizer

Transform one user-provided context block into platform-native social posts optimized for organic reach, engagement, and audience fit across **Instagram, LinkedIn, and X**.

This skill does **not** guarantee virality. It maximizes the *probability of distribution* by adapting the same idea to each platform's native content patterns, audience expectations, ranking signals, and compliance constraints.

---

## Global rules

1. Never cross-post the same copy unchanged.
2. Preserve the core message, but rewrite the structure, tone, CTA, and format for each platform.
3. Prioritize original, useful, non-spammy content.
4. Do not fabricate metrics, testimonials, screenshots, founder stories, user stories, partnerships, customer counts, or claims.
5. Do not create fake urgency unless the user provided a real deadline.
6. Do not use engagement bait such as "comment YES," "like if you agree," "tag 3 friends," or misleading hooks.
7. Prefer native content over external links.
8. Avoid spammy hashtag stuffing.
9. Optimize for shares, saves, replies, comments, dwell time, watch time, and profile visits — not just likes.
10. Use a clear human point of view.
11. If the post contains health, finance, legal, political, employment, or safety claims, add a fact-check warning (in `risk_notes`).
12. If the content is sponsored, affiliate-based, or paid partnership content, include a disclosure recommendation (in `risk_notes`).
13. Do not automate likes, follows, comments, replies, DMs, mass mentions, scraping, or profile visits.
14. Require human approval before publishing.

---

## Platform playbooks

### Instagram
- Visual-first.
- Optimize for Reels, carousels, shares, saves, and quick emotional payoff.
- Captions should be skimmable, direct, and less formal than LinkedIn.
- Use **3–8 hashtags**.
- Recommend asset ideas such as carousel slides, screenshots, demo clips, or short videos.

### LinkedIn
- Professional, credible, specific, and insight-driven.
- Optimize for expertise, dwell time, comments, profile visits, and qualified leads.
- Avoid corporate filler.
- Use **0–3 hashtags**.
- A strong first line is critical (it's the only thing shown before "see more").
- Prefer discussion-oriented CTAs.

### X / Twitter
- Concise, punchy, timely, and conversation-oriented.
- Optimize for replies, reposts, quotes, bookmarks, and a sharp point of view.
- Use **0–2 hashtags**.
- Avoid link-first posts unless needed (links can suppress reach; consider link in a reply).
- If appropriate, provide a **thread option**.

---

## Avoid these phrases

- "Excited to announce"
- "Thrilled to share"
- "Game changer"
- "Revolutionary"
- "The future of"
- "AI-powered solution" (without a concrete benefit)

---

## Virality score rubric (sums to 100)

| Dimension | Max points |
| --- | --- |
| Hook strength | 20 |
| Platform fit | 15 |
| Specificity & credibility | 15 |
| Share / save / reply value | 15 |
| Novelty or point of view | 10 |
| Audience clarity | 10 |
| CTA quality | 5 |
| Native format fit | 5 |
| Compliance / trust safety | 5 |

Score each post 0–100. Treat anything below ~60 as needing revision; note specific fixes in `revision_notes`.

---

## Output contract

For each requested platform, return:

- `recommended_format` — the native format to use (Reel, carousel, text post, thread, etc.).
- `post_copy` — the main post text, fully platform-adapted.
- `caption` — Instagram only.
- `thread_option` — X only; an ordered array of tweet-sized posts (optional).
- `hashtags` — within the platform's range, no stuffing, no leading `#` needed.
- `cta` — one clear, human, non-baity call to action.
- `asset_brief` — concrete visual/asset guidance.
- `virality_score` — 0–100 per the rubric.
- `revision_notes` — specific, actionable improvements.
- `risk_notes` — compliance/fact-check/disclosure flags (rules 11 & 12).

Plus a `global_strategy` (`core_angle`, `primary_emotion`, `target_action`, `risk_notes`) and an `assumptions` list for anything you inferred.

---

## Hard boundary (automation)

This skill only ever helps **create, stage, and (with explicit human approval) publish the user's own post**. It must never automate likes, comments, follows, DMs, reposts, scraping, mass mentions, profile visits, or any engagement farming. Always include a preview/review step and require explicit confirmation before the final publish click.
