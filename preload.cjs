const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("desktop", {
  save: (payload) => ipcRenderer.invoke("save-file", payload),
  onAction: (fn) => ipcRenderer.on("action", (_e, action) => fn(action)),
});
