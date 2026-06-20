#!/usr/bin/env bash
# Package the whole thing as ONE installable Claude Code plugin .zip.
# The archive has .claude-plugin/plugin.json at its ROOT plus the skills/ tree.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

MANIFEST=".claude-plugin/plugin.json"
DIST_DIR="dist"

# --- Validate manifest + skills ---------------------------------------------
[[ -f "$MANIFEST" ]] || { echo "error: $MANIFEST missing" >&2; exit 1; }
python3 -c "import json,sys; d=json.load(open('$MANIFEST')); sys.exit(0 if d.get('name') else 1)" \
  || { echo "error: $MANIFEST must be valid JSON with a 'name'" >&2; exit 1; }
PLUGIN_NAME="$(python3 -c "import json; print(json.load(open('$MANIFEST'))['name'])")"

shopt -s nullglob
for skill_md in skills/*/SKILL.md; do
  head -1 "$skill_md" | grep -q '^---$' || { echo "error: $skill_md missing frontmatter" >&2; exit 1; }
  grep -q '^name:' "$skill_md"        || { echo "error: $skill_md missing 'name:'" >&2; exit 1; }
  grep -q '^description:' "$skill_md"  || { echo "error: $skill_md missing 'description:'" >&2; exit 1; }
done

# --- Stage a clean copy and zip from its root -------------------------------
mkdir -p "$DIST_DIR"
ZIP_PATH="$ROOT/$DIST_DIR/${PLUGIN_NAME}.zip"
rm -f "$ZIP_PATH"

STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT
cp -R .claude-plugin "$STAGE"/
cp -R skills "$STAGE"/
[[ -f README.md ]] && cp README.md "$STAGE"/
find "$STAGE" \( -name '.env' -o -name '.env.local' -o -name '.DS_Store' -o -name '*.pyc' \) -delete
find "$STAGE" -name '__pycache__' -type d -prune -exec rm -rf {} +

zip_args=(.claude-plugin skills)
[[ -f "$STAGE/README.md" ]] && zip_args+=(README.md)
( cd "$STAGE" && zip -r -X "$ZIP_PATH" "${zip_args[@]}" >/dev/null )

# --- Safety checks (capture listing once; piping into grep -q races on SIGPIPE)
listing="$(unzip -l "$ZIP_PATH")"
grep -q '\.claude-plugin/plugin.json' <<<"$listing" \
  || { echo "error: zip missing .claude-plugin/plugin.json at root" >&2; rm -f "$ZIP_PATH"; exit 1; }
if grep -qE '/\.env($|[^.])|(^| )\.env$' <<<"$listing"; then
  echo "error: a real .env leaked into the zip — aborting" >&2; rm -f "$ZIP_PATH"; exit 1
fi

echo "✓ Built $ZIP_PATH"
echo "$listing"
