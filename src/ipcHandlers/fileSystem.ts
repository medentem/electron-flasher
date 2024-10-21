import { ipcMain, type BrowserWindow } from "electron";
import { list } from "drivelist";

let _mainWindow: BrowserWindow | undefined;

export function registerFileSystemHandlers(mainWindow: BrowserWindow) {
  _mainWindow = mainWindow;

  ipcMain.handle("get-drives", async (_event: any, _requestId: string) => {
    const drives = await list();
    const removableDrives = drives.filter((drive) => drive.isRemovable);
    return removableDrives;
  });
}
