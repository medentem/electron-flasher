import { useFirmwareStore } from "../stores/firmwareStore";
import { useEffect } from "react";
import { Switch } from "@headlessui/react";

export interface CustomizeFirmwareProps {
  cancelCustomization: () => void;
}

export default function CustomizeFirmware(props: CustomizeFirmwareProps) {
  const { cancelCustomization } = props;

  const getFirmwareCustomizationOptions = useFirmwareStore(
    (state) => state.getFirmwareCustomizationOptions,
  );

  const firmwareCustomizationOptions = useFirmwareStore(
    (state) => state.firmwareCustomizationOptions,
  );

  const isCompiling = useFirmwareStore((state) => state.isCompiling);
  const isLoadingFirmwareCustomizationOptions = useFirmwareStore(
    (state) => state.isLoadingFirmwareCustomizationOptions,
  );

  const lclApplyCustomizedOptions = () => {};

  useEffect(() => {
    getFirmwareCustomizationOptions();
  }, [getFirmwareCustomizationOptions]);

  return (
    <div className="flow-root">
      <div className="border-b border-gray-200 py-2">
        <div className="flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold leading-6 text-gray-900">
              Customize Firmware
            </h3>
          </div>
        </div>
      </div>
      {isLoadingFirmwareCustomizationOptions && (
        <div className="animate-pulse pt-4">
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
      )}
      {!isLoadingFirmwareCustomizationOptions &&
        !firmwareCustomizationOptions && (
          <h2>
            Firmware customization options were not found. Try a more recent
            firmware version.
          </h2>
        )}
      {!isLoadingFirmwareCustomizationOptions &&
        firmwareCustomizationOptions && (
          <form>
            <div className="space-y-12 overflow-scroll max-h-72">
              <div className="border-b border-gray-900/10 pb-12">
                <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                  {firmwareCustomizationOptions.map((option) => (
                    <div className="col-span-full" key={option.name}>
                      <label
                        htmlFor={option.name}
                        className="block text-sm/6 font-medium text-gray-900"
                      >
                        {option.prettyName}
                      </label>
                      <div className="mt-2">
                        {option.type === "boolean" && (
                          <Switch className="group relative inline-flex h-5 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2">
                            <span className="sr-only">Use setting</span>
                            <span
                              aria-hidden="true"
                              className="pointer-events-none absolute size-full rounded-md bg-white"
                            />
                            <span
                              aria-hidden="true"
                              className="pointer-events-none absolute mx-auto h-4 w-9 rounded-full bg-gray-200 transition-colors duration-200 ease-in-out group-data-[checked]:bg-indigo-600"
                            />
                            <span
                              aria-hidden="true"
                              className="pointer-events-none absolute left-0 inline-block size-5 transform rounded-full border border-gray-200 bg-white shadow ring-0 transition-transform duration-200 ease-in-out group-data-[checked]:translate-x-5"
                            />
                          </Switch>
                        )}

                        {option.type !== "boolean" && (
                          <input
                            type="text"
                            name={option.name}
                            id={option.name}
                            autoComplete={option.name}
                            className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-x-6">
              <button
                type="button"
                onClick={cancelCustomization}
                className="text-sm/6 font-semibold text-gray-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-md bg-meshtastic-green px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-meshtastic-green/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Save
              </button>
            </div>
          </form>
        )}
    </div>
  );
}
