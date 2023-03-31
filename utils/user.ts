export function onlineCount() {
  let onlineCount = 0;
  return {
    add() {
      onlineCount++;
    },
    deduct() {
      onlineCount = onlineCount > 0 ? onlineCount-- : onlineCount;
    },
    get() {
      return onlineCount;
    },
  };
}
