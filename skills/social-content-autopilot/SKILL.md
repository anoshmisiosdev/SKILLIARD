---
name: social-content-autopilot
description: Transform product context, announcements, articles, and rough ideas into truthful, platform-native Instagram image posts, LinkedIn posts, and X posts optimized for qualified organic reach. Use when drafting, adapting, auditing, testing, or preparing social posts and publishing handoffs for one or more of those platforms, including hooks, descriptions, threads, image carousels, media briefs, calls to action, virality hypotheses, and measurement plans.
---

# Social Content Autopilot

Optimize for useful distribution, not a promise of virality. Produce a distinct
native post for each platform; do not merely shorten the same copy.

## Required context

Extract these inputs from the request and supplied materials:

- source idea and verified facts
- product, audience, and audience problem
- objective: awareness, conversation, followers, traffic, leads, or conversion
- proof: demo, result, example, quote, data, or first-hand observation
- brand voice, offer, link, and available media
- target platform(s)
- account analytics, timezone, and publishing constraints when available

Ask only for information whose absence would make the post misleading or
unusable. Otherwise make conservative assumptions and label them in the
strategy note, not inside the post. Never invent an anecdote, customer, quote,
statistic, credential, urgency, or product capability.

## Workflow

1. Define one audience, one promise, one proof point, and one desired action.
2. Choose one primary success metric from the objective table below.
3. Read every requested platform file before drafting:
   - Instagram: `formats/instagram.md` and
     `references/instagram-strategy.md`
   - LinkedIn: `formats/linkedin.md` and
     `references/linkedin-strategy.md`; also read
     `references/linkedin-lunatics.md` for high-drama mode
   - X: `formats/x.md` and `references/x-strategy.md`
4. Draft around the strongest specific truth in the source. Put context before
   promotion and make the product the mechanism, not the entire story.
5. Run the quality gate and revise weak drafts.
6. Validate hard limits with `scripts/check.py`.
7. Return a publishing packet. Do not operate a browser or publish unless the
   user explicitly asks for publishing after reviewing the exact final copy.

## Objective and metric

| Objective | Primary metric | Draft toward |
| --- | --- | --- |
| Awareness | qualified reach outside the existing audience | sends/shares, retention, clear topic |
| Conversation | substantive comments or replies | a defensible point and specific question |
| Followers | follows per profile visit | repeatable expertise and a clear audience promise |
| Traffic | qualified link visits / impressions | concrete benefit and one low-friction CTA |
| Leads or conversion | completed actions / qualified visits | proof, fit, objection handling, one next step |

Treat likes as a diagnostic, not the goal. Never optimize a business post for
raw impressions while ignoring audience fit.

## Quality gate

Score each item 0-2. Revise until the total is at least 14/18 and no item is 0.

1. Audience specificity
2. First-screen hook: clear tension, result, novelty, or useful promise
3. Concrete value: teaches, demonstrates, reframes, or entertains
4. Credible proof and factual fidelity
5. Native platform fit
6. Share/save/reply reason aligned with the objective
7. Low-friction reading and accessible media plan
8. One proportionate CTA
9. Originality and brand distinctiveness

Reject hooks that overpromise the body. Reject generic openings such as “Big
news,” “Thrilled to announce,” and “Unpopular opinion” unless the following
claim earns them. Do not add a question or CTA only to manufacture engagement.

## Timing and experimentation

Do not claim a universal best posting time. If account analytics exist, choose
a window when the target audience is active. Otherwise propose a clearly
labeled starting window in the audience's timezone and test it.

Compare results against the median of at least 10 recent, comparable organic
posts when possible. Test one variable at a time: topic, hook, format, creative,
CTA, or time. Do not publish simultaneous near-duplicates. Record platform,
format, audience, objective, hypothesis, publish time, reach, meaningful
engagement, profile actions, clicks, and conversions. Recommend the next test;
do not infer a rule from one post.

## Publishing packet

Return, for each platform:

1. **Strategy note** — audience, objective, format, and primary metric in one line.
2. **Final post** — exact paste-ready copy.
3. **Creative brief** — asset, opening frame, on-screen text, accessibility, and
   platform-specific crop or duration. Say “text only” when appropriate.
4. **Alternate hook** — one materially different hook for a future test.
5. **Publishing notes** — link placement, tags/mentions requiring verification,
   location or disclosure needs, and test window. Omit irrelevant fields.
6. **Measurement note** — what to capture and the next controlled test.

For a future browser agent, also state the target account, visibility, exact
media file(s), exact copy, and approval status. Mark approval `required` unless
the user explicitly approved that exact payload. Never infer approval from a
request to draft or optimize.

## Safety and distribution guardrails

- Preserve attribution and disclose material affiliations or sponsorships.
- Use only relevant, verified mentions and hashtags. Never hijack a trend.
- Do not use engagement pods, coordinated amplification, repetitive replies,
  bulk tagging, fake scarcity, or deceptive engagement bait. LinkedIn may use a
  high-drama, bait-adjacent presentation only under its platform rules.
- Do not copy a competitor's wording or repost unoriginal media as original.
- Check recommendation eligibility and account status before diagnosing weak
  reach as a copy problem.
- For current rationale and official sources, read
  `references/platform-research.md`. Re-check official guidance when the user
  asks for a strategy audit or when platform behavior may have changed.

## Bundled resources

- `formats/{instagram,linkedin,x}.md` — platform decision and drafting rules.
- `scripts/check.py` — hard-limit and heuristic linting.
- `assets/platforms.json` — validator configuration.
- `references/platform-research.md` — evidence, source dates, and uncertainty.
- `references/{instagram,linkedin,x}-strategy.md` — detailed platform-specific
  virality models, archetypes, ranking implications, metrics, and experiments.
- `references/linkedin-lunatics.md` — observed LinkedIn high-drama mechanics and
  truth-preserving transformations.
- `references/competitor-research.md` and `scripts/competitor_research.py` —
  optional public competitor research. Use patterns as inspiration, never copy.
