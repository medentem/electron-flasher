export function preloadPlatformIO(ipcRenderer: Electron.IpcRenderer) {
  return {
    checkPython: () => ipcRenderer.invoke("check-python"),
    checkPlatformIO: () => ipcRenderer.invoke("check-platformio"),
    installPython: () => ipcRenderer.invoke("install-python"),
    installPlatformIO: () => ipcRenderer.invoke("install-platformio"),
    getSourceCodePath: (zipPath: string) =>
      ipcRenderer.invoke("get-source-code-path", zipPath),
    compileFirmware: (
      deviceString: string,
      sourceCodePath: string,
      optionsJsonString: string,
    ) =>
      ipcRenderer.invoke(
        "compile-firmware",
        deviceString,
        sourceCodePath,
        optionsJsonString,
      ),
    onBuildProgress: (callback: (progress: number) => void) =>
      ipcRenderer.on("on-build-progress", (_event, progress) =>
        callback(progress),
      ),
  };
}
