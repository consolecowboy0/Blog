/**
 * Determines whether the message list should re-render based on
 * server messages vs local state.
 *
 * The old approach compared only message counts, which fails when
 * the optimistic count coincidentally matches the server count
 * (e.g. visitor sends while admin replies).
 *
 * This version also compares the last message timestamp so that
 * content changes are detected even when counts align.
 */
export function shouldRerender(serverMessages, lastMsgCount, lastMsgTime) {
  const len = serverMessages.length;
  if (len !== lastMsgCount) return true;
  if (len === 0) return false;
  const lastServer = serverMessages[len - 1];
  return lastServer.time !== lastMsgTime;
}

/**
 * Extracts tracking state from a messages array.
 * Call after every render or optimistic append.
 */
export function trackingState(messages) {
  const count = messages.length;
  const time = count > 0 ? messages[count - 1].time : 0;
  return { count, time };
}
