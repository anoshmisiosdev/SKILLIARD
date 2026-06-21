# ViralMorph Connector

> Turn **one** raw context block into platform-native posts for **Instagram, LinkedIn, and X**, then stage and (only with explicit confirmation) publish them using your **own local browser session** — all driven from Claude Desktop, Claude Code, or any MCP client.

ViralMorph is a **local MCP server**, not a web app. It exposes tools that an AI client calls on your behalf.

---

## 1. What ViralMorph Connector does

You give it one messy context block (a launch, an update, an idea). It:

1. **Generates** platform-native posts — different structure, hook, CTA, hashtags, and format per platform (never the same copy cross-posted).
2. **Scores** each post 0–100 with a transparent virality rubric and adds an asset brief + revision notes.
3. **Saves** drafts locally as JSON so you can edit, regenerate, and reuse them.
4. **Stages** the approved posts in your **real Chrome via Claude-in-Chrome** by default — real cursor movement + screenshots — pasting each into the platform's composer **without** clicking Post. You can stage all three platforms in **one prompt** with no per-post confirmation.
5. **Publishes** only after you explicitly confirm once, by clicking the final Post/Share button (one confirmation can cover all staged posts).
6. Falls back to **clipboard + manual instructions** whenever automation is uncertain.

> **Two browser backends:** `claude_in_chrome` (default) hands the host AI a step‑by‑step plan + text to execute with its Claude‑in‑Chrome tools in your real Chrome. `playwright` makes ViralMorph drive its own bundled Chromium instead (use when the Claude‑in‑Chrome extension isn't available). Set via `BROWSER_BACKEND`.

> ⚠️ **Safety:** ViralMorph is a local hackathon prototype. It uses your own browser session and does not store your social media password. Review every post before publishing. Do not use this for spam, mass posting, automated engagement, scraping, or impersonation.

---

## 2. Why it's an MCP connector, not a web app

- There is **no React/Vite/Next.js UI**, no server to host, no dashboard.
- You interact entirely through your AI client (Claude Desktop / Claude Code / a Codex-style desktop agent).
- The connector exposes **tools**; the AI decides when to call them based on what you ask in natural language.
- It uses **no Instagram / LinkedIn / X / Meta / Twitter APIs** and **no OAuth** — only **browser automation** (Claude-in-Chrome by default, or Playwright) against your own manually-logged-in session.

This means the same connector works in any MCP-compatible client, and your credentials never leave your browser.

---

## 3. Install dependencies

Requires **Node.js 18+** (tested on Node 20/25).

```bash
cd viralmorph-connector
npm install
```

## 4. Build the project

```bash
npm run build      # compiles TypeScript -> dist/
```

## 5. Install Playwright browsers

Staging/publishing needs a real Chromium binary:

```bash
npx playwright install
```

(You can install just Chromium with `npx playwright install chromium`.)

## Quick start (all together)

```bash
npm install
npx playwright install
npm run build
npm start          # boots the MCP server over stdio (for manual testing)
```

`npm start` runs the server on stdio. You normally don't run it by hand — your MCP client launches it for you (next section). Running it directly just prints `ready` to stderr and waits.

---

## 6. Connect it to Claude Desktop

1. Build first (`npm run build`) so `dist/index.js` exists.
2. Open Claude Desktop → **Settings → Developer → Edit Config** (this opens `claude_desktop_config.json`).
3. Add the `viralmorph` server (see [`claude_desktop_config.example.json`](claude_desktop_config.example.json)). Use **absolute paths**:

```json
{
  "mcpServers": {
    "viralmorph": {
      "command": "node",
      "args": ["/absolute/path/to/viralmorph-connector/dist/index.js"],
      "env": {
        "LLM_PROVIDER": "mock",
        "BROWSER_PROFILE_DIR": "/absolute/path/to/viralmorph-connector/browser_profiles/default",
        "BROWSER_HEADLESS": "false"
      }
    }
  }
}
```

4. **Fully quit and reopen** Claude Desktop. ViralMorph's 10 tools should now appear.

> **Claude Code:** `claude mcp add viralmorph -- node /absolute/path/to/viralmorph-connector/dist/index.js`
> **Other MCP clients:** point them at `node dist/index.js` over stdio.

### Browser backend (the `BROWSER_BACKEND` env)

| Value | Behavior |
| --- | --- |
| `claude_in_chrome` *(default)* | ViralMorph does **not** drive a browser itself. Stage/publish tools return a step‑by‑step **plan** + the exact text, and the **host AI executes it with its Claude‑in‑Chrome tools** in your real Chrome — real cursor + screenshots. **Requires the Claude‑in‑Chrome extension** to be connected in your client. |
| `playwright` | ViralMorph drives its **own** persistent Chromium (run `npx playwright install` first). Self-contained; use when Claude‑in‑Chrome isn't available. |

The MCP server also ships `instructions` telling the host to prefer Claude‑in‑Chrome and to stage all platforms in one prompt — so the default behavior "just works" without you having to ask for it each time.

### Generation modes (the `LLM_PROVIDER` env)

| Value | Behavior |
| --- | --- |
| `mock` *(default)* | Deterministic local generator. No network, no keys. The demo fully works. |
| `host` | The connector seeds a draft and hands the **host AI** (Claude) the optimizer skill + brief to rewrite the copy itself, then you save it with `update_platform_post`. Best quality in Claude Desktop. |
| `anthropic` | Server calls the Anthropic Messages API. Requires `ANTHROPIC_API_KEY`. |
| `openai` | Server calls an OpenAI-compatible Chat Completions API. Requires `OPENAI_API_KEY` (and optional `OPENAI_BASE_URL`). |

See [`.env.example`](.env.example) for all variables. If a provider call fails, it automatically falls back to the mock generator so the demo never hard-stops.

---

## 7. How to use it from Claude Desktop

A typical flow, all in natural language (default Claude-in-Chrome backend):

1. **Generate:** "Use ViralMorph to generate Instagram, LinkedIn, and X posts for this launch: …" → returns a `draft_id` and three platform posts with scores.
2. **Refine (optional):** "Regenerate the LinkedIn post — more credible, less hypey, focus on the distribution problem."
3. **Stage all in one prompt:** "Stage all three posts in my browser." → Claude opens your real Chrome and stages X, LinkedIn, and Instagram back-to-back (no confirmation between them), screenshotting each. If you're not logged into a platform, it pauses and asks you to log in manually.
4. **Review:** Look at the screenshots Claude took of each staged post.
5. **Publish (one confirmation):** "I confirm I want to publish all the staged posts." → Claude clicks Post/Share on each.

You can still do one platform at a time ("Stage the X post but don't publish yet" → "I confirm I want to publish the staged X post"). At any point: "What's the browser status?" or "Copy the LinkedIn post to my clipboard."

---

## 8. Example prompts

```text
Use ViralMorph to generate Instagram, LinkedIn, and X posts for this launch:

We built a tool that takes one messy product update and turns it into platform-native posts for different social platforms. It then opens your browser and helps stage the posts. Target audience is startup founders and indie hackers. Desired action is waitlist signups. Tone should be founder-led and slightly contrarian.
```

```text
Regenerate the LinkedIn post. Make it more credible, less hypey, and more focused on the distribution problem.
```

```text
Stage all three posts in my browser (X, LinkedIn, and Instagram). Don't publish yet.
```

```text
Stage the X post in my browser but do not publish it yet.
```

```text
Open Instagram and prepare the caption.
```

```text
I confirm I want to publish all the staged posts.
```

```text
I confirm I want to publish the staged X post.
```

---

## 9. Safety limitations

- **Your account, your responsibility.** ViralMorph drives your real, logged-in browser session.
- **No passwords stored.** You log into each platform **manually**. ViralMorph never asks for or stores credentials, cookies, or tokens. Session data lives only in `browser_profiles/`.
- **Explicit confirmation required to publish.** `publish_staged_post` / `publish_all_staged` refuse unless your confirmation clearly says you want to publish (it must contain both "confirm" and "publish"). Publishing is the **only** confirmation gate — staging multiple posts needs none, but nothing goes live until you approve.
- **Preview step is mandatory.** Staging never clicks Post/Share. You always review (screenshots in Claude-in-Chrome mode) before publishing.
- **No engagement automation, ever.** ViralMorph only creates/stages/publishes *your own* post. It never automates likes, comments, follows, DMs, reposts, scraping, mass mentions, profile visits, or engagement farming.
- **No fabrication.** The generator and skill rules forbid inventing metrics, quotes, testimonials, or claims, and add fact-check/disclosure flags for sensitive topics.

---

## 10. Browser automation limitations

- **Claude-in-Chrome backend (default)** requires the Claude-in-Chrome extension connected in your client. ViralMorph returns the plan + text; the host AI does the actual navigating/typing/clicking, so reliability depends on the host following the plan. If the extension isn't available, switch to `BROWSER_BACKEND=playwright`.
- **Playwright backend** selectors are **best-effort** and ordered with fallbacks; when nothing matches, ViralMorph **stops, copies your text to the clipboard, and returns manual instructions** instead of clicking aggressively or looping. A single Playwright window holds one composer at a time, so true multi-platform staging in one shot is a Claude-in-Chrome feature.
- **Login walls:** if you're not logged in, ViralMorph pauses (Claude-in-Chrome) or waits a bounded time (`LOGIN_WAIT_MS`, default 120s, Playwright) for you to log in manually, then returns `login_required` if you didn't.
- **Instagram is visual-first.** Text-only posts aren't supported by IG. Without `media_paths`, ViralMorph copies your caption and returns manual steps. With an image/video path it *attempts* the create flow, but IG's web uploader is fragile — expect manual fallback sometimes.
- **X threads:** for the MVP, only the **first** post of a thread is staged automatically; the rest is left to you.
- **Post URLs:** publishing confirms the click but usually can't return a permalink (that would require scraping), so `post_url` is typically empty.
- Run **headful** (`BROWSER_HEADLESS=false`) — you need to see the window to log in and review.

---

## 11. What works in the hackathon MVP

- ✅ MCP server boots over stdio and registers **all 10 tools** + ships host `instructions`.
- ✅ `generate_social_posts` returns strong, platform-specific drafts with 0–100 scores, asset briefs, and revision notes (works offline in mock mode).
- ✅ Drafts **save and load** locally (`data/drafts/{draft_id}.json`).
- ✅ `get_draft`, `update_platform_post`, `regenerate_platform_post` edit drafts and re-score.
- ✅ **Claude-in-Chrome backend by default:** `stage_all_posts` returns one plan per platform so the host stages all three in a single prompt with no per-post confirmation; `publish_all_staged` publishes them all after one confirmation.
- ✅ `stage_post_in_browser` / `publish_staged_post` work per-platform, in both backends.
- ✅ **Playwright backend** still self-contained: stages X & LinkedIn, Instagram caption/manual fallback.
- ✅ Both publish paths enforce explicit confirmation + a real staged post before clicking Post/Share.
- ✅ `copy_post_to_clipboard` and `get_browser_status` (now reports `backend` + `staged_platforms`) work.
- ✅ Graceful fallbacks everywhere (missing Chromium, missing composer, not logged in) — the server never crashes.

## 12. What to improve next

- More resilient, regularly-updated selectors (and a self-test that flags drift).
- Reliable **multi-tweet thread** posting on X.
- Robust Instagram media upload (carousels, Reels) and post-publish URL capture.
- Optional MCP **sampling** so the server can ask the host AI to write copy directly (true "Mode 1").
- Image generation / asset rendering from the `asset_brief`.
- Per-platform scheduling and a draft history/library view.
- Package as a Claude Desktop `.mcpb` extension (see [`manifest.example.json`](manifest.example.json)).

---

## Project layout

```text
viralmorph-connector/
  src/
    index.ts                     # MCP server entry (stdio), registers all tools
    tools/                       # one file per MCP tool (+ stage_all / publish_all)
    browser/                     # backend selector, Claude-in-Chrome plan builder,
                                 #   Playwright context + X / LinkedIn / Instagram posters
    llm/                         # mock generator, provider caller, host-instructions
    storage/drafts.ts            # local JSON draft storage
    types/                       # domain types + zod tool schemas
    skills/social_platform_optimizer/SKILL.md   # the optimization rules
  data/drafts/                   # generated drafts (gitignored)
  browser_profiles/              # your persistent browser session (gitignored)
  claude_desktop_config.example.json
  manifest.example.json          # optional future .mcpb packaging
```

## The 10 MCP tools

| Tool | Purpose |
| --- | --- |
| `generate_social_posts` | Generate platform-native posts from one context block; returns a `draft_id`. |
| `get_draft` | Retrieve a saved draft by id. |
| `update_platform_post` | Edit one platform's post (copy/hashtags/caption/thread) and re-score. |
| `regenerate_platform_post` | Regenerate one platform's post from plain-language feedback. |
| `stage_all_posts` | **Stage every platform in one prompt** (no per-post confirmation). Primary staging tool. |
| `stage_post_in_browser` | Stage one platform's post (never publishes). |
| `publish_all_staged` | Publish **all** staged posts after **one** confirmation. |
| `publish_staged_post` | Publish one staged post — only after explicit confirmation. |
| `copy_post_to_clipboard` | Copy a post to the clipboard as a manual fallback. |
| `get_browser_status` | Report browser/login/staging state (+ `backend`, `staged_platforms`). |

---

*MIT licensed. Built as a hackathon prototype — prioritizes a working local demo over production hardening.*
