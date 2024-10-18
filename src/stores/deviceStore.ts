import { create } from "zustand";
import { createUrl } from "../utils/api";
import type { DeviceHardware } from "src/types/api";
import { OfflineHardwareList } from "../types/resources";
import type * as Protobuf from "@meshtastic/protobufs";

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
  setConnectedDevice: (value: Protobuf.Mesh.DeviceMetadata) => void;
  setConnectedTarget: (value: DeviceHardware) => void;
  setSelectedPort: (value: SerialPortInfo) => void;
  fetchDeviceList: () => Promise<void>;
  fetchPorts: () => Promise<void>;
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
      console.error(ex);
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
}));
