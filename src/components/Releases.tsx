import { useFirmwareStore } from "../stores/firmwareStore";
import MeshtasticIcon from "./MeshtasticIcon";
import { FolderPlusIcon } from "@heroicons/react/24/solid";
import { useEffect, useState } from "react";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function Releases() {
  const stableFirmwareReleases = useFirmwareStore((state) => state.stable);
  const alphaFirmwareReleases = useFirmwareStore((state) => state.alpha);
  const previewFirmwareReleases = useFirmwareStore((state) => state.previews);
  const getFirmwareReleases = useFirmwareStore(
    (state) => state.getFirmwareReleases,
  );
  const [firmwares, setFirmwares] = useState<FirmwareResource[]>([]);

  useEffect(() => {
    getFirmwareReleases();
  }, [getFirmwareReleases]);

  useEffect(() => {
    const firmwares = [
      ...previewFirmwareReleases.map((x) => {
        return {
          ...x,
          classNames: "bg-red-500",
          type: "preview",
          selected: false,
          isLatest: false,
        };
      }),
      ...alphaFirmwareReleases.map((x) => {
        return {
          ...x,
          classNames: "bg-orange-500",
          type: "alpha",
          selected: false,
          isLatest: false,
        };
      }),
      {
        ...stableFirmwareReleases[0],
        classNames: "bg-meshtastic-green",
        type: "stable",
        selected: true,
        isLatest: true,
      },
      ...stableFirmwareReleases.slice(1).map((x) => {
        return {
          ...x,
          classNames: "bg-meshtastic-green",
          type: "stable",
          selected: false,
          isLatest: false,
        };
      }),
    ];
    setFirmwares(firmwares);
  }, [stableFirmwareReleases, alphaFirmwareReleases, previewFirmwareReleases]);

  return (
    <div className="flow-root">
      <div className="border-b border-gray-200 py-2">
        <div className="flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold leading-6 text-gray-900">
              Available Updates
            </h3>
          </div>
          <div className="min-w-0 flex 1">
            <FolderPlusIcon className="text-gray-500 size-6 cursor-pointer" />
          </div>
        </div>
      </div>
      <ul className="overflow-scroll">
        {firmwares.map((item, itemIdx) => (
          <li key={`${item.id}-${item.isLatest}`}>
            <div className="relative">
              {itemIdx !== firmwares.length - 1 ? (
                <span
                  aria-hidden="true"
                  className="absolute left-8 top-4 -ml-px h-full w-0.5 bg-gray-200"
                />
              ) : null}
              <div
                className={`p-4 relative flex space-x-3 hover:bg-gray-200 ${item.selected ? "border-2 border-meshtastic-green" : ""}`}
              >
                <div>
                  <span
                    className={classNames(
                      item.classNames,
                      "flex h-8 w-8 items-center justify-center rounded-full ring-8 ring-white",
                    )}
                  >
                    <MeshtasticIcon
                      aria-hidden="true"
                      className="h-5 w-5 text-white"
                    />
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                  <div>
                    <p className="text-sm text-gray-500">{item.id}</p>
                    <p className="text-xs italic text-gray-500">
                      {item.type === "alpha" || item.type === "preview"
                        ? "Pre-release"
                        : "Stable"}
                    </p>
                  </div>
                  <div className="flex flex-col whitespace-nowrap text-right text-sm text-gray-500">
                    {item.isLatest && (
                      <span className="inline-flex items-center rounded-full bg-meshtastic-green px-2 py-0.5 text-xs font-medium text-gray-900">
                        Latest
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
