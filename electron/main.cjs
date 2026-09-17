const { app, BrowserWindow, dialog, ipcMain, shell } = require("electron");
const fs = require("fs/promises");
const path = require("path");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1500,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: "#f5f6f8",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }
}

async function listFiles(dirPath, allowedExtensions, recursive = false) {
  const result = [];
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dirPath, entry.name);
      if (entry.isFile()) {
        const ext = path.extname(entry.name).slice(1).toLowerCase();
        if (!allowedExtensions || allowedExtensions.includes(ext)) {
          result.push({ name: entry.name, path: full, ext });
        }
      } else if (entry.isDirectory() && recursive) {
        result.push(...await listFiles(full, allowedExtensions, true));
      }
    }
  } catch {}
  return result;
}

async function scanFolder(rootPath) {
  const result = {
    source: rootPath,
    ai: [],
    links: [],
    export: [],
    fonts: [],
    linksFolder: "",
    exportFolder: "",
    fontsFolder: ""
  };

  try {
    const entries = await fs.readdir(rootPath, { withFileTypes: true });

    for (const entry of entries) {
      const full = path.join(rootPath, entry.name);
      if (entry.isFile() && path.extname(entry.name).toLowerCase() === ".ai") {
        result.ai.push({ name: entry.name, path: full, ext: "ai" });
      }

      if (entry.isDirectory()) {
        const folderName = entry.name.toLowerCase();
        if (folderName === "links") {
          result.linksFolder = full;
          result.links = await listFiles(full, ["psd", "psb"], true);
        }
        if (folderName === "export") {
          result.exportFolder = full;
          result.export = await listFiles(full, ["jpg", "jpeg", "png"], true);
        }
        if (folderName === "fonts") {
          result.fontsFolder = full;
          result.fonts = await listFiles(full, ["ttf", "otf", "woff", "woff2"], true);
        }
      }
    }
  } catch (error) {
    result.error = error.message;
  }

  return result;
}

ipcMain.handle("choose-folder", async () => {
  const response = await dialog.showOpenDialog(mainWindow, {
    title: "Select Task Source Folder",
    properties: ["openDirectory", "createDirectory"]
  });
  if (response.canceled || !response.filePaths[0]) return null;
  return response.filePaths[0];
});

ipcMain.handle("choose-workfile-folder", async () => {
  const response = await dialog.showOpenDialog(mainWindow, {
    title: "Select Workfile Location",
    properties: ["openDirectory", "createDirectory"]
  });
  if (response.canceled || !response.filePaths[0]) return null;
  return response.filePaths[0];
});

ipcMain.handle("scan-folder", async (_, rootPath) => {
  if (!rootPath) return null;
  return scanFolder(rootPath);
});

ipcMain.handle("open-path", async (_, targetPath) => {
  if (!targetPath) return { ok: false, error: "No path supplied" };
  const error = await shell.openPath(targetPath);
  return { ok: !error, error: error || null };
});

ipcMain.handle("rename-file", async (_, oldPath, newName) => {
  try {
    if (!oldPath || !newName) throw new Error("Missing file path or name");
    const cleanName = path.basename(String(newName).trim());
    if (!cleanName || cleanName === "." || cleanName === "..") throw new Error("Invalid file name");
    const newPath = path.join(path.dirname(oldPath), cleanName);
    if (path.normalize(newPath).toLowerCase() !== path.normalize(oldPath).toLowerCase()) {
      try {
        await fs.access(newPath);
        throw new Error("A file with that name already exists.");
      } catch (e) { if (e.code !== "ENOENT") throw e; }
    }
    await fs.rename(oldPath, newPath);
    return { ok: true, path: newPath, name: cleanName };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});

ipcMain.handle("path-exists", async (_, targetPath) => {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
});

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});