// src/ipcHandlers/serialPorts.ts

import { ipcMain, WebContentsView } from "electron";
import { SerialPort as ElectronSerialPort } from "serialport";
import { execFile } from "node:child_process";
import plist from "plist";
import type { BrowserWindow } from "electron/main";
import { Client, type ElectronSerialConnection } from "@meshtastic/js";
import { sleep } from "../utils/promise";
import { arrayBufferToBinaryString } from "blob-util";
import AdmZip from "adm-zip";
import {
  ESPLoader,
  type FlashOptions,
  type LoaderOptions,
  Transport,
} from "esptool-js";
import axios from "axios";
import { ElectronSerialPortWrapper } from "../utils/electronSerialPortWrapper";
import fs from "node:fs";
import path from "node:path";

let _mainWindow: BrowserWindow | undefined;
let connection: ElectronSerialConnection | undefined;
let port: ElectronSerialPort | undefined;
let canEnterFlashMode: boolean = false;

export function registerSerialPortHandlers(mainWindow: BrowserWindow) {
  _mainWindow = mainWindow;

  ipcMain.handle("get-serial-ports", async () => {
    try {
      const enrichedPorts = await getEnrichedPorts();
      return enrichedPorts;
    } catch (error) {
      console.error("Error fetching serial ports:", error);
      throw error;
    }
  });

  ipcMain.handle("connect-to-device", async (_event, path: string) => {
    await connectToDevice(path);
  });

  ipcMain.handle("enter-dfu-mode", async (_event) => {
    if (!canEnterFlashMode || !connection) {
      console.error("Device not ready for flash mode");
      return;
    }
    connection.enterDfuMode();
  });

  ipcMain.handle("baud-1200", async (_event, path: string) => {
    if (!canEnterFlashMode || !connection) {
      console.error("Device not ready for flash mode");
      return false;
    }
    await connection.disconnect();
    return await baud1200(path);
  });

  ipcMain.handle(
    "clean-update-esp32",
    async (
      _event: any,
      fileName: string,
      otaFileName: string,
      littleFsFileName: string,
      filePath: string,
      isUrl: boolean,
    ) => {
      console.info("Handling clean-update-esp32.");
      const webSerialPort = await getBaud1200Port();
      const transport = new Transport(webSerialPort, true);
      const espLoader = await connectEsp32(transport);
      const appContent = await fetchBinaryContent(fileName, filePath, isUrl);
      const otaContent = await fetchBinaryContent(otaFileName, filePath, isUrl);
      const littleFsContent = await fetchBinaryContent(
        littleFsFileName,
        filePath,
        isUrl,
      );
      const flashOptions: FlashOptions = {
        fileArray: [
          { data: appContent, address: 0x00 },
          { data: otaContent, address: 0x260000 },
          { data: littleFsContent, address: 0x300000 },
        ],
        flashSize: "keep",
        eraseAll: true,
        compress: true,
        flashMode: "keep",
        flashFreq: "keep",
        reportProgress: (fileIndex, written, total) => {
          const flashPercentDone = Math.round((written / total) * 100);
          _mainWindow.webContents.send("on-flash-progress", flashPercentDone);
          console.info(`Flash Progres: ${flashPercentDone}`);
          if (written === total) {
            console.info("Done flashing!");
          }
        },
      };
      await startWrite(espLoader, transport, flashOptions);
    },
  );

  ipcMain.handle(
    "update-esp32",
    async (_event: any, fileName: string, filePath: string, isUrl: boolean) => {
      console.info("Handling update-esp32.");
      const webSerialPort = await getBaud1200Port();
      const transport = new Transport(webSerialPort, true);
      const espLoader = await connectEsp32(transport);
      const content = await fetchBinaryContent(fileName, filePath, isUrl);
      const flashOptions: FlashOptions = {
        fileArray: [{ data: content, address: 0x10000 }],
        flashSize: "keep",
        eraseAll: false,
        compress: true,
        flashMode: "keep",
        flashFreq: "keep",
        reportProgress: (fileIndex, written, total) => {
          const flashPercentDone = Math.round((written / total) * 100);
          _mainWindow.webContents.send("on-flash-progress", flashPercentDone);
          console.info(`Flash Progres: ${flashPercentDone}`);
          if (written === total) {
            console.info("Done flashing!");
          }
        },
      };
      await startWrite(espLoader, transport, flashOptions);
    },
  );

  ipcMain.handle("disconnect-from-device", async (_event, path: string) => {
    try {
      if (connection) {
        await connection.disconnect();
        connection = undefined;
      }
    } catch (error) {
      console.error(`Error closing serial port ${path}:`, error);
      throw error;
    }
  });
}

async function getBaud1200Port() {
  const portList = await getEnrichedPorts();
  console.info(`New Port List: ${JSON.stringify(portList)}`);
  const baud1200Port = portList.find(
    (x) =>
      x.deviceName.toLowerCase().includes("jtag") ||
      x.manufacturer?.toLowerCase().includes("expressif"),
  );
  console.info(`Found Port: ${JSON.stringify(baud1200Port)}`);

  const webSerialPort = new ElectronSerialPortWrapper(
    baud1200Port.path,
    115200,
    {
      usbProductId: Number.parseInt(baud1200Port.productId, 16),
      usbVendorId: Number.parseInt(baud1200Port.vendorId, 16),
    },
    false,
  );
  return webSerialPort;
}

async function baud1200(path: string) {
  /** Set device if specified, else request. */
  port = new ElectronSerialPort({
    path,
    baudRate: 1200,
    autoOpen: false,
  });
  return new Promise<boolean>((resolve, _reject) => {
    port.open();
    sleep(3000).then(() => {
      port.close(() => {
        resolve(true);
      });
    });
  });
}

async function getEnrichedPorts() {
  const ports = await ElectronSerialPort.list();
  const enrichedPorts = await Promise.all(
    ports.map(async (port) => {
      let deviceName = "Unknown Device";
      if (process.platform === "darwin") {
        console.info("OSX detected - getting additional information.");
        deviceName = await getDeviceNameForMacOS(port.serialNumber);
      } else if (process.platform === "win32") {
        const wmiData = await getWmiDeviceInfo();
        console.log(wmiData);
        const wmiDevice = wmiData.find(
          (device) =>
            device.DeviceID &&
            port.pnpId &&
            device.DeviceID.toLowerCase().includes(port.pnpId.toLowerCase()),
        );
        if (wmiDevice) {
          deviceName = `${wmiDevice.Name} ${wmiDevice.Description} ${wmiDevice.Manufacturer}`;
        }
      } else if (process.platform === "linux") {
        deviceName = await getDeviceNameLinux(port.path);
      }
      return {
        ...port,
        deviceName: deviceName || "Unknown Device",
      };
    }),
  );
  console.log(enrichedPorts);
  return enrichedPorts;
}

async function getDeviceNameLinux(
  portPath: string,
): Promise<string | undefined> {
  let deviceName = await getDeviceNameFromSymlinks(portPath);
  if (!deviceName) {
    deviceName = await getDeviceNameFromUdevadm(portPath);
  }
  return deviceName;
}

function parseSymlinkName(symlinkName: string): string {
  // Replace underscores with spaces and remove prefixes
  const name = symlinkName
    .replace(/_/g, " ")
    .replace(/^usb-/, "")
    .replace(/-if.*$/, "");
  return name;
}

async function getDeviceNameFromSymlinks(
  portPath: string,
): Promise<string | undefined> {
  const symlinkDir = "/dev/serial/by-id/";
  try {
    const files = await fs.promises.readdir(symlinkDir);
    for (const file of files) {
      const symlinkPath = path.join(symlinkDir, file);
      const realPath = await fs.promises.realpath(symlinkPath);
      if (realPath === portPath) {
        const deviceName = parseSymlinkName(file);
        return deviceName;
      }
    }
  } catch (error) {
    console.error("Error reading symlink directory:", error);
  }
  return undefined;
}

async function getDeviceNameFromUdevadm(
  portPath: string,
): Promise<string | undefined> {
  return new Promise((resolve) => {
    execFile(
      "udevadm",
      ["info", "--query=property", `--name=${portPath}`],
      (error, stdout) => {
        if (error) {
          console.error("Error executing udevadm:", error);
          resolve(undefined);
          return;
        }

        const properties = stdout
          .split("\n")
          .reduce((acc: Record<string, string>, line) => {
            const [key, value] = line.split("=");
            if (key && value) {
              acc[key] = value;
            }
            return acc;
          }, {});

        const deviceName =
          properties.ID_MODEL || properties.ID_SERIAL || properties.ID_VENDOR;
        resolve(deviceName);
      },
    );
  });
}

async function connectToDevice(path: string) {
  try {
    const client = new Client();
    try {
      if (connection) {
        await connection.disconnect();
        connection = undefined;
      }
    } catch (error) {
      console.error(`Error closing serial port ${path}:`, error);
      throw error;
    }
    connection = client.createElectronSerialConnection();
    connection.events.onFromRadio.subscribe((packet: any) => {
      if (packet?.payloadVariant?.case === "configCompleteId") {
        canEnterFlashMode = true;
      }
    });
    connection.events.onDeviceMetadataPacket.subscribe((packet: any) => {
      _mainWindow.webContents.send("on-device-metadata", packet);
    });
    await connection.connect({
      path,
      baudRate: 115200,
      concurrentLogOutput: false,
    });
  } catch (error) {
    console.error(`Error opening serial port ${path}:`, error);
    throw error;
  }
}

async function getDeviceNameForMacOS(
  portSerial: string,
): Promise<string | undefined> {
  return new Promise((resolve) => {
    const command = "ioreg";
    const args = ["-p", "IOUSB", "-l", "-a"];

    execFile(command, args, (error, stdout) => {
      if (error) {
        console.error("Error executing ioreg:", error);
        resolve(undefined);
        return;
      }

      try {
        const data = plist.parse(stdout);
        const deviceName = findDeviceNameInIORegData(data, portSerial);
        resolve(deviceName);
      } catch (parseError) {
        console.error("Error parsing ioreg output:", parseError);
        resolve(undefined);
      }
    });
  });
}

function findDeviceNameInIORegData(
  data: any,
  portSerial: string,
): string | undefined {
  if (Array.isArray(data)) {
    for (const item of data) {
      const result = findDeviceNameInIORegData(item, portSerial);
      if (result) {
        return result;
      }
    }
  } else if (typeof data === "object" && data !== null) {
    if (data.kUSBSerialNumberString === portSerial) {
      return data["USB Product Name"] || data.kUSBProductString;
    }
    for (const key of Object.keys(data)) {
      const result = findDeviceNameInIORegData(data[key], portSerial);
      if (result) {
        return result;
      }
    }
  }
  return undefined;
}

async function getWmiDeviceInfo(): Promise<WMICDevice[]> {
  return new Promise((resolve) => {
    const command = "wmic";
    const args = [
      "path",
      "Win32_PnPEntity",
      "where",
      "\"ConfigManagerErrorCode = 0 AND PNPClass = 'Ports'\"",
      "get",
      "DeviceID,Name,Description,Manufacturer,HardwareID",
      "/format:csv",
    ];

    try {
      execFile(command, args, (error, stdout, stderr) => {
        if (error) {
          console.error("WMIC Execution Error:", error);
          return;
        }

        const lines = stdout
          .trim()
          .split("\n")
          .filter((line) => line.trim() !== "");
        const devices = [];

        // Skip the header line
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          const columns = line.split(",");

          // Ensure we have all expected columns
          if (columns.length >= 5) {
            const [
              node,
              deviceId,
              name,
              description,
              manufacturer,
              hardwareId,
            ] = columns;

            devices.push({
              DeviceID: deviceId.trim(),
              Name: name.trim(),
              Description: description.trim(),
              Manufacturer: manufacturer.trim(),
              HardwareID: hardwareId.trim(),
            });
          }
        }
        resolve(devices);
      });
    } catch {
      resolve([]);
    }
  });
}

async function connectEsp32(transport: Transport): Promise<ESPLoader> {
  const loaderOptions = <LoaderOptions>{
    transport,
    baudrate: 115200,
    enableTracing: false,
    debugLogging: false,
  };
  const espLoader = new ESPLoader(loaderOptions);
  const chip = await espLoader.main();
  console.log("Detected chip:", chip);
  return espLoader;
}

async function fetchBinaryContent(
  fileName: string,
  filePath: string,
  isUrl: boolean,
): Promise<string> {
  if (isUrl) {
    // Download the file
    const response = await axios({
      method: "GET",
      url: filePath,
      responseType: "arraybuffer",
    });
    return arrayBufferToBinaryString(response.data);
  }
  if (filePath.endsWith(".zip")) {
    const zipReader = new AdmZip(filePath);
    const file = zipReader.getEntries().find((entry) => {
      if (fileName.startsWith("firmware-tbeam-."))
        return (
          !entry.entryName.includes("s3") &&
          new RegExp(fileName).test(entry.entryName) &&
          fileName.endsWith("update.bin") ===
            entry.entryName.endsWith("update.bin")
        );
      return (
        new RegExp(fileName).test(entry.entryName) &&
        fileName.endsWith("update.bin") ===
          entry.entryName.endsWith("update.bin")
      );
    });
    if (file) {
      console.log("Found file:", file.entryName);
      const buffer = file.getData();
      return arrayBufferToBinaryString(buffer.buffer);
    }
  } else {
    const buffer = fs.readFileSync(filePath, null).buffer;
    return arrayBufferToBinaryString(buffer);
  }
  throw new Error(
    "Cannot fetch binary content without a file or firmware selected",
  );
}

async function startWrite(
  espLoader: ESPLoader,
  transport: Transport,
  flashOptions: FlashOptions,
) {
  await espLoader.writeFlash(flashOptions);
  await resetEsp32(transport);
}

async function resetEsp32(transport: Transport) {
  console.info("Resetting ESP32...");
  await transport.setRTS(true);
  await new Promise((resolve) => setTimeout(resolve, 100));
  await transport.setRTS(false);
  console.info("Reset sent.");
}
