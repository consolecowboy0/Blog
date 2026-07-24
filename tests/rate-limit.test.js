import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { checkRate } from '../src/lib/rate-limit.js';

// Unique key per test so the shared module-level store never leaks state
// between cases.
let n = 0;
function freshKey() {
  return `test-key-${n++}`;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(0);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('checkRate', () => {
  it('allows up to max hits, then blocks', () => {
    const key = freshKey();
    expect(checkRate(key, 3, 1000).ok).toBe(true);  // 1
    expect(checkRate(key, 3, 1000).ok).toBe(true);  // 2
    expect(checkRate(key, 3, 1000).ok).toBe(true);  // 3
    expect(checkRate(key, 3, 1000).ok).toBe(false); // 4 blocked
  });

  it('reports decreasing remaining and clamps at zero', () => {
    const key = freshKey();
    expect(checkRate(key, 2, 1000).remaining).toBe(1);
    expect(checkRate(key, 2, 1000).remaining).toBe(0);
    expect(checkRate(key, 2, 1000).remaining).toBe(0); // stays clamped
  });

  it('resets the window after it expires', () => {
    const key = freshKey();
    checkRate(key, 1, 1000);                    // uses the single allowed hit
    expect(checkRate(key, 1, 1000).ok).toBe(false);
    vi.setSystemTime(1001);                     // past resetAt
    expect(checkRate(key, 1, 1000).ok).toBe(true);
  });

  it('computes retryAfter in seconds, rounded up', () => {
    const key = freshKey();
    const r = checkRate(key, 5, 2500);
    expect(r.retryAfter).toBe(3); // ceil(2500 / 1000)
  });

  it('tracks separate keys independently', () => {
    const a = freshKey();
    const b = freshKey();
    checkRate(a, 1, 1000);
    expect(checkRate(a, 1, 1000).ok).toBe(false);
    expect(checkRate(b, 1, 1000).ok).toBe(true); // b unaffected
  });
});
