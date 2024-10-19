export function preloadFileSystemAPIs(ipcRenderer: Electron.IpcRenderer) {
  return {
    getDrives: () => ipcRenderer.invoke("get-drives"),
  };
}
