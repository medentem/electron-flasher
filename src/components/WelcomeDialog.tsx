import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import MeshtasticIcon from "./MeshtasticIcon";
import { useEffect, useState } from "react";

export interface WelcomeDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function WelcomeDialog(props: WelcomeDialogProps) {
  const { open, onClose } = props;
  const [pluginGifData, setPluginGifData] = useState<string | undefined>();

  useEffect(() => {
    window.electronAPI
      .getImageData("images", "mesh-plugin.gif")
      .then((path: string) => {
        setPluginGifData(path);
      });
  }, []);

  return (
    <Dialog open={open} onClose={onClose} className="relative z-10">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in"
      />

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <DialogPanel
            transition
            className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all data-[closed]:translate-y-4 data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in sm:my-8 sm:w-full sm:max-w-sm sm:p-6 data-[closed]:sm:translate-y-0 data-[closed]:sm:scale-95"
          >
            <div>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-meshtastic-green">
                <MeshtasticIcon
                  aria-hidden="true"
                  className="h-6 w-6 text-green-600"
                />
              </div>
              <div className="mt-3 text-center sm:mt-5">
                <DialogTitle
                  as="h3"
                  className="text-base font-semibold text-gray-900"
                >
                  Welcome to the Meshtastic Updater!
                </DialogTitle>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Power on your device and plug it into your computer. Then
                    click the "Scan for Device" button.
                  </p>
                  <div className="flex flex-row justify-center content-center align-middle">
                    <div className="flex-0">
                      <img
                        src={`data:image/gif;base64,${pluginGifData}`}
                        alt="device plugging in"
                        className="object-contain h-48"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-6">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex w-full justify-center rounded-md bg-meshtastic-green px-3 py-2 text-sm font-semibold text-white shadow-sm  focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Scan For Device
              </button>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
