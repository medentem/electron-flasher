
export function preloadSerialPortAPIs(ipcRenderer: Electron.IpcRenderer) {
  return {
    getSerialPorts: () => ipcRenderer.invoke('get-serial-ports'),
    openSerialPort: (path: string) => ipcRenderer.invoke('open-serial-port', path),
    closeSerialPort: (path: string) => ipcRenderer.invoke('close-serial-port', path),
  };
}