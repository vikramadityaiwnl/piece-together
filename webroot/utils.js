export const sendMessage = (type, data) => {
  window.parent.postMessage({
    type,
    ...data
  }, '*');
};

export const getCooldownMessage = (remainingSeconds) => {
  return `Please wait ${remainingSeconds} seconds before your next move`;
};

export const formatRemainingTime = (ms) => {
  return Math.ceil(ms / 1000);
};