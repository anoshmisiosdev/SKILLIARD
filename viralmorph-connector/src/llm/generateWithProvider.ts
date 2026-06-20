/**
 * Mode 2 (optional): the SERVER calls an LLM directly, when the user supplies
 * an API key via env. Supports Anthropic Messages and any OpenAI-compatible
 * Chat Completions endpoint. Uses global fetch (Node 18+), no extra SDKs.
 *
 * If the provider is not configured or the call fails, callers fall back to the
 * deterministic mock generator — the demo must never hard-fail on this.
 */
import type {
  GenerationInput,
  GlobalStrategy,
  Posts,
  Platform,
} from "../types/postPlan.js";
import { loadSkill } from "./generateWithHostInstructions.js";
import { scorePost } from "./mockGenerator.js";

export interface ProviderResult {
  assumptions: string[];
  global_strategy: GlobalStrategy;
  posts: Posts;
}

export type ProviderName = "anthropic" | "openai" | "none";

export function activeProvider(): ProviderName {
  const p = (process.env.LLM_PROVIDER ?? "").toLowerCase();
  if (p === "anthropic" && process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (p === "openai" && process.env.OPENAI_API_KEY) return "openai";
  return "none";
}

function buildPrompt(input: GenerationInput, skill: string, onlyPlatform?: Platform, feedback?: string): string {
  const target = onlyPlatform ? [onlyPlatform] : input.platforms;
  return [
    "Transform the user context into platform-native social posts using the rules in the skill.",
    feedback ? `Apply this revision feedback: "${feedback}".` : "",
    "Return ONLY valid minified JSON, no markdown fences, matching exactly this TypeScript shape:",
    "{",
    '  "assumptions": string[],',
    '  "global_strategy": { "core_angle": string, "primary_emotion": string, "target_action": string, "risk_notes": string[] },',
    '  "posts": {',
    '    "instagram"?: { "recommended_format": string, "post_copy": string, "caption": string, "hashtags": string[], "cta": string, "asset_brief": string, "revision_notes": string[], "risk_notes": string[] },',
    '    "linkedin"?: { "recommended_format": string, "post_copy": string, "hashtags": string[], "cta": string, "asset_brief": string, "revision_notes": string[], "risk_notes": string[] },',
    '    "x"?: { "recommended_format": string, "post_copy": string, "thread_option": string[], "hashtags": string[], "cta": string, "asset_brief": string, "revision_notes": string[], "risk_notes": string[] }',
    "  }",
    "}",
    `Only include these platforms: ${target.join(", ")}.`,
    "Do NOT fabricate metrics, quotes, testimonials, or claims. Do NOT use banned phrases.",
    "",
    "USER CONTEXT:",
    JSON.stringify(input, null, 2),
    "",
    "SKILL RULES:",
    skill,
  ]
    .filter(Boolean)
    .join("\n");
}

function extractJson(text: string): unknown {
  // Models sometimes wrap JSON in prose/fences. Grab the outermost JSON object.
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object found in model output.");
  return JSON.parse(candidate.slice(start, end + 1));
}

async function callAnthropic(prompt: string): Promise<string> {
  const model = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY as string,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic API error ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
  return (data.content ?? []).map((b) => b.text ?? "").join("");
}

async function callOpenAI(prompt: string): Promise<string> {
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const base = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.OPENAI_API_KEY as string}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: "You are a precise social media strategist. Output only valid JSON." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI API error ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content ?? "";
}

/** Normalize provider JSON into our shape and (re)compute virality scores. */
function normalize(raw: any, input: GenerationInput, platforms: Platform[]): ProviderResult {
  const posts: Posts = {};
  for (const p of platforms) {
    const src = raw?.posts?.[p];
    if (!src) continue;
    const base = {
      recommended_format: String(src.recommended_format ?? ""),
      post_copy: String(src.post_copy ?? ""),
      hashtags: Array.isArray(src.hashtags) ? src.hashtags.map(String) : [],
      cta: String(src.cta ?? ""),
      asset_brief: String(src.asset_brief ?? ""),
      virality_score: 0,
      revision_notes: Array.isArray(src.revision_notes) ? src.revision_notes.map(String) : [],
      risk_notes: Array.isArray(src.risk_notes) ? src.risk_notes.map(String) : [],
    };
    if (p === "instagram") {
      const ig = { ...base, caption: String(src.caption ?? src.post_copy ?? "") };
      ig.virality_score = scorePost("instagram", ig, input);
      posts.instagram = ig;
    } else if (p === "linkedin") {
      const li = { ...base };
      li.virality_score = scorePost("linkedin", li, input);
      posts.linkedin = li;
    } else if (p === "x") {
      const x = { ...base, thread_option: Array.isArray(src.thread_option) ? src.thread_option.map(String) : [] };
      x.virality_score = scorePost("x", x, input);
      posts.x = x;
    }
  }
  const gs = raw?.global_strategy ?? {};
  return {
    assumptions: Array.isArray(raw?.assumptions) ? raw.assumptions.map(String) : [],
    global_strategy: {
      core_angle: String(gs.core_angle ?? ""),
      primary_emotion: String(gs.primary_emotion ?? ""),
      target_action: String(gs.target_action ?? input.desired_action ?? "awareness"),
      risk_notes: Array.isArray(gs.risk_notes) ? gs.risk_notes.map(String) : [],
    },
    posts,
  };
}

/**
 * Generate via the configured provider. Returns null if no provider is
 * configured. Throws only on a genuine API failure (callers catch + fall back).
 */
export async function generateWithProvider(
  input: GenerationInput,
  opts: { onlyPlatform?: Platform; feedback?: string } = {}
): Promise<ProviderResult | null> {
  const provider = activeProvider();
  if (provider === "none") return null;

  const skill = await loadSkill();
  const prompt = buildPrompt(input, skill, opts.onlyPlatform, opts.feedback);
  const raw = provider === "anthropic" ? await callAnthropic(prompt) : await callOpenAI(prompt);
  const parsed = extractJson(raw);
  const platforms = opts.onlyPlatform ? [opts.onlyPlatform] : input.platforms;
  return normalize(parsed, input, platforms);
}
