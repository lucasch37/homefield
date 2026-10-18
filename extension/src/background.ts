// An open panel listens for subsequent toolbar clicks without storing listing data.
const panels = new Map<number, chrome.runtime.Port>();
chrome.runtime.onConnect.addListener(port => {
  if (!port.name.startsWith('hazard-panel:')) return;
  const windowId = Number(port.name.slice('hazard-panel:'.length));
  if (!Number.isInteger(windowId)) return;
  panels.set(windowId, port);
  port.onDisconnect.addListener(() => {
    if (panels.get(windowId) === port) panels.delete(windowId);
  });
});
chrome.action.onClicked.addListener(tab => {
  if (tab.windowId === undefined) return;
  // Keep open() directly in the user gesture handler.
  void chrome.sidePanel.open({ windowId: tab.windowId });
  panels.get(tab.windowId)?.postMessage({ type: 'analyze-listing' });
});
