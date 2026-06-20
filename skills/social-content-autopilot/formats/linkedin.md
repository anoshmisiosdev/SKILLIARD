# LinkedIn

Default to **high-drama practitioner mode**, inspired by the recognizable form
catalogued in r/LinkedInLunatics: a disruptive opener, staccato pacing, narrative
tension, a hard pivot to a professional lesson, and an ending that invites a
position. Keep the substance credible even when the presentation is theatrical.

Read `references/linkedin-strategy.md` and `references/linkedin-lunatics.md`
before drafting this mode.

## High-drama structure

1. Open with a jarring but true confession, counterintuitive result, sharp
   opinion, or high-stakes contrast. Make the first two lines earn expansion.
2. Use one short sentence or fragment per paragraph for the opening 3-6 beats.
   Use whitespace for pacing, then switch to denser paragraphs or bullets when
   explaining the substance. Do not turn every line into broetry.
3. Build a miniature story from a verified event, product decision, failure,
   customer observation, or experiment supplied by the user.
4. Insert a pattern-interrupt pivot such as “That is not the interesting part”
   or “The lesson was not about the feature.” Avoid copying these verbatim when
   a more specific line fits.
5. Deliver one concrete professional lesson, framework, or tradeoff. Include
   proof early enough that the hook does not feel deceptive.
6. Stack 2-4 short takeaways only when each adds information. Parallel phrasing
   is useful; empty inspiration is not.
7. Connect the product after the insight. Make it the mechanism or example, not
   a surprise sales pitch.
8. End with a **debate prompt** that resembles engagement bait but requires a
   meaningful answer: ask which tradeoff the reader would choose, where the
   argument fails, or what their experience contradicts. “Agree?” may be used
   only when the preceding claim is specific and contestable; prefer “Where do
   you disagree?” or a two-sided professional choice.

## Reach and credibility rules

- Create tension from a real tradeoff, not ragebait or a fabricated villain.
- Never invent a firing, rejection, child, driver, barista, customer, revenue
  number, emotional confession, or “everyone clapped” moment.
- Do not explicitly request likes, follows, reposts, tags, or “comment YES.”
  LinkedIn identifies those as engagement bait that may not receive broader
  recommendation.
- Do not use engagement pods, coordinated comments, unrelated tags, fake
  scarcity, or a controversy unrelated to the product.
- Use zero to three precise hashtags only when useful. Do not append generic
  `#Leadership`, `#Growth`, or `#Mindset` filler.
- Ask for a provocative variant only by intensifying a defensible opinion. Do
  not make the claim less accurate.

## Format selection

- Use text for a focused story or argument.
- Use a native document/carousel for a stepwise framework or teardown.
- Use native video for a demonstration or person-led explanation.
- Use an image for evidence, contrast, or a result. Do not add media without a
  job.

Include an external link when it serves the objective; do not repeat folklore
that links are always suppressed.

## Output additions

Include:

1. exact post
2. a **drama dial** from 1-5; default to 4
3. one alternate opening with a different tension mechanism
4. the verified fact supporting the hook
5. the debate prompt and why a qualified reader can answer it
6. primary analytics: out-of-network reach plus the objective-specific metric
7. one virality hypothesis from `references/linkedin-strategy.md` and the
   controlled next test

If the user explicitly asks for maximal engagement bait, provide the high-drama
version first. Optionally provide a separately labeled **high-risk bait test**
using “Agree or disagree?”—never direct engagement requests—and warn that the
platform says engagement bait may reduce broader recommendation.

Validate with:
`python scripts/check.py --platform linkedin --text "<post>"`
