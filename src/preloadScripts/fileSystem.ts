export function preloadFileSystemAPIs(ipcRenderer: Electron.IpcRenderer) {
  return {
    getDrives: (requestId: string) =>
      ipcRenderer.invoke("get-drives", requestId),
  };
}
