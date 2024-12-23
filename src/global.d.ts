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
    apiRequest: <T>(url: string) => Promise<T>;
    onDeviceMetadata: (callback: (data: any) => void) => void;
    enterDfuMode: () => Promise<void>;
    getDrives: (requestId: string) => Promise<Drive[]>;
    downloadFirmware: (fileUrl: string) => Promise<FileInfo>;
    getCustomFirmwareOptions: (
      fullPath: string,
    ) => Promise<CustomFirmwareOption[] | undefined>;
    parseCustomFirmwareOptions: (
      fullPath: string,
    ) => Promise<CustomFirmwareOption[] | undefined>;
    copyFirmware: (
      fileName: string,
      fromPath: string,
      toPath: string,
    ) => Promise<void>;
    selectFile: (extensions: string[]) => Promise<string | undefined>;
    getFilename: (filePath: string) => Promise<string>;
    baud1200: (path: string) => Promise<boolean>;
    updateEsp32: (
      fileName: string,
      filePath: string,
      isUrl: boolean,
    ) => Promise<void>;
    cleanUpdateEsp32: (
      fileName: string,
      otaFileName: string,
      littleFsFileName: string,
      filePath: string,
      isUrl: boolean,
    ) => Promise<void>;
    onFlashProgress: (callback: (progress: number) => void) => void;
    getAssetPath: (...paths: string[]) => Promise<string>;
    getImageData: (...paths: string[]) => Promise<string>;
    checkPython: () => Promise<boolean>;
    checkPlatformIO: () => Promise<boolean>;
    installPython: () => Promise<boolean>;
    installPlatformIO: () => Promise<boolean>;
    compileFirmware: (
      deviceString: string,
      compileFirmwareSourcePath: string,
      optionsJsonString: string,
    ) => Promise<string>;
    getSourceCodePath: (zipPath: string) => Promise<string>;
    onBuildProgress: (callback: (progress: number) => void) => void;
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

  interface WMICDevice {
    DeviceID: string;
    Name: string;
    Description: string;
    Manufacturer: string;
    FriendlyName: string;
  }

  interface FileInfo {
    fullPath: string;
    fileName: string;
  }

  interface FirmwareResource {
    id: string;
    title: string;
    page_url?: string;
    zip_url?: string;
    release_notes?: string;
    classNames: string;
    type: string;
    isLatest: boolean;
  }

  interface FirmwareReleases {
    releases: {
      stable: FirmwareResource[];
      alpha: FirmwareResource[];
    };
    pullRequests: FirmwareResource[];
  }

  interface CustomFirmwareOption {
    name: string;
    prettyName?: string;
    type?: "string" | "boolean" | "number" | "arrayOfHexValues";
    value: string;
  }
}
