function collectFields() {
  const fields = document.querySelectorAll(
    "input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=image]):not([type=reset]), textarea, select, [contenteditable=true]"
  );
  const items = [];
  fields.forEach((el, index) => {
    if (el.offsetParent === null && el.type !== "checkbox" && el.type !== "radio") return;

    let value = "";
    let kind = "text";

    if (el.isContentEditable) {
      value = el.innerText.trim();
      kind = "contenteditable";
    } else if (el.tagName === "SELECT") {
      value = el.value;
      kind = "select";
    } else if (el.type === "checkbox" || el.type === "radio") {
      value = el.checked ? "1" : "0";
      kind = el.type;
    } else {
      value = el.value;
    }

    if (!value && kind !== "checkbox" && kind !== "radio") return;

    items.push({
      index,
      kind,
      name: el.name || "",
      id: el.id || "",
      placeholder: el.placeholder || "",
      label: findLabel(el),
      aria: el.getAttribute("aria-label") || "",
      value
    });
  });
  return items;
}

function findLabel(el) {
  if (el.id) {
    const label = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
    if (label) return label.innerText.trim().slice(0, 80);
  }
  const parent = el.closest("label");
  if (parent) return parent.innerText.trim().slice(0, 80);
  return "";
}

function scoreField(el, item) {
  let score = 0;
  if (item.id && el.id === item.id) score += 100;
  if (item.name && el.name === item.name) score += 60;
  if (item.label && findLabel(el) === item.label) score += 40;
  if (item.placeholder && el.placeholder === item.placeholder) score += 30;
  if (item.aria && el.getAttribute("aria-label") === item.aria) score += 25;
  return score;
}

function applyFields(snapshot) {
  const fields = Array.from(
    document.querySelectorAll(
      "input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=image]):not([type=reset]), textarea, select, [contenteditable=true]"
    )
  ).filter((el) => el.offsetParent !== null || el.type === "checkbox" || el.type === "radio");

  let filled = 0;
  const used = new Set();

  snapshot.forEach((item) => {
    let best = null;
    let bestScore = 0;

    fields.forEach((el, i) => {
      if (used.has(i)) return;
      const s = scoreField(el, item);
      if (s > bestScore) {
        bestScore = s;
        best = { el, i };
      }
    });

    if (!best || bestScore < 25) {
      const byIndex = fields[item.index];
      if (byIndex && !used.has(item.index)) {
        best = { el: byIndex, i: item.index };
        bestScore = 10;
      }
    }

    if (!best) return;

    const { el, i } = best;
    used.add(i);
    setValue(el, item);
    filled += 1;
  });

  return filled;
}

function setValue(el, item) {
  if (el.isContentEditable) {
    el.innerText = item.value;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    return;
  }
  if (item.kind === "checkbox" || item.kind === "radio") {
    el.checked = item.value === "1";
    el.dispatchEvent(new Event("change", { bubbles: true }));
    return;
  }
  if (el.tagName === "SELECT") {
    const opt = Array.from(el.options).find((o) => o.value === item.value || o.text === item.value);
    if (opt) el.value = opt.value;
    else el.value = item.value;
    el.dispatchEvent(new Event("change", { bubbles: true }));
    return;
  }
  el.value = item.value;
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "collect") {
    sendResponse({ snapshot: collectFields() });
    return;
  }
  if (msg.type === "apply") {
    sendResponse({ filled: applyFields(msg.snapshot) });
    return;
  }
});
