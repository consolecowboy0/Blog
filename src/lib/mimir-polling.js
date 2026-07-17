export function shouldRerender(serverMessages, lastMsgCount, lastMsgTime) {
  const len = serverMessages.length;
  if (len === 0 && lastMsgCount === 0) return false;
  if (len !== lastMsgCount) return true;
  const lastTime = len > 0 ? serverMessages[len - 1].time : 0;
  return lastTime !== lastMsgTime;
}

export function trackingState(messages) {
  const count = messages.length;
  const time = count > 0 ? messages[count - 1].time : 0;
  return { count, time };
}
