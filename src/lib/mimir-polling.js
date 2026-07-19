export function shouldRerender(serverMessages, lastMsgCount, lastMsgTime) {
  const count = serverMessages.length;
  if (count === 0 && lastMsgCount === 0) return false;
  if (count !== lastMsgCount) return true;
  const lastTime = count > 0 ? serverMessages[count - 1].time : 0;
  return lastTime !== lastMsgTime;
}

export function trackingState(messages) {
  const count = messages.length;
  const time = count > 0 ? messages[count - 1].time : 0;
  return { count, time };
}
