export {};

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }

  interface IElectronAPI {
    getSerialPorts: () => Promise<SerialPortInfo[]>;
    openSerialPort: (path: string) => Promise<boolean>;
    closeSerialPort: (path: string) => Promise<boolean>;
  }

  interface SerialPortInfo {
    path: string;
    manufacturer?: string;
    serialNumber?: string;
    pnpId?: string;
    locationId?: string;
    productId?: string;
    vendorId?: string;
  }
}