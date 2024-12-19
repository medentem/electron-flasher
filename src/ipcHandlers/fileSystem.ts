import { dialog, ipcMain, type BrowserWindow } from "electron";
import { list } from "drivelist";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import axios from "axios";
import { getAssetPath } from "../utils/assets";
import AdmZip from "adm-zip";

let _mainWindow: BrowserWindow | undefined;

export function registerFileSystemHandlers(mainWindow: BrowserWindow) {
  _mainWindow = mainWindow;

  ipcMain.handle("get-drives", async (_event: any, _requestId: string) => {
    const drives = await list();
    const removableDrives = drives.filter((drive) => drive.isRemovable);
    return removableDrives;
  });

  ipcMain.handle(
    "get-custom-firmware-options",
    async (_event: any, fullPath: string) => {
      try {
        // 1. Determine the directory of the zip file
        const dirName = path.dirname(fullPath);

        // 2. Create a folder name based on the zip file name (without extension)
        const baseName = path.basename(fullPath, path.extname(fullPath));
        const extractDir = path.join(dirName, baseName);

        // Ensure the output directory doesn't exist or create it
        if (!fs.existsSync(extractDir)) {
          fs.mkdirSync(extractDir, { recursive: true });
        }

        // 3. Extract the contents of the zip file into the new folder
        const zip = new AdmZip(fullPath);
        zip.extractAllTo(extractDir, true);

        // 4. After extraction, read userPrefs.jsonc
        const userPrefsPath = path.join(
          extractDir,
          baseName.replace("v", "firmware-"),
          "userPrefs.jsonc",
        );

        // Check if the file exists
        if (!fs.existsSync(userPrefsPath)) {
          return undefined;
        }

        // Read the file contents
        let userPrefsContent = fs.readFileSync(userPrefsPath, "utf-8");
        // Uncomment all prefernces
        // Fix lines without ending commas
        userPrefsContent = userPrefsContent
          .replace(/\/\//g, "")
          .replace(/("[^"]+"\s*:\s*"[^"]+")\s*(?="[^"]+"\s*:)/g, "$1,");
        return createCustomFirmwareOptions(userPrefsContent);
      } catch (error: any) {
        return undefined;
      }
    },
  );

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

  ipcMain.handle("get-image-data", async (_event: any, ...paths: string[]) => {
    const imagePath = getAssetPath(...paths);
    const file = fs.readFileSync(imagePath);
    const base64Data = file.toString("base64");
    return base64Data;
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

function inferType(
  valueStr: string,
): "string" | "boolean" | "number" | "arrayOfHexValues" {
  const trimmed = valueStr.trim();

  if (trimmed === "true" || trimmed === "false") {
    return "boolean";
  }
  if (trimmed !== "" && !Number.isNaN(Number(trimmed))) {
    return "number";
  }
  if (/^\{.*\}$/.test(trimmed)) {
    return "arrayOfHexValues";
  }
  return "string";
}

function castValue(
  valueStr: string,
  type: "string" | "boolean" | "number" | "arrayOfHexValues",
): string {
  switch (type) {
    case "arrayOfHexValues": {
      const inner = valueStr.replace(/[{}]/g, "").trim();
      if (inner.length > 0) {
        const hexStrings = inner.split(",").map((s) => s.trim());
        const hexValues = hexStrings.map((hx) => Number.parseInt(hx, 16));
        // Convert array of bytes to a Buffer and then to Base64
        const buffer = Buffer.from(hexValues);
        return buffer.toString("base64");
      }
      return "";
    }
    default:
      return valueStr.trim();
  }
}

function createCustomFirmwareOptions(
  jsonString: string,
): CustomFirmwareOption[] {
  const obj = JSON.parse(jsonString) as Record<string, string>;
  const options: CustomFirmwareOption[] = [];

  for (const [paramName, valueStr] of Object.entries(obj)) {
    const type = inferType(valueStr);
    const castedValue = castValue(valueStr, type);
    // Split by underscore, lowercase, and then capitalize each part
    const parts = paramName
      .replace("USERPREFS_", "")
      .split("_")
      .map((part) => {
        const lower = part.toLowerCase();
        return lower.charAt(0).toUpperCase() + lower.slice(1);
      });

    // Join the parts with spaces
    const prettyName = parts.join(" ");
    options.push({
      name: paramName,
      prettyName,
      type,
      value: castedValue,
    });
  }

  return options;
}
