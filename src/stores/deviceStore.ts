import { create } from "zustand";
import { createUrl } from "../utils/api";
import { getCorsFriendyReleaseUrl, type DeviceHardware } from "../types/api";
import { OfflineHardwareList } from "../types/resources";
import type * as Protobuf from "@meshtastic/protobufs";
import { sleep } from "../utils/promise";
import { v4 as uuidv4 } from "uuid";
import { useFirmwareStore } from "./firmwareStore";

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
  flashProgress: number;
  setIsScanning: (val: boolean) => void;
  cleanupPostUpdate: () => void;
  isUF2: () => boolean;
  isESP32: () => boolean;
  setConnectedDevice: (value: Protobuf.Mesh.DeviceMetadata) => void;
  setConnectedTarget: (value: DeviceHardware) => void;
  setSelectedPort: (value: SerialPortInfo) => void;
  fetchDeviceList: () => Promise<void>;
  fetchPorts: () => Promise<void>;
  updateDevice: () => Promise<void>;
  startUF2Update: () => Promise<void>;
  startESP32Update: () => Promise<void>;
  getUF2FirmwareFileName: () => string;
  getESP32FirmwareFileName: () => string;
}

export const useDeviceStore = create<DeviceState>((set, get) => ({
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
  flashProgress: 0,
  setIsScanning: (val: boolean) => {
    set({ isScanning: val });
  },
  cleanupPostUpdate: () => {
    set({
      connectedDevice: undefined,
      connectedTarget: undefined,
      selectedPort: undefined,
      deviceImage: undefined,
      isUpdating: false,
      isScanning: false,
    });
  },
  getUF2FirmwareFileName: () => {
    return `firmware-${get().connectedTarget?.platformioTarget}-${useFirmwareStore.getState().selectedFirmware?.id.replace("v", "")}.uf2`;
  },
  getESP32FirmwareFileName: () => {
    return `firmware-${get().connectedTarget?.platformioTarget}-${useFirmwareStore.getState().selectedFirmware?.id.replace("v", "")}-update.bin`;
  },
  isUF2: () => {
    return (
      get().connectedTarget &&
      ["nrf52840", "rp2040"].includes(get().connectedTarget.architecture)
    );
  },
  isESP32: () => {
    return get().connectedTarget?.architecture.startsWith("esp32");
  },
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
  fetchDeviceList: async () => {
    try {
      const result: DeviceHardware[] = await window.electronAPI.apiRequest<
        DeviceHardware[]
      >(createUrl("api/resource/deviceHardware"));
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
    if (get().isUF2()) {
      console.info("UF2 device detected.");
      await get().startUF2Update();
    } else if (get().isESP32()) {
      console.info("ESP32 device detected.");
      await get().startESP32Update();
    } else {
      // ERROR
    }
  },
  startESP32Update: async () => {
    if (!get().selectedPort) {
      return;
    }
    if (!(await window.electronAPI.baud1200(get().selectedPort.path))) return;

    // Check for custom firmware
    const customFirmwarePath = useFirmwareStore.getState().customFirmwarePath;
    const customFirmwareFileName =
      useFirmwareStore.getState().customFirmwareFileName;

    let fullPath = undefined;
    let fileName = undefined;

    if (customFirmwarePath) {
      set({ progressMessage: "Reading custom firmware." });
      fullPath = customFirmwarePath;
      fileName = customFirmwareFileName;
    } else {
      set({ progressMessage: "Starting firmware download." });
      fileName = get().getESP32FirmwareFileName();
      fullPath = useFirmwareStore.getState().getFirmwareDownloadUrl(fileName);
    }

    set({ progressMessage: "Starting update download." });

    window.electronAPI.onFlashProgress((progress: number) => {
      set({
        flashProgress: progress,
        progressMessage: `Flashing ${progress}%`,
      });
    });
    await window.electronAPI.updateEsp32(
      fileName,
      fullPath,
      !customFirmwarePath,
    );
  },
  startUF2Update: async () => {
    const driveListBefore = await window.electronAPI.getDrives(uuidv4());
    console.info(
      `USB Drives Attached (pre-DFU): ${JSON.stringify(driveListBefore)}`,
    );

    set({ progressMessage: "Placing device in update mode." });
    await window.electronAPI.enterDfuMode();

    set({
      progressMessage:
        "Preparing device for update. This may take several seconds.",
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

    // TODO: Error state
    if (!meshDevice) {
      return;
    }
    console.info(`DFU Device Detected: ${JSON.stringify(meshDevice)}`);

    // Check for custom firmware
    const customFirmwarePath = useFirmwareStore.getState().customFirmwarePath;
    const customFirmwareFileName =
      useFirmwareStore.getState().customFirmwareFileName;

    let finalCopyFromPath = undefined;
    let fileName = undefined;

    if (customFirmwarePath) {
      finalCopyFromPath = customFirmwarePath;
      fileName = customFirmwareFileName;
    } else {
      set({ progressMessage: "Starting firmware download." });

      // Download firmware to temp dir
      fileName = get().getUF2FirmwareFileName();
      const firmwareDownloadUrl = useFirmwareStore
        .getState()
        .getFirmwareDownloadUrl(fileName);
      const fileInfo =
        await window.electronAPI.downloadFirmware(firmwareDownloadUrl);
      fileName = fileInfo.fileName;
      finalCopyFromPath = fileInfo.fullPath;
    }

    set({ progressMessage: "Copying firmware." });

    await window.electronAPI.copyFirmware(
      fileName,
      finalCopyFromPath,
      meshDevice.mountpoints[0].path,
    );

    set({
      isUpdating: false,
      finishedUpdate: true,
      progressMessage: "Update complete. Unplug & Reboot your device.",
    });
  },
}));
