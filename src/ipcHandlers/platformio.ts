// src/ipcHandlers/platformio.ts

import { execFile } from "node:child_process";
import path from "node:path";
import { type BrowserWindow, ipcMain } from "electron";

let _mainWindow: BrowserWindow | undefined;
let _pythonCommand = "";

export function registerPlatformIOHandlers(mainWindow: BrowserWindow) {
  _mainWindow = mainWindow;

  ipcMain.handle("check-python", async (_event) => {
    const foundPython = await isPythonAvailable();
    return foundPython;
  });

  ipcMain.handle("check-platformio", async (_event) => {
    const foundPIO = await checkPlatformIO();
    return foundPIO;
  });

  ipcMain.handle("install-python", async (_event) => {
    if (process.platform === "darwin") {
      return await installPythonOnMac();
    }
    if (process.platform === "win32") {
      return await installPythonOnWindows();
    }
    return await installPythonOnLinux();
  });

  ipcMain.handle("install-platformio", async (_event) => {
    const foundPIO = await installPlatformIO(_pythonCommand);
    return foundPIO;
  });

  ipcMain.handle(
    "compile-firmware",
    async (
      _event,
      deviceString: string,
      zipPath: string,
      optionsJsonString: string,
    ) => {
      // TODO: write the optionsJSONString to userPrefs.jsonc in the folderPath
      console.log("IPC HANDLER: compile-firmware");
      console.log(deviceString);
      console.log(zipPath);
      console.log(optionsJsonString);

      const dirName = path.dirname(zipPath);
      const baseName = path.basename(zipPath, path.extname(zipPath));
      const extractDir = path.join(dirName, baseName);
      const sourceCodePath = path.join(
        extractDir,
        baseName.replace("v", "firmware-"),
      );
      console.log(sourceCodePath);
      execFile(
        "platformio",
        ["run", "-e", deviceString],
        { cwd: sourceCodePath },
        (error, stdout, stderr) => {
          if (error) {
            console.error("Build failed:", stderr);
          } else {
            console.log("Build success:", stdout);
          }
        },
      );
    },
  );
}

async function installPlatformIO(pythonCommand = "python") {
  return new Promise((resolve, reject) => {
    // Attempt to install using pip. We use `-m pip install platformio` to ensure
    // we run pip associated with the given Python.
    execFile(
      pythonCommand,
      ["-m", "pip", "install", "platformio"],
      (error, stdout, stderr) => {
        if (error) {
          console.error("Failed to install platformio:", stderr);
          reject(error);
        } else {
          console.log("PlatformIO installed successfully:", stdout);
          resolve(true);
        }
      },
    );
  });
}

async function checkPythonCommand(command = "python") {
  return new Promise((resolve) => {
    execFile(command, ["--version"], (error, stdout, stderr) => {
      if (error) {
        console.log(`${command} not found: ${error}`);
        resolve(false);
      } else {
        console.log(`${command} found!`);
        _pythonCommand = command;
        resolve(true);
      }
    });
  });
}

async function checkPlatformIO() {
  return new Promise((resolve) => {
    execFile("platformio", ["--version"], (error, stdout, stderr) => {
      if (error) {
        // platformio is not installed or not on PATH
        resolve(false);
      } else {
        // platformio is installed
        console.log(`PlatformIO version: ${stdout.trim()}`);
        resolve(true);
      }
    });
  });
}

async function isPythonAvailable() {
  // Try 'python', then 'python3' if 'python' fails.
  return (
    (await checkPythonCommand("python")) ||
    (await checkPythonCommand("python3"))
  );
}

async function installPythonOnWindows() {
  const installerPath = path.join(
    process.resourcesPath,
    "python-installer.exe",
  );

  // These arguments are for a silent install, adjust as necessary:
  const installerArgs = ["/quiet", "InstallAllUsers=1", "PrependPath=1"];

  return new Promise((resolve, reject) => {
    execFile(installerPath, installerArgs, (error) => {
      if (error) {
        console.error("Python installation failed:", error);
        reject(error);
      } else {
        console.log("Python installed successfully.");
        resolve(true);
      }
    });
  });
}

async function isHomebrewAvailable() {
  return new Promise((resolve) => {
    execFile("which", ["brew"], (error, stdout) => {
      if (error || !stdout.trim()) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

async function installPythonOnMac() {
  const homebrewAvailable = await isHomebrewAvailable();
  if (!homebrewAvailable) {
    throw new Error(
      "Homebrew not available. Cannot auto-install Python silently on macOS.",
    );
  }

  return new Promise((resolve, reject) => {
    // 'brew install python' is a shell command, but we can run brew directly:
    execFile("brew", ["install", "python"], (error, stdout, stderr) => {
      if (error) {
        console.error("Failed to install Python via Homebrew:", stderr);
        reject(error);
      } else {
        console.log("Python installed via Homebrew.");
        resolve(true);
      }
    });
  });
}

async function installPythonOnLinux() {
  // This command will require sudo and user password. Running it directly from Electron is challenging.
  return new Promise((resolve, reject) => {
    execFile("sudo", ["apt-get", "update"], (updateError) => {
      if (updateError) return reject(updateError);

      execFile(
        "sudo",
        ["apt-get", "install", "-y", "python3"],
        (installError) => {
          if (installError) {
            reject(installError);
          } else {
            console.log("Python installed via apt-get.");
            resolve(true);
          }
        },
      );
    });
  });
}
