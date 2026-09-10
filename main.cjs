const { app, BrowserWindow, Menu, ipcMain, dialog } = require("electron");
const path = require("node:path");
const fs = require("node:fs/promises");
let win;
app.setName("Dither Studio");
function createWindow() {
  win = new BrowserWindow({
    width: 1440,
    height: 1000,
    minWidth: 1000,
    minHeight: 720,
    backgroundColor: "#101110",
    title: "Dither Studio",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  win.loadFile("index.html");
  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  win.webContents.on("will-navigate", (e) => e.preventDefault());
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      {
        label: "Dither Studio",
        submenu: [{ role: "about" }, { type: "separator" }, { role: "quit" }],
      },
      {
        label: "File",
        submenu: [
          {
            label: "Open images…",
            accelerator: "CmdOrCtrl+O",
            click: () => win.webContents.send("action", "open"),
          },
          {
            label: "Export PNG…",
            accelerator: "CmdOrCtrl+S",
            click: () => win.webContents.send("action", "export"),
          },
        ],
      },
      { role: "editMenu" },
      { role: "viewMenu" },
    ]),
  );
}
ipcMain.handle("save-file", async (event, { name, bytes }) => {
  if (
    event.sender !== win.webContents ||
    !ArrayBuffer.isView(bytes) ||
    bytes.byteLength > 512 * 1024 * 1024
  )
    throw Error("Invalid export");
  const ext = path.extname(name).slice(1);
  if (!["png", "zip", "json"].includes(ext)) throw Error("Unsupported export");
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    defaultPath: path.basename(name),
    filters: [{ name: ext.toUpperCase(), extensions: [ext] }],
  });
  if (canceled) return false;
  await fs.writeFile(filePath, Buffer.from(bytes));
  return true;
});
app.whenReady().then(createWindow);
app.on("window-all-closed", () => app.quit());
