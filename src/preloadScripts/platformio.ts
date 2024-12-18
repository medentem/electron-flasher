export function preloadPlatformIO(ipcRenderer: Electron.IpcRenderer) {
  return {
    checkPython: () => ipcRenderer.invoke("check-python"),
    checkPlatformIO: () => ipcRenderer.invoke("check-platformio"),
    installPython: () => ipcRenderer.invoke("install-python"),
    installPlatformIO: () => ipcRenderer.invoke("install-platformio"),
    compileFirmware: (
      deviceString: string,
      zipPath: string,
      optionsJsonString: string,
    ) =>
      ipcRenderer.invoke(
        "compile-firmware",
        deviceString,
        zipPath,
        optionsJsonString,
      ),
  };
}
