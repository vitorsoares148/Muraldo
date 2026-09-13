import { useEffect, useRef, useState } from "react";
import { FaAngleDown } from "react-icons/fa";

import { cn } from "../../../utils/cn";

type ResponsibleDropdownProps = {
  selectedResponsible: string;
  setResponsible: React.Dispatch<React.SetStateAction<string>>;
  members: string[];
};

export default function ResponsibleDropdown({
  selectedResponsible,
  setResponsible,
  members,
}: ResponsibleDropdownProps) {
  const [openResponsible, setOpenResponsible] = useState(false);
  const responsibleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        responsibleRef.current &&
        !responsibleRef.current.contains(event.target as Node)
      ) {
        setOpenResponsible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleResponsibleChange = (responsible: string) => {
    setResponsible(responsible);
    setOpenResponsible(false);
  };

  return (
    <div
      ref={responsibleRef}
      className="relative max-w-full min-w-0 select-none"
    >
      <button
        onClick={() => setOpenResponsible((prev) => !prev)}
        className={cn(
          "flex max-w-45 min-w-0 items-center justify-between gap-1",
          "cursor-pointer rounded-xl border-5 border-black",
          "py-2 pr-2 pl-3",
          "font-shadows text-lg font-semibold",
          "transition duration-200 ease-in-out",
          openResponsible && "bg-black text-[#FFF4DE] outline-0",
        )}
      >
        <div className="min-w-0 truncate">{selectedResponsible}</div>

        <FaAngleDown className="mt-1.5 h-5 w-5 shrink-0" />
      </button>

      {openResponsible && (
        <div
          className={cn(
            "absolute bottom-full left-0 z-50",
            "w-max max-w-full overflow-hidden rounded-lg",
            "border-5 border-black",
            "bg-[#13110e] backdrop-blur-xl",
          )}
        >
          {members.map((member) => (
            <button
              key={member}
              onClick={() => handleResponsibleChange(member)}
              className={cn(
                "block w-full cursor-pointer px-3 py-2 text-left",
                "font-shadows text-[18px] text-[#FFF4DE]",
                "hover:bg-[#FFF4DE] hover:text-black",
              )}
            >
              <div className="flex min-w-0 items-center gap-1">
                <div className="min-w-0 truncate">{member}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
