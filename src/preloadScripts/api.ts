export function preloadApi(ipcRenderer: Electron.IpcRenderer) {
  return {
    apiRequest: <T>(url: string) => ipcRenderer.invoke("api-request", url) as T,
  };
}
