import type React from "react";
import { useState } from "react";
import { Switch } from "@headlessui/react";

interface Props {
  name: string;
}

const FormSwitch: React.FC<Props> = ({ name }) => {
  const [enabled, setEnabled] = useState(false);

  return (
    <>
      <input
        type="checkbox"
        name={name}
        id={name}
        hidden
        className="hidden"
        checked={enabled}
        onChange={() => {}}
      />

      <Switch
        checked={enabled}
        onChange={setEnabled}
        className="group relative inline-flex h-5 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-meshtastic-green focus:ring-offset-2"
      >
        <span className="sr-only">Use setting</span>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute size-full rounded-md bg-white"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute mx-auto h-4 w-9 rounded-full bg-gray-200 transition-colors duration-200 ease-in-out group-data-[checked]:bg-meshtastic-green"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-0 inline-block size-5 transform rounded-full border border-gray-200 bg-white shadow ring-0 transition-transform duration-200 ease-in-out group-data-[checked]:translate-x-5"
        />
      </Switch>
    </>
  );
};

export default FormSwitch;
