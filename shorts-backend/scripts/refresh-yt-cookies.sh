#!/usr/bin/env bash
# Refresh YT_COOKIES_BASE64 on Railway from your current Chrome cookies.
#
# When YouTube starts rejecting the Shorts Generator with "Sign in to confirm
# you're not a bot", run this from anywhere in this repo:
#
#     ./shorts-backend/scripts/refresh-yt-cookies.sh
#
# Requirements: yt-dlp (brew install yt-dlp), Railway CLI (brew install railway),
# Chrome logged into YouTube. macOS will prompt for keychain access the first
# time — click "Always Allow".

set -euo pipefail

YTDLP="${YTDLP:-/opt/homebrew/bin/yt-dlp}"
RAILWAY="${RAILWAY:-/opt/homebrew/bin/railway}"

RAW="${TMPDIR:-/tmp}/yt-cookies-raw.$$"
FILTERED="${TMPDIR:-/tmp}/yt-cookies-filtered.$$"
trap 'rm -f "$RAW" "$FILTERED"' EXIT
# yt-dlp refuses to write into an already-existing file that isn't Netscape-
# formatted, so make sure these paths don't exist before it runs.
rm -f "$RAW" "$FILTERED"

echo "→ extracting cookies from Chrome…"
"$YTDLP" --cookies-from-browser chrome \
         --cookies "$RAW" \
         --skip-download \
         "https://www.youtube.com/watch?v=dQw4w9WgXcQ" \
         2>&1 | tail -3

echo "→ filtering to YouTube + Google cookies…"
(head -2 "$RAW"
 grep -E "^\.?(youtube\.com|google\.com)" "$RAW"
) > "$FILTERED"

count=$(grep -cE "^\.?(youtube\.com|google\.com)" "$FILTERED")
size=$(wc -c < "$FILTERED")
echo "   $count cookies, $size bytes"

if [ "$size" -gt 24576 ]; then
  echo "✗ Filtered cookies file is over 24KB — Railway caps env vars at 32KB base64"
  exit 1
fi

echo "→ base64 encoding…"
B64=$(base64 -i "$FILTERED" | tr -d '\n')
echo "   base64 length: ${#B64}"

echo "→ pushing to Railway…"
(cd "$(dirname "$0")/.." && "$RAILWAY" variables --set "YT_COOKIES_BASE64=$B64" >/dev/null)

echo "✓ Done. Railway is redeploying — wait ~30s, then retry the Shorts Generator."
