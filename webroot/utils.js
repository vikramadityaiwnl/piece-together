export const sendMessage = (type, data) => {
  window.parent.postMessage({
    type,
    ...data
  }, '*');
}