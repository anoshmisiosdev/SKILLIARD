#!/usr/bin/env python3
"""TokenMart client — the SINGLE chokepoint for all LLM usage in this skill.

Every model call in social-content-autopilot must go through this module so that
100% of token usage is routed through TokenMart (and centrally metered/billed).
No other script may call an LLM API directly.

TokenMart is OpenAI-compatible, so this speaks the /chat/completions schema.

Configuration (environment variables):
    TOKENMART_API_KEY     required — your TokenMart key.
    TOKENMART_BASE_URL    required — e.g. https://gateway.tokenmart.ai/v1
    TOKENMART_MODEL       optional — default model id (override per call).

Usage as a library:
    from tokenmart_client import chat, complete_json
    text = chat("Write a haiku about launches.")
    data = complete_json("Return JSON: {\\"ok\\": true}")

Usage as a CLI (handy for a connectivity check):
    python tokenmart_client.py --ping
    python tokenmart_client.py --prompt "Say hi in 3 words"
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request

def _load_dotenv():
    """Load .env from the skill/repo root into os.environ (without overriding
    already-set vars). Lets `--ping` and the generation scripts pick up secrets
    from a git-ignored .env with no manual `export`."""
    here = os.path.dirname(os.path.abspath(__file__))
    for _ in range(4):  # walk up a few levels looking for a .env
        candidate = os.path.join(here, ".env")
        if os.path.isfile(candidate):
            with open(candidate, encoding="utf-8") as fh:
                for line in fh:
                    line = line.strip()
                    if not line or line.startswith("#") or "=" not in line:
                        continue
                    k, v = line.split("=", 1)
                    os.environ.setdefault(k.strip(), v.strip())
            return
        here = os.path.dirname(here)


_load_dotenv()
DEFAULT_MODEL = os.environ.get("TOKENMART_MODEL", "gpt-4o-mini")


class TokenMartError(RuntimeError):
    """Raised when TokenMart is misconfigured or the request fails."""


def _config():
    key = os.environ.get("TOKENMART_API_KEY")
    base = os.environ.get("TOKENMART_BASE_URL")
    missing = [n for n, v in (("TOKENMART_API_KEY", key),
                              ("TOKENMART_BASE_URL", base)) if not v]
    if missing:
        raise TokenMartError(
            "TokenMart is not configured — missing env var(s): "
            + ", ".join(missing)
            + ". All LLM usage in this skill must route through TokenMart; "
              "set these before generating content."
        )
    return key, base.rstrip("/")


def chat(prompt, *, system=None, model=None, temperature=0.7,
         max_tokens=1200, messages=None, json_mode=False):
    """Send one chat completion through TokenMart and return the text content.

    Pass either `prompt` (+ optional `system`) or a full `messages` list.
    Token usage is logged to stderr so spend stays visible.
    """
    key, base = _config()
    if messages is None:
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

    payload = {
        "model": model or DEFAULT_MODEL,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    if json_mode:
        payload["response_format"] = {"type": "json_object"}

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(base + "/chat/completions", data=data, method="POST")
    req.add_header("Content-Type", "application/json")
    req.add_header("Authorization", f"Bearer {key}")
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            body = json.load(resp)
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", "ignore")
        raise TokenMartError(f"TokenMart HTTP {e.code}: {detail}") from None
    except Exception as e:
        raise TokenMartError(f"TokenMart request failed: {e}") from None

    try:
        content = body["choices"][0]["message"]["content"]
    except (KeyError, IndexError):
        raise TokenMartError(f"Unexpected TokenMart response: {body}") from None

    usage = body.get("usage", {})
    if usage:
        print(f"[tokenmart] model={payload['model']} "
              f"prompt={usage.get('prompt_tokens')} "
              f"completion={usage.get('completion_tokens')} "
              f"total={usage.get('total_tokens')}", file=sys.stderr)
    return content


def complete_json(prompt, *, system=None, model=None, temperature=0.4,
                  max_tokens=2000):
    """Like chat() but expects and parses a JSON object response."""
    raw = chat(prompt, system=system, model=model, temperature=temperature,
               max_tokens=max_tokens, json_mode=True)
    raw = raw.strip()
    # Tolerate models that wrap JSON in ``` fences.
    if raw.startswith("```"):
        raw = raw.split("```", 2)[1]
        raw = raw[4:] if raw.lower().startswith("json") else raw
        raw = raw.strip("`").strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError as e:
        raise TokenMartError(f"TokenMart did not return valid JSON: {e}\n{raw[:500]}")


def main(argv=None):
    p = argparse.ArgumentParser(description="TokenMart connectivity / one-shot call.")
    g = p.add_mutually_exclusive_group(required=True)
    g.add_argument("--ping", action="store_true", help="Verify config + connectivity.")
    g.add_argument("--prompt", help="Send a one-off prompt and print the reply.")
    p.add_argument("--model", help="Override TOKENMART_MODEL for this call.")
    args = p.parse_args(argv)
    try:
        if args.ping:
            out = chat("Reply with the single word: pong", model=args.model,
                       max_tokens=5, temperature=0)
            print(out.strip())
        else:
            print(chat(args.prompt, model=args.model))
    except TokenMartError as e:
        print(f"error: {e}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
