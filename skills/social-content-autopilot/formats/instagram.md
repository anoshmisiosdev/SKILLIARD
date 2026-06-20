# Instagram image posts

Create only feed image posts with descriptions. Do not propose Reels, video,
Stories, live content, or an audio strategy for this project.

Read `references/instagram-strategy.md` before drafting.

## Choose the image format

- Use a **single image** for one striking proof point, product moment,
  comparison, result, diagram, or emotionally legible scene.
- Use an **image carousel** when sequence creates value: a framework, teardown,
  checklist, before/after, mini-case study, or progressive reveal.
- Default to a portrait feed canvas as a testable creative choice, not a ranking
  fact. Preserve safe margins and phone readability. Keep a user-supplied aspect
  ratio or template when specified.

## Build the image before the caption

1. Make the first image understandable without reading the description. Show a
   concrete promise, tension, outcome, or visual proof.
2. Use original assets or meaningfully transformed source material. Do not rely
   on reposted graphics, copied quote cards, or another creator's layout.
3. Prefer one visual idea and a clear focal point. Use text on the image only
   when it improves comprehension; make it short, high-contrast, and readable.
4. For carousels, give each slide one job:
   - slide 1: audience + payoff or tension
   - slide 2: why the problem matters
   - middle: proof, steps, comparison, or reveal
   - penultimate: application or product mechanism
   - final: summary and proportionate next action
5. Ensure every slide advances the argument. Delete filler slides.

## Write the description

1. Front-load a line that complements rather than repeats the image.
2. Add context, evidence, and one useful takeaway that the visual cannot carry.
3. Create an honest send/save reason through utility, identity, surprise,
   reference value, or emotional resonance. Do not demand saves or shares.
4. Use natural topic and audience keywords. Add zero to five specific hashtags;
   treat them as labels, not a reach engine.
5. Use one objective-aligned CTA. For traffic, state the destination clearly;
   do not pretend a caption URL is a frictionless clickable link.
6. Supply useful alt text describing the image's meaning, important visible
   text, and relevant visual details.

## Output additions

Include:

1. `single image` or `carousel` and the rationale
2. exact image copy and composition brief
3. slide-by-slide plan for a carousel
4. exact description
5. alt text
6. the intended send/save trigger
7. one alternate first image for a controlled test
8. primary metric and comparison baseline

If no image exists, produce a build-ready image brief and mark the post
`not publishable: image required`.

Validate the description with:
`python scripts/check.py --platform instagram --text "<description>" --media`
