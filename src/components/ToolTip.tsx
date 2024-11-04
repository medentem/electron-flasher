import { type FC, type ReactNode, useRef } from "react";

interface Props {
  children: ReactNode;
  tooltip?: string;
}

const ToolTip: FC<Props> = ({ children, tooltip }): JSX.Element => {
  const tooltipRef = useRef<HTMLSpanElement>(null);
  const container = useRef<HTMLDivElement>(null);

  return (
    <div ref={container} className="group relative">
      {tooltip ? (
        <span
          ref={tooltipRef}
          className="-ml-12 -mt-8 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition bg-gray-200 text-sm px-2 font-bold text-black p-1 rounded fixed whitespace-nowrap"
        >
          {tooltip}
        </span>
      ) : null}
      {children}
    </div>
  );
};

export default ToolTip;
