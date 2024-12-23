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
  compileFirmwareZipPath: string | undefined;
  buildProgress: number | undefined;
  hasDependenciesToCustomizeFirmware: boolean;
  isCompiling: boolean;
  isLoadingFirmwareCustomizationOptions: boolean;
  firmwareCustomizationOptions: CustomFirmwareOption[] | undefined;
  setSelectedFirmware: (selectedFirmwareId: string) => void;
  setCustomFirmware: (customFirmware: string) => Promise<void>;
  setFirmwareRollup: (firmwareRollup: FirmwareResource[]) => void;
  getFirmwareReleases: () => Promise<void>;
  getFirmwareDownloadUrl: (fileName: string) => string;
  hasCustomFirmware: () => boolean;
  getFirmwareCustomizationOptions: (pathToUserPrefs?: string) => Promise<void>;
  compileCustomFirmware: (
    deviceString: string,
    options: CustomFirmwareOption[],
  ) => Promise<boolean>;
  setHasDependenciesToCustomizeFirmware: (hasDependencies: boolean) => void;
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
  compileFirmwareZipPath: undefined,
  buildProgress: undefined,
  hasDependenciesToCustomizeFirmware: false,
  isCompiling: false,
  isLoadingFirmwareCustomizationOptions: false,
  firmwareCustomizationOptions: undefined,
  hasCustomFirmware: () => {
    return get().customFirmwareFileName !== undefined;
  },
  setHasDependenciesToCustomizeFirmware: (hasDependencies: boolean) => {
    // Once true, always true
    if (get().hasDependenciesToCustomizeFirmware) return;
    set({ hasDependenciesToCustomizeFirmware: hasDependencies });
  },
  setSelectedFirmware: (selectedFirmwareId: string) => {
    const firmware = get().firmwareRollup.find(
      (x) => x.id === selectedFirmwareId,
    );
    set({
      selectedFirmware: firmware,
    });
    if (
      get().hasDependenciesToCustomizeFirmware &&
      !get().hasCustomFirmware()
    ) {
      get().getFirmwareCustomizationOptions();
    }
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
  getFirmwareCustomizationOptions: async (pathToUserPrefs?: string) => {
    if (get().hasCustomFirmware()) return;
    console.log("Getting firmware customization options");
    set({ isLoadingFirmwareCustomizationOptions: true });

    const selectedFirmware = get().selectedFirmware;
    const firmwareDownloadUrl = getFirmwareZipDownloadUrl(
      selectedFirmware.zip_url,
    );
    const fileInfo =
      await window.electronAPI.downloadFirmware(firmwareDownloadUrl);

    const userPrefsContent = await window.electronAPI.getCustomFirmwareOptions(
      pathToUserPrefs || fileInfo.fullPath,
    );

    set({
      firmwareCustomizationOptions: userPrefsContent,
      isLoadingFirmwareCustomizationOptions: false,
      compileFirmwareZipPath: fileInfo.fullPath,
    });
  },
  compileCustomFirmware: async (
    deviceString: string,
    options: CustomFirmwareOption[],
  ) => {
    set({ isCompiling: true });

    if (
      options &&
      options.length > 0 &&
      options.findIndex((x) => x.name === "USERPREFS_TZ_STRING") === -1
    ) {
      options.push({
        name: "USERPREFS_TZ_STRING",
        value: "tzplaceholder                                         ",
      });
    }

    const json =
      options && options.length > 0
        ? JSON.stringify(
            Object.fromEntries(
              options.map((opt) => [
                opt.name,
                opt.type === "arrayOfHexValues"
                  ? base64ToHexArrayString(opt.value)
                  : opt.value,
              ]),
            ),
          )
        : "{}";

    const compileFirmwareZipPath = get().compileFirmwareZipPath;
    console.log(deviceString);
    console.log(json);
    console.log(compileFirmwareZipPath);

    const compileFirmwareSourcePath =
      await window.electronAPI.getSourceCodePath(compileFirmwareZipPath);

    window.electronAPI.onBuildProgress((progress: number) => {
      set({ buildProgress: progress });
    });

    const compiledFirmwarePath = await window.electronAPI.compileFirmware(
      deviceString,
      compileFirmwareSourcePath,
      json,
    );

    get().setCustomFirmware(compiledFirmwarePath);

    set({ isCompiling: false });
    return true;
  },
}));

function base64ToHexArrayString(base64Str: string): string {
  try {
    // Decode Base64 into a binary string
    const binaryStr = atob(base64Str);

    // Convert each character's char code into a byte (0-255)
    const byteValues = [];
    for (let i = 0; i < binaryStr.length; i++) {
      byteValues.push(binaryStr.charCodeAt(i));
    }

    // Convert each byte to a hex string like "0xd4"
    const hexValues = byteValues.map(
      (byte) => `0x${byte.toString(16).padStart(2, "0")}`,
    );

    // Join them with commas and wrap with braces
    return `{ ${hexValues.join(", ")} }`;
  } catch {
    return base64Str;
  }
}
