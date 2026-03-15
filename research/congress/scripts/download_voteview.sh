#!/usr/bin/env bash
# download_voteview.sh - Download VoteView roll-call voting data
#
# Primary data source for bipartisan cooperation network analysis.
# VoteView (https://voteview.com) provides roll-call vote data for all
# Congresses from the 1st through the present.
#
# Data documentation: https://voteview.com/data
#
# Usage: bash download_voteview.sh
# Run from: /home/user/Blog/research/congress/

set -euo pipefail

DATA_DIR="$(cd "$(dirname "$0")/.." && pwd)/data/rollcall"
mkdir -p "$DATA_DIR"

VOTEVIEW_BASE="https://voteview.com/static/data/out"

echo "=== VoteView Data Download ==="
echo "Output directory: $DATA_DIR"
echo ""

# -------------------------------------------------------
# 1. Members file (all Congresses, ~50MB)
# -------------------------------------------------------
echo "[1/3] Downloading HSall_members.csv (all members, all Congresses)..."
curl -L -o "$DATA_DIR/HSall_members.csv" \
    "$VOTEVIEW_BASE/members/HSall_members.csv" \
    --progress-bar
echo "  -> $(wc -l < "$DATA_DIR/HSall_members.csv") lines, $(du -h "$DATA_DIR/HSall_members.csv" | cut -f1)"

# -------------------------------------------------------
# 2. Rollcalls file (all Congresses, ~30MB)
# -------------------------------------------------------
echo "[2/3] Downloading HSall_rollcalls.csv (all roll calls, all Congresses)..."
curl -L -o "$DATA_DIR/HSall_rollcalls.csv" \
    "$VOTEVIEW_BASE/rollcalls/HSall_rollcalls.csv" \
    --progress-bar
echo "  -> $(wc -l < "$DATA_DIR/HSall_rollcalls.csv") lines, $(du -h "$DATA_DIR/HSall_rollcalls.csv" | cut -f1)"

# -------------------------------------------------------
# 3. Individual votes - check size first, download per-congress if huge
# -------------------------------------------------------
echo "[3/3] Checking HSall_votes.csv size..."
VOTES_SIZE=$(curl -sIL "$VOTEVIEW_BASE/votes/HSall_votes.csv" | grep -i content-length | tail -1 | awk '{print $2}' | tr -d '\r')
VOTES_SIZE_MB=$((${VOTES_SIZE:-0} / 1048576))
echo "  HSall_votes.csv is approximately ${VOTES_SIZE_MB}MB"

if [ "${VOTES_SIZE_MB}" -gt 500 ]; then
    echo "  File is >500MB. Downloading per-Congress files for Congresses 93-118..."
    mkdir -p "$DATA_DIR/by_congress"

    for CONGRESS in $(seq 93 118); do
        CNUM=$(printf "%03d" $CONGRESS)
        for CHAMBER in H S; do
            FNAME="${CHAMBER}${CNUM}_votes.csv"
            echo "    Downloading $FNAME..."
            curl -L -o "$DATA_DIR/by_congress/$FNAME" \
                "$VOTEVIEW_BASE/votes/$FNAME" \
                --progress-bar --fail 2>/dev/null || echo "    (not available: $FNAME)"
        done
    done

    echo "  Per-congress downloads complete."
    echo "  Files downloaded: $(ls -1 "$DATA_DIR/by_congress/"*.csv 2>/dev/null | wc -l)"
else
    echo "  File is manageable. Downloading full HSall_votes.csv..."
    curl -L -o "$DATA_DIR/HSall_votes.csv" \
        "$VOTEVIEW_BASE/votes/HSall_votes.csv" \
        --progress-bar
    echo "  -> $(wc -l < "$DATA_DIR/HSall_votes.csv") lines, $(du -h "$DATA_DIR/HSall_votes.csv" | cut -f1)"
fi

echo ""
echo "=== Download Summary ==="
echo "Files in $DATA_DIR:"
ls -lh "$DATA_DIR"/*.csv 2>/dev/null || true
ls -lh "$DATA_DIR/by_congress/"*.csv 2>/dev/null | head -5 || true
echo ""
echo "=== Column descriptions ==="
echo "HSall_members.csv columns:"
head -1 "$DATA_DIR/HSall_members.csv"
echo ""
echo "HSall_rollcalls.csv columns:"
head -1 "$DATA_DIR/HSall_rollcalls.csv"
echo ""
echo "Done! Data ready for analysis."
