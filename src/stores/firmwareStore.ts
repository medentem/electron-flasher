import { create } from "zustand";
import { createUrl } from "../utils/api";

interface FirmwareState {
  stable: FirmwareResource[];
  alpha: FirmwareResource[];
  previews: FirmwareResource[];
  pullRequests: FirmwareResource[];
  getFirmwareReleases: () => Promise<void>;
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
    console.log(result);

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
