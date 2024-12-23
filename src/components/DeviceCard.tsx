import { useEffect, useState } from "react";
import type * as Protobuf from "@meshtastic/protobufs";
import { useDeviceStore } from "../stores/deviceStore";
import { sleep } from "../utils/promise";
import { TrashIcon } from "@heroicons/react/24/solid";
import Toaster from "./Toaster";
import ToolTip from "./ToolTip";
import { useFirmwareStore } from "../stores/firmwareStore";

export interface DeviceCardProps {
  onUpdateClick: () => void;
}

export default function DeviceCard(props: DeviceCardProps) {
  const { onUpdateClick } = props;
  const [showToaster, setShowToaster] = useState(false);
  const [showFullDeviceDetails, setShowFullDeviceDetails] = useState(false);
  const [toasterPrimaryMessage, setToasterPrimaryMessage] = useState(
    "Your device will be wiped clean!",
  );
  const [toasterSecondaryMessage, setToasterSecondaryMessage] = useState(
    "All your settings, channels and preferences will be removed.",
  );
  const isCompiling = useFirmwareStore((state) => state.isCompiling);
  const availablePorts = useDeviceStore((state) => state.availablePorts);
  const availableTargets = useDeviceStore((state) => state.availableTargets);
  const selectedPort = useDeviceStore((state) => state.selectedPort);
  const connectedTarget = useDeviceStore((state) => state.connectedTarget);
  const connectedDevice = useDeviceStore((state) => state.connectedDevice);
  const setSelectedPort = useDeviceStore((state) => state.setSelectedPort);
  const deviceImage = useDeviceStore((state) => state.deviceImage);
  const isScanning = useDeviceStore((state) => state.isScanning);
  const setIsScanning = useDeviceStore((state) => state.setIsScanning);
  const isUpdating = useDeviceStore((state) => state.isUpdating);
  const finishedUpdate = useDeviceStore((state) => state.finishedUpdate);
  const setConnectedDevice = useDeviceStore(
    (state) => state.setConnectedDevice,
  );
  const fetchDeviceList = useDeviceStore((state) => state.fetchDeviceList);
  const fetchPorts = useDeviceStore((state) => state.fetchPorts);
  const cleanupPostUpdate = useDeviceStore((state) => state.cleanupPostUpdate);
  const cleanInstall = useDeviceStore((state) => state.cleanInstall);
  const setCleanInstall = useDeviceStore((state) => state.setCleanInstall);

  useEffect(() => {
    fetchDeviceList();
  }, [fetchDeviceList]);

  useEffect(() => {
    if (cleanInstall) {
      setShowToaster(true);
    } else {
      setShowToaster(false);
    }
  }, [cleanInstall]);

  useEffect(() => {
    if (finishedUpdate) {
      cleanupPostUpdate();
      sleep(1500).then(() => {
        scanForDevice();
      });
    }
  }, [cleanupPostUpdate, finishedUpdate]);

  useEffect(() => {
    if (
      availablePorts &&
      availablePorts.length > 0 &&
      availableTargets &&
      availableTargets.length > 0
    ) {
      setIsScanning(true);
      // Find the first PORT that matches ANY of the known meshtastic device characteristics (platformio, name, architecture)
      // We're using a metal detector on hackstack to find the needle here
      let matchingPort = availablePorts.find((x) => {
        const matchingTargets = availableTargets.find((y) => {
          const deviceNameLower = x.deviceName?.toLowerCase();
          return (
            deviceNameLower.includes(y.platformioTarget.toLowerCase()) ||
            deviceNameLower.includes(y.displayName.toLowerCase()) ||
            deviceNameLower.includes(y.architecture.toLowerCase())
          );
        });
        return matchingTargets;
      });

      // If there weren't any matching ports, just pick the last one
      if (!matchingPort) {
        matchingPort = availablePorts[availablePorts.length - 1];
      }

      setSelectedPort(matchingPort);
      // If we found a port that is likely to be a meshtastic device, connect to it to extract DeviceMetadata
      if (matchingPort) {
        window.electronAPI.onDeviceMetadata((data) => {
          setConnectedDevice(data.data as Protobuf.Mesh.DeviceMetadata);
          setIsScanning(false);
        });
        window.electronAPI.connectToDevice(matchingPort.path);
      }

      setTimeout(() => {
        setIsScanning(false);
      }, 1000);
    }
  }, [
    setIsScanning,
    setSelectedPort,
    setConnectedDevice,
    availablePorts,
    availableTargets,
  ]);

  const lclUpdateDevice = async () => {
    onUpdateClick();
  };

  const scanForDevice = async () => {
    if (selectedPort) {
      await window.electronAPI.disconnectFromDevice(selectedPort.path);
      setSelectedPort(undefined);
    }
    await fetchPorts();
  };

  const toggleCleanInstall = async () => {
    setCleanInstall(!cleanInstall);
  };

  const onCloseToaster = async () => {
    setShowToaster(false);
  };

  return (
    <>
      <Toaster
        show={showToaster}
        primaryMessage={toasterPrimaryMessage}
        secondaryMessage={toasterSecondaryMessage}
        onClose={onCloseToaster}
      />
      <div className="flow-root">
        <div className="border-b border-gray-200 py-2">
          <div className="flex items-center justify-between mb-4">
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold leading-6 text-gray-900">
                {connectedTarget ? connectedTarget.displayName : "No Device"}
              </h3>
            </div>
            <div className="flex ml-4 mt-0">
              <div>
                {!connectedDevice && (
                  <button
                    type="button"
                    className="inline-flex items-center rounded-md bg-meshtastic-green px-3 py-2 text-sm font-semibold text-gray-800 shadow-sm hover:bg-meshtastic-green/70"
                    onClick={scanForDevice}
                    disabled={isScanning}
                  >
                    {isScanning ? "Scanning..." : "Scan For Device"}
                  </button>
                )}
                {connectedDevice && !finishedUpdate && (
                  <button
                    type="button"
                    className={`inline-flex items-center rounded-md ${isUpdating || isCompiling ? "bg-gray-400 hover:bg-gray-400" : "bg-meshtastic-green hover:bg-meshtastic-green/70"} px-3 py-2 text-sm font-semibold text-gray-800 shadow-sm `}
                    onClick={lclUpdateDevice}
                    disabled={isUpdating || isCompiling}
                  >
                    {isUpdating ? "Updating..." : "Update Device"}
                  </button>
                )}
                {connectedDevice && finishedUpdate && (
                  <button
                    type="button"
                    className={`inline-flex items-center rounded-md ${finishedUpdate ? "bg-gray-400 hover:bg-gray-400" : "bg-meshtastic-green hover:bg-meshtastic-green/70"} px-3 py-2 text-sm font-semibold text-gray-800 shadow-sm `}
                    onClick={lclUpdateDevice}
                    disabled={finishedUpdate}
                  >
                    Done
                  </button>
                )}
              </div>
            </div>
            <div>
              <ToolTip tooltip="Wipe Device?">
                <TrashIcon
                  className={`${cleanInstall ? "text-red-500" : "text-gray-500"} ml-4 size-6 cursor-pointer`}
                  onClick={toggleCleanInstall}
                />
              </ToolTip>
            </div>
          </div>
          <div className={`${!connectedTarget ? "animate-pulse" : ""}`}>
            <div className="mb-4 flex-shrink-0">
              <div className="flex items-center justify-center w-full h-32 bg-gray-300 rounded dark:bg-gray-700 overflow-hidden">
                {deviceImage && (
                  <img
                    className="object-fill"
                    src={deviceImage}
                    alt="device-iamge"
                  />
                )}
                {!deviceImage && (
                  <svg
                    className="w-10 h-10 text-gray-200 dark:text-gray-600"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 20 18"
                  >
                    <path d="M18 0H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2Zm-5.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm4.376 10.481A1 1 0 0 1 16 15H4a1 1 0 0 1-.895-1.447l3.5-7A1 1 0 0 1 7.468 6a.965.965 0 0 1 .9.5l2.775 4.757 1.546-1.887a1 1 0 0 1 1.618.1l2.541 4a1 1 0 0 1 .028 1.011Z" />
                  </svg>
                )}
              </div>
            </div>
            {!connectedTarget && (
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
            )}
            {connectedTarget && selectedPort && connectedDevice && (
              <div className="w-full">
                <div className="px-4">
                  <h3 className="text-base font-semibold leading-7 text-gray-900">
                    Device Information
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">
                    Firmware Version: {connectedDevice.firmwareVersion}
                  </p>
                </div>
                <div className="mt-6 border-t border-gray-100">
                  <dl className="divide-y divide-gray-100">
                    <div className="px-4 py-1">
                      <dt className="text-xs font-medium leading-6 text-gray-900">
                        Device Type
                      </dt>
                      <dd className="mt-1 text-sm leading-6 text-gray-700">
                        {connectedTarget.displayName}
                      </dd>
                    </div>
                    <div className="px-4 py-1">
                      <dt className="text-xs font-medium leading-6 text-gray-900">
                        Device Serial
                      </dt>
                      <dd className="mt-1 text-sm leading-6 text-gray-700">
                        {`${"*".repeat(selectedPort.serialNumber.length - 4)}${selectedPort.serialNumber.slice(selectedPort.serialNumber.length - 4)}`}
                      </dd>
                    </div>
                    {!showFullDeviceDetails && (
                      <span
                        className="px-4 py-1 text-xs leading-6 text-gray-700 cursor-pointer"
                        onClick={() => setShowFullDeviceDetails(true)}
                        onKeyUp={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            setShowFullDeviceDetails(true);
                          }
                        }}
                      >
                        Show More
                      </span>
                    )}
                    {showFullDeviceDetails && (
                      <>
                        <div className="px-4 py-1">
                          <dt className="text-xs font-medium leading-6 text-gray-900">
                            Manufacturer
                          </dt>
                          <dd className="mt-1 text-sm leading-6 text-gray-700">
                            {selectedPort.manufacturer}
                          </dd>
                        </div>
                        <div className="px-4 py-1">
                          <dt className="text-xs font-medium leading-6 text-gray-900">
                            Device Name
                          </dt>
                          <dd className="mt-1 text-sm leading-6 text-gray-700">
                            {selectedPort.deviceName}
                          </dd>
                        </div>
                        <div className="px-4 py-1">
                          <dt className="text-xs font-medium leading-6 text-gray-900">
                            Has Bluetooth?
                          </dt>
                          <dd className="mt-1 text-sm leading-6 text-gray-700">
                            {connectedDevice.hasBluetooth ? "Yes" : "No"}
                          </dd>
                        </div>
                        <div className="px-4 py-1">
                          <dt className="text-xs font-medium leading-6 text-gray-900">
                            Has WiFi?
                          </dt>
                          <dd className="mt-1 text-sm leading-6 text-gray-700">
                            {connectedDevice.hasWifi ? "Yes" : "No"}
                          </dd>
                        </div>
                      </>
                    )}
                    {showFullDeviceDetails && (
                      <span
                        className="px-4 py-1 text-xs leading-6 text-gray-700 cursor-pointer"
                        onClick={() => setShowFullDeviceDetails(false)}
                        onKeyUp={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            setShowFullDeviceDetails(false);
                          }
                        }}
                      >
                        Hide Details
                      </span>
                    )}
                  </dl>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
