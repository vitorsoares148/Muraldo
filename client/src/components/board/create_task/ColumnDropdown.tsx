import { useEffect, useRef, useState } from "react";
import { FaAngleDown } from "react-icons/fa";

import type { Column } from "../../../types/projects";
import { cn } from "../../../utils/cn";

type ColumnDropdownProps = {
  selectedColumn: string;
  setColumn: React.Dispatch<React.SetStateAction<string>>;
  columns: Column[];
};

export default function ColumnDropdown({
  selectedColumn,
  setColumn,
  columns,
}: ColumnDropdownProps) {
  const [openColumn, setOpenColumn] = useState(false);
  const columnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        columnRef.current &&
        !columnRef.current.contains(event.target as Node)
      ) {
        setOpenColumn(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function handleColumnChange(column: string) {
    setColumn(column);
    setOpenColumn(false);
  }

  return (
    <div ref={columnRef} className="relative max-w-full min-w-0 select-none">
      <button
        onClick={() => setOpenColumn((prev) => !prev)}
        className={cn(
          "flex max-w-45 min-w-0 items-center justify-between gap-1",
          "cursor-pointer rounded-xl border-5 border-black",
          "py-2 pr-2 pl-3",
          "font-shadows text-lg font-semibold",
          "transition duration-200 ease-in-out",
          openColumn && "bg-black text-[#FFF4DE] outline-0",
        )}
      >
        <div className="min-w-0 truncate">{selectedColumn}</div>

        <FaAngleDown className="mt-1.5 h-5 w-5 shrink-0" />
      </button>

      {openColumn && (
        <div
          className={cn(
            "absolute bottom-full left-0 z-50",
            "w-max max-w-full overflow-hidden rounded-lg",
            "border-5 border-black",
            "bg-[#13110e] backdrop-blur-xl",
          )}
        >
          {columns.map((column) => (
            <button
              key={column.id}
              onClick={() => handleColumnChange(column.name)}
              className={cn(
                "block w-full cursor-pointer px-3 py-2 text-left",
                "font-shadows text-[18px] text-[#FFF4DE]",
                "hover:bg-[#FFF4DE] hover:text-black",
              )}
            >
              <div className="min-w-0 truncate">{column.name}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
