const DEFAULT = { enabled: true, color: "#15202b", preset: "dim" };

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === "install") await chrome.storage.sync.set(DEFAULT);
  notifyTabs();
});

chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
  if (msg.type === "STATE_UPDATED") { notifyTabs(); reply({ ok: true }); }
  return true;
});

async function notifyTabs() {
  const tabs = await chrome.tabs.query({ url: ["https://x.com/*", "https://twitter.com/*"] });
  const state = await chrome.storage.sync.get(DEFAULT);
  for (const tab of tabs) {
    chrome.tabs.sendMessage(tab.id, { type: "APPLY_STATE", state }).catch(() => {});
  }
}
