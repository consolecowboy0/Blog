"""
Visualization for the Superhero Network Analysis blog post.
Generates: network visualization, dismantling curves, before/after comparison.
"""

import networkx as nx
import matplotlib.pyplot as plt
import matplotlib
matplotlib.use('Agg')
import numpy as np
import pandas as pd
import json
import random

# ── Color Palette ─────────────────────────────────────────────────
DARK_BG = "#0d1117"
GRID_COLOR = "#1a2030"
TEXT_COLOR = "#c9d1d9"
ACCENT_COLORS = {
    "Detective": "#58a6ff",   # Cool blue
    "Bruiser": "#f0883e",     # Warm orange
    "Ghost": "#8b949e",       # Grey-green
    "Random": "#6e7681",      # Dotted grey
}

COMMUNITY_COLORS = [
    "#58a6ff",  # blue
    "#f0883e",  # orange
    "#7ee787",  # green
    "#d2a8ff",  # purple
    "#ff7b72",  # red
    "#ffa657",  # amber
    "#79c0ff",  # light blue
]

# ── Chart 1: Network Visualization ───────────────────────────────
def draw_network(G, community_map, output_path="output/charts/network.png"):
    fig, ax = plt.subplots(figsize=(12, 10), facecolor=DARK_BG)
    ax.set_facecolor(DARK_BG)

    # Layout
    random.seed(42)
    np.random.seed(42)
    pos = nx.spring_layout(G.to_undirected(), k=0.3, iterations=80, seed=42)

    # Node sizes by degree
    degrees = dict(G.degree())
    max_deg = max(degrees.values())
    node_sizes = [80 + 600 * (degrees[n] / max_deg) for n in G.nodes()]

    # Node colors by community
    node_colors = []
    for n in G.nodes():
        comm = community_map.get(str(n), 0)
        node_colors.append(COMMUNITY_COLORS[comm % len(COMMUNITY_COLORS)])

    # Draw edges with low opacity
    edge_weights = [G[u][v].get('weight', 1) for u, v in G.edges()]
    max_w = max(edge_weights) if edge_weights else 1
    edge_alphas = [0.03 + 0.15 * (w / max_w) for w in edge_weights]

    for (u, v), alpha in zip(G.edges(), edge_alphas):
        ax.plot(
            [pos[u][0], pos[v][0]],
            [pos[u][1], pos[v][1]],
            color="#30363d",
            alpha=alpha,
            linewidth=0.5,
            zorder=1
        )

    # Draw nodes
    nx.draw_networkx_nodes(
        G, pos, ax=ax,
        node_size=node_sizes,
        node_color=node_colors,
        alpha=0.85,
        edgecolors="#0d1117",
        linewidths=0.5,
    )

    ax.set_title("110 people. Real wiretaps. Two years of surveillance.",
                 fontsize=14, color=TEXT_COLOR, fontweight='bold', pad=15,
                 fontfamily='sans-serif')

    ax.axis('off')
    plt.tight_layout()
    plt.savefig(output_path, dpi=200, facecolor=DARK_BG, bbox_inches='tight')
    plt.close()
    print(f"  Saved: {output_path}")


# ── Chart 2: Dismantling Curves ──────────────────────────────────
def draw_dismantling_curves(output_path="output/charts/dismantling_curves.png"):
    df = pd.read_csv("data/simulation_results.csv")

    fig, ax = plt.subplots(figsize=(10, 6), facecolor=DARK_BG)
    ax.set_facecolor(DARK_BG)

    for strategy in ["Detective", "Bruiser", "Random"]:
        data = df[df["strategy"] == strategy]
        style = "-" if strategy != "Random" else "--"
        lw = 2.5 if strategy != "Random" else 1.5
        ax.plot(data["removals"], data["lcc_frac"],
                label=f"The {strategy}",
                color=ACCENT_COLORS[strategy],
                linewidth=lw,
                linestyle=style,
                zorder=3 if strategy == "Detective" else 2)

    # Ghost uses edge removals - normalize x-axis to be comparable
    # Show Ghost on a secondary notion: every ~5.4 edge removals ≈ 1 node removal equivalent
    ghost = df[df["strategy"] == "Ghost"]
    # Plot Ghost with its own x-axis scaled to node removals for comparison
    # 295 edges / 110 nodes ≈ 2.68 edges per node
    # But let's just show first 55 edge removals mapped to the same x range
    ghost_subset = ghost[ghost["removals"] <= 55]
    ax.plot(ghost_subset["removals"], ghost_subset["lcc_frac"],
            label="The Ghost (edge removals)",
            color=ACCENT_COLORS["Ghost"],
            linewidth=2, linestyle="-.",
            alpha=0.8, zorder=2)

    # 50% threshold line
    ax.axhline(y=0.5, color="#f85149", linewidth=1, linestyle=":", alpha=0.7, zorder=1)
    ax.text(1, 0.52, "50% threshold", color="#f85149", fontsize=9, alpha=0.7)

    # Mark threshold crossings
    thresholds = {"Detective": 4, "Bruiser": 5, "Random": 37}
    for strat, x in thresholds.items():
        ax.plot(x, 0.5, 'o', color=ACCENT_COLORS[strat], markersize=8, zorder=4)
        offset = -3 if strat == "Random" else 1
        ax.annotate(f"{x}", (x, 0.48),
                    color=ACCENT_COLORS[strat], fontsize=10, fontweight='bold',
                    ha='center', va='top')

    ax.set_xlabel("Operations (nodes or edges removed)", color=TEXT_COLOR, fontsize=11)
    ax.set_ylabel("Network integrity (largest component fraction)", color=TEXT_COLOR, fontsize=11)
    ax.set_title("How fast can each superhero dismantle the network?",
                 color=TEXT_COLOR, fontsize=13, fontweight='bold', pad=12)

    ax.set_xlim(0, 55)
    ax.set_ylim(0, 1.05)
    ax.tick_params(colors=TEXT_COLOR)
    ax.spines['bottom'].set_color(GRID_COLOR)
    ax.spines['left'].set_color(GRID_COLOR)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.grid(True, alpha=0.1, color=GRID_COLOR)

    legend = ax.legend(loc='upper right', framealpha=0.9,
                       facecolor="#161b22", edgecolor="#30363d",
                       fontsize=10)
    for text in legend.get_texts():
        text.set_color(TEXT_COLOR)

    plt.tight_layout()
    plt.savefig(output_path, dpi=200, facecolor=DARK_BG, bbox_inches='tight')
    plt.close()
    print(f"  Saved: {output_path}")


# ── Chart 3: Before/After ────────────────────────────────────────
def draw_before_after(G, community_map, output_path="output/charts/before_after.png"):
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 7), facecolor=DARK_BG)

    # Compute layout on original network
    random.seed(42)
    np.random.seed(42)
    pos = nx.spring_layout(G.to_undirected(), k=0.3, iterations=80, seed=42)

    degrees = dict(G.degree())
    max_deg = max(degrees.values())

    for ax, title in [(ax1, "Before"), (ax2, "After 4 operations")]:
        ax.set_facecolor(DARK_BG)

    # ── Before ──
    node_sizes = [60 + 500 * (degrees[n] / max_deg) for n in G.nodes()]
    node_colors = [COMMUNITY_COLORS[community_map.get(str(n), 0) % len(COMMUNITY_COLORS)] for n in G.nodes()]

    for (u, v) in G.edges():
        w = G[u][v].get('weight', 1)
        alpha = 0.03 + 0.15 * (w / max(1, max_deg))
        ax1.plot([pos[u][0], pos[v][0]], [pos[u][1], pos[v][1]],
                 color="#30363d", alpha=alpha, linewidth=0.5, zorder=1)
    nx.draw_networkx_nodes(G, pos, ax=ax1, node_size=node_sizes,
                           node_color=node_colors, alpha=0.85,
                           edgecolors="#0d1117", linewidths=0.5)
    ax1.set_title("The network", color=TEXT_COLOR, fontsize=13, fontweight='bold', pad=10)
    ax1.axis('off')

    # ── After: remove top 4 by betweenness ──
    G_after = G.copy()
    bc = nx.betweenness_centrality(G)
    # Sequential removal with recalculation
    for _ in range(4):
        bc = nx.betweenness_centrality(G_after)
        target = max(bc, key=bc.get)
        G_after.remove_node(target)

    remaining_degrees = dict(G_after.degree())
    remaining_max = max(remaining_degrees.values()) if remaining_degrees else 1
    node_sizes_after = [60 + 500 * (remaining_degrees.get(n, 0) / max(1, remaining_max)) for n in G_after.nodes()]
    node_colors_after = [COMMUNITY_COLORS[community_map.get(str(n), 0) % len(COMMUNITY_COLORS)] for n in G_after.nodes()]

    for (u, v) in G_after.edges():
        if u in pos and v in pos:
            w = G_after[u][v].get('weight', 1)
            alpha = 0.05 + 0.2 * (w / max(1, remaining_max))
            ax2.plot([pos[u][0], pos[v][0]], [pos[u][1], pos[v][1]],
                     color="#30363d", alpha=alpha, linewidth=0.5, zorder=1)

    # Draw remaining nodes at original positions
    remaining_pos = {n: pos[n] for n in G_after.nodes() if n in pos}
    nx.draw_networkx_nodes(G_after, remaining_pos, ax=ax2, node_size=node_sizes_after,
                           node_color=node_colors_after, alpha=0.85,
                           edgecolors="#0d1117", linewidths=0.5)

    # Draw removed nodes as faint X marks
    removed = set(G.nodes()) - set(G_after.nodes())
    for n in removed:
        if n in pos:
            ax2.scatter(pos[n][0], pos[n][1], marker='x', c='#f85149',
                       s=150, linewidths=2, zorder=5, alpha=0.9)

    ax2.set_title("After The Detective (4 moves)", color=TEXT_COLOR,
                  fontsize=13, fontweight='bold', pad=10)
    ax2.axis('off')

    # Match axes limits
    all_x = [p[0] for p in pos.values()]
    all_y = [p[1] for p in pos.values()]
    margin = 0.1
    for ax in [ax1, ax2]:
        ax.set_xlim(min(all_x) - margin, max(all_x) + margin)
        ax.set_ylim(min(all_y) - margin, max(all_y) + margin)

    plt.tight_layout()
    plt.savefig(output_path, dpi=200, facecolor=DARK_BG, bbox_inches='tight')
    plt.close()
    print(f"  Saved: {output_path}")


# ── Main ──────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("Loading data...")
    df = pd.read_csv("data/caviar_edges.csv")
    G = nx.DiGraph()
    for _, row in df.iterrows():
        G.add_edge(int(row["source"]), int(row["target"]), weight=int(row["weight"]))

    with open("data/community_map.json") as f:
        community_map = json.load(f)

    print("Generating charts...")
    draw_network(G, community_map)
    draw_dismantling_curves()
    draw_before_after(G, community_map)

    # Write chart descriptions
    with open("output/chart_descriptions.md", "w") as f:
        f.write("# Chart Descriptions\n\n")
        f.write("## 1. Network Visualization (network.png)\n")
        f.write("Force-directed layout of the full Caviar network. 110 nodes colored by community,\n")
        f.write("sized by degree. Dark background. The few large, bright nodes are the hubs-\n")
        f.write("the people with the most connections. The small scattered ones are foot soldiers.\n\n")
        f.write("## 2. Dismantling Curves (dismantling_curves.png)\n")
        f.write("Line chart showing network integrity vs operations for each superhero archetype.\n")
        f.write("The Detective (blue) drops the network below 50% in just 4 moves.\n")
        f.write("The Bruiser (orange) takes 5. Random (grey dashed) takes 37.\n")
        f.write("The Ghost barely makes a dent in 55 edge removals.\n\n")
        f.write("## 3. Before/After (before_after.png)\n")
        f.write("Side-by-side: the full network on the left, and the shattered network after\n")
        f.write("The Detective removes just 4 nodes (marked with red X). The connected whole\n")
        f.write("becomes isolated fragments.\n")

    print("Done.")
