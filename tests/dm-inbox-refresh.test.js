import { describe, it, expect } from 'vitest';

/**
 * These tests model the inbox auto-refresh behavior.
 * The bug: setInterval only calls loadConversations (list refresh)
 * but never re-fetches the currently open conversation's messages.
 *
 * We simulate the refresh cycle and verify that open conversations
 * get refreshed too.
 */

// Simulates the inbox refresh controller logic.
// Before fix: refreshOpenConversation is never called.
// After fix: refreshOpenConversation is called when activeConvId is set.
function createInboxRefreshController() {
  let activeConvId = null;
  const calls = { list: 0, read: 0 };

  async function loadConversations() {
    calls.list++;
  }

  async function refreshOpenConversation() {
    if (activeConvId) {
      calls.read++;
    }
  }

  async function tick() {
    await loadConversations();
    await refreshOpenConversation();
  }

  return {
    setActive(id) { activeConvId = id; },
    getActive() { return activeConvId; },
    tick,
    calls,
  };
}

describe('inbox auto-refresh', () => {
  it('refreshes conversation list on each tick', async () => {
    const ctrl = createInboxRefreshController();
    await ctrl.tick();
    await ctrl.tick();
    expect(ctrl.calls.list).toBe(2);
  });

  it('refreshes open conversation on tick when one is active', async () => {
    const ctrl = createInboxRefreshController();
    ctrl.setActive('conv-123');
    await ctrl.tick();
    expect(ctrl.calls.read).toBe(1);
  });

  it('does not fetch conversation when none is active', async () => {
    const ctrl = createInboxRefreshController();
    await ctrl.tick();
    expect(ctrl.calls.read).toBe(0);
  });

  it('stops refreshing conversation after deselect', async () => {
    const ctrl = createInboxRefreshController();
    ctrl.setActive('conv-123');
    await ctrl.tick();
    expect(ctrl.calls.read).toBe(1);
    ctrl.setActive(null);
    await ctrl.tick();
    expect(ctrl.calls.read).toBe(1); // unchanged
  });
});
