import { useFirmwareStore } from "../stores/firmwareStore";
import { useEffect } from "react";
import { useDeviceStore } from "../stores/deviceStore";
import FormSwitch from "./FormSwitch";

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
  const hasCustomFirmware = useFirmwareStore(
    (state) => state.hasCustomFirmware,
  );
  const buildProgress = useFirmwareStore((state) => state.buildProgress);
  const isLoadingFirmwareCustomizationOptions = useFirmwareStore(
    (state) => state.isLoadingFirmwareCustomizationOptions,
  );

  const connectedTarget = useDeviceStore((state) => state.connectedTarget);

  const compileCustomFirmware = useFirmwareStore(
    (state) => state.compileCustomFirmware,
  );

  const formSubmitHandler = (event: React.FormEvent) => {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);
    const options: CustomFirmwareOption[] = [];
    for (const [key, value] of formData.entries()) {
      if (value === "" || value === "off") {
        continue;
      }
      const option = firmwareCustomizationOptions.find((x) => x.name === key);
      options.push({
        name: key,
        value: (value as string) === "on" ? "true" : (value as string),
        type: option?.type,
      });
    }
    console.log(options);
    compileCustomFirmware(connectedTarget.platformioTarget, options);
  };

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
          <h3>
            Firmware customization options were not found. Try a more recent
            firmware version.
          </h3>
        )}
      {!isLoadingFirmwareCustomizationOptions &&
        firmwareCustomizationOptions && (
          <form onSubmit={formSubmitHandler}>
            <div className="space-y-12 overflow-scroll max-h-96">
              <div className="border-b border-gray-900/10 pb-12 pl-1">
                <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-2">
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
                          <FormSwitch name={option.name} />
                        )}

                        {option.type !== "boolean" && (
                          <input
                            type="text"
                            name={option.name}
                            id={option.name}
                            autoComplete={option.name}
                            placeholder={option.value as string}
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
                disabled={isCompiling}
                className="text-sm/6 font-semibold text-gray-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCompiling}
                className={`rounded-md ${isCompiling || hasCustomFirmware() ? "bg-gray-400 hover:bg-gray-400" : "bg-meshtastic-green hover:bg-meshtastic-green/70"} px-3 py-2 text-sm font-semibold text-gray-800 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600`}
              >
                {isCompiling
                  ? buildProgress
                    ? `Building: ${buildProgress}%`
                    : "Getting dependencies..."
                  : hasCustomFirmware()
                    ? "Done"
                    : "Create Custom Firmware"}
              </button>
            </div>
          </form>
        )}
    </div>
  );
}
