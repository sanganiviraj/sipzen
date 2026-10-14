const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  updateTrayTitle: (title) => ipcRenderer.send("update-tray-title", title),
  sendNotification: (options) => ipcRenderer.send("send-notification", options),
  triggerReminderPopup: () => ipcRenderer.send("trigger-reminder-popup"),
  hideWindow: () => ipcRenderer.send("hide-window"),
  expandToDashboard: () => ipcRenderer.send("expand-to-dashboard"),
  onSetMode: (callback) => {
    const handler = (event, mode) => callback(mode);
    ipcRenderer.on("set-mode", handler);
    return () => ipcRenderer.removeListener("set-mode", handler);
  },
  quitApp: () => ipcRenderer.send("quit-app"),
});
