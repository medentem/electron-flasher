export {};

declare global {

interface Navigator {
    serial: any;
}

  interface Window {
    electronAPI: IElectronAPI;
  }

  interface IElectronAPI {
    getSerialPorts: () => Promise<SerialPortInfo[]>;
    connectToDevice: (path: string) => Promise<void>;
    disconnectFromDevice: (path: string) => Promise<void>;
    apiRequest: (url: string) => Promise<any>;
  }

  interface SerialPortInfo {
    path: string;
    manufacturer?: string;
    serialNumber?: string;
    pnpId?: string;
    locationId?: string;
    productId?: string;
    vendorId?: string;
    deviceName?: string;
  }
}