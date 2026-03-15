"""
Inflection Point Detection for Congressional Polarization Metrics.

Uses change-point detection (PELT algorithm from ruptures library)
and sigmoid curve fitting to identify the specific Congress where
the bipartisan cooperation network underwent a phase transition.
"""

import numpy as np
import pandas as pd
from scipy.optimize import curve_fit
from scipy.signal import savgol_filter
import ruptures as rpt
import os
import json

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def sigmoid(x, L, k, x0, b):
    """Logistic/sigmoid function for fitting."""
    return L / (1 + np.exp(k * (x - x0))) + b


def fit_sigmoid(congresses, values):
    """Fit a sigmoid curve to the data and find the midpoint (inflection)."""
    try:
        # Initial guess: L=range of data, k=negative (decreasing), x0=midpoint, b=min
        L_guess = max(values) - min(values)
        k_guess = -0.3
        x0_guess = np.median(congresses)
        b_guess = min(values)

        popt, pcov = curve_fit(
            sigmoid, congresses, values,
            p0=[L_guess, k_guess, x0_guess, b_guess],
            maxfev=10000,
            bounds=(
                [0, -5, min(congresses), -np.inf],
                [np.inf, 0, max(congresses), np.inf]
            )
        )

        L, k, x0, b = popt
        perr = np.sqrt(np.diag(pcov))

        # R-squared
        y_pred = sigmoid(congresses, *popt)
        ss_res = np.sum((values - y_pred) ** 2)
        ss_tot = np.sum((values - np.mean(values)) ** 2)
        r_squared = 1 - ss_res / ss_tot

        return {
            'inflection_congress': round(x0, 1),
            'steepness': round(k, 4),
            'amplitude': round(L, 2),
            'baseline': round(b, 2),
            'r_squared': round(r_squared, 4),
            'inflection_std_error': round(perr[2], 2),
            'params': popt.tolist()
        }
    except Exception as e:
        return {'error': str(e)}


def detect_changepoints_pelt(values, n_bkps=2, penalty=None):
    """Use PELT algorithm to detect change points."""
    signal = np.array(values).reshape(-1, 1)

    # PELT with RBF kernel
    if penalty:
        algo = rpt.Pelt(model="rbf", min_size=3).fit(signal)
        result = algo.predict(pen=penalty)
    else:
        algo = rpt.Pelt(model="rbf", min_size=3).fit(signal)
        # Try multiple penalties
        results = {}
        for pen in [1, 2, 5, 10, 20]:
            bkps = algo.predict(pen=pen)
            results[pen] = bkps
        return results

    return result


def detect_changepoints_binseg(values, n_bkps=2):
    """Use Binary Segmentation to detect change points."""
    signal = np.array(values).reshape(-1, 1)
    algo = rpt.Binseg(model="l2", min_size=3).fit(signal)
    result = algo.predict(n_bkps=n_bkps)
    return result


def compute_rate_of_change(congresses, values):
    """Compute the rate of change (first derivative) over time."""
    # Smooth first
    if len(values) > 5:
        smoothed = savgol_filter(values, window_length=5, polyorder=2)
    else:
        smoothed = values

    # Numerical derivative
    rates = np.gradient(smoothed, congresses)

    return rates, smoothed


def main():
    print("Loading metrics data...")
    metrics_df = pd.read_csv(os.path.join(BASE_DIR, 'analysis', 'connectivity_metrics.csv'))

    congresses = metrics_df['congress'].values.astype(float)
    years = metrics_df['year'].values

    # Metrics to analyze
    metrics_to_analyze = {
        'bridge_index': metrics_df['bridge_index'].values,
        'n_edges': metrics_df['n_edges'].values.astype(float),
        'edge_density': metrics_df['edge_density'].values,
        'algebraic_connectivity': metrics_df['algebraic_connectivity'].values,
        'connected_fraction': metrics_df['connected_fraction'].values,
        'avg_cross_party_degree': metrics_df['avg_cross_party_degree'].values,
    }

    results = {}

    for metric_name, values in metrics_to_analyze.items():
        print(f"\n{'='*60}")
        print(f"Analyzing: {metric_name}")
        print(f"{'='*60}")

        # 1. Sigmoid fit
        sigmoid_result = fit_sigmoid(congresses, values)
        print(f"  Sigmoid fit:")
        if 'error' not in sigmoid_result:
            print(f"    Inflection Congress: {sigmoid_result['inflection_congress']}")
            print(f"    R-squared: {sigmoid_result['r_squared']}")
            print(f"    Std Error: {sigmoid_result['inflection_std_error']}")
        else:
            print(f"    Error: {sigmoid_result['error']}")

        # 2. PELT change points
        pelt_results = detect_changepoints_pelt(values)
        print(f"  PELT change points (by penalty):")
        changepoint_congresses = {}
        for pen, bkps in sorted(pelt_results.items()):
            # Convert indices to congress numbers
            cp_congresses = [int(congresses[min(b-1, len(congresses)-1)]) for b in bkps if b < len(congresses)]
            changepoint_congresses[pen] = cp_congresses
            print(f"    penalty={pen}: Congress {cp_congresses}")

        # 3. Binary segmentation (1 and 2 change points)
        binseg_1 = detect_changepoints_binseg(values, n_bkps=1)
        binseg_2 = detect_changepoints_binseg(values, n_bkps=2)
        cp1 = [int(congresses[min(b-1, len(congresses)-1)]) for b in binseg_1 if b < len(congresses)]
        cp2 = [int(congresses[min(b-1, len(congresses)-1)]) for b in binseg_2 if b < len(congresses)]
        print(f"  Binary Segmentation (1 break): Congress {cp1}")
        print(f"  Binary Segmentation (2 breaks): Congress {cp2}")

        # 4. Rate of change analysis
        rates, smoothed = compute_rate_of_change(congresses, values)
        max_decline_idx = np.argmin(rates)
        max_decline_congress = int(congresses[max_decline_idx])
        print(f"  Maximum rate of decline at Congress {max_decline_congress}")

        results[metric_name] = {
            'sigmoid': sigmoid_result,
            'pelt_changepoints': {str(k): v for k, v in changepoint_congresses.items()},
            'binseg_1': cp1,
            'binseg_2': cp2,
            'max_decline_congress': max_decline_congress,
            'max_decline_rate': round(float(rates[max_decline_idx]), 4),
        }

    # Cross-validate: which Congress appears most frequently?
    print(f"\n{'='*60}")
    print("CROSS-VALIDATION: Most frequent inflection points")
    print(f"{'='*60}")

    all_inflections = []
    for metric_name, result in results.items():
        if 'error' not in result['sigmoid']:
            all_inflections.append(round(result['sigmoid']['inflection_congress']))
        for pen, cps in result['pelt_changepoints'].items():
            all_inflections.extend(cps)
        all_inflections.extend(result['binseg_1'])
        all_inflections.extend(result['binseg_2'])
        all_inflections.append(result['max_decline_congress'])

    from collections import Counter
    inflection_counts = Counter(all_inflections)
    print("\nMost common inflection Congresses:")
    for congress, count in inflection_counts.most_common(10):
        year_idx = np.argmin(np.abs(congresses - congress))
        year = int(years[year_idx])
        print(f"  Congress {congress} ({year}-{year+1}): appears {count} times")

    # Determine the primary inflection
    primary_inflection = inflection_counts.most_common(1)[0][0]
    primary_year_idx = np.argmin(np.abs(congresses - primary_inflection))
    primary_year = int(years[primary_year_idx])

    print(f"\n*** PRIMARY INFLECTION: Congress {primary_inflection} ({primary_year}) ***")

    # Save results
    output = {
        'primary_inflection': {
            'congress': int(primary_inflection),
            'year': primary_year,
        },
        'inflection_frequency': dict(inflection_counts.most_common(10)),
        'per_metric_results': results,
    }

    analysis_dir = os.path.join(BASE_DIR, 'analysis')

    with open(os.path.join(analysis_dir, 'inflection_results.json'), 'w') as f:
        json.dump(output, f, indent=2, default=str)

    # Write human-readable analysis
    with open(os.path.join(analysis_dir, 'inflection_analysis.md'), 'w') as f:
        f.write("# Inflection Point Analysis\n\n")
        f.write("## Summary\n\n")
        f.write(f"**Primary inflection point: Congress {primary_inflection} ({primary_year}-{primary_year+1})**\n\n")
        f.write("This Congress was identified as the most frequent change point across multiple metrics and detection methods.\n\n")

        f.write("## Cross-Validation Results\n\n")
        f.write("| Congress | Year | Frequency |\n")
        f.write("|----------|------|----------|\n")
        for congress, count in inflection_counts.most_common(10):
            yi = np.argmin(np.abs(congresses - congress))
            yr = int(years[yi])
            f.write(f"| {congress} | {yr} | {count} |\n")

        f.write("\n## Per-Metric Analysis\n\n")
        for metric_name, result in results.items():
            f.write(f"### {metric_name}\n\n")
            if 'error' not in result['sigmoid']:
                sig = result['sigmoid']
                f.write(f"- Sigmoid inflection: Congress {sig['inflection_congress']} "
                       f"(R² = {sig['r_squared']}, SE = {sig['inflection_std_error']})\n")
            f.write(f"- Binary segmentation (1 break): Congress {result['binseg_1']}\n")
            f.write(f"- Binary segmentation (2 breaks): Congress {result['binseg_2']}\n")
            f.write(f"- Maximum decline rate at Congress {result['max_decline_congress']}\n\n")

        f.write("## Methodology\n\n")
        f.write("Multiple change-point detection methods were applied:\n")
        f.write("1. **Sigmoid curve fitting**: Fits a logistic function and finds the midpoint\n")
        f.write("2. **PELT algorithm**: Pruned Exact Linear Time change-point detection with RBF kernel\n")
        f.write("3. **Binary segmentation**: Greedy algorithm for finding optimal breakpoints\n")
        f.write("4. **Rate-of-change analysis**: Identifies where the decline accelerates most\n\n")
        f.write("The primary inflection point was determined by the Congress that appeared most "
               "frequently across all methods and metrics.\n")

    print(f"\nResults saved to {analysis_dir}")


if __name__ == '__main__':
    main()
