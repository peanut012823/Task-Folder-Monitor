const { contextBridge, ipcRenderer, webUtils } = require("electron");

contextBridge.exposeInMainWorld("desktop", {
  chooseFolder: () => ipcRenderer.invoke("choose-folder"),
  chooseWorkfileFolder: () => ipcRenderer.invoke("choose-workfile-folder"),
  scanFolder: (folder) => ipcRenderer.invoke("scan-folder", folder),
  openPath: (filePath) => ipcRenderer.invoke("open-path", filePath),
  renameFile: (oldPath, newName) => ipcRenderer.invoke("rename-file", oldPath, newName),
  pathExists: (filePath) => ipcRenderer.invoke("path-exists", filePath),
  getPathForFile: (file) => {
    try { return webUtils.getPathForFile(file); }
    catch { return ""; }
  }
});