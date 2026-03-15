"""
Generate publication-quality visualizations for the Congressional polarization article.

Charts:
1. Main time-series: Bridge Index by Congress with phase transition marked
2. Network snapshots: Cosponsorship graphs for key Congresses
3. Bridge vs Bunker member distribution
4. Validation overlay: multiple metrics on same time axis
5. DW-NOMINATE party divergence
6. Edge count waterfall
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.gridspec import GridSpec
import networkx as nx
import os
import json

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHART_DIR = os.path.join(BASE_DIR, 'output', 'charts')
os.makedirs(CHART_DIR, exist_ok=True)

# Style settings
plt.rcParams.update({
    'font.family': 'sans-serif',
    'font.sans-serif': ['DejaVu Sans', 'Arial', 'Helvetica'],
    'font.size': 11,
    'axes.titlesize': 14,
    'axes.labelsize': 12,
    'figure.facecolor': '#fafafa',
    'axes.facecolor': '#fafafa',
    'axes.edgecolor': '#cccccc',
    'axes.grid': True,
    'grid.alpha': 0.3,
    'grid.color': '#cccccc',
})

BLUE = '#2563eb'
RED = '#dc2626'
PURPLE = '#7c3aed'
GRAY = '#6b7280'
ORANGE = '#ea580c'
GREEN = '#16a34a'
DARK = '#1f2937'


def plot_bridge_index_timeline(metrics_df):
    """Chart 1: The main Bridge Index time series with phase transition marked."""
    fig, ax = plt.subplots(figsize=(14, 7))

    congresses = metrics_df['congress'].values
    years = metrics_df['year'].values
    bridge_idx = metrics_df['bridge_index'].values

    # Plot the line
    ax.plot(congresses, bridge_idx, color=BLUE, linewidth=2.5, zorder=5)
    ax.fill_between(congresses, bridge_idx, alpha=0.1, color=BLUE)

    # Mark the phase transition (Congress 102)
    transition_idx = np.where(congresses == 102)[0][0]
    ax.axvline(x=102, color=RED, linestyle='--', linewidth=1.5, alpha=0.7, zorder=3)
    ax.annotate(
        '102nd Congress\n(1991-92)',
        xy=(102, bridge_idx[transition_idx]),
        xytext=(106, bridge_idx[transition_idx] + 20),
        fontsize=11, fontweight='bold', color=RED,
        arrowprops=dict(arrowstyle='->', color=RED, lw=1.5),
        ha='left'
    )

    # Secondary break (Congress 107)
    ax.axvline(x=107, color=ORANGE, linestyle=':', linewidth=1.2, alpha=0.5, zorder=3)

    # Add era labels
    ax.text(96, 235, 'Fluid Era', fontsize=12, color=BLUE, alpha=0.6, fontweight='bold', ha='center')
    ax.text(113, 135, 'Frozen Era', fontsize=12, color=RED, alpha=0.6, fontweight='bold', ha='center')

    # Custom x-axis with both Congress number and year
    tick_congresses = [93, 97, 101, 105, 109, 113, 117]
    tick_labels = [f"{c}\n({y})" for c, y in zip(tick_congresses,
                  [1973, 1981, 1989, 1997, 2005, 2013, 2021])]
    ax.set_xticks(tick_congresses)
    ax.set_xticklabels(tick_labels)

    ax.set_xlabel('Congress (Year)', fontsize=12)
    ax.set_ylabel('Bridge Index', fontsize=13, fontweight='bold')
    ax.set_title('The Bridge Index: When Congress Froze', fontsize=16, fontweight='bold', pad=15)

    ax.set_ylim(100, 250)
    ax.set_xlim(92, 119)

    fig.tight_layout()
    filepath = os.path.join(CHART_DIR, 'bridge_index_timeline.png')
    fig.savefig(filepath, dpi=150, bbox_inches='tight')
    plt.close()
    print(f"  Saved: {filepath}")


def plot_network_snapshots(members_df, edges_df):
    """Chart 2: Network visualizations for key Congresses."""
    key_congresses = [
        (93, '93rd Congress (1973)\n"The Liquid Era"'),
        (102, '102nd Congress (1991)\n"The Inflection"'),
        (108, '108th Congress (2003)\n"Freezing"'),
        (118, '118th Congress (2023)\n"Solid Ice"'),
    ]

    fig, axes = plt.subplots(1, 4, figsize=(20, 5))

    for idx, (congress, title) in enumerate(key_congresses):
        ax = axes[idx]

        cong_members = members_df[
            (members_df['congress'] == congress) &
            (members_df['chamber'] == 'House')
        ]
        cong_edges = edges_df[edges_df['congress'] == congress]

        # Build graph
        G = nx.Graph()
        for _, m in cong_members.iterrows():
            G.add_node(m['member_id'], party=m['party_name'])

        for _, e in cong_edges.iterrows():
            G.add_edge(e['member_a'], e['member_b'])

        # Position nodes: Democrats on left, Republicans on right
        pos = {}
        dems = [n for n, d in G.nodes(data=True) if d.get('party') == 'Democrat']
        reps = [n for n, d in G.nodes(data=True) if d.get('party') == 'Republican']

        # Arrange in circles on each side
        for i, node in enumerate(dems):
            angle = np.pi/2 + np.pi * i / max(len(dems)-1, 1)
            pos[node] = (-0.6 + 0.4 * np.cos(angle), 0.4 * np.sin(angle))

        for i, node in enumerate(reps):
            angle = -np.pi/2 + np.pi * i / max(len(reps)-1, 1)
            pos[node] = (0.6 + 0.4 * np.cos(angle), 0.4 * np.sin(angle))

        # Draw edges (sample if too many)
        edge_list = list(G.edges())
        if len(edge_list) > 500:
            np.random.seed(42)
            edge_list = [edge_list[i] for i in np.random.choice(len(edge_list), 500, replace=False)]

        nx.draw_networkx_edges(G, pos, edgelist=edge_list, alpha=0.03,
                              edge_color=PURPLE, ax=ax, width=0.5)

        # Draw nodes
        nx.draw_networkx_nodes(G, pos, nodelist=dems, node_color=BLUE,
                              node_size=8, alpha=0.6, ax=ax)
        nx.draw_networkx_nodes(G, pos, nodelist=reps, node_color=RED,
                              node_size=8, alpha=0.6, ax=ax)

        ax.set_title(title, fontsize=10, fontweight='bold', pad=10)
        ax.set_xlim(-1.2, 1.2)
        ax.set_ylim(-0.6, 0.6)
        ax.axis('off')

        # Edge count annotation
        n_edges = len(cong_edges)
        ax.text(0, -0.55, f'{n_edges:,} cross-party ties', ha='center',
               fontsize=9, color=GRAY, style='italic')

    fig.suptitle('The Network Fractures: Cross-Party Cosponsorship Over Time',
                fontsize=14, fontweight='bold', y=1.02)
    fig.tight_layout()
    filepath = os.path.join(CHART_DIR, 'network_snapshots.png')
    fig.savefig(filepath, dpi=150, bbox_inches='tight')
    plt.close()
    print(f"  Saved: {filepath}")


def plot_bridge_vs_bunker(members_df, edges_df):
    """Chart 3: Distribution of cross-party cooperation - bridge vs bunker members."""
    fig, axes = plt.subplots(1, 2, figsize=(14, 6))

    for idx, (congress, label) in enumerate([(93, '93rd Congress (1973)'), (118, '118th Congress (2023)')]):
        ax = axes[idx]

        cong_members = members_df[
            (members_df['congress'] == congress) &
            (members_df['chamber'] == 'House')
        ]
        cong_edges = edges_df[edges_df['congress'] == congress]

        # Count cross-party edges per member
        edge_counts = {}
        for _, m in cong_members.iterrows():
            edge_counts[m['member_id']] = {'party': m['party_name'], 'count': 0}

        for _, e in cong_edges.iterrows():
            if e['member_a'] in edge_counts:
                edge_counts[e['member_a']]['count'] += 1
            if e['member_b'] in edge_counts:
                edge_counts[e['member_b']]['count'] += 1

        # Separate by party
        dem_counts = [v['count'] for v in edge_counts.values() if v['party'] == 'Democrat']
        rep_counts = [v['count'] for v in edge_counts.values() if v['party'] == 'Republican']

        bins = np.arange(0, max(max(dem_counts, default=0), max(rep_counts, default=0)) + 5, 3)

        ax.hist(dem_counts, bins=bins, alpha=0.6, color=BLUE, label='Democrats', edgecolor='white')
        ax.hist(rep_counts, bins=bins, alpha=0.6, color=RED, label='Republicans', edgecolor='white')

        # Mark bridge threshold (top decile)
        all_counts = dem_counts + rep_counts
        threshold = np.percentile([c for c in all_counts if c > 0], 90)
        ax.axvline(x=threshold, color=PURPLE, linestyle='--', linewidth=1.5, alpha=0.7)
        ax.text(threshold + 1, ax.get_ylim()[1] * 0.9, 'Bridge\nThreshold',
               fontsize=9, color=PURPLE, fontweight='bold')

        n_bridges = sum(1 for c in all_counts if c >= threshold and c > 0)
        n_bunkers = sum(1 for c in all_counts if c == 0)

        ax.set_title(f'{label}\n{n_bridges} Bridges, {n_bunkers} Bunkers', fontsize=12, fontweight='bold')
        ax.set_xlabel('Cross-Party Cosponsorships', fontsize=11)
        ax.set_ylabel('Number of Members', fontsize=11)
        ax.legend(fontsize=10)

    fig.suptitle('Two Kinds of Legislator: Bridges and Bunkers',
                fontsize=14, fontweight='bold', y=1.02)
    fig.tight_layout()
    filepath = os.path.join(CHART_DIR, 'bridge_vs_bunker.png')
    fig.savefig(filepath, dpi=150, bbox_inches='tight')
    plt.close()
    print(f"  Saved: {filepath}")


def plot_validation_overlay(metrics_df, overlap_df, votes_df):
    """Chart 4: Multiple metrics on the same time axis."""
    fig, ax1 = plt.subplots(figsize=(14, 7))

    congresses = metrics_df['congress'].values

    # Normalize all metrics to 0-100 scale for comparison
    def normalize(x):
        return 100 * (x - x.min()) / (x.max() - x.min()) if x.max() != x.min() else x * 0 + 50

    bridge_norm = normalize(metrics_df['bridge_index'].values)
    overlap_norm = normalize(overlap_df['overlap_fraction'].values)
    # Invert party-line voting (higher = more partisan = lower cooperation)
    vote_norm = normalize(1 - votes_df['party_line_vote_pct'].values)
    density_norm = normalize(metrics_df['edge_density'].values)

    ax1.plot(congresses, bridge_norm, color=BLUE, linewidth=2.5, label='Bridge Index', zorder=5)
    ax1.plot(congresses, overlap_norm, color=GREEN, linewidth=2, label='Ideology Overlap', linestyle='--', zorder=4)
    ax1.plot(congresses, vote_norm, color=ORANGE, linewidth=2, label='Bipartisan Voting', linestyle='-.', zorder=4)
    ax1.plot(congresses, density_norm, color=PURPLE, linewidth=1.5, label='Edge Density', linestyle=':', zorder=3)

    # Phase transition line
    ax1.axvline(x=102, color=RED, linestyle='--', linewidth=1.5, alpha=0.7)
    ax1.text(102.5, 95, 'Phase\nTransition', fontsize=10, color=RED, fontweight='bold')

    # Era shading
    ax1.axvspan(93, 102, alpha=0.05, color=BLUE)
    ax1.axvspan(102, 118, alpha=0.05, color=RED)

    tick_congresses = [93, 97, 101, 105, 109, 113, 117]
    tick_labels = [f"{c}\n({y})" for c, y in zip(tick_congresses,
                  [1973, 1981, 1989, 1997, 2005, 2013, 2021])]
    ax1.set_xticks(tick_congresses)
    ax1.set_xticklabels(tick_labels)

    ax1.set_xlabel('Congress (Year)', fontsize=12)
    ax1.set_ylabel('Normalized Score (0-100)', fontsize=12)
    ax1.set_title('Four Metrics, One Story: Everything Breaks Together',
                 fontsize=15, fontweight='bold', pad=15)
    ax1.legend(loc='upper right', fontsize=11, framealpha=0.9)
    ax1.set_ylim(-5, 105)
    ax1.set_xlim(92, 119)

    fig.tight_layout()
    filepath = os.path.join(CHART_DIR, 'validation_overlay.png')
    fig.savefig(filepath, dpi=150, bbox_inches='tight')
    plt.close()
    print(f"  Saved: {filepath}")


def plot_party_divergence(overlap_df):
    """Chart 5: DW-NOMINATE party means diverging over time."""
    fig, ax = plt.subplots(figsize=(14, 7))

    congresses = overlap_df['congress'].values

    ax.plot(congresses, overlap_df['dem_mean'].values, color=BLUE, linewidth=2.5, label='Democrats (mean)')
    ax.plot(congresses, overlap_df['rep_mean'].values, color=RED, linewidth=2.5, label='Republicans (mean)')

    # Fill between
    ax.fill_between(congresses, overlap_df['dem_mean'].values, overlap_df['rep_mean'].values,
                    alpha=0.1, color=PURPLE)

    # Annotate the gap
    for congress in [93, 104, 118]:
        idx = np.where(congresses == congress)[0][0]
        gap = overlap_df['party_distance'].values[idx]
        y_mid = (overlap_df['dem_mean'].values[idx] + overlap_df['rep_mean'].values[idx]) / 2
        ax.annotate(f'Gap: {gap:.2f}', xy=(congress, y_mid),
                   fontsize=10, ha='center', fontweight='bold', color=PURPLE,
                   bbox=dict(boxstyle='round,pad=0.3', facecolor='white', edgecolor=PURPLE, alpha=0.8))

    ax.axvline(x=102, color=GRAY, linestyle='--', linewidth=1, alpha=0.5)
    ax.axhline(y=0, color=GRAY, linewidth=0.5, alpha=0.5)

    tick_congresses = [93, 97, 101, 105, 109, 113, 117]
    tick_labels = [f"{c}\n({y})" for c, y in zip(tick_congresses,
                  [1973, 1981, 1989, 1997, 2005, 2013, 2021])]
    ax.set_xticks(tick_congresses)
    ax.set_xticklabels(tick_labels)

    ax.set_xlabel('Congress (Year)', fontsize=12)
    ax.set_ylabel('DW-NOMINATE Score (Dimension 1)', fontsize=12)
    ax.set_title('The Great Divergence: Party Ideologies Pull Apart',
                fontsize=15, fontweight='bold', pad=15)
    ax.legend(loc='center left', fontsize=11, framealpha=0.9)

    fig.tight_layout()
    filepath = os.path.join(CHART_DIR, 'party_divergence.png')
    fig.savefig(filepath, dpi=150, bbox_inches='tight')
    plt.close()
    print(f"  Saved: {filepath}")


def plot_edge_decline(metrics_df):
    """Chart 6: Cross-party edge count decline - simple and dramatic."""
    fig, ax = plt.subplots(figsize=(14, 6))

    congresses = metrics_df['congress'].values
    edges = metrics_df['n_edges'].values

    # Color bars by era
    colors = [BLUE if c <= 102 else (ORANGE if c <= 107 else RED) for c in congresses]

    bars = ax.bar(congresses, edges, color=colors, alpha=0.8, width=0.8, edgecolor='white', linewidth=0.5)

    # Annotations
    ax.annotate(f'{edges[0]:,}', xy=(congresses[0], edges[0]), xytext=(0, 10),
               textcoords='offset points', ha='center', fontsize=10, fontweight='bold', color=BLUE)
    ax.annotate(f'{edges[-1]:,}', xy=(congresses[-1], edges[-1]), xytext=(0, 10),
               textcoords='offset points', ha='center', fontsize=10, fontweight='bold', color=RED)

    # Percentage decline
    pct_decline = (1 - edges[-1] / edges[0]) * 100
    ax.text(106, max(edges) * 0.85, f'{pct_decline:.0f}% decline\nin cross-party ties',
           fontsize=13, fontweight='bold', color=DARK, ha='center',
           bbox=dict(boxstyle='round,pad=0.5', facecolor='white', edgecolor=GRAY, alpha=0.9))

    ax.axvline(x=102, color=DARK, linestyle='--', linewidth=1, alpha=0.3)

    tick_congresses = [93, 97, 101, 105, 109, 113, 117]
    tick_labels = [f"{c}\n({y})" for c, y in zip(tick_congresses,
                  [1973, 1981, 1989, 1997, 2005, 2013, 2021])]
    ax.set_xticks(tick_congresses)
    ax.set_xticklabels(tick_labels)

    ax.set_xlabel('Congress (Year)', fontsize=12)
    ax.set_ylabel('Cross-Party Cosponsorships', fontsize=12)
    ax.set_title('Counting the Bridges That Burned', fontsize=15, fontweight='bold', pad=15)

    # Legend
    legend_elements = [
        mpatches.Patch(color=BLUE, alpha=0.8, label='Pre-transition'),
        mpatches.Patch(color=ORANGE, alpha=0.8, label='Transition zone'),
        mpatches.Patch(color=RED, alpha=0.8, label='Post-transition'),
    ]
    ax.legend(handles=legend_elements, loc='upper right', fontsize=10)

    fig.tight_layout()
    filepath = os.path.join(CHART_DIR, 'edge_decline.png')
    fig.savefig(filepath, dpi=150, bbox_inches='tight')
    plt.close()
    print(f"  Saved: {filepath}")


def write_chart_descriptions():
    """Write chart descriptions with suggested captions."""
    descriptions = {
        'bridge_index_timeline.png': {
            'title': 'The Bridge Index: When Congress Froze',
            'caption': 'The Bridge Index tracks how many members cross the aisle and how evenly those crossings are distributed. The red dashed line marks the 102nd Congress (1991-92) - the inflection point our change-point detection identified. After that- it\'s all downhill. Claude made this chart title, I\'m taking credit.',
            'description': 'Time series of the Bridge Index from the 93rd through 118th Congress, showing a clear decline with a structural break around the 102nd Congress.',
        },
        'network_snapshots.png': {
            'title': 'The Network Fractures',
            'caption': 'Four snapshots of the cross-party cosponsorship network. Blue dots are Democrats, red dots are Republicans, purple lines are cross-party ties. In 1973 the graph is dense with connections. By 2023 it looks like two separate countries sharing a building. Which- I mean- it kind of is.',
            'description': 'Network visualization showing the bipartisan cosponsorship graph for the 93rd, 102nd, 108th, and 118th Congresses.',
        },
        'bridge_vs_bunker.png': {
            'title': 'Two Kinds of Legislator: Bridges and Bunkers',
            'caption': 'Distribution of cross-party cosponsorships per member. In 1973 the distribution was wide - many members had lots of cross-party ties. By 2023 most members cluster near zero. The bridge members didn\'t just get rarer - they got lonelier.',
            'description': 'Histogram comparing distribution of cross-party cosponsorship counts in 1973 vs 2023.',
        },
        'validation_overlay.png': {
            'title': 'Four Metrics, One Story',
            'caption': 'Four independent measures of bipartisan cooperation - Bridge Index, ideology overlap, bipartisan voting, and edge density - all normalized to the same scale. They all tell the same story and they all break at the same point. That\'s not a coincidence. That\'s a phase transition.',
            'description': 'Overlay of normalized Bridge Index, DW-NOMINATE overlap, bipartisan voting rate, and edge density over time.',
        },
        'party_divergence.png': {
            'title': 'The Great Divergence',
            'caption': 'Average DW-NOMINATE ideology scores for each party over time. The purple shaded area between them is the ideological gap. It used to be a creek you could wade across. Now it\'s the Grand Canyon.',
            'description': 'DW-NOMINATE dimension 1 means for Democrats and Republicans showing increasing party distance.',
        },
        'edge_decline.png': {
            'title': 'Counting the Bridges That Burned',
            'caption': 'Raw count of cross-party cosponsorship ties per Congress. From 4,513 in the 93rd Congress to 1,384 in the 118th. That\'s a 69% decline in the connections that make bipartisan legislation possible. Each bar is a Congress. Each missing connection is a bill that couldn\'t happen.',
            'description': 'Bar chart showing the decline in cross-party cosponsorship edges from 1973 to 2023.',
        },
    }

    with open(os.path.join(BASE_DIR, 'output', 'chart_descriptions.md'), 'w') as f:
        f.write("# Chart Descriptions and Suggested Captions\n\n")
        for filename, info in descriptions.items():
            f.write(f"## {info['title']}\n")
            f.write(f"**File**: `charts/{filename}`\n\n")
            f.write(f"**Description**: {info['description']}\n\n")
            f.write(f"**Suggested Caption**: {info['caption']}\n\n")
            f.write("---\n\n")

    print(f"  Saved chart descriptions")


def main():
    print("Loading data...")
    metrics_df = pd.read_csv(os.path.join(BASE_DIR, 'analysis', 'connectivity_metrics.csv'))
    members_df = pd.read_csv(os.path.join(BASE_DIR, 'data', 'nominate', 'members_all.csv'))
    edges_df = pd.read_csv(os.path.join(BASE_DIR, 'data', 'cosponsorship', 'all_cross_party_edges.csv'))
    overlap_df = pd.read_csv(os.path.join(BASE_DIR, 'data', 'nominate', 'nominate_overlap.csv'))
    votes_df = pd.read_csv(os.path.join(BASE_DIR, 'data', 'rollcall', 'party_line_votes.csv'))

    print("\nGenerating charts...")

    print("\n1. Bridge Index Timeline")
    plot_bridge_index_timeline(metrics_df)

    print("\n2. Network Snapshots")
    plot_network_snapshots(members_df, edges_df)

    print("\n3. Bridge vs Bunker Distribution")
    plot_bridge_vs_bunker(members_df, edges_df)

    print("\n4. Validation Overlay")
    plot_validation_overlay(metrics_df, overlap_df, votes_df)

    print("\n5. Party Divergence")
    plot_party_divergence(overlap_df)

    print("\n6. Edge Decline")
    plot_edge_decline(metrics_df)

    print("\n7. Chart Descriptions")
    write_chart_descriptions()

    print("\nAll charts generated!")
    print(f"Output directory: {CHART_DIR}")


if __name__ == '__main__':
    main()
