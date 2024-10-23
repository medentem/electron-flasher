// src/ipcHandlers/serialPorts.ts

import { ipcMain } from "electron";
import { SerialPort } from "serialport";
import { exec } from "node:child_process";
import wmi from "node-wmi";
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

let _mainWindow: BrowserWindow | undefined;
let connection: ElectronSerialConnection | undefined;
let port: SerialPort | undefined;
let canEnterFlashMode: boolean = false;

export function registerSerialPortHandlers(mainWindow: BrowserWindow) {
  _mainWindow = mainWindow;

  ipcMain.handle("get-serial-ports", async () => {
    try {
      const ports = await SerialPort.list();
      const enrichedPorts = await Promise.all(
        ports.map(async (port) => {
          let deviceName = "Unknown Device";
          if (process.platform === "darwin") {
            console.info("OSX detected - getting additional information.");
            deviceName = await getDeviceNameForMacOS(port.serialNumber);
          } else if (process.platform === "win32") {
            const wmiData = await getWmiDeviceInfo();
            const wmiDevice = wmiData.find(
              (device) => device.PNPDeviceID === port.pnpId,
            );
            if (wmiDevice) {
              deviceName = wmiDevice.Name || wmiDevice.Caption || deviceName;
            }
          }
          return {
            ...port,
            deviceName: deviceName || "Unknown Device",
          };
        }),
      );
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
      return;
    }
    await connection.disconnect();
    /** Set device if specified, else request. */
    port = new SerialPort({
      path,
      baudRate: 1200,
    });
    await sleep(1000);
    return port.isOpen;
  });

  ipcMain.handle(
    "update-esp32",
    async (_event: any, fileName: string, filePath: string, isUrl: boolean) => {
      if (!port) return;
      const transport = new Transport(port, true);
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
    console.log("connect-to-device");
  } catch (error) {
    console.error(`Error opening serial port ${path}:`, error);
    throw error;
  }
}

async function getDeviceNameForMacOS(
  portSerial: string,
): Promise<string | undefined> {
  return new Promise((resolve) => {
    exec("ioreg -p IOUSB -l -a", (error, stdout) => {
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

async function getWmiDeviceInfo(): Promise<any[]> {
  return new Promise((resolve) => {
    wmi.Query(
      {
        class: "Win32_SerialPort",
      },
      (err: any, result: any[]) => {
        if (err) {
          console.error("Error querying WMI:", err);
          resolve([]);
        } else {
          resolve(result);
        }
      },
    );
  });
}

async function connectEsp32(transport: Transport): Promise<ESPLoader> {
  const loaderOptions = <LoaderOptions>{
    transport,
    baudrate: 1200,
    enableTracing: false,
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
  await transport.setRTS(true);
  await new Promise((resolve) => setTimeout(resolve, 100));
  await transport.setRTS(false);
}
