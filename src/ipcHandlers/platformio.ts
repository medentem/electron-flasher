// src/ipcHandlers/platformio.ts

import { execFile } from "node:child_process";
import { type BrowserWindow, ipcMain } from "electron";

let _mainWindow: BrowserWindow | undefined;
let _pythonCommand = "";

export function registerPlatformIOHandlers(mainWindow: BrowserWindow) {
  _mainWindow = mainWindow;

  ipcMain.handle("check-python", async (_event) => {
    const foundPython = await isPythonAvailable();
    return foundPython;
  });
}

function checkPythonCommand(command = "python") {
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

async function isPythonAvailable() {
  // Try 'python', then 'python3' if 'python' fails.
  return (
    (await checkPythonCommand("python")) ||
    (await checkPythonCommand("python3"))
  );
}
