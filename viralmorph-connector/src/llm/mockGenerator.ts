/**
 * Deterministic, network-free generator.
 *
 * This is the fallback that makes the whole demo work with zero config or API
 * keys. It is intentionally rule-based (not random) so the same input yields the
 * same output. It applies the social_platform_optimizer rules: no banned
 * phrases, platform-native structure, sane hashtag counts, no fabricated proof.
 */
import type {
  GenerationInput,
  GlobalStrategy,
  InstagramPost,
  LinkedInPost,
  Platform,
  Posts,
  XPost,
} from "../types/postPlan.js";

/** Phrases the optimizer skill forbids. Used by the generator AND the scorer. */
export const BANNED_PHRASES = [
  "excited to announce",
  "thrilled to share",
  "game changer",
  "game-changer",
  "revolutionary",
  "the future of",
  "ai-powered solution",
];

const ENGAGEMENT_BAIT = [
  "comment yes",
  "like if you agree",
  "tag 3 friends",
  "tag three friends",
];

// ---------------------------------------------------------------------------
// Small text helpers
// ---------------------------------------------------------------------------

/** Collapse ALL whitespace to single spaces — for single-line fields (hooks, CTAs). */
function clean(text: string): string {
  return (text || "").replace(/\s+/g, " ").trim();
}

/** Normalize but PRESERVE intentional line breaks — for multi-paragraph post copy. */
function tidy(text: string): string {
  return (text || "")
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function sentences(text: string): string[] {
  return clean(text)
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function firstSentence(text: string): string {
  return sentences(text)[0] || clean(text).slice(0, 120);
}

function titleCaseWords(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Pull short topical keywords for hashtags (no stuffing). */
function keywords(input: GenerationInput, max: number): string[] {
  const stop = new Set([
    "the", "a", "an", "and", "or", "for", "to", "of", "in", "on", "with", "that",
    "this", "it", "is", "are", "we", "our", "your", "you", "from", "into", "one",
    "turns", "takes", "built", "build", "tool", "different", "into", "platform",
    "platforms", "posts", "post", "opens", "helps", "then", "stage", "target",
    "audience", "desired", "action", "tone", "should",
  ]);
  const base = `${input.product_name ?? ""} ${input.context}`;
  const words = base
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stop.has(w));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const w of words) {
    if (seen.has(w)) continue;
    seen.add(w);
    out.push(w);
    if (out.length >= max) break;
  }
  return out;
}

function hashtagify(words: string[]): string[] {
  return words.map((w) => w.replace(/[^a-z0-9]/gi, "")).filter(Boolean);
}

// ---------------------------------------------------------------------------
// Voice + intent helpers
// ---------------------------------------------------------------------------

function ctaFor(input: GenerationInput, platform: Platform): string {
  const link = input.link ? ` ${input.link}` : "";
  const action = input.desired_action ?? "awareness";
  const byAction: Record<string, string> = {
    awareness: platform === "linkedin"
      ? "Curious how others are solving this — how do you handle it today?"
      : "Following up with what we learn. What would you want to see next?",
    waitlist: `Join the waitlist${link}`,
    demo: `Want a 5-minute walkthrough? Reply and I'll send one${link ? `: ${input.link}` : "."}`,
    feedback: "I'd genuinely like to know where this breaks. What am I missing?",
    sales: `See how it works${link}`,
    recruit: "We're a small team and hiring. If this sounds like your kind of problem, let's talk.",
    community: `Come build with us${link}`,
    other: link ? `More here${link}` : "More soon.",
  };
  return byAction[action] ?? byAction.awareness;
}

function angleFor(input: GenerationInput): string {
  const subject = input.product_name ? `${input.product_name}: ` : "";
  return `${subject}${firstSentence(input.context)}`;
}

function emotionFor(input: GenerationInput): string {
  const tone = input.tone ?? "credible";
  const map: Record<string, string> = {
    credible: "earned trust",
    witty: "delight",
    "founder-led": "shared ambition",
    technical: "respect for the details",
    contrarian: "productive disagreement",
    educational: "clarity",
    casual: "relatability",
    polished: "confidence",
  };
  return map[tone] ?? "curiosity";
}

// ---------------------------------------------------------------------------
// Per-platform copy builders
// ---------------------------------------------------------------------------

function buildX(input: GenerationInput): XPost {
  const idea = firstSentence(input.context);
  const tone = input.tone ?? "credible";
  const hookByTone: Record<string, string> = {
    contrarian: "Most teams don't have a content problem. They have a distribution problem.",
    "founder-led": "We kept rewriting the same update 3 times for 3 platforms. So we stopped.",
    technical: "One context block in, three platform-native drafts out. Here's the approach.",
    witty: "Your launch deserves better than copy-paste across every feed.",
    credible: "Posting the same text everywhere quietly kills your reach.",
    educational: "Cross-posting identical copy is the #1 reach killer. Here's the fix.",
    casual: "Turns out 'just post it everywhere' is bad advice.",
    polished: "Same idea, three native formats. That's the whole game.",
  };
  const hook = hookByTone[tone] ?? hookByTone.credible;
  const cta = ctaFor(input, "x");

  const body = input.product_name
    ? `${input.product_name} takes one messy update and reshapes it per platform — then stages it in your own browser.`
    : `${idea}`;

  const post_copy = tidy(`${hook}\n\n${body}\n\n${cta}`);

  const thread_option = [
    hook,
    body,
    input.proof_points
      ? `What we're seeing so far: ${clean(input.proof_points)}`
      : "The trick isn't more posts. It's adapting structure, hook, and CTA to each feed's ranking signals.",
    cta,
  ].map(clean);

  return {
    recommended_format: "Single punchy post (with optional 3–4 tweet thread)",
    post_copy,
    thread_option,
    hashtags: [],
    cta,
    asset_brief:
      "Optional: a 15–30s screen recording of one context block becoming three drafts. Native video > link.",
    virality_score: 0,
    revision_notes: [
      "Lead with the sharpest line; cut hedging words.",
      "If using the thread, make tweet 1 stand alone without the rest.",
    ],
    risk_notes: [],
  };
}

function buildLinkedIn(input: GenerationInput): LinkedInPost {
  const audience = input.target_audience ?? "people shipping things";
  const opener = "I rewrote the same launch post three times last week. Different platform, same idea, three different rules.";
  const middle = input.product_name
    ? `So we built ${input.product_name}: you give it one block of context, it returns posts shaped for each platform's native format — then helps you stage them in your own browser, with a review step before anything goes live.`
    : "The lesson: the same idea needs a different structure, hook, and CTA on every platform. Cross-posting identical copy is the quiet reason good launches get no reach.";
  const proofLine = input.proof_points ? `What's real so far: ${clean(input.proof_points)}.` : "";
  const cta = ctaFor(input, "linkedin");
  const audienceLine = `If you're ${audience}, ${cta}`;

  const post_copy = tidy([opener, middle, proofLine, audienceLine].filter(Boolean).join("\n\n"));

  const tags = hashtagify(keywords(input, 2)).map(titleCaseWords);
  const hashtags = [...new Set([...tags, "Distribution"])].slice(0, 3);

  return {
    recommended_format: "Text post, strong first line, short paragraphs, discussion CTA",
    post_copy,
    hashtags,
    cta,
    asset_brief:
      "Optional: a single clean diagram (one input → three platform outputs). Document/PDF carousels also perform well.",
    virality_score: 0,
    revision_notes: [
      "First line must earn the 'see more' click on its own.",
      "Keep paragraphs to 1–2 lines for mobile skimming.",
    ],
    risk_notes: [],
  };
}

function buildInstagram(input: GenerationInput): InstagramPost {
  const idea = input.product_name
    ? `One messy update → ready-to-post for every platform.`
    : firstSentence(input.context);
  const cta = ctaFor(input, "instagram");

  const caption = tidy(
    [
      idea,
      "Writing the same launch three different ways is the worst part of shipping. We made the boring part fast.",
      `Save this if you post to more than one platform. ${cta}`,
    ].join("\n\n")
  );

  const tags = hashtagify(keywords(input, 5));
  const hashtags = [...new Set([...tags, "buildinpublic", "indiehackers", "startup"])].slice(0, 7);

  return {
    recommended_format: "Carousel (5–7 slides) or 15–30s Reel",
    post_copy: idea,
    caption,
    hashtags,
    cta,
    asset_brief:
      "Carousel: Slide 1 = the hook as bold text. Slides 2–5 = the same idea morphing into X / LinkedIn / IG. Final slide = CTA. Or a quick screen-recording Reel of the transform.",
    virality_score: 0,
    revision_notes: [
      "Front-load the payoff on slide 1; assume sound-off.",
      "Captions skimmable — short lines, no corporate filler.",
    ],
    risk_notes: ["Instagram is visual-first: a text-only post will underperform. Pair with media."],
  };
}

// ---------------------------------------------------------------------------
// Virality score rubric (sums to 100)
// ---------------------------------------------------------------------------

const HASHTAG_RANGE: Record<Platform, [number, number]> = {
  instagram: [3, 8],
  linkedin: [0, 3],
  x: [0, 2],
};

function hasBanned(text: string): boolean {
  const lc = text.toLowerCase();
  return BANNED_PHRASES.some((p) => lc.includes(p)) || ENGAGEMENT_BAIT.some((p) => lc.includes(p));
}

export function scorePost(
  platform: Platform,
  post: InstagramPost | LinkedInPost | XPost,
  input: GenerationInput
): number {
  const copy = platform === "instagram" ? (post as InstagramPost).caption : post.post_copy;
  const firstLine = copy.split("\n")[0] ?? "";
  let score = 0;

  // Hook strength (20)
  let hook = 8;
  if (firstLine.length > 0 && firstLine.length <= 100) hook += 6;
  if (/\d/.test(firstLine) || /\?$/.test(firstLine.trim())) hook += 3;
  if (!/^(excited|thrilled)/i.test(firstLine)) hook += 3;
  score += Math.min(20, hook);

  // Platform fit (15)
  let fit = 6;
  if (platform === "x" && copy.length <= 280) fit += 6;
  if (platform === "linkedin" && copy.length >= 300 && copy.length <= 1800) fit += 6;
  if (platform === "instagram" && copy.includes("\n")) fit += 6;
  const tagCount = post.hashtags.length;
  const [lo, hi] = HASHTAG_RANGE[platform];
  if (tagCount >= lo && tagCount <= hi) fit += 3;
  score += Math.min(15, fit);

  // Specificity & credibility (15)
  let spec = 5;
  if (input.proof_points && input.proof_points.trim().length > 0) spec += 5;
  if (/\d/.test(copy)) spec += 3;
  if (input.product_name && copy.includes(input.product_name)) spec += 2;
  score += Math.min(15, spec);

  // Share / save / reply value (15)
  let share = 6;
  if (/\?/.test(copy)) share += 4;
  if (/save|reply|comment|share|thread/i.test(copy)) share += 3;
  if (post.cta && post.cta.length > 0) share += 2;
  score += Math.min(15, share);

  // Novelty / point of view (10)
  let novelty = 4;
  const t = input.tone ?? "credible";
  if (t === "contrarian" || t === "founder-led") novelty += 4;
  if (/most (teams|people|founders)|the real|quietly|nobody/i.test(copy)) novelty += 2;
  score += Math.min(10, novelty);

  // Audience clarity (10)
  let aud = 5;
  if (input.target_audience && input.target_audience.trim().length > 0) aud += 5;
  score += Math.min(10, aud);

  // CTA quality (5)
  score += post.cta && post.cta.length > 4 ? 5 : 2;

  // Native format fit (5)
  score += post.recommended_format && post.recommended_format.length > 0 ? 5 : 2;

  // Compliance / trust safety (5)
  score += hasBanned(copy) ? 1 : 5;

  return Math.max(0, Math.min(100, Math.round(score)));
}

// ---------------------------------------------------------------------------
// Public entry
// ---------------------------------------------------------------------------

export function buildGlobalStrategy(input: GenerationInput): GlobalStrategy {
  const risk: string[] = [];
  if (/\b\d+%|\b\d+x\b|\d+ users|\d+ customers/i.test(input.context) && !input.proof_points) {
    risk.push("Context mentions metrics — verify they're real before publishing; do not invent numbers.");
  }
  if (input.link) {
    risk.push("Link-in-post can reduce reach on X/IG; prefer native content + link in reply/bio.");
  }
  return {
    core_angle: angleFor(input),
    primary_emotion: emotionFor(input),
    target_action: input.desired_action ?? "awareness",
    risk_notes: risk,
  };
}

export function buildAssumptions(input: GenerationInput): string[] {
  const a: string[] = [];
  if (!input.product_name) a.push("No product name given — kept the copy product-agnostic.");
  if (!input.target_audience) a.push("No audience specified — assumed a general builder/founder audience.");
  if (!input.proof_points) a.push("No proof points given — avoided any metrics or claims to stay truthful.");
  if (!input.link) a.push("No link given — used native, discussion-first CTAs.");
  a.push(`Tone interpreted as: ${input.tone ?? "credible"}.`);
  return a;
}

/** Build the per-platform posts (only those requested), with scores attached. */
export function buildPosts(input: GenerationInput): Posts {
  const posts: Posts = {};
  if (input.platforms.includes("x")) {
    const x = buildX(input);
    x.virality_score = scorePost("x", x, input);
    posts.x = x;
  }
  if (input.platforms.includes("linkedin")) {
    const li = buildLinkedIn(input);
    li.virality_score = scorePost("linkedin", li, input);
    posts.linkedin = li;
  }
  if (input.platforms.includes("instagram")) {
    const ig = buildInstagram(input);
    ig.virality_score = scorePost("instagram", ig, input);
    posts.instagram = ig;
  }
  return posts;
}
