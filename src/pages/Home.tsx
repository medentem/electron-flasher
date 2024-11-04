// src/pages/Home.tsx
import type React from "react";
import DeviceCard from "../components/DeviceCard";
import Releases from "../components/Releases";
import ReleaseNotes from "../components/ReleaseNotes";
import { useFirmwareStore } from "../stores/firmwareStore";
import { useState } from "react";
import { useDeviceStore } from "../stores/deviceStore";

const Home: React.FC = () => {
  const selectedFirmware = useFirmwareStore((state) => state.selectedFirmware);
  const updateDevice = useDeviceStore((state) => state.updateDevice);
  const hasCustomFirmware = useFirmwareStore(
    (state) => state.hasCustomFirmware,
  );
  const [openReleaseNotes, setOpenReleaseNotes] = useState(false);

  const onUpdateClick = () => {
    if (hasCustomFirmware()) {
      updateDevice();
      return;
    }
    setOpenReleaseNotes(true);
  };

  const onContinue = () => {
    setOpenReleaseNotes(false);
    updateDevice();
  };
  const onCancel = () => {
    setOpenReleaseNotes(false);
  };

  return (
    <>
      <div className="mt-2 grid grid-cols-1 gap-4 lg:grid-cols-6 px-12">
        <div className="flex p-px lg:col-span-4">
          <div className="overflow-hidden rounded-lg  bg-gray-50 ring-1 ring-white/15 max-lg:rounded-t-[2rem] lg:rounded-tl-[2rem] lg:rounded-bl-[2rem] w-full p-6">
            <DeviceCard onUpdateClick={onUpdateClick} />
          </div>
        </div>
        <div className="flex p-px lg:col-span-2">
          <div className="overflow-hidden rounded-lg  bg-gray-50 ring-1 ring-white/15 lg:rounded-tr-[2rem] lg:rounded-br-[2rem] w-full p-6">
            <Releases />
          </div>
        </div>
      </div>
      <ReleaseNotes
        releaseNotes={selectedFirmware?.release_notes || "No release notes."}
        releaseTitle={selectedFirmware?.id || "No firmware selected."}
        open={openReleaseNotes}
        onContinue={onContinue}
        onCancel={onCancel}
      />
    </>
  );
};

export default Home;
