# Browser control: how this skill publishes

This skill is **capability-agnostic**. It does not depend on a specific tool API.
It produces an ordered list of page actions (the *upload plan*) and the running
model carries them out with whatever browser-control tool it has.

## Supported back-ends

| Back-end | What it is | How the plan maps onto it |
| --- | --- | --- |
| **Claude in Chrome** (primary) | Anthropic's Chrome extension that lets Claude see and act on the current tab. | Each plan step ("find the composer", "type text", "attach file", "click Post") is a page action the extension performs on the live, logged-in tab. |
| **Browser MCP server** | An MCP server exposing `navigate` / `click` / `type` / `upload` tools. | Same steps, executed through the MCP tool calls. |
| **Computer-use** | Screenshot + click/type loop. | The model reads the page from screenshots and performs the same semantic steps. |

Because the steps are described **semantically** (e.g. "the contenteditable that
says 'What is happening?!'") rather than as brittle CSS selectors, they survive
the platforms' frequent DOM changes and work across all three back-ends.

## Why steps are semantic, not selectors

Social composers change their markup constantly and load content dynamically.
Hard-coded selectors rot fast and break silently. Claude in Chrome and
computer-use both *perceive* the page, so the most robust instruction is "find
the element that does X" — exactly what `publish_map.json` encodes.

## Permissions & login

- The skill **never** handles passwords, 2FA, or CAPTCHAs. The user signs in to
  each platform in the Chrome profile *before* running the skill.
- If a step hits a login wall, an account picker, or a bot check, **stop** and
  hand control back to the user, then resume from the same step.
- Claude in Chrome runs against the user's real, authenticated session — treat
  it with the same caution as the user clicking "Post" themselves.

## The mandatory confirmation gate

`prepare_upload.py` injects a **STOP** step right before every submit action. The
model must:

1. show the user the final draft and the exact destination, then
2. get an explicit "yes", and only then
3. click the submit button named in the plan.

This gate is non-negotiable — it is the difference between an assistant and an
unattended bot, and it keeps a human accountable for anything published.

## Failure handling

- Media still uploading → wait for the progress indicator to finish before
  submitting.
- Wrong account/Page/channel → confirm with the user and switch before posting.
- Post appears to fail → report the actual state (draft saved? error toast?),
  never a success you didn't verify.
