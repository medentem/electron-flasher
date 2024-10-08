// src/ipcHandlers/serialPorts.ts

import { ipcMain } from 'electron';
import { SerialPort } from 'serialport';

export function registerSerialPortHandlers() {
  ipcMain.handle('get-serial-ports', async () => {
    try {
      const ports = await SerialPort.list();
      return ports;
    } catch (error) {
      console.error('Error fetching serial ports:', error);
      throw error;
    }
  });

  ipcMain.handle('open-serial-port', async (_event, path: string) => {
    try {
      const port = new SerialPort({ path, baudRate: 115200 });
      return port;
    } catch (error) {
      console.error(`Error opening serial port ${path}:`, error);
      throw error;
    }
  });

  ipcMain.handle('close-serial-port', async (_event, path: string) => {
    try {
      // Retrieve and close the port instance
      return true;
    } catch (error) {
      console.error(`Error closing serial port ${path}:`, error);
      throw error;
    }
  });
}
