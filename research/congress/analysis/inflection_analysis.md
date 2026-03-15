# Inflection Point Analysis

## Summary

**Primary inflection point: Congress 102 (1991-1992)**

This Congress was identified as the most frequent change point across multiple metrics and detection methods.

## Cross-Validation Results

| Congress | Year | Frequency |
|----------|------|----------|
| 102 | 1991 | 20 |
| 107 | 2001 | 16 |
| 112 | 2011 | 6 |
| 97 | 1981 | 5 |
| 93 | 1973 | 4 |
| 118 | 2023 | 2 |
| 95 | 1977 | 1 |
| 103 | 1993 | 1 |
| 94 | 1975 | 1 |
| 113 | 2013 | 1 |

## Per-Metric Analysis

### bridge_index

- Sigmoid inflection: Congress 94.6 (R² = -0.0, SE = 0.0)
- Binary segmentation (1 break): Congress [102]
- Binary segmentation (2 breaks): Congress [102, 107]
- Maximum decline rate at Congress 93

### n_edges

- Sigmoid inflection: Congress 117.9 (R² = -0.0, SE = 0.0)
- Binary segmentation (1 break): Congress [102]
- Binary segmentation (2 breaks): Congress [102, 107]
- Maximum decline rate at Congress 93

### edge_density

- Sigmoid inflection: Congress 118.0 (R² = -0.0, SE = 0.0)
- Binary segmentation (1 break): Congress [102]
- Binary segmentation (2 breaks): Congress [102, 107]
- Maximum decline rate at Congress 103

### algebraic_connectivity

- Sigmoid inflection: Congress 97.3 (R² = -0.0, SE = 0.0)
- Binary segmentation (1 break): Congress [107]
- Binary segmentation (2 breaks): Congress [97, 107]
- Maximum decline rate at Congress 93

### connected_fraction

- Sigmoid inflection: Congress 93.6 (R² = -0.0, SE = 28269796.42)
- Binary segmentation (1 break): Congress [112]
- Binary segmentation (2 breaks): Congress [107, 112]
- Maximum decline rate at Congress 113

### avg_cross_party_degree

- Sigmoid inflection: Congress 110.8 (R² = -0.0, SE = 0.0)
- Binary segmentation (1 break): Congress [102]
- Binary segmentation (2 breaks): Congress [102, 107]
- Maximum decline rate at Congress 93

## Methodology

Multiple change-point detection methods were applied:
1. **Sigmoid curve fitting**: Fits a logistic function and finds the midpoint
2. **PELT algorithm**: Pruned Exact Linear Time change-point detection with RBF kernel
3. **Binary segmentation**: Greedy algorithm for finding optimal breakpoints
4. **Rate-of-change analysis**: Identifies where the decline accelerates most

The primary inflection point was determined by the Congress that appeared most frequently across all methods and metrics.
