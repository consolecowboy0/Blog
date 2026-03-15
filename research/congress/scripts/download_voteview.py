#!/usr/bin/env python3
"""
download_voteview.py - Download VoteView roll-call voting data for bipartisan cooperation analysis.

Data source: https://voteview.com
Documentation: https://voteview.com/data

Files downloaded:
  - HSall_members.csv: All members of Congress, all time
    Columns: congress, chamber, icpsr, state_icpsr, district_fips, state_abbrev,
             party_code, occupancy, last_means, bioname, bioguide_id, born, died,
             nominate_dim1, nominate_dim2, nominate_log_likelihood, nominate_geo_mean_probability,
             nominate_number_of_votes, nominate_number_of_errors, conditional
  - HSall_rollcalls.csv: All roll-call votes metadata
    Columns: congress, chamber, rollnumber, date, session, clerk_rollnumber,
             yea_count, nay_count, nominate_mid_1, nominate_mid_2, nominate_spread_1,
             nominate_spread_2, nominate_log_likelihood, bill_number, vote_result,
             vote_desc, vote_question, dtl_desc
  - Individual votes (HSall_votes.csv or per-congress files)
    Columns: congress, chamber, rollnumber, icpsr, cast_code
    cast_code: 1=Yea, 2=Yea(paired), 3=Yea(announced), 4=Yea(announced),
               5=Yea(announced), 6=Nay, 7=Nay(paired), 8=Nay(announced),
               9=Not voting

Usage:
    python3 download_voteview.py [--congresses 93-118] [--force]
"""

import os
import sys
import argparse
import urllib.request
from pathlib import Path

VOTEVIEW_BASE = "https://voteview.com/static/data/out"
DATA_DIR = Path(__file__).resolve().parent.parent / "data" / "rollcall"


def download_file(url, dest, force=False):
    """Download a file from url to dest. Skip if exists and not force."""
    if dest.exists() and not force:
        size_mb = dest.stat().st_size / 1_048_576
        print(f"  Skipping {dest.name} (already exists, {size_mb:.1f}MB). Use --force to re-download.")
        return True

    print(f"  Downloading {dest.name} from {url}...")
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (VoteView-Download-Script)"})
        with urllib.request.urlopen(req, timeout=300) as response:
            data = response.read()
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(data)
            size_mb = len(data) / 1_048_576
            print(f"  -> Saved {dest.name} ({size_mb:.1f}MB)")
            return True
    except Exception as e:
        print(f"  ERROR downloading {dest.name}: {e}")
        return False


def get_file_size(url):
    """Get file size from Content-Length header."""
    try:
        req = urllib.request.Request(url, method="HEAD",
                                     headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=30) as response:
            return int(response.headers.get("Content-Length", 0))
    except Exception:
        return 0


def download_members(force=False):
    """Download the all-members file."""
    print("\n[1/3] Members data (HSall_members.csv)")
    url = f"{VOTEVIEW_BASE}/members/HSall_members.csv"
    return download_file(url, DATA_DIR / "HSall_members.csv", force)


def download_rollcalls(force=False):
    """Download the all-rollcalls file."""
    print("\n[2/3] Roll calls data (HSall_rollcalls.csv)")
    url = f"{VOTEVIEW_BASE}/rollcalls/HSall_rollcalls.csv"
    return download_file(url, DATA_DIR / "HSall_rollcalls.csv", force)


def download_votes(congresses=None, force=False):
    """Download individual votes. If file is >500MB, download per-congress."""
    print("\n[3/3] Individual votes data")

    if congresses:
        # Download per-congress files
        by_congress_dir = DATA_DIR / "by_congress"
        by_congress_dir.mkdir(parents=True, exist_ok=True)
        success = 0
        total = 0
        for congress in congresses:
            for chamber in ["H", "S"]:
                fname = f"{chamber}{congress:03d}_votes.csv"
                url = f"{VOTEVIEW_BASE}/votes/{fname}"
                total += 1
                if download_file(url, by_congress_dir / fname, force):
                    success += 1
        print(f"\n  Downloaded {success}/{total} per-congress vote files.")
        return success > 0
    else:
        # Try the big file, but check size first
        url = f"{VOTEVIEW_BASE}/votes/HSall_votes.csv"
        size = get_file_size(url)
        size_mb = size / 1_048_576

        if size_mb > 500:
            print(f"  HSall_votes.csv is {size_mb:.0f}MB (>500MB). Downloading per-congress files instead.")
            print("  Re-run with --congresses 93-118 to specify range, or downloading 93-118 by default.")
            return download_votes(congresses=range(93, 119), force=force)
        else:
            print(f"  HSall_votes.csv is {size_mb:.0f}MB. Downloading full file.")
            return download_file(url, DATA_DIR / "HSall_votes.csv", force)


def verify_data():
    """Print summary of downloaded data."""
    print("\n=== Data Verification ===")
    for csv_file in sorted(DATA_DIR.rglob("*.csv")):
        size_mb = csv_file.stat().st_size / 1_048_576
        with open(csv_file) as f:
            header = f.readline().strip()
            line_count = sum(1 for _ in f) + 1
        rel_path = csv_file.relative_to(DATA_DIR)
        print(f"  {rel_path}: {line_count:,} lines, {size_mb:.1f}MB")
        print(f"    Columns: {header}")


def parse_congress_range(s):
    """Parse '93-118' or '93,95,100' into a list of integers."""
    result = []
    for part in s.split(","):
        if "-" in part:
            start, end = part.split("-", 1)
            result.extend(range(int(start), int(end) + 1))
        else:
            result.append(int(part))
    return result


def main():
    parser = argparse.ArgumentParser(description="Download VoteView roll-call voting data")
    parser.add_argument("--congresses", type=str, default=None,
                        help="Congress numbers to download votes for (e.g., '93-118' or '93,95,100')")
    parser.add_argument("--force", action="store_true",
                        help="Re-download files even if they exist")
    parser.add_argument("--votes-only", action="store_true",
                        help="Only download individual vote files")
    args = parser.parse_args()

    congresses = parse_congress_range(args.congresses) if args.congresses else None

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    print(f"=== VoteView Data Download ===")
    print(f"Output directory: {DATA_DIR}")

    if not args.votes_only:
        download_members(args.force)
        download_rollcalls(args.force)

    download_votes(congresses=congresses, force=args.force)
    verify_data()

    print("\nDone!")


if __name__ == "__main__":
    main()
