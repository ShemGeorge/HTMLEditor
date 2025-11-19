const { app, BrowserWindow, dialog } = require("electron");
const path = require("path");
let mainWindow;

app.setName("HTMLEditor");

function createWindow() {
mainWindow = new BrowserWindow({
width: 800,
height: 600,
icon: "HTMLEditorApp.ico",
webPreferences: {
preload: path.join(__dirname, "preload.js"),
nodeIntegration: true,
contextIsolation: true,
sandbox: true,
nativeWindowOpen: true
}
});
mainWindow.loadFile("HTMLEditorApp.html");
mainWindow.maximize();
mainWindow.webContents.on("will-prevent-unload", (event) => {
const choice = dialog.showMessageBoxSync(mainWindow, {
type: "question",
buttons: ["Leave", "Stay"],
defaultId: 1,
title: "Leave Site?",
message: "Changes you made may not be saved."
});
if (choice === 0) {
event.preventDefault();
}
});
mainWindow.on("closed", () => {
mainWindow = null;
});
}

app.on("ready", createWindow);

app.on("window-all-closed", () => {
if (process.platform !== "darwin") {
app.quit();
}
});

app.on("activate", () => {
if (mainWindow === null) {
createWindow();
}
});
