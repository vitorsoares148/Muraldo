import { useEffect, useRef, useState } from "react";
import { FaAngleDown } from "react-icons/fa";

import {
  PRIORITIES,
  priorityConfig,
  type PriorityLevel,
} from "../../../constants/priorities";
import { cn } from "../../../utils/cn";

type PriorityDropdownProps = {
  selectedPriority: PriorityLevel | undefined;
  setPriority: React.Dispatch<React.SetStateAction<PriorityLevel>>;
};

export default function PriorityDropdown({
  selectedPriority,
  setPriority,
}: PriorityDropdownProps) {
  const [openPriority, setOpenPriority] = useState(false);
  const priorityRef = useRef<HTMLDivElement>(null);

  const config =
    priorityConfig[selectedPriority as PriorityLevel] ?? priorityConfig.none;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        priorityRef.current &&
        !priorityRef.current.contains(event.target as Node)
      ) {
        setOpenPriority(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function handlePriorityChange(priority: PriorityLevel) {
    setPriority(priority);
    setOpenPriority(false);
  }

  return (
    <div ref={priorityRef} className="relative max-w-full min-w-0 select-none">
      <button
        onClick={() => setOpenPriority((prev) => !prev)}
        className={cn(
          "flex max-w-full min-w-0 items-center justify-between gap-1",
          "cursor-pointer rounded-xl border-5 border-black",
          "py-2 pr-2 pl-3",
          "font-shadows text-lg font-semibold",
          "transition duration-200 ease-in-out",
          openPriority && "bg-black text-[#FFF4DE] outline-0",
        )}
      >
        <div className="flex min-w-0 items-center gap-1">
          <div
            className={cn(
              "mt-0.5 h-3 w-3 shrink-0 rounded-full",
              config.pinColor,
            )}
          />

          <div className="min-w-0 truncate">{config.label}</div>
        </div>

        <FaAngleDown className="mt-1.5 h-5 w-5 shrink-0" />
      </button>

      {openPriority && (
        <div
          className={cn(
            "absolute bottom-full left-0 z-50",
            "w-max max-w-full overflow-hidden rounded-lg",
            "border-5 border-black",
            "bg-[#13110e] backdrop-blur-xl",
          )}
        >
          {PRIORITIES.map((item) => (
            <button
              key={item.level}
              onClick={() => handlePriorityChange(item.level)}
              className={cn(
                "block w-full cursor-pointer px-3 py-2 text-left",
                "font-shadows text-[18px] text-[#FFF4DE]",
                "hover:bg-[#FFF4DE] hover:text-black",
              )}
            >
              <div className="flex min-w-0 items-center justify-start gap-1">
                <div
                  className={cn("h-3 w-3 shrink-0 rounded-full", item.pinColor)}
                />

                <div className="min-w-0 truncate">{item.label}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
