export function preloadPlatformIO(ipcRenderer: Electron.IpcRenderer) {
  return {
    checkPython: () => ipcRenderer.invoke("check-python"),
  };
}
