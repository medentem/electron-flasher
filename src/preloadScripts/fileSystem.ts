export function preloadFileSystemAPIs(ipcRenderer: Electron.IpcRenderer) {
  return {
    getDrives: (requestId: string) =>
      ipcRenderer.invoke("get-drives", requestId),
    downloadFirmware: (fileUrl: string) =>
      ipcRenderer.invoke("download-firmware", fileUrl),
    copyFirmware: (fileName: string, fromPath: string, toPath: string) =>
      ipcRenderer.invoke("copy-firmware", fileName, fromPath, toPath),
  };
}
