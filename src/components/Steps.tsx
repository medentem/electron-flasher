import { CheckIcon } from "@heroicons/react/24/solid";

export interface Step {
  name: string;
  status: "current" | "upcoming" | "complete";
  shouldAnimate: boolean;
  onClick?: () => void;
}

export interface StepsProps {
  steps: Step[];
}

export default function Steps(props: StepsProps) {
  const { steps } = props;
  return (
    <>
      <nav aria-label="Progress" className="hidden md:block">
        <ol className="divide-y divide-gray-300 rounded-md border border-gray-300 md:flex md:divide-y-0">
          {steps.map((step, stepIdx) => (
            <li key={step.name} className="relative md:flex md:flex-1">
              {step.status === "complete" ? (
                <span
                  onClick={step.onClick}
                  className="group flex w-full items-center"
                >
                  <span className="flex items-center px-6 py-4 text-sm font-medium">
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-meshtastic-green group-hover:bg-meshtastic-green">
                      <CheckIcon
                        aria-hidden="true"
                        className="h-6 w-6 text-white"
                      />
                    </span>
                    <span className="ml-4 text-sm font-medium text-gray-400">
                      {step.name}
                    </span>
                  </span>
                </span>
              ) : step.status === "current" ? (
                <span
                  onClick={step.onClick}
                  aria-current="step"
                  className="flex items-center px-6 py-4 text-sm font-medium"
                >
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-meshtastic-green">
                    <span className="text-meshtastic-green">{step.id}</span>
                  </span>
                  <span className="ml-4 text-sm font-medium text-meshtastic-green">
                    {step.name}
                  </span>
                </span>
              ) : (
                <span
                  onClick={step.onClick}
                  className="group flex items-center"
                >
                  <span className="flex items-center px-6 py-4 text-sm font-medium">
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-gray-300 group-hover:border-gray-400">
                      <span className="text-white group-hover:text-gray-300">
                        {step.id}
                      </span>
                    </span>
                    <span className="ml-4 text-sm font-medium text-white group-hover:text-gray-300">
                      {step.name}
                    </span>
                  </span>
                </span>
              )}

              {stepIdx !== steps.length - 1 ? (
                <>
                  {/* Arrow separator for lg screens and up */}
                  <div
                    aria-hidden="true"
                    className="absolute right-0 top-0 hidden h-full w-5 md:block"
                  >
                    <svg
                      fill="none"
                      viewBox="0 0 22 80"
                      preserveAspectRatio="none"
                      className="h-full w-full text-gray-300"
                    >
                      <title>arrow</title>
                      <path
                        d="M0 -2L20 40L0 82"
                        stroke="currentcolor"
                        vectorEffect="non-scaling-stroke"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </>
              ) : null}
            </li>
          ))}
        </ol>
      </nav>
      <p className="md:hidden">
        Step {steps.indexOf(steps.find((x) => x.status === "current")) + 1} of{" "}
        {steps.length}
      </p>
    </>
  );
}
