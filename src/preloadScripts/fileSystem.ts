export function preloadFileSystemAPIs(ipcRenderer: Electron.IpcRenderer) {
  return {
    getDrives: (requestId: string) =>
      ipcRenderer.invoke("get-drives", requestId),
    downloadFirmware: (fileUrl: string) =>
      ipcRenderer.invoke("download-firmware", fileUrl),
    copyFirmware: (fileName: string, fromPath: string, toPath: string) =>
      ipcRenderer.invoke("copy-firmware", fileName, fromPath, toPath),
    selectFile: () => ipcRenderer.invoke("select-file"),
    getFilename: (filePath: string) =>
      ipcRenderer.invoke("get-filename", filePath),
    getAssetPath: (...paths: string[]) =>
      ipcRenderer.invoke("get-asset-path", ...paths),
    getImageData: (...paths: string[]) =>
      ipcRenderer.invoke("get-image-data", ...paths),
  };
}
