/**
 * Mode 1 (preferred for Claude Desktop / Claude Code): the host AI does the
 * writing. We don't call any external model — instead we hand the host the
 * social_platform_optimizer skill plus a structured brief, and let it refine
 * the seeded draft via `update_platform_post`.
 *
 * The skill file is read from disk so it stays the single source of truth.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { GenerationInput } from "../types/postPlan.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Try a few likely locations so this works whether or not the skill was copied
// into dist during the build. The src copy is the canonical one.
const SKILL_CANDIDATES = [
  path.resolve(__dirname, "..", "skills", "social_platform_optimizer", "SKILL.md"),
  path.resolve(__dirname, "..", "..", "src", "skills", "social_platform_optimizer", "SKILL.md"),
];

let cachedSkill: string | null = null;

export async function loadSkill(): Promise<string> {
  if (cachedSkill) return cachedSkill;
  for (const candidate of SKILL_CANDIDATES) {
    try {
      cachedSkill = await fs.readFile(candidate, "utf8");
      return cachedSkill;
    } catch {
      // try next candidate
    }
  }
  // Should never happen, but degrade gracefully instead of crashing the tool.
  cachedSkill = "social_platform_optimizer skill file not found on disk.";
  return cachedSkill;
}

/** Build a brief the host AI can act on to rewrite/improve the seeded posts. */
export async function buildHostInstructions(input: GenerationInput): Promise<string> {
  const skill = await loadSkill();
  return [
    "You are the writer for ViralMorph. The server seeded a baseline draft using",
    "deterministic templates. Improve each platform's post yourself using the rules",
    "in the optimizer skill below, then persist your version with `update_platform_post`",
    "(one call per platform). Do NOT fabricate metrics, quotes, or claims. Keep X under",
    "280 chars, LinkedIn discussion-first, Instagram visual-first with a strong caption.",
    "",
    "=== USER CONTEXT ===",
    `context: ${input.context}`,
    `product_name: ${input.product_name ?? "(none)"}`,
    `target_audience: ${input.target_audience ?? "(none)"}`,
    `desired_action: ${input.desired_action ?? "awareness"}`,
    `tone: ${input.tone ?? "credible"}`,
    `link: ${input.link ?? "(none)"}`,
    `proof_points: ${input.proof_points ?? "(none)"}`,
    `platforms: ${input.platforms.join(", ")}`,
    "",
    "=== social_platform_optimizer SKILL ===",
    skill,
  ].join("\n");
}
