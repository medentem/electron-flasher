import { useEffect, useState } from "react";
import { createUrl } from "../utils/api";
import type { DeviceHardware } from "src/types/api";
import { OfflineHardwareList } from "../types/resources";
import type * as Protobuf from '@meshtastic/protobufs';

export default function DeviceCard() {
  const [ports, setPorts] = useState<SerialPortInfo[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Protobuf.Mesh.DeviceMetadata | undefined>();
  const [connectedTarget, setConnectedTarget] = useState<DeviceHardware | undefined>();
  const [meshDevicePort, setMeshDevicePort] = useState<SerialPortInfo>(undefined);
  const [isScanning, setIsScanning] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [targets, setTargets] = useState<DeviceHardware[]>([]);
  const firmwareApi = createUrl("api/resource/deviceHardware");

  const fetchPorts = async () => {
    const portsList = await window.electronAPI.getSerialPorts();
    setPorts(portsList);
  };

  useEffect(() => {
    fetchDeviceList();
  }, []);

  useEffect(() => {
    if (ports && ports.length > 0 && targets && targets.length > 0) {
      const matchingPort = ports.find(x => {
          const matchingTargets = targets.find(y => {
            const deviceNameLower = x.deviceName?.toLowerCase();
            return deviceNameLower.includes(y.platformioTarget.toLowerCase()) || deviceNameLower.includes(y.displayName.toLowerCase()) || deviceNameLower.includes(y.architecture.toLowerCase());
          });
          return matchingTargets;
         }
      );
      setMeshDevicePort(matchingPort);
      if (matchingPort) {
        window.electronAPI.onDeviceMetadata((data) => {
          setConnectedDevice(data.data as Protobuf.Mesh.DeviceMetadata);
        });
        window.electronAPI.connectToDevice(matchingPort.path);
      }
    }
  }, [ports, targets]);

  useEffect(() => {
    if (connectedDevice) {
      console.log(connectedDevice);
      const target = targets.find(x => x.hwModel === connectedDevice.hwModel);
      if (target) {
        setConnectedTarget(target);
      }
    }
  }, [connectedDevice]);

  const scanForDevice = async () => {
    if (meshDevicePort) {
      await window.electronAPI.disconnectFromDevice(meshDevicePort.path);
      setMeshDevicePort(undefined);
    }
    setIsScanning(true);
    fetchPorts().then(() => {
      setIsScanning(false);
    });
  };

  const updateDevice = async () => {
    console.log("update");
    setIsUpdating(true);
  };

  const fetchDeviceList = async () => {
    try {
      const result: DeviceHardware[] =
        await window.electronAPI.apiRequest(firmwareApi);
        setTargets(result.filter((t: DeviceHardware) => t.activelySupported));
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
              {connectedTarget ? connectedTarget.displayName : "No Device" }
            </h3>
          </div>
          <div className="mt-4 flex md:ml-4 md:mt-0">
            {!connectedDevice &&
              <button
                type="button"
                className="inline-flex items-center rounded-md bg-meshtastic-green px-3 py-2 text-sm font-semibold text-gray-800 shadow-sm hover:bg-meshtastic-green/70"
                onClick={scanForDevice}
                disabled={isScanning}
              >
                {isScanning ? "Scanning..." : "Scan For Device"}
              </button>
            }
            {connectedDevice &&
              <button
                type="button"
                className={`inline-flex items-center rounded-md ${isUpdating ? 'bg-gray-400 hover:bg-gray-400' : 'bg-meshtastic-green hover:bg-meshtastic-green/70'} px-3 py-2 text-sm font-semibold text-gray-800 shadow-sm `}
                onClick={updateDevice}
                disabled={isUpdating}
              >
                {isUpdating ? "Updating..." : "Update Device"}
              </button>
            }
          </div>
        </div>
        <div className="sm:flex animate-pulse">
          <div className="mb-4 flex-shrink-0 sm:mb-0 sm:mr-4">
            <div className="flex items-center justify-center w-full h-32 bg-gray-300 rounded sm:w-32 dark:bg-gray-700">
              {connectedTarget &&
                <img src={`$assets/images/devices/${connectedTarget.displayName.replace(' ', '_').toUpperCase()}.png`} alt="device-iamge" />
              }
              {!connectedTarget &&
                <svg
                  className="w-10 h-10 text-gray-200 dark:text-gray-600"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 20 18"
                >
                  <path d="M18 0H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2Zm-5.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm4.376 10.481A1 1 0 0 1 16 15H4a1 1 0 0 1-.895-1.447l3.5-7A1 1 0 0 1 7.468 6a.965.965 0 0 1 .9.5l2.775 4.757 1.546-1.887a1 1 0 0 1 1.618.1l2.541 4a1 1 0 0 1 .028 1.011Z" />
                </svg>
              }
            </div>
          </div>
          {!connectedTarget &&
            <>
              <div className="w-full">
                <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-48 mb-4" />
                <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[480px] mb-2.5" />
                <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 mb-2.5" />
                <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[440px] mb-2.5" />
                <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[460px] mb-2.5" />
                <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[360px]" />
              </div>
              <span className="sr-only">Loading...</span>
            </>
          }
          {connectedTarget && meshDevicePort && connectedDevice &&
            <div className="w-full">
              <div className="px-4 sm:px-0">
                <h3 className="text-base font-semibold leading-7 text-gray-900">Device Information</h3>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">Firmware Version: {connectedDevice.firmwareVersion}</p>
              </div>
              <div className="mt-6 border-t border-gray-100">
                <dl className="divide-y divide-gray-100">
                  <div className="px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt className="text-sm font-medium leading-6 text-gray-900">Device Type</dt>
                    <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">{connectedTarget.displayName}</dd>
                  </div>
                  <div className="px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt className="text-sm font-medium leading-6 text-gray-900">Device Name</dt>
                    <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">{meshDevicePort.deviceName}</dd>
                  </div>
                  <div className="px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt className="text-sm font-medium leading-6 text-gray-900">Device Serial</dt>
                    <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">{meshDevicePort.serialNumber}</dd>
                  </div>
                  <div className="px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt className="text-sm font-medium leading-6 text-gray-900">Manufacturer</dt>
                    <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">{meshDevicePort.manufacturer}</dd>
                  </div>
                  <div className="px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt className="text-sm font-medium leading-6 text-gray-900">Has Bluetooth?</dt>
                    <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">{connectedDevice.hasBluetooth ? 'Yes' : 'No'}</dd>
                  </div>
                  <div className="px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt className="text-sm font-medium leading-6 text-gray-900">Has WiFi?</dt>
                    <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">{connectedDevice.hasWifi ? 'Yes' : 'No'}</dd>
                  </div>
                </dl>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  );
}
