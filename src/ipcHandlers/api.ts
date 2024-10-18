// src/ipcHandlers/api.ts

import axios from "axios";
import { ipcMain } from "electron";

export function registerApiHandlers() {
  ipcMain.handle("api-request", async (_event, url: string) => {
    const response = await axios.get(url);
    console.log(response);
    return response.data;
  });
}
