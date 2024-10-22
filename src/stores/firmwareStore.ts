import { create } from "zustand";
import { createUrl } from "../utils/api";

interface FirmwareState {
  stable: FirmwareResource[];
  alpha: FirmwareResource[];
  previews: FirmwareResource[];
  pullRequests: FirmwareResource[];
  firmwareRollup: FirmwareResource[];
  selectedFirmware: FirmwareResource | undefined;
  setSelectedFirmware: (selectedFirmwareId: string) => void;
  setFirmwareRollup: (firmwareRollup: FirmwareResource[]) => void;
  getFirmwareReleases: () => Promise<void>;
}

export const useFirmwareStore = create<FirmwareState>((set, get) => ({
  stable: new Array<FirmwareResource>(),
  alpha: new Array<FirmwareResource>(),
  previews: new Array<FirmwareResource>(),
  pullRequests: new Array<FirmwareResource>(),
  firmwareRollup: new Array<FirmwareResource>(),
  selectedFirmware: undefined,
  setSelectedFirmware: (selectedFirmwareId: string) => {
    const firmware = get().firmwareRollup.find(
      (x) => x.id === selectedFirmwareId,
    );
    set({ selectedFirmware: firmware });
  },
  setFirmwareRollup: (firmwareRollup: FirmwareResource[]) => {
    set({ firmwareRollup });
  },
  getFirmwareReleases: async () => {
    const result: FirmwareReleases =
      await window.electronAPI.apiRequest<FirmwareReleases>(
        createUrl("api/github/firmware/list"),
      );

    // Only grab the latest 4 releases
    const stable = result.releases.stable.slice(0, 3);
    const alpha = result.releases.alpha
      .filter((f) => !f.title.includes("Preview"))
      .slice(0, 3);
    const previews = result.releases.alpha
      .filter((f) => f.title.includes("Preview"))
      .slice(0, 3);
    const pullRequests = result.pullRequests.slice(0, 4);

    set({
      stable: stable,
      alpha: alpha,
      previews: previews,
      pullRequests: pullRequests,
    });
  },
}));
