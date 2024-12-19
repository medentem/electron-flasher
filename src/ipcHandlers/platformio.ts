// src/ipcHandlers/platformio.ts

import { execFile, spawn } from "node:child_process";
import path from "node:path";
import { type BrowserWindow, ipcMain } from "electron";
import fs from "node:fs";

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

  ipcMain.handle("get-source-code-path", async (_event, zipPath: string) => {
    const dirName = path.dirname(zipPath);
    const baseName = path.basename(zipPath, path.extname(zipPath));
    const extractDir = path.join(dirName, baseName);
    const sourceCodePath = path.join(
      extractDir,
      baseName.replace("v", "firmware-"),
    );
    console.log(sourceCodePath);
    return sourceCodePath;
  });

  ipcMain.handle(
    "compile-firmware",
    async (
      _event,
      deviceString: string,
      sourceCodePath: string,
      optionsJsonString: string,
    ) => {
      // TODO: write the optionsJSONString to userPrefs.jsonc in the folderPath

      console.log("IPC HANDLER: compile-firmware");
      console.log(deviceString);
      console.log(sourceCodePath);
      console.log(optionsJsonString);

      const srcDir = path.join(sourceCodePath, "src");
      const allFiles = findAllCppFiles(srcDir);
      const totalFiles = allFiles.length;
      console.log("Total files to compile:", totalFiles);

      return new Promise((resolve, reject) => {
        // Spawn platformio build
        const pio = spawn("platformio", ["run", "-e", deviceString], {
          cwd: sourceCodePath,
        });

        let compiledCount = 0;

        pio.stdout.on("data", (data) => {
          const line = data.toString();

          // Check if line indicates a compiled file, for example:
          // "Compiling .pio/build/heltec_esp32/src/main.cpp.o"
          if (line.includes("Compiling") && line.includes(".cpp")) {
            compiledCount++;
            const percentage = Math.round((compiledCount / totalFiles) * 100);

            // Send progress update to the renderer
            if (_mainWindow) {
              _mainWindow.webContents.send("on-build-progress", percentage);
            }
          }

          console.log(`stdout: ${line}`);
        });

        pio.stderr.on("data", (data) => {
          console.error(`stderr: ${data}`);
        });

        pio.on("close", (code) => {
          console.log(`PlatformIO process exited with code: ${code}`);
          if (code === 0) {
            console.log("Build succeeded.");
            // Send 100% just to finalize
            if (_mainWindow) {
              _mainWindow.webContents.send("on-build-progress", 100);
            }
            // Only now that the build is done, get the firmware file path
            const firmwarePath = getCompiledFirmwareFilePath(
              sourceCodePath,
              deviceString,
            );
            if (firmwarePath) {
              resolve(firmwarePath);
            } else {
              reject(
                new Error("Firmware file not found after successful build."),
              );
            }
          } else {
            console.error("Build failed.");
            reject(new Error(`Build failed with exit code ${code}.`));
          }
        });
      });
    },
  );
}

function findAllCppFiles(dir: string) {
  let results: string[] = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of list) {
    const filePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(findAllCppFiles(filePath));
    } else if (entry.isFile() && filePath.endsWith(".cpp")) {
      results.push(filePath);
    }
  }
  return results;
}

function getCompiledFirmwareFilePath(
  sourceCodePath: string,
  deviceString: string,
) {
  const buildFolder = path.join(sourceCodePath, ".pio", "build", deviceString);

  // Possible firmware filenames
  const possibleFiles = ["firmware.uf2", "firmware.factory.bin"];

  for (const filename of possibleFiles) {
    const filePath = path.join(buildFolder, filename);
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }

  // If neither file exists, return null or throw an error
  return null;
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
