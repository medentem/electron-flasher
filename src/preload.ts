// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from "electron";
import { preloadSerialPortAPIs } from "./preloadScripts/serialPorts";
import { preloadApi } from "./preloadScripts/api";
import { preloadFileSystemAPIs } from "./preloadScripts/fileSystem";
import { preloadPlatformIO } from "./preloadScripts/platformio";

contextBridge.exposeInMainWorld("electronAPI", {
  ...preloadSerialPortAPIs(ipcRenderer),
  ...preloadApi(ipcRenderer),
  ...preloadFileSystemAPIs(ipcRenderer),
  ...preloadPlatformIO(ipcRenderer),
});
