import { create } from "zustand";
import { createUrl } from "../utils/api";
import {
  getCorsFriendyReleaseUrl,
  getFirmwareZipDownloadUrl,
} from "../types/api";

interface FirmwareState {
  stable: FirmwareResource[];
  alpha: FirmwareResource[];
  previews: FirmwareResource[];
  pullRequests: FirmwareResource[];
  firmwareRollup: FirmwareResource[];
  selectedFirmware: FirmwareResource | undefined;
  customFirmwarePath: string | undefined;
  customFirmwareFileName: string | undefined;
  isCompiling: boolean;
  isLoadingFirmwareCustomizationOptions: boolean;
  setSelectedFirmware: (selectedFirmwareId: string) => void;
  setCustomFirmware: (customFirmware: string) => Promise<void>;
  setFirmwareRollup: (firmwareRollup: FirmwareResource[]) => void;
  getFirmwareReleases: () => Promise<void>;
  getFirmwareDownloadUrl: (fileName: string) => string;
  hasCustomFirmware: () => boolean;
  getFirmwareCustomizationOptions: () => void;
}

export const useFirmwareStore = create<FirmwareState>((set, get) => ({
  stable: new Array<FirmwareResource>(),
  alpha: new Array<FirmwareResource>(),
  previews: new Array<FirmwareResource>(),
  pullRequests: new Array<FirmwareResource>(),
  firmwareRollup: new Array<FirmwareResource>(),
  selectedFirmware: undefined,
  customFirmwarePath: undefined,
  customFirmwareFileName: undefined,
  isCompiling: false,
  isLoadingFirmwareCustomizationOptions: false,
  hasCustomFirmware: () => {
    return get().customFirmwareFileName !== undefined;
  },
  setSelectedFirmware: (selectedFirmwareId: string) => {
    const firmware = get().firmwareRollup.find(
      (x) => x.id === selectedFirmwareId,
    );
    set({
      selectedFirmware: firmware,
    });
  },
  setCustomFirmware: async (customFirmware: string) => {
    const fileName = await window.electronAPI.getFilename(customFirmware);
    set({
      customFirmwarePath: customFirmware,
      customFirmwareFileName: fileName,
    });
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
      .slice(0, 2);
    const previews = result.releases.alpha
      .filter((f) => f.title.includes("Preview"))
      .slice(0, 3);
    const pullRequests = result.pullRequests.slice(0, 3);

    set({
      stable: stable,
      alpha: alpha,
      previews: previews,
      pullRequests: pullRequests,
    });
  },
  getFirmwareDownloadUrl: (fileName: string) => {
    // Download firmware to temp dir
    const selectedFirmware = get().selectedFirmware;
    const firmwareDownloadUrl = `${getCorsFriendyReleaseUrl(selectedFirmware.zip_url)}/${fileName}`;
    return firmwareDownloadUrl;
  },
  getFirmwareCustomizationOptions: async () => {
    const selectedFirmware = get().selectedFirmware;
    const firmwareDownloadUrl = getFirmwareZipDownloadUrl(
      selectedFirmware.zip_url,
    );
    const fileInfo =
      await window.electronAPI.downloadFirmware(firmwareDownloadUrl);
    const userPrefsFileContent = await window.electronAPI.getUserprefsFile(
      fileInfo.fullPath,
    );
    console.log(userPrefsFileContent);
    //fileName = fileInfo.fileName;
    //finalCopyFromPath = fileInfo.fullPath;
  },
}));
