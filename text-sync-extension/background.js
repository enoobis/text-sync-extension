chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "save") {
    chrome.storage.local.set({ snapshot: msg.snapshot }, () => {
      sendResponse({ ok: true, count: msg.snapshot.length });
    });
    return true;
  }
  if (msg.type === "load") {
    chrome.storage.local.get("snapshot", (data) => {
      sendResponse({ snapshot: data.snapshot || [] });
    });
    return true;
  }
  if (msg.type === "clear") {
    chrome.storage.local.remove("snapshot", () => sendResponse({ ok: true }));
    return true;
  }
});
