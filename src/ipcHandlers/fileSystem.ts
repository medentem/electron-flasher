import { dialog, ipcMain, type BrowserWindow } from "electron";
import { list } from "drivelist";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import axios from "axios";
import { getAssetPath } from "../utils/assets";

let _mainWindow: BrowserWindow | undefined;

export function registerFileSystemHandlers(mainWindow: BrowserWindow) {
  _mainWindow = mainWindow;

  ipcMain.handle("get-drives", async (_event: any, _requestId: string) => {
    const drives = await list();
    const removableDrives = drives.filter((drive) => drive.isRemovable);
    return removableDrives;
  });

  ipcMain.handle("download-firmware", async (_event: any, fileUrl: string) => {
    // Create a temporary file path
    console.info(`Downloading firmware from ${fileUrl}`);
    const tempDir = os.tmpdir();
    const urlPath = new URL(fileUrl).pathname;
    let fileName = path.basename(urlPath);
    console.info(`Filename: ${fileName}`);

    // If the URL does not contain a filename, assign a default one
    if (!fileName || fileName.length === 0) {
      fileName = "downloaded_file";
    }

    const tempFilePath = path.join(tempDir, fileName);
    console.info(`Downloading firmware to ${tempFilePath}`);

    // Download the file
    const response = await axios({
      method: "GET",
      url: fileUrl,
      responseType: "stream",
    });

    // Save the file to temp directory
    const writer = fs.createWriteStream(tempFilePath);
    response.data.pipe(writer);

    // Wait for the download to finish
    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    return { fullPath: tempFilePath, fileName: fileName } as FileInfo;
  });

  ipcMain.handle("get-asset-path", async (_event: any, ...paths: string[]) => {
    return getAssetPath(...paths);
  });

  ipcMain.handle(
    "copy-firmware",
    async (_event: any, fileName: string, fromPath: string, toPath: string) => {
      const destination = path.join(toPath, fileName);
      try {
        await fs.promises.copyFile(fromPath, destination);
      } catch (err) {
        console.error(`Failed to copy file to ${destination}:`, err);
      }
    },
  );

  ipcMain.handle("select-file", async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [{ name: "Firmware", extensions: ["uf2", "bin"] }],
    });
    return canceled ? undefined : filePaths[0];
  });

  ipcMain.handle("get-filename", async (_event: any, filePath: string) => {
    return path.basename(filePath);
  });
}
