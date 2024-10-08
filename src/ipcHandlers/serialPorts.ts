// src/ipcHandlers/serialPorts.ts

import { ipcMain } from "electron";
import { SerialPort } from "serialport";
import { exec } from "node:child_process";
import wmi from 'node-wmi';
import plist from 'plist';

export function registerSerialPortHandlers() {
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

  ipcMain.handle("open-serial-port", async (_event, path: string) => {
    try {
      const port = new SerialPortInfo({ path, baudRate: 115200 });
      return "Connected";
    } catch (error) {
      console.error(`Error opening serial port ${path}:`, error);
      throw error;
    }
  });

  ipcMain.handle("close-serial-port", async (_event, path: string) => {
    try {
      // Retrieve and close the port instance
      return true;
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