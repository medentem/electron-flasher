// src/pages/Home.tsx
import type React from "react";
import DeviceCard from "../components/DeviceCard";
import Releases from "../components/Releases";
import ReleaseNotes from "../components/ReleaseNotes";
import { useFirmwareStore } from "../stores/firmwareStore";
import { useEffect, useState } from "react";
import { useDeviceStore } from "../stores/deviceStore";
import SuccessDialog from "../components/SuccessDialog";
import WelcomeDialog from "../components/WelcomeDialog";
import CustomizeFirmwareDependenciesDialog from "../components/CustomizeFirmwareDependenciesDialog";
import RequiresActionToContinueDialog from "../components/RequiresActionToContinueDialog";
import CustomizeFirmware from "../components/CustomizeFirmware";

const Home: React.FC = () => {
  const selectedFirmware = useFirmwareStore((state) => state.selectedFirmware);
  const fetchPorts = useDeviceStore((state) => state.fetchPorts);
  const updateDevice = useDeviceStore((state) => state.updateDevice);
  const finishedUpdate = useDeviceStore((state) => state.finishedUpdate);
  const hasCustomFirmware = useFirmwareStore(
    (state) => state.hasCustomFirmware,
  );
  const [customizeFirmwareDepsInstalled, setCustomizeFirmwareDepsInstalled] =
    useState(false);
  const [openReleaseNotes, setOpenReleaseNotes] = useState(false);
  const [openSuccessDialog, setOpenSuccessDialog] = useState(false);
  const [openContinueActionDialog, setOpenContinueActionDialog] =
    useState(false);
  const [
    openCustomizeFirmwareDependenciesDialog,
    setOpenCustomizeFirwareDependenciesDialog,
  ] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    setShowWelcomeModal(true);
    /*
    const hasSeenModal = localStorage.getItem("hasSeenModal");

    if (!hasSeenModal) {
    }
    */
  }, []);

  const onUpdateClick = () => {
    if (hasCustomFirmware()) {
      handleUpdate();
      return;
    }
    setOpenReleaseNotes(true);
  };

  const onContinue = () => {
    setOpenReleaseNotes(false);
    handleUpdate();
  };

  const handleUpdate = async () => {
    updateDevice();
  };

  const onContinueUpdateAction = () => {
    // updateDevice(true);
    setOpenContinueActionDialog(false);
  };

  const onCancel = () => {
    setOpenReleaseNotes(false);
  };

  const successDialogDismissed = () => {
    setOpenSuccessDialog(false);
  };

  const welcomeDialogDismissed = () => {
    setShowWelcomeModal(false);
    localStorage.setItem("hasSeenModal", "true");
    fetchPorts();
  };

  const onCustomizeFirmware = () => {
    setOpenCustomizeFirwareDependenciesDialog(true);
  };

  const customizeFirwareDependenciesDialogDismissed = (
    wasContinue: boolean,
  ) => {
    setOpenCustomizeFirwareDependenciesDialog(false);
    setCustomizeFirmwareDepsInstalled(wasContinue);
  };

  useEffect(() => {
    if (finishedUpdate) {
      setOpenSuccessDialog(true);
    }
  }, [finishedUpdate]);

  return (
    <>
      <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-6 px-12">
        <div
          className={`flex p-px ${customizeFirmwareDepsInstalled ? "md:col-span-2" : "md:col-span-4"}`}
        >
          <div className="overflow-hidden rounded-lg  bg-gray-50 ring-1 ring-white/15 max-md:rounded-t-[2rem] md:rounded-tl-[2rem] md:rounded-bl-[2rem] w-full p-6">
            <DeviceCard onUpdateClick={onUpdateClick} />
          </div>
        </div>
        <div className="flex p-px md:col-span-2">
          <div
            className={`overflow-hidden rounded-lg  bg-gray-50 ring-1 ring-white/15 ${!customizeFirmwareDepsInstalled ? "md:rounded-tr-[2rem] md:rounded-br-[2rem]" : ""} w-full p-6`}
          >
            <Releases onCustomizeFirmware={onCustomizeFirmware} />
          </div>
        </div>
        {customizeFirmwareDepsInstalled && (
          <div className="flex p-px md:col-span-2">
            <div className="overflow-hidden rounded-lg  bg-gray-50 ring-1 ring-white/15 md:rounded-tr-[2rem] md:rounded-br-[2rem] w-full p-6">
              <CustomizeFirmware placeholder={() => {}} />
            </div>
          </div>
        )}
      </div>
      <ReleaseNotes
        releaseNotes={selectedFirmware?.release_notes || "No release notes."}
        releaseTitle={selectedFirmware?.id || "No firmware selected."}
        open={openReleaseNotes}
        onContinue={onContinue}
        onCancel={onCancel}
      />
      <SuccessDialog
        open={openSuccessDialog}
        onClose={successDialogDismissed}
      />
      <WelcomeDialog open={showWelcomeModal} onClose={welcomeDialogDismissed} />
      <CustomizeFirmwareDependenciesDialog
        open={openCustomizeFirmwareDependenciesDialog}
        onClose={customizeFirwareDependenciesDialogDismissed}
      />
      <RequiresActionToContinueDialog
        open={openContinueActionDialog}
        onClose={onContinueUpdateAction}
        title={"Reboot Your Device"}
        body={
          "Your device was wiped clean and needs to be rebooted to continue the update. Please power off your device, power it back on, and ensure its plugged in. Click 'Continue' once your device is powered back on and connected."
        }
      />
    </>
  );
};

export default Home;
