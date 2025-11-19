const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("appAPI", {});
