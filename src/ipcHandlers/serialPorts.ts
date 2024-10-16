// src/ipcHandlers/serialPorts.ts

import { ipcMain } from "electron";
import { SerialPort } from "serialport";
import { exec } from "node:child_process";
import wmi from 'node-wmi';
import plist from 'plist';
import type { BrowserWindow } from "electron/main";
import { Client } from '@meshtastic/js';
import * as Protobuf from '@meshtastic/protobufs';

let _mainWindow: BrowserWindow | undefined;

export function registerSerialPortHandlers(mainWindow: BrowserWindow) {
  _mainWindow = mainWindow;
  console.log(_mainWindow);

  ipcMain.handle("get-serial-ports", async () => {
    try {
      const ports = await SerialPort.list();
      const enrichedPorts = await Promise.all(
        ports.map(async (port) => {
          let deviceName = 'Unknown Device';
          if (process.platform === "darwin") {
            console.info("OSX detected - getting additional information.");
            deviceName = await getDeviceNameForMacOS(port.serialNumber);
          } else if (process.platform === "win32") {
            const wmiData = await getWmiDeviceInfo();
            const wmiDevice = wmiData.find((device) => device.PNPDeviceID === port.pnpId);
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
    try {
      //await subscribeToPackets(mainWindow);
      const client = new Client();
      const connection = client.createElectronSerialConnection();
      connection.events.onDeviceMetadataPacket.subscribe((packet: any) => {
        console.log(packet);
      });
      await connection.connect({path, baudRate: 115200, concurrentLogOutput: false});
      await new Promise(_ => setTimeout(_, 15000));
      await connection.disconnect();
      console.log("connect-to-device");
    } catch (error) {
      console.error(`Error opening serial port ${path}:`, error);
      throw error;
    }
  });

  ipcMain.handle("disconnect-from-device", async (_event, path: string) => {
    try {
      console.log("disconnect-from-device");
    } catch (error) {
      console.error(`Error closing serial port ${path}:`, error);
      throw error;
    }
  });
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
        console.error('Error parsing ioreg output:', parseError);
        resolve(undefined);
      }
    });
  });
}

function findDeviceNameInIORegData(data: any, portSerial: string): string | undefined {
    if (Array.isArray(data)) {
      for (const item of data) {
        const result = findDeviceNameInIORegData(item, portSerial);
        if (result) {
          return result;
        }
      }
    } else if (typeof data === 'object' && data !== null) {
      if (data.kUSBSerialNumberString === portSerial) {
        return data['USB Product Name'] || data.kUSBProductString;
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
          class: 'Win32_SerialPort',
        },
        (err: any, result: any[]) => {
          if (err) {
            console.error('Error querying WMI:', err);
            resolve([]);
          } else {
            resolve(result);
          }
        }
      );
    });
  }