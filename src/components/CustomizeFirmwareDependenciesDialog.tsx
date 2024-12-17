import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import {
  ExclamationCircleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/solid";
import { useEffect, useState } from "react";

export interface CustomizeFirmwareDialogProps {
  open: boolean;
  onClose: (isContinue: boolean) => void;
}

export default function CustomizeFirmwareDialog(
  props: CustomizeFirmwareDialogProps,
) {
  const { open, onClose } = props;
  const [isLoading, setIsLoading] = useState(false);
  const [allDepsInstalled, setAllDepsInstalled] = useState(false);
  const [pythonInstalled, setPythonInstalled] = useState<undefined | boolean>();
  const [platformIOInstalled, setPlatformIOInstalled] = useState<
    undefined | boolean
  >();
  const [pythonSubText, setPythonSubText] = useState("Checking for python...");
  const [platformIOSubText, setPlatformIOSubText] = useState(
    "Checking for Platform IO...",
  );
  const [checkingDependencies, setCheckingDependencies] = useState(false);
  const [dialogTitle, setDialogTitle] = useState(
    "Additional Software Required",
  );

  useEffect(() => {
    setAllDepsInstalled(pythonInstalled && platformIOInstalled);
    if (pythonInstalled && platformIOInstalled) {
      setDialogTitle("All Set!");
    } else {
      setDialogTitle("Additional Software Required");
    }
  }, [pythonInstalled, platformIOInstalled]);

  const checkSoftware = () => {
    if (allDepsInstalled) {
      lclOnClose(true);
      return;
    }
    setIsLoading(true);
    setCheckingDependencies(true);
    setDialogTitle("Checking Software...");
    window.electronAPI.checkPython().then((pythonInstalled) => {
      setPythonInstalled(pythonInstalled);
      setPythonSubText(
        `Python ${pythonInstalled ? "found." : "not found. Installing..."}`,
      );
      if (!pythonInstalled) {
        window.electronAPI.installPython().then((installed) => {
          setPythonInstalled(installed);
          setPythonSubText(
            `Python ${installed ? "installed." : "not installed."}`,
          );
        });
      }
      window.electronAPI.checkPlatformIO().then((platformIOInstalled) => {
        setPlatformIOInstalled(platformIOInstalled);
        setPlatformIOSubText(
          `Platform IO ${platformIOInstalled ? "found." : "not found. Installing..."}`,
        );
        if (!platformIOInstalled) {
          window.electronAPI.installPlatformIO().then((installed) => {
            setPlatformIOInstalled(installed);
            setPythonSubText(
              `Platform IO ${installed ? "installed." : "not installed."}`,
            );
          });
        }
        setIsLoading(false);
      });
    });
  };

  const lclOnClose = (isContinue: boolean) => {
    setIsLoading(false);
    setCheckingDependencies(false);
    setPythonInstalled(undefined);
    setPythonSubText("Checking for python...");
    setDialogTitle("Additional Software Required");
    onClose(isContinue);
  };

  return (
    <Dialog
      open={open}
      onClose={() => lclOnClose(false)}
      className="relative z-10"
    >
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
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full">
                {!isLoading && !allDepsInstalled && (
                  <ExclamationCircleIcon
                    aria-hidden="true"
                    className="h-12 w-12 text-gray-500 dark:text-gray-400"
                  />
                )}
                {!isLoading && allDepsInstalled && (
                  <CheckCircleIcon
                    aria-hidden="true"
                    className="h-12 w-12 text-meshtastic-green"
                  />
                )}
                {isLoading && (
                  <svg
                    aria-hidden="true"
                    className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-meshtastic-green absolute"
                    viewBox="0 0 100 101"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                      fill="currentColor"
                    />
                    <path
                      d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                      fill="currentFill"
                    />
                  </svg>
                )}
              </div>
              <div className="mt-3 text-center sm:mt-5">
                <DialogTitle
                  as="h3"
                  className="text-base font-semibold text-gray-900"
                >
                  {dialogTitle}
                </DialogTitle>
                <div className="mt-2">
                  {checkingDependencies && (
                    <div className="flex-row">
                      <div className="p-2 flex justify-between">
                        <div className="text-left">
                          <h4>Python</h4>
                          <p className="text-xs text-gray-500">
                            {pythonSubText}
                          </p>
                        </div>
                        <div className="h-8 w-8">
                          {pythonInstalled === undefined && (
                            <svg
                              aria-hidden="true"
                              className="w-6 h-6 text-gray-200 animate-spin dark:text-gray-600 fill-meshtastic-green absolute"
                              viewBox="0 0 100 101"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                                fill="currentColor"
                              />
                              <path
                                d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                                fill="currentFill"
                              />
                            </svg>
                          )}
                          {pythonInstalled === true && (
                            <CheckCircleIcon
                              aria-hidden="true"
                              className="h-6 w-6 text-meshtastic-green dark:text-meshtastic-green"
                            />
                          )}
                          {pythonInstalled === false && (
                            <ExclamationCircleIcon
                              aria-hidden="true"
                              className="h-6 w-6 text-gray-500 dark:text-gray-500"
                            />
                          )}
                        </div>
                      </div>
                      <div className="p-2 flex justify-between">
                        <div className="text-left">
                          <h4>Platform IO</h4>
                          <p className="text-xs text-gray-500">
                            {platformIOSubText}
                          </p>
                        </div>
                        <div className="h-8 w-8">
                          {platformIOInstalled === undefined && (
                            <svg
                              aria-hidden="true"
                              className="w-6 h-6 text-gray-200 animate-spin dark:text-gray-600 fill-meshtastic-green absolute"
                              viewBox="0 0 100 101"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                                fill="currentColor"
                              />
                              <path
                                d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                                fill="currentFill"
                              />
                            </svg>
                          )}
                          {platformIOInstalled === true && (
                            <CheckCircleIcon
                              aria-hidden="true"
                              className="h-6 w-6 text-meshtastic-green dark:text-meshtastic-green"
                            />
                          )}
                          {platformIOInstalled === false && (
                            <ExclamationCircleIcon
                              aria-hidden="true"
                              className="h-6 w-6 text-gray-500 dark:text-gray-500"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  {!checkingDependencies && (
                    <>
                      <p className="text-sm text-gray-500">
                        Meshtastic allows you to customize certain settings
                        before updating your device with new firmware. To do
                        this, we need to check if you have the required software
                        installed. If the required software isn't installed,
                        we'll try to automatically install it for you, but you
                        may see additional permission requests from your
                        operating system.
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        The same settings can be configured later by using the
                        Meshtastic app and connecting to your device.
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-6 flex">
              <button
                type="button"
                onClick={() => lclOnClose(false)}
                className="mr-4 inline-flex w-full justify-center rounded-md bg-gray-500 px-3 py-2 text-sm font-semibold text-white shadow-sm  focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={checkSoftware}
                disabled={isLoading}
                className={`inline-flex w-full justify-center rounded-md ${isLoading ? "bg-gray-300" : "bg-meshtastic-green"} px-3 py-2 text-sm font-semibold text-white shadow-sm  focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600`}
              >
                {isLoading
                  ? "Checking..."
                  : allDepsInstalled
                    ? "Continue"
                    : "Check Now"}
              </button>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
