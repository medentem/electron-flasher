import { create } from "zustand";
import { createUrl } from "../utils/api";

interface FirmwareState {
  getFirmwareReleases: () => Promise<void>;
  stable: FirmwareResource[];
  alpha: FirmwareResource[];
  previews: FirmwareResource[];
  pullRequests: FirmwareResource[];
}

export const useFirmwareStore = create<FirmwareState>((set, _get) => ({
  stable: new Array<FirmwareResource>(),
  alpha: new Array<FirmwareResource>(),
  previews: new Array<FirmwareResource>(),
  pullRequests: new Array<FirmwareResource>(),
  getFirmwareReleases: async () => {
    const result: FirmwareReleases =
      await window.electronAPI.apiRequest<FirmwareReleases>(
        createUrl("api/github/firmware/list"),
      );

    // Only grab the latest 4 releases
    const stable = result.releases.stable.slice(0, 4);
    const alpha = result.releases.alpha
      .filter((f) => !f.title.includes("Preview"))
      .slice(0, 4);
    const previews = result.releases.alpha
      .filter((f) => f.title.includes("Preview"))
      .slice(0, 4);
    const pullRequests = result.pullRequests.slice(0, 4);

    set({
      stable,
      alpha,
      previews,
      pullRequests,
    });
  },
}));
