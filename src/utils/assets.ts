import path from "node:path";
import { app } from "electron";

export function getAssetPath(...paths: string[]) {
  const isDev = !app.isPackaged;

  if (isDev) {
    // During development
    return path.join(__dirname, "..", "public", ...paths);
  }

  // In production, after packaging
  return path.join(process.resourcesPath, ...paths);
}
