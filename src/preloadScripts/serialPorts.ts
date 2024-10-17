
export function preloadSerialPortAPIs(ipcRenderer: Electron.IpcRenderer) {
  return {
    getSerialPorts: () => ipcRenderer.invoke('get-serial-ports'),
    connectToDevice: (path: string) => ipcRenderer.invoke('connect-to-device', path),
    disconnectFromDevice: (path: string) => ipcRenderer.invoke('disconnect-from-device', path),
    onDeviceMetadata: (callback: (data: any) => void) => ipcRenderer.on('on-device-metadata', (_event, data) => callback(data))
  };
}