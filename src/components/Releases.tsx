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
  const setSelectedFirmware = useFirmwareStore(
    (state) => state.setSelectedFirmware,
  );
  const getFirmwareReleases = useFirmwareStore(
    (state) => state.getFirmwareReleases,
  );
  const firmwareRollup = useFirmwareStore((state) => state.firmwareRollup);
  const setFirmwareRollup = useFirmwareStore(
    (state) => state.setFirmwareRollup,
  );
  const [selectedIdx, setSelectedIdx] = useState<number>();

  useEffect(() => {
    getFirmwareReleases();
  }, [getFirmwareReleases]);

  useEffect(() => {
    if (selectedIdx && firmwareRollup && firmwareRollup.length > 0) {
      setSelectedFirmware(firmwareRollup[selectedIdx].id);
    }
  }, [selectedIdx, setSelectedFirmware, firmwareRollup]);

  useEffect(() => {
    if (stableFirmwareReleases.length > 0 && alphaFirmwareReleases.length > 0) {
      const firmwares = [
        ...previewFirmwareReleases.map((x) => {
          return {
            ...x,
            classNames: "bg-red-500",
            type: "preview",
            isLatest: false,
          };
        }),
        ...alphaFirmwareReleases.map((x) => {
          return {
            ...x,
            classNames: "bg-orange-500",
            type: "alpha",
            isLatest: false,
          };
        }),
        {
          ...stableFirmwareReleases[0],
          classNames: "bg-meshtastic-green",
          type: "stable",
          isLatest: true,
        },
        ...stableFirmwareReleases.slice(1).map((x) => {
          return {
            ...x,
            classNames: "bg-meshtastic-green",
            type: "stable",
            isLatest: false,
          };
        }),
      ];
      setFirmwareRollup(firmwares);
      if (stableFirmwareReleases && stableFirmwareReleases.length > 0) {
        setSelectedIdx(
          firmwares.findIndex((x) => x.id === stableFirmwareReleases[0].id),
        );
      }
    }
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
        {firmwareRollup.map((item, itemIdx) => (
          // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
          <li
            className="cursor-pointer"
            key={`${item.id}-${item.isLatest}`}
            onClick={() => setSelectedIdx(itemIdx)}
          >
            <div className="relative">
              {itemIdx !== firmwareRollup.length - 1 ? (
                <span
                  aria-hidden="true"
                  className="absolute left-8 top-4 -ml-px h-full w-0.5 bg-gray-200"
                />
              ) : null}
              <div
                className={`p-4 relative flex space-x-3 hover:bg-gray-200 ${itemIdx === selectedIdx ? "border-2 border-meshtastic-green" : ""}`}
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
