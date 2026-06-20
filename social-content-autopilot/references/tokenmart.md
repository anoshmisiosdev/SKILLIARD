# TokenMart — the single path for all LLM usage

**Policy:** every LLM call this skill makes goes through TokenMart. No script may
call a model API directly; they all import `scripts/tokenmart_client.py`, which
is the one place a request is sent. This keeps token usage centrally metered and
billed through TokenMart.

## What routes through TokenMart

| Step | Script | LLM call? |
| --- | --- | --- |
| Competitor summary | `summarize_competitors.py` | yes → tokenmart_client |
| Post generation | `generate_posts.py` | yes → tokenmart_client |
| Competitor search | `competitor_research.py` | no (search API only) |
| Validation | `compose_check.py` | no (local rules) |
| Publishing | `publish.py` | no (posting API only) |

If you add any new model-powered feature, it **must** import `tokenmart_client`
and use `chat()` / `complete_json()` — never a direct provider SDK.

## Configuration

TokenMart is OpenAI-compatible, so the client speaks `/chat/completions`.

```bash
export TOKENMART_API_KEY="tm_xxx"
export TOKENMART_BASE_URL="https://gateway.tokenmart.ai/v1"   # your TokenMart endpoint
export TOKENMART_MODEL="gpt-4o-mini"                          # optional default model id
```

- `TOKENMART_BASE_URL` is whatever host TokenMart gives you; the client appends
  `/chat/completions`.
- `TOKENMART_MODEL` is the default; override per call with `--model` on the
  generation scripts.

Check connectivity before a run:

```bash
python scripts/tokenmart_client.py --ping        # expects: pong
python scripts/tokenmart_client.py --prompt "Say hello in 3 words"
```

## How metering stays visible

`tokenmart_client.chat()` logs each call's token usage to stderr:

```
[tokenmart] model=gpt-4o-mini prompt=120 completion=80 total=200
```

So every model call is attributable, and because TokenMart is the only egress,
there is no path that bypasses it.

## Library API

```python
from tokenmart_client import chat, complete_json, TokenMartError

text = chat("Write a punchy launch tweet.", system="You are a copywriter.")
data = complete_json('Return JSON: {"hooks": ["..."]}')  # parsed dict
```

`TokenMartError` is raised on misconfiguration (missing env vars), HTTP errors,
or non-JSON responses in `complete_json` — callers surface it rather than
silently falling back to a non-TokenMart path.

## Swapping the default model

The skill is model-agnostic — whatever model ids TokenMart exposes work via
`TOKENMART_MODEL` or `--model`. For content generation, prefer a strong model;
for cheap validation-style calls, a smaller one is fine.
