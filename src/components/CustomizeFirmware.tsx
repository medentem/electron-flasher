import { useFirmwareStore } from "../stores/firmwareStore";
import MeshtasticIcon from "./MeshtasticIcon";
import {
  FolderPlusIcon,
  AdjustmentsVerticalIcon,
} from "@heroicons/react/24/solid";
import { useEffect, useState } from "react";
import ToolTip from "./ToolTip";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export interface CustomizeFirmwareProps {
  placeholder: (value: string) => void;
}

export default function CustomizeFirmware(props: CustomizeFirmwareProps) {
  const { placeholder } = props;

  const getFirmwareOptions = useFirmwareStore(
    (state) => state.getFirmwareCustomizationOptions,
  );

  const isCompiling = useFirmwareStore((state) => state.isCompiling);
  const isLoadingFirmwareCustomizationOptions = useFirmwareStore(
    (state) => state.isLoadingFirmwareCustomizationOptions,
  );

  const lclApplyCustomizedOptions = () => {};

  useEffect(() => {
    getFirmwareOptions();
  }, [getFirmwareOptions]);

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
      <form>
        <div className="space-y-12">
          <div className="border-b border-gray-900/10 pb-12">
            <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
              <div className="col-span-full">
                <label
                  htmlFor="USERPREFS_CHANNELS_TO_WRITE"
                  className="block text-sm/6 font-medium text-gray-900"
                >
                  USERPREFS_CHANNELS_TO_WRITE
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    name="USERPREFS_CHANNELS_TO_WRITE"
                    id="USERPREFS_CHANNELS_TO_WRITE"
                    autoComplete="USERPREFS_CHANNELS_TO_WRITE"
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-end gap-x-6">
          <button
            type="button"
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
    </div>
  );
}
