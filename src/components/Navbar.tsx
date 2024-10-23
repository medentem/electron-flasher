// src/components/Navbar.tsx
import { useDeviceStore } from "../stores/deviceStore";
import Steps, { type Step } from "./Steps";

export default function Navbar() {
  const connectedDevice = useDeviceStore((state) => state.connectedDevice);
  const isUpdating = useDeviceStore((state) => state.isUpdating);
  const progressMessage = useDeviceStore((state) => state.progressMessage);
  const isScanning = useDeviceStore((state) => state.isScanning);
  const finishedUpdate = useDeviceStore((state) => state.finishedUpdate);
  const steps: Step[] = [
    {
      name: "Connect",
      status: connectedDevice ? "complete" : "current",
      shouldAnimate: isScanning,
    },
    {
      name: "Update",
      status: finishedUpdate
        ? "complete"
        : connectedDevice
          ? "current"
          : "upcoming",
      shouldAnimate: isUpdating,
    },
    {
      name: "Done",
      status: finishedUpdate ? "complete" : "upcoming",
      shouldAnimate: false,
    },
  ];
  return (
    <div className="text-center">
      <header className="border-b-slate-700 border-b-2 text-white text-center">
        <nav
          aria-label="Global"
          className="mx-auto flex max-w-7xl items-center justify-between p-4 lg:px-8"
        >
          <div className="flex">
            <div className="-m-1.5 p-1.5">
              <span className="sr-only">Meshtastic</span>
              <img
                alt=""
                src="https://meshtastic.org/design/logo/svg/Mesh_Logo_White.svg"
                className="h-8 w-auto"
              />
            </div>
          </div>
          <div className="flex">
            <Steps steps={steps} />
          </div>
          <div className="flex w-14">
            <div className="-m-1.5 p-1.5" />
          </div>
        </nav>
      </header>
      <span className="block text-xs text-center p-6 text-white h-4">
        {progressMessage}
      </span>
    </div>
  );
}
