export function preloadSerialPortAPIs(ipcRenderer: Electron.IpcRenderer) {
  return {
    getSerialPorts: () => ipcRenderer.invoke("get-serial-ports"),
    connectToDevice: (path: string) =>
      ipcRenderer.invoke("connect-to-device", path),
    disconnectFromDevice: (path: string) =>
      ipcRenderer.invoke("disconnect-from-device", path),
    onDeviceMetadata: (callback: (data: any) => void) =>
      ipcRenderer.on("on-device-metadata", (_event, data) => callback(data)),
    enterDfuMode: () => ipcRenderer.invoke("enter-dfu-mode"),
    baud1200: (path: string) => ipcRenderer.invoke("baud-1200", path),
    updateEsp32: (
      devicePath: string,
      fileName: string,
      filePath: string,
      isUrl: boolean,
    ) => ipcRenderer.invoke("update-esp32", fileName, filePath, isUrl),
    onFlashProgress: (callback: (progress: number) => void) =>
      ipcRenderer.on("on-flash-progresss", (_event, progress) =>
        callback(progress),
      ),
  };
}
