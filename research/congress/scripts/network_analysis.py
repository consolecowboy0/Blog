"""
Network analysis of Congressional cross-party cooperation.

For each Congress, constructs the bipartisan cooperation graph and computes:
- Algebraic connectivity (Fiedler value)
- Number of connected components
- Largest component fraction
- Bridge node count (top decile of cross-party degree)
- Average cross-party degree
- Modularity
- The "Bridge Index" - our custom metric

The Bridge Index: fraction of members who participate in at least one
cross-party cosponsorship, weighted by the density of those connections.
It captures both breadth (how many members cross the aisle) and depth
(how connected those crossings are).
"""

import numpy as np
import pandas as pd
import networkx as nx
from scipy import sparse
from scipy.sparse.linalg import eigsh
import os
import json

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def build_bipartisan_graph(members_df, edges_df, congress):
    """Build the cross-party cooperation graph for a given Congress."""
    cong_members = members_df[
        (members_df['congress'] == congress) &
        (members_df['chamber'] == 'House')
    ]
    cong_edges = edges_df[edges_df['congress'] == congress]

    G = nx.Graph()

    # Add all members as nodes
    for _, member in cong_members.iterrows():
        G.add_node(
            member['member_id'],
            party=member['party_name'],
            nominate=member['nominate_dim1']
        )

    # Add cross-party edges
    for _, edge in cong_edges.iterrows():
        G.add_edge(
            edge['member_a'],
            edge['member_b'],
            weight=edge['weight']
        )

    return G


def compute_algebraic_connectivity(G):
    """Compute the Fiedler value (algebraic connectivity) of the graph."""
    if len(G) < 3:
        return 0.0

    try:
        # Use NetworkX's built-in algebraic connectivity
        return float(nx.algebraic_connectivity(G, weight='weight'))
    except Exception:
        return 0.0


def compute_metrics(G, members_df, congress):
    """Compute all connectivity metrics for a graph."""
    cong_members = members_df[
        (members_df['congress'] == congress) &
        (members_df['chamber'] == 'House')
    ]

    n_total = len(cong_members)
    n_dem = len(cong_members[cong_members['party_code'] == 100])
    n_rep = len(cong_members[cong_members['party_code'] == 200])

    # Members with at least one cross-party edge
    members_with_edges = set()
    for u, v in G.edges():
        members_with_edges.add(u)
        members_with_edges.add(v)

    n_connected = len(members_with_edges)
    connected_fraction = n_connected / n_total if n_total > 0 else 0

    # Cross-party degree for each member
    cross_party_degrees = {}
    for node in G.nodes():
        cross_party_degrees[node] = G.degree(node)

    degrees = list(cross_party_degrees.values())
    avg_degree = np.mean(degrees) if degrees else 0

    # Bridge nodes: top decile of cross-party degree
    if degrees:
        threshold = np.percentile([d for d in degrees if d > 0], 90) if any(d > 0 for d in degrees) else 0
        bridge_nodes = sum(1 for d in degrees if d >= threshold and d > 0)
    else:
        bridge_nodes = 0

    # Connected components (of the subgraph with edges only)
    if G.number_of_edges() > 0:
        subgraph = G.subgraph(members_with_edges)
        n_components = nx.number_connected_components(subgraph)
        largest_cc = max(nx.connected_components(subgraph), key=len)
        largest_cc_fraction = len(largest_cc) / n_connected if n_connected > 0 else 0
    else:
        n_components = 0
        largest_cc_fraction = 0

    # Algebraic connectivity on the connected subgraph
    if G.number_of_edges() > 2:
        subgraph = G.subgraph(members_with_edges)
        if nx.is_connected(subgraph):
            alg_connectivity = compute_algebraic_connectivity(subgraph)
        else:
            # Use largest connected component
            largest_cc_nodes = max(nx.connected_components(subgraph), key=len)
            lcc_graph = subgraph.subgraph(largest_cc_nodes)
            alg_connectivity = compute_algebraic_connectivity(lcc_graph)
    else:
        alg_connectivity = 0.0

    # Modularity (using party as community assignment)
    if G.number_of_edges() > 0:
        dem_nodes = set(cong_members[cong_members['party_code'] == 100]['member_id'])
        rep_nodes = set(cong_members[cong_members['party_code'] == 200]['member_id'])
        # Only include nodes that are in the graph
        dem_in_graph = dem_nodes & set(G.nodes())
        rep_in_graph = rep_nodes & set(G.nodes())
        if dem_in_graph and rep_in_graph:
            try:
                modularity = nx.community.modularity(G, [dem_in_graph, rep_in_graph])
            except Exception:
                modularity = 0.0
        else:
            modularity = 0.0
    else:
        modularity = 0.0

    # Edge density: actual cross-party edges / max possible cross-party edges
    max_possible_edges = n_dem * n_rep
    actual_edges = G.number_of_edges()
    edge_density = actual_edges / max_possible_edges if max_possible_edges > 0 else 0

    # ================================================================
    # THE BRIDGE INDEX
    # ================================================================
    # Our custom metric combining:
    # 1. Participation breadth: fraction of members with cross-party ties
    # 2. Connection density: normalized edge density
    # 3. Distribution evenness: how evenly distributed cross-party ties are
    #
    # Bridge Index = connected_fraction * sqrt(edge_density) * (1 - gini_of_degrees)
    #
    # This produces a single number between 0 and 1 that captures:
    # - High when many members cross the aisle with even distribution
    # - Low when few members cross, or connections are concentrated in few members

    if degrees and any(d > 0 for d in degrees):
        nonzero_degrees = sorted([d for d in degrees if d > 0])
        n = len(nonzero_degrees)
        if n > 1:
            # Gini coefficient of nonzero degrees
            cumulative = np.cumsum(nonzero_degrees)
            gini = (2 * np.sum((np.arange(1, n+1) * nonzero_degrees))) / (n * cumulative[-1]) - (n + 1) / n
            gini = max(0, min(1, gini))
        else:
            gini = 0
        evenness = 1 - gini
    else:
        evenness = 0
        gini = 1

    bridge_index = connected_fraction * np.sqrt(edge_density) * evenness

    # Normalize to 0-100 scale for readability
    bridge_index_scaled = round(bridge_index * 1000, 2)  # Scale to make differences visible

    return {
        'congress': congress,
        'year': int(cong_members['year'].iloc[0]),
        'n_total': n_total,
        'n_dem': n_dem,
        'n_rep': n_rep,
        'n_edges': actual_edges,
        'max_possible_edges': max_possible_edges,
        'edge_density': round(edge_density, 6),
        'n_connected_members': n_connected,
        'connected_fraction': round(connected_fraction, 4),
        'avg_cross_party_degree': round(avg_degree, 2),
        'bridge_nodes': bridge_nodes,
        'n_components': n_components,
        'largest_cc_fraction': round(largest_cc_fraction, 4),
        'algebraic_connectivity': round(alg_connectivity, 6),
        'modularity': round(modularity, 4),
        'degree_gini': round(gini if degrees else 1.0, 4),
        'bridge_index': round(bridge_index_scaled, 2),
    }


def main():
    print("Loading data...")
    members_df = pd.read_csv(os.path.join(BASE_DIR, 'data', 'nominate', 'members_all.csv'))
    edges_df = pd.read_csv(os.path.join(BASE_DIR, 'data', 'cosponsorship', 'all_cross_party_edges.csv'))

    congresses = sorted(members_df[members_df['chamber'] == 'House']['congress'].unique())

    print(f"Analyzing {len(congresses)} Congresses...")

    all_metrics = []

    for congress in congresses:
        print(f"  Processing Congress {congress}...")
        G = build_bipartisan_graph(members_df, edges_df, congress)
        metrics = compute_metrics(G, members_df, congress)
        all_metrics.append(metrics)

        print(f"    Edges: {metrics['n_edges']}, Connected: {metrics['connected_fraction']:.2%}, "
              f"Bridge Index: {metrics['bridge_index']:.2f}, "
              f"Alg. Connectivity: {metrics['algebraic_connectivity']:.4f}")

    # Save metrics
    metrics_df = pd.DataFrame(all_metrics)
    output_path = os.path.join(BASE_DIR, 'analysis', 'connectivity_metrics.csv')
    metrics_df.to_csv(output_path, index=False)
    print(f"\nSaved metrics to {output_path}")

    # Print summary
    print("\n" + "="*80)
    print("CONNECTIVITY METRICS SUMMARY")
    print("="*80)
    print(metrics_df[['congress', 'year', 'n_edges', 'connected_fraction',
                       'bridge_index', 'algebraic_connectivity', 'modularity']].to_string(index=False))

    return metrics_df


if __name__ == '__main__':
    main()
