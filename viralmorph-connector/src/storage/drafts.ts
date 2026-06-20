/**
 * Local JSON draft storage. One file per draft: data/drafts/{draft_id}.json.
 *
 * We NEVER store passwords, cookies, tokens, or social credentials here —
 * only generated post content and the inputs used to produce it.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Draft, Platform } from "../types/postPlan.js";

// dist/storage/drafts.js -> project root is two levels up.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const DRAFTS_DIR = path.join(PROJECT_ROOT, "data", "drafts");

async function ensureDir(): Promise<void> {
  await fs.mkdir(DRAFTS_DIR, { recursive: true });
}

/** Short, human-friendly, collision-resistant id like "vm_lq3k9f_x7a2". */
export function makeDraftId(): string {
  const time = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 6);
  return `vm_${time}_${rand}`;
}

function draftPath(draftId: string): string {
  // Guard against path traversal from a malformed id.
  const safe = draftId.replace(/[^a-zA-Z0-9_-]/g, "");
  return path.join(DRAFTS_DIR, `${safe}.json`);
}

export async function saveDraft(draft: Draft): Promise<Draft> {
  await ensureDir();
  draft.updated_at = new Date().toISOString();
  await fs.writeFile(draftPath(draft.draft_id), JSON.stringify(draft, null, 2), "utf8");
  return draft;
}

export async function loadDraft(draftId: string): Promise<Draft | null> {
  try {
    const raw = await fs.readFile(draftPath(draftId), "utf8");
    return JSON.parse(raw) as Draft;
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

export async function listDraftIds(): Promise<string[]> {
  await ensureDir();
  const files = await fs.readdir(DRAFTS_DIR);
  return files.filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, ""));
}

/**
 * Returns the platform-appropriate primary text for staging:
 * Instagram -> caption (fallback post_copy), LinkedIn -> post_copy, X -> post_copy.
 */
export function primaryTextFor(draft: Draft, platform: Platform): string | null {
  const post = draft.posts[platform];
  if (!post) return null;
  if (platform === "instagram") {
    const ig = draft.posts.instagram!;
    return ig.caption || ig.post_copy || "";
  }
  return post.post_copy || "";
}
