export {};

declare global {
  interface Window {
    electronAPI: {
      getSerialPorts: () => Promise<SerialPortInfo[]>;
    };
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