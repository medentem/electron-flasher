export function preloadApi(ipcRenderer: Electron.IpcRenderer) {
    return {
        apiRequest: (url: string) => ipcRenderer.invoke('api-request', url)
    };
  }