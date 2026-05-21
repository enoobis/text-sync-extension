const statusEl = document.getElementById("status");
const saveBtn = document.getElementById("save");
const pasteBtn = document.getElementById("paste");
const clearBtn = document.getElementById("clear");

async function getTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function inject(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["content.js"]
  });
}

async function sendToPage(type, extra = {}) {
  const tab = await getTab();
  if (!tab?.id) throw new Error("нет вкладки");
  try {
    return await chrome.tabs.sendMessage(tab.id, { type, ...extra });
  } catch {
    await inject(tab.id);
    return chrome.tabs.sendMessage(tab.id, { type, ...extra });
  }
}

function setStatus(text) {
  statusEl.textContent = text;
}

async function refreshStatus() {
  const res = await chrome.runtime.sendMessage({ type: "load" });
  const n = res.snapshot?.length || 0;
  if (n === 0) {
    setStatus("пусто");
    pasteBtn.disabled = true;
  } else {
    setStatus(`сохранено полей: ${n}`);
    pasteBtn.disabled = false;
  }
}

saveBtn.addEventListener("click", async () => {
  saveBtn.disabled = true;
  try {
    const { snapshot } = await sendToPage("collect");
    if (!snapshot.length) {
      setStatus("поля не найдены");
      return;
    }
    await chrome.runtime.sendMessage({ type: "save", snapshot });
    setStatus(`сохранено: ${snapshot.length}`);
    pasteBtn.disabled = false;
  } catch (e) {
    setStatus("ошибка: " + e.message);
  } finally {
    saveBtn.disabled = false;
  }
});

pasteBtn.addEventListener("click", async () => {
  pasteBtn.disabled = true;
  try {
    const { snapshot } = await chrome.runtime.sendMessage({ type: "load" });
    if (!snapshot?.length) {
      setStatus("сначала сохраните");
      return;
    }
    const { filled } = await sendToPage("apply", { snapshot });
    setStatus(`вставлено: ${filled}`);
  } catch (e) {
    setStatus("ошибка: " + e.message);
  } finally {
    pasteBtn.disabled = false;
    refreshStatus();
  }
});

clearBtn.addEventListener("click", async () => {
  await chrome.runtime.sendMessage({ type: "clear" });
  setStatus("пусто");
  pasteBtn.disabled = true;
});

refreshStatus();
