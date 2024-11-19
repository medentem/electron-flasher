import type { ForgeConfig } from "@electron-forge/shared-types";
import path from "node:path";
import { AutoUnpackNativesPlugin } from "@electron-forge/plugin-auto-unpack-natives";
import { MakerSquirrel } from "@electron-forge/maker-squirrel";
import { MakerZIP } from "@electron-forge/maker-zip";
import { MakerDeb } from "@electron-forge/maker-deb";
import { MakerDMG } from "@electron-forge/maker-dmg";
import { MakerRpm } from "@electron-forge/maker-rpm";
import { VitePlugin } from "@electron-forge/plugin-vite";
import { FusesPlugin } from "@electron-forge/plugin-fuses";
import { FuseV1Options, FuseVersion } from "@electron/fuses";

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    ignore: [/\/\.(?!vite)/],
    appBundleId: "com.medentem.meshtastic-updater",
    executableName: "meshtastic-updater",
    osxSign: {
      identity: "Developer ID Application: Medentem LLC (A68V7LS529)",
      optionsForFile: (_filePath) => {
        return {
          hardenedRuntime: true,
          entitlements: path.resolve(__dirname, "entitlements.plist"),
          entitlementsInherit: path.resolve(__dirname, "entitlements.plist"),
          requirements: undefined,
          strictVerify: false,
          gatekeeperAssess: false,
          additionalArguments: ["--force", "--verbose"],
        };
      },
    },
    osxNotarize: {
      appleId: process.env.APPLE_ID || "",
      appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD || "",
      teamId: process.env.APPLE_TEAM_ID || "A68V7LS529",
    },
  },
  makers: [
    new MakerSquirrel({}),
    new MakerZIP({}, ["darwin"]),
    new MakerRpm({}),
    new MakerDeb({}),
    new MakerDMG(),
  ],
  rebuildConfig: {
    force: true,
    onlyModules: ["serialport", "drivelist", "platformio-node-helpers"],
  },
  plugins: [
    new AutoUnpackNativesPlugin({}),
    new VitePlugin({
      // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
      // If you are familiar with Vite configuration, it will look really familiar.
      build: [
        {
          // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
          entry: "src/main.ts",
          config: "vite.main.config.ts",
          target: "main",
        },
        {
          entry: "src/preload.ts",
          config: "vite.preload.config.ts",
          target: "preload",
        },
      ],
      renderer: [
        {
          name: "main_window",
          config: "vite.renderer.config.ts",
        },
      ],
    }),
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;
