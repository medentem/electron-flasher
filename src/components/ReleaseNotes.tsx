import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import Markdown from "react-markdown";
import MeshtasticIcon from "./MeshtasticIcon";

export interface ReleaseNotesProps {
  releaseTitle: string;
  releaseNotes: string;
  open: boolean;
  onCancel: () => void;
  onContinue: () => void;
}

export default function ReleaseNotes(props: ReleaseNotesProps) {
  const { releaseTitle, releaseNotes, open, onCancel, onContinue } = props;

  return (
    <Dialog open={open} onClose={onCancel} className="relative z-10">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in"
      />

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <DialogPanel
            transition
            className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all data-[closed]:translate-y-4 data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in sm:my-8 sm:w-full sm:max-w-lg sm:p-6 data-[closed]:sm:translate-y-0 data-[closed]:sm:scale-95"
          >
            <div>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-900">
                <MeshtasticIcon
                  aria-hidden="true"
                  className="h-6 w-6 text-meshtastic-green"
                />
              </div>
              <div className="mt-3 text-center sm:mt-5">
                <DialogTitle
                  as="h3"
                  className="text-base font-semibold text-gray-900"
                >
                  Release Notes - {releaseTitle}
                </DialogTitle>
                <div className="mt-2 text-sm">
                  <Markdown
                    className="h-48 overflow-scroll"
                    components={{
                      a: (props) => {
                        return (
                          <a href={props.href} target="_blank" rel="noreferrer">
                            {props.children}
                          </a>
                        );
                      },
                    }}
                  >
                    {releaseNotes}
                  </Markdown>
                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
              <button
                type="button"
                onClick={onContinue}
                className="inline-flex w-full justify-center rounded-md bg-meshtastic-green px-3 py-2 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2"
              >
                Continue
              </button>
              <button
                type="button"
                data-autofocus
                onClick={onCancel}
                className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
              >
                Cancel
              </button>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
