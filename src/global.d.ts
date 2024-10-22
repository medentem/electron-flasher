import type { Drive } from "drivelist";

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
    onDeviceMetadata: (callback: (data: any) => void) => void;
    getAssetPath: (assetName: string) => string;
    enterDfuMode: () => Promise<void>;
    getDrives: (requestId: string) => Promise<Drive[]>;
    downloadFirmware: (fileUrl: string) => Promise<void>;
    copyFirmware: (
      fileName: string,
      fromPath: string,
      toPath: string,
    ) => Promise<void>;
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

  interface FileInfo {
    fullPath: string;
    fileName: string;
  }
}
