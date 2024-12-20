export function preloadFileSystemAPIs(ipcRenderer: Electron.IpcRenderer) {
  return {
    getDrives: (requestId: string) =>
      ipcRenderer.invoke("get-drives", requestId),
    downloadFirmware: (fileUrl: string) =>
      ipcRenderer.invoke("download-firmware", fileUrl),
    getCustomFirmwareOptions: (fullPath: string) =>
      ipcRenderer.invoke("get-custom-firmware-options", fullPath),
    parseCustomFirmwareOptions: (fullPath: string) =>
      ipcRenderer.invoke("parse-custom-firmware-options", fullPath),
    copyFirmware: (fileName: string, fromPath: string, toPath: string) =>
      ipcRenderer.invoke("copy-firmware", fileName, fromPath, toPath),
    selectFile: (extensions: string[]) =>
      ipcRenderer.invoke("select-file", extensions),
    getFilename: (filePath: string) =>
      ipcRenderer.invoke("get-filename", filePath),
    getAssetPath: (...paths: string[]) =>
      ipcRenderer.invoke("get-asset-path", ...paths),
    getImageData: (...paths: string[]) =>
      ipcRenderer.invoke("get-image-data", ...paths),
  };
}
