import { describe, it, expect } from 'vitest';
import { shouldRerender, trackingState } from '../src/lib/dm-polling.js';

describe('shouldRerender', () => {
  it('returns false when server and local are both empty', () => {
    expect(shouldRerender([], 0, 0)).toBe(false);
  });

  it('returns true when server has messages but local is empty', () => {
    const server = [{ from: 'visitor', text: 'hi', time: 1000 }];
    expect(shouldRerender(server, 0, 0)).toBe(true);
  });

  it('returns false when counts and last timestamp match', () => {
    const server = [{ from: 'visitor', text: 'hi', time: 1000 }];
    expect(shouldRerender(server, 1, 1000)).toBe(false);
  });

  it('returns true when counts match but last timestamp differs', () => {
    // BUG CASE: visitor optimistically appended (count=2, time=2000)
    // but server has [visitorA, adminReply] (count=2, time=1500)
    // Old code: 2 === 2 -> skip. New code: 1500 !== 2000 -> rerender.
    const server = [
      { from: 'visitor', text: 'hello', time: 1000 },
      { from: 'admin', text: 'reply', time: 1500 },
    ];
    expect(shouldRerender(server, 2, 2000)).toBe(true);
  });

  it('returns true when server has more messages', () => {
    const server = [
      { from: 'visitor', text: 'a', time: 1000 },
      { from: 'admin', text: 'b', time: 2000 },
    ];
    expect(shouldRerender(server, 1, 1000)).toBe(true);
  });

  it('returns true when server has fewer messages (e.g. race on optimistic)', () => {
    const server = [{ from: 'visitor', text: 'a', time: 1000 }];
    // Client optimistically added another msg
    expect(shouldRerender(server, 2, 3000)).toBe(true);
  });

  it('detects admin reply arriving between two visitor sends', () => {
    // Visitor sent A (time 100), admin replied B (time 200),
    // visitor sent C optimistically (time 300, not yet on server).
    // Server currently has [A, B]. Local count is 2 (A rendered + C optimistic).
    // Old code: server.length(2) === lastMsgCount(2) -> MISS.
    // New code: server last time (200) !== lastMsgTime (300) -> CATCH.
    const server = [
      { from: 'visitor', text: 'A', time: 100 },
      { from: 'admin', text: 'B', time: 200 },
    ];
    expect(shouldRerender(server, 2, 300)).toBe(true);
  });
});

describe('trackingState', () => {
  it('returns zeros for empty array', () => {
    expect(trackingState([])).toEqual({ count: 0, time: 0 });
  });

  it('returns count and last time', () => {
    const msgs = [
      { from: 'visitor', text: 'a', time: 100 },
      { from: 'admin', text: 'b', time: 200 },
    ];
    expect(trackingState(msgs)).toEqual({ count: 2, time: 200 });
  });
});
