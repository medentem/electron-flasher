import { create } from "zustand";
import { createUrl } from "../utils/api";
import type { DeviceHardware } from "src/types/api";
import { OfflineHardwareList } from "../types/resources";
import type * as Protobuf from "@meshtastic/protobufs";
import { sleep } from "../utils/promise";
import { v4 as uuidv4 } from "uuid";

interface DeviceState {
  connectedDevice: Protobuf.Mesh.DeviceMetadata | undefined;
  connectedTarget: DeviceHardware | undefined;
  selectedPort: SerialPortInfo | undefined;
  availableTargets: DeviceHardware[] | undefined;
  availablePorts: SerialPortInfo[] | undefined;
  isUpdating: boolean;
  isScanning: boolean;
  finishedUpdate: boolean;
  deviceImage: string | undefined;
  progressMessage: string | undefined;
  setConnectedDevice: (value: Protobuf.Mesh.DeviceMetadata) => void;
  setConnectedTarget: (value: DeviceHardware) => void;
  setSelectedPort: (value: SerialPortInfo) => void;
  fetchDeviceList: () => Promise<void>;
  fetchPorts: () => Promise<void>;
  updateDevice: () => Promise<void>;
}

export const useDeviceStore = create<DeviceState>((set, _get) => ({
  connectedDevice: undefined,
  connectedTarget: undefined,
  selectedPort: undefined,
  availableTargets: undefined,
  availablePorts: undefined,
  deviceImage: undefined,
  isUpdating: false,
  isScanning: false,
  finishedUpdate: false,
  progressMessage: undefined,
  setConnectedDevice: (value: Protobuf.Mesh.DeviceMetadata) => {
    set((state) => {
      // Now that we've successfully connected to the device, and we have the DeviceMetadata,
      // we can go back into the targets and ensure we have the exact target this device is
      const target = state.availableTargets?.find(
        (x) => x.hwModel === value.hwModel,
      );
      state.setConnectedTarget(target);
      return {
        connectedDevice: value,
        deviceImage: `https://wismesh.org/images/devices/${target.displayName.replaceAll(" ", "_").toUpperCase()}.png`,
      };
    });
  },
  setConnectedTarget: (value: DeviceHardware) => {
    set({ connectedTarget: value });
  },
  setSelectedPort: (value: SerialPortInfo) => {
    set({ selectedPort: value });
  },
  clearState: set({} as DeviceState, true),
  fetchDeviceList: async () => {
    try {
      const result: DeviceHardware[] = await window.electronAPI.apiRequest(
        createUrl("api/resource/deviceHardware"),
      );
      set({
        availableTargets: result.filter(
          (t: DeviceHardware) => t.activelySupported,
        ),
      });
    } catch (ex) {
      // Fallback to offline list
      set({
        availableTargets: OfflineHardwareList.filter(
          (t: DeviceHardware) => t.activelySupported,
        ),
      });
    }
  },
  fetchPorts: async () => {
    set({ isScanning: true });
    const portsList = await window.electronAPI.getSerialPorts();
    set({ availablePorts: portsList, isScanning: false });
  },
  updateDevice: async () => {
    set({ isUpdating: true, progressMessage: "Checking device type." });

    // TODO: check for nrf vs ESP32
    const driveListBefore = await window.electronAPI.getDrives(uuidv4());
    console.info(
      `USB Drives Attached (pre-DFU): ${JSON.stringify(driveListBefore)}`,
    );

    set({ progressMessage: "Placing device in update mode." });
    await window.electronAPI.enterDfuMode();

    set({
      progressMessage:
        "Waiting for device to reattach. This may take several seconds.",
    });
    await sleep(5000);

    set({ progressMessage: "Finding device drive." });
    const driveListAfter = await window.electronAPI.getDrives(uuidv4());
    console.info(
      `USB Drives Attached (post-DFU): ${JSON.stringify(driveListAfter)}`,
    );

    // Only get drives that weren't there before we placed the mesh device in DFU mode
    // There SHOULD only be one here...
    const meshDevice = driveListAfter.find((x) => {
      return (
        driveListBefore.find((y) => x.devicePath === y.devicePath) === undefined
      );
    });
    console.info(`DFU Device Detected: ${JSON.stringify(meshDevice)}`);
    set({ isUpdating: false, progressMessage: undefined });
  },
}));
