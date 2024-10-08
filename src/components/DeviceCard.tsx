import { useEffect, useState } from "react";
import { createUrl } from "../utils/api";
import type { DeviceHardware } from "src/types/api";
import { OfflineHardwareList } from "../types/resources";

export default function DeviceCard() {
  const [ports, setPorts] = useState<SerialPortInfo[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [targets, setTargets] = useState<DeviceHardware[]>([]);
  const firmwareApi = createUrl("api/resource/deviceHardware");

  const fetchPorts = async () => {
    const portsList = await window.electronAPI.getSerialPorts();
    console.log(portsList);
  };

  useEffect(() => {
    fetchDeviceList();
  }, []);

  useEffect(() => {
    console.log(ports);
  }, [ports]);

  useEffect(() => {
    console.log(targets);
  }, [targets]);

  const scanForDevice = () => {
    setIsScanning(true);
    fetchPorts().then(() => {
      setIsScanning(false);
    });
  };

  const fetchDeviceList = async () => {
    try {
      const result: DeviceHardware[] =
        await window.electronAPI.apiRequest(firmwareApi);
      //setTargets(result.filter((t: DeviceHardware) => t.activelySupported));
    } catch (ex) {
      console.error(ex);
      // Fallback to offline list
      setTargets(
        OfflineHardwareList.filter((t: DeviceHardware) => t.activelySupported),
      );
    }
  };

  return (
    <div className="flow-root">
      <div className="border-b border-gray-200 py-2">
        <div className="md:flex md:items-center md:justify-between mb-4">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold leading-6 text-gray-900">
              No Device
            </h3>
          </div>
          <div className="mt-4 flex md:ml-4 md:mt-0">
            <button
              type="button"
              className="inline-flex items-center rounded-md bg-meshtastic-green px-3 py-2 text-sm font-semibold text-gray-800 shadow-sm hover:bg-meshtastic-green/70"
              onClick={scanForDevice}
              disabled={isScanning}
            >
              {isScanning ? "Scanning..." : "Scan For Device"}
            </button>
          </div>
        </div>
        <div className="sm:flex animate-pulse">
          <div className="mb-4 flex-shrink-0 sm:mb-0 sm:mr-4">
            <div className="flex items-center justify-center w-full h-32 bg-gray-300 rounded sm:w-32 dark:bg-gray-700">
              <svg
                className="w-10 h-10 text-gray-200 dark:text-gray-600"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 20 18"
              >
                <path d="M18 0H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2Zm-5.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm4.376 10.481A1 1 0 0 1 16 15H4a1 1 0 0 1-.895-1.447l3.5-7A1 1 0 0 1 7.468 6a.965.965 0 0 1 .9.5l2.775 4.757 1.546-1.887a1 1 0 0 1 1.618.1l2.541 4a1 1 0 0 1 .028 1.011Z" />
              </svg>
            </div>
          </div>
          <div className="w-full">
            <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-48 mb-4" />
            <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[480px] mb-2.5" />
            <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 mb-2.5" />
            <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[440px] mb-2.5" />
            <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[460px] mb-2.5" />
            <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[360px]" />
          </div>
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    </div>
  );
}
