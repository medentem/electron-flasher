export function preloadPlatformIO(ipcRenderer: Electron.IpcRenderer) {
  return {
    checkPython: () => ipcRenderer.invoke("check-python"),
    checkPlatformIO: () => ipcRenderer.invoke("check-platformio"),
    installPython: () => ipcRenderer.invoke("install-python"),
  };
}
