"""
Superhero Network Dismantling Simulation
Runs four dismantling strategies against the Project Caviar network.
"""

import networkx as nx
import numpy as np
import pandas as pd
import random
import json
from collections import defaultdict

# ── Load the network ──────────────────────────────────────────────
def load_network(path="data/caviar_edges.csv"):
    df = pd.read_csv(path)
    G = nx.DiGraph()
    for _, row in df.iterrows():
        G.add_edge(int(row["source"]), int(row["target"]), weight=int(row["weight"]))
    return G

# ── Metrics ───────────────────────────────────────────────────────
def compute_metrics(G, original_n):
    """Compute network health metrics."""
    if G.number_of_nodes() == 0:
        return 0.0, 0, 0.0

    # Work with undirected version for component analysis
    U = G.to_undirected()
    components = list(nx.connected_components(U))
    largest_cc = max(len(c) for c in components) if components else 0
    lcc_frac = largest_cc / original_n
    num_components = len(components)

    # Global efficiency
    efficiency = nx.global_efficiency(U)

    return lcc_frac, num_components, efficiency

# ── Dismantling Strategies ────────────────────────────────────────

def dismantle_detective(G_orig, max_removals):
    """Sequential betweenness centrality targeting (adaptive)."""
    G = G_orig.copy()
    original_n = G_orig.number_of_nodes()
    results = []
    lcc, nc, eff = compute_metrics(G, original_n)
    results.append({"removals": 0, "lcc_frac": lcc, "num_components": nc, "efficiency": eff})

    for i in range(1, max_removals + 1):
        if G.number_of_nodes() <= 1:
            break
        bc = nx.betweenness_centrality(G)
        target = max(bc, key=bc.get)
        G.remove_node(target)
        lcc, nc, eff = compute_metrics(G, original_n)
        results.append({"removals": i, "lcc_frac": lcc, "num_components": nc, "efficiency": eff})

    return results

def dismantle_bruiser(G_orig, max_removals):
    """Sequential degree centrality targeting (adaptive)."""
    G = G_orig.copy()
    original_n = G_orig.number_of_nodes()
    results = []
    lcc, nc, eff = compute_metrics(G, original_n)
    results.append({"removals": 0, "lcc_frac": lcc, "num_components": nc, "efficiency": eff})

    for i in range(1, max_removals + 1):
        if G.number_of_nodes() <= 1:
            break
        dc = nx.degree_centrality(G)
        target = max(dc, key=dc.get)
        G.remove_node(target)
        lcc, nc, eff = compute_metrics(G, original_n)
        results.append({"removals": i, "lcc_frac": lcc, "num_components": nc, "efficiency": eff})

    return results

def dismantle_ghost(G_orig, max_removals):
    """Sequential edge betweenness targeting."""
    G = G_orig.copy()
    original_n = G_orig.number_of_nodes()
    results = []
    lcc, nc, eff = compute_metrics(G, original_n)
    results.append({"removals": 0, "lcc_frac": lcc, "num_components": nc, "efficiency": eff})

    for i in range(1, max_removals + 1):
        if G.number_of_edges() == 0:
            break
        ebc = nx.edge_betweenness_centrality(G)
        target_edge = max(ebc, key=ebc.get)
        G.remove_edge(*target_edge)
        lcc, nc, eff = compute_metrics(G, original_n)
        results.append({"removals": i, "lcc_frac": lcc, "num_components": nc, "efficiency": eff})

    return results

def dismantle_random(G_orig, max_removals, n_runs=100):
    """Random node removal, averaged over multiple runs."""
    original_n = G_orig.number_of_nodes()
    all_runs = []

    for run in range(n_runs):
        G = G_orig.copy()
        nodes = list(G.nodes())
        random.shuffle(nodes)
        run_results = []
        lcc, nc, eff = compute_metrics(G, original_n)
        run_results.append({"lcc_frac": lcc, "num_components": nc, "efficiency": eff})

        for i in range(min(max_removals, len(nodes))):
            G.remove_node(nodes[i])
            lcc, nc, eff = compute_metrics(G, original_n)
            run_results.append({"lcc_frac": lcc, "num_components": nc, "efficiency": eff})

        all_runs.append(run_results)

    # Average across runs
    max_len = max(len(r) for r in all_runs)
    results = []
    for i in range(max_len):
        vals = [r[i] for r in all_runs if i < len(r)]
        results.append({
            "removals": i,
            "lcc_frac": np.mean([v["lcc_frac"] for v in vals]),
            "num_components": np.mean([v["num_components"] for v in vals]),
            "efficiency": np.mean([v["efficiency"] for v in vals]),
        })

    return results

# ── Network Statistics ────────────────────────────────────────────
def compute_network_stats(G):
    """Compute basic network statistics."""
    U = G.to_undirected()
    stats = {
        "nodes": G.number_of_nodes(),
        "edges": G.number_of_edges(),
        "density": nx.density(G),
        "avg_degree": sum(dict(G.degree()).values()) / G.number_of_nodes(),
        "num_components": nx.number_connected_components(U),
        "avg_clustering": nx.average_clustering(U),
    }

    # Top nodes by degree and betweenness
    dc = nx.degree_centrality(G)
    bc = nx.betweenness_centrality(G)
    stats["top5_degree"] = sorted(dc.items(), key=lambda x: -x[1])[:5]
    stats["top5_betweenness"] = sorted(bc.items(), key=lambda x: -x[1])[:5]

    # Community detection
    from networkx.algorithms.community import greedy_modularity_communities
    communities = list(greedy_modularity_communities(U))
    stats["num_communities"] = len(communities)
    stats["community_sizes"] = [len(c) for c in communities]
    stats["communities"] = [sorted(list(c)) for c in communities]

    # Largest connected component
    largest_cc = max(nx.connected_components(U), key=len)
    stats["largest_cc_size"] = len(largest_cc)

    return stats

# ── Main ──────────────────────────────────────────────────────────
if __name__ == "__main__":
    random.seed(42)
    np.random.seed(42)

    print("Loading network...")
    G = load_network()

    print("Computing network statistics...")
    stats = compute_network_stats(G)
    print(f"  Nodes: {stats['nodes']}")
    print(f"  Edges: {stats['edges']}")
    print(f"  Density: {stats['density']:.4f}")
    print(f"  Avg degree: {stats['avg_degree']:.2f}")
    print(f"  Connected components: {stats['num_components']}")
    print(f"  Largest CC: {stats['largest_cc_size']}")
    print(f"  Communities: {stats['num_communities']} (sizes: {stats['community_sizes']})")
    print(f"  Top 5 by degree: {stats['top5_degree']}")
    print(f"  Top 5 by betweenness: {stats['top5_betweenness']}")

    # Save stats
    with open("analysis/network_stats.md", "w") as f:
        f.write("# Caviar Network Statistics\n\n")
        f.write(f"- **Nodes**: {stats['nodes']}\n")
        f.write(f"- **Edges**: {stats['edges']}\n")
        f.write(f"- **Density**: {stats['density']:.4f}\n")
        f.write(f"- **Average degree**: {stats['avg_degree']:.2f}\n")
        f.write(f"- **Connected components**: {stats['num_components']}\n")
        f.write(f"- **Largest connected component**: {stats['largest_cc_size']} nodes\n")
        f.write(f"- **Average clustering coefficient**: {stats['avg_clustering']:.4f}\n")
        f.write(f"- **Communities detected**: {stats['num_communities']}\n")
        f.write(f"- **Community sizes**: {stats['community_sizes']}\n\n")
        f.write("## Top 5 by Degree Centrality\n\n")
        for node, val in stats['top5_degree']:
            f.write(f"- Node {node}: {val:.4f}\n")
        f.write("\n## Top 5 by Betweenness Centrality\n\n")
        for node, val in stats['top5_betweenness']:
            f.write(f"- Node {node}: {val:.4f}\n")
        f.write(f"\n## Communities\n\n")
        for i, comm in enumerate(stats['communities']):
            f.write(f"- Community {i+1} ({len(comm)} members): {comm}\n")

    # Save community data for visualization
    community_map = {}
    for i, comm in enumerate(stats['communities']):
        for node in comm:
            community_map[node] = i
    with open("data/community_map.json", "w") as f:
        json.dump({str(k): v for k, v in community_map.items()}, f)

    # Run dismantling simulations
    max_removals = int(stats['nodes'] * 0.5)  # Remove up to 50% of nodes
    max_edge_removals = int(G.number_of_edges() * 0.5)

    print(f"\nRunning simulations (max {max_removals} node removals, {max_edge_removals} edge removals)...")

    print("  Detective (betweenness)...")
    detective = dismantle_detective(G, max_removals)

    print("  Bruiser (degree)...")
    bruiser = dismantle_bruiser(G, max_removals)

    print("  Ghost (edge betweenness)...")
    ghost = dismantle_ghost(G, max_edge_removals)

    print("  Random (100 runs)...")
    rand = dismantle_random(G, max_removals, n_runs=100)

    # Find threshold crossings
    def find_threshold(results, metric="lcc_frac", threshold=0.5):
        for r in results:
            if r[metric] < threshold:
                return r["removals"]
        return None

    det_threshold = find_threshold(detective)
    bru_threshold = find_threshold(bruiser)
    gho_threshold = find_threshold(ghost)
    ran_threshold = find_threshold(rand)

    print(f"\n50% LCC Threshold Crossings:")
    print(f"  Detective: {det_threshold} removals")
    print(f"  Bruiser: {bru_threshold} removals")
    print(f"  Ghost: {gho_threshold} edge removals")
    print(f"  Random: {ran_threshold} removals")

    # Save results
    all_results = []
    for r in detective:
        r["strategy"] = "Detective"
        all_results.append(r)
    for r in bruiser:
        r["strategy"] = "Bruiser"
        all_results.append(r)
    for r in ghost:
        r["strategy"] = "Ghost"
        all_results.append(r)
    for r in rand:
        r["strategy"] = "Random"
        all_results.append(r)

    df = pd.DataFrame(all_results)
    df.to_csv("data/simulation_results.csv", index=False)
    print("\nResults saved to data/simulation_results.csv")

    # Save threshold summary
    summary = {
        "detective_threshold": det_threshold,
        "bruiser_threshold": bru_threshold,
        "ghost_threshold": gho_threshold,
        "random_threshold": ran_threshold,
    }
    with open("data/threshold_summary.json", "w") as f:
        json.dump(summary, f, indent=2)
    print("Threshold summary saved to data/threshold_summary.json")
