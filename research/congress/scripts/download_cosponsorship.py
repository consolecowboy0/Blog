#!/usr/bin/env python3
"""
download_cosponsorship.py - Download cosponsorship data from Congress.gov bulk data.

Uses the @unitedstates/congress project to download bill data including cosponsors.
Repo: https://github.com/unitedstates/congress

Alternative approaches:
  1. congress.gov bulk data (XML) - most complete
  2. ProPublica Congress API - easier but rate-limited
  3. James Fowler's cosponsorship network data - pre-built but older (93rd-110th)

This script provides setup instructions and a download pipeline.

NOTE: Cosponsorship data is our SECONDARY source. Roll-call co-voting from
VoteView is the primary data path for the bipartisan cooperation network.
"""

import os
import subprocess
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data" / "cosponsorship"
CONGRESS_REPO = BASE_DIR / "tools" / "congress"


def setup_congress_tool():
    """Clone and set up the @unitedstates/congress tool."""
    CONGRESS_REPO.parent.mkdir(parents=True, exist_ok=True)

    if not (CONGRESS_REPO / ".git").exists():
        print("Cloning unitedstates/congress repository...")
        subprocess.run(
            ["git", "clone", "https://github.com/unitedstates/congress.git", str(CONGRESS_REPO)],
            check=True
        )
    else:
        print("unitedstates/congress repo already cloned.")

    # Install dependencies
    print("Installing dependencies...")
    subprocess.run(
        [sys.executable, "-m", "pip", "install", "-e", str(CONGRESS_REPO)],
        check=True
    )


def download_bills(congress_num):
    """Download bill data for a specific Congress using usc-run."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    print(f"\nDownloading bills for Congress {congress_num}...")

    # The unitedstates/congress tool outputs to a data/ directory
    env = os.environ.copy()
    subprocess.run(
        ["usc-run", "bills", f"--congress={congress_num}"],
        cwd=str(CONGRESS_REPO),
        env=env,
        check=True
    )


def download_fowler_cosponsorship():
    """
    Download James Fowler's pre-built cosponsorship network data.

    Fowler's data covers 93rd-110th Congress (1973-2008).
    Source: https://fowler.ucsd.edu/cosponsorship.htm

    The data includes:
    - Adjacency matrices for cosponsorship networks
    - Both House and Senate
    """
    import urllib.request

    fowler_dir = DATA_DIR / "fowler"
    fowler_dir.mkdir(parents=True, exist_ok=True)

    # Fowler's cosponsorship data URLs (these may need updating)
    base_url = "https://fowler.ucsd.edu/data"
    files = [
        "house_cosponsorship_93-110.zip",
        "senate_cosponsorship_93-110.zip",
    ]

    for fname in files:
        url = f"{base_url}/{fname}"
        dest = fowler_dir / fname
        if dest.exists():
            print(f"  Skipping {fname} (already exists)")
            continue
        print(f"  Downloading {fname}...")
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=120) as resp:
                dest.write_bytes(resp.read())
                print(f"  -> Saved {fname}")
        except Exception as e:
            print(f"  Could not download {fname}: {e}")
            print(f"  Manual download: {url}")


def main():
    import argparse

    parser = argparse.ArgumentParser(description="Download cosponsorship data")
    parser.add_argument("--method", choices=["congress-tool", "fowler", "both"],
                        default="both", help="Which data source to use")
    parser.add_argument("--congresses", type=str, default="93-118",
                        help="Congress range for congress-tool method")
    args = parser.parse_args()

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    print(f"=== Cosponsorship Data Download ===")
    print(f"Output directory: {DATA_DIR}")

    if args.method in ("fowler", "both"):
        print("\n--- Fowler Cosponsorship Network Data ---")
        download_fowler_cosponsorship()

    if args.method in ("congress-tool", "both"):
        print("\n--- @unitedstates/congress Bill Data ---")
        print("NOTE: This requires cloning a repo and installing dependencies.")
        print("It also takes a long time to download all congresses.")
        response = input("Continue? [y/N] ").strip().lower()
        if response == "y":
            setup_congress_tool()
            # Parse congress range
            parts = args.congresses.split("-")
            if len(parts) == 2:
                for c in range(int(parts[0]), int(parts[1]) + 1):
                    download_bills(c)
            else:
                download_bills(int(args.congresses))

    print("\nDone!")
    print("\nNOTE: For the bipartisan cooperation network, roll-call co-voting data")
    print("from VoteView (download_voteview.py) is the primary and recommended source.")
    print("Cosponsorship data is supplementary.")


if __name__ == "__main__":
    main()
