#!/usr/bin/env bash
# Validate and package the skill into a distributable .zip.
set -euo pipefail

SKILL_DIR="${1:-social-content-autopilot}"
DIST_DIR="dist"

if [[ ! -d "$SKILL_DIR" ]]; then
  echo "error: skill directory '$SKILL_DIR' not found" >&2
  exit 1
fi

SKILL_MD="$SKILL_DIR/SKILL.md"
if [[ ! -f "$SKILL_MD" ]]; then
  echo "error: $SKILL_MD is missing (every skill needs a SKILL.md)" >&2
  exit 1
fi

# --- Validate frontmatter ---------------------------------------------------
header="$(awk 'NR==1{if($0!="---"){print "NOFM"; exit}} NR>1{if($0=="---") exit; print}' "$SKILL_MD")"
if [[ "$header" == "NOFM" ]]; then
  echo "error: $SKILL_MD must start with a '---' YAML frontmatter block" >&2
  exit 1
fi
if ! grep -q '^name:' "$SKILL_MD"; then
  echo "error: frontmatter is missing required 'name:' field" >&2
  exit 1
fi
if ! grep -q '^description:' "$SKILL_MD"; then
  echo "error: frontmatter is missing required 'description:' field" >&2
  exit 1
fi
if grep -qi 'REPLACE ME' "$SKILL_MD"; then
  echo "warning: SKILL.md still contains placeholder text ('REPLACE ME')" >&2
fi

# --- Package ----------------------------------------------------------------
mkdir -p "$DIST_DIR"
ZIP_PATH="$DIST_DIR/$(basename "$SKILL_DIR").zip"
rm -f "$ZIP_PATH"

# Exclude junk; zip the folder so it unpacks as my-skill/SKILL.md
zip -r -X "$ZIP_PATH" "$SKILL_DIR" \
  -x '*/.DS_Store' '*/__pycache__/*' '*.pyc' >/dev/null

echo "✓ Built $ZIP_PATH"
unzip -l "$ZIP_PATH"
