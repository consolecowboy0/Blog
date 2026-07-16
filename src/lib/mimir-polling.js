export function shouldRerender(serverMessages, lastMsgCount, lastMsgTime) {
  const count = serverMessages.length;
  if (count === 0 && lastMsgCount === 0) return false;
  if (count !== lastMsgCount) return true;
  const serverLastTime = serverMessages[count - 1].time;
  return serverLastTime !== lastMsgTime;
}

export function trackingState(messages) {
  if (messages.length === 0) return { count: 0, time: 0 };
  return { count: messages.length, time: messages[messages.length - 1].time };
}
