import { useDroppable } from "@dnd-kit/react";
import { FaTrashCan } from "react-icons/fa6";

import { cn } from "../../../utils/cn";

export default function TrashCan() {
  const { ref, isDropTarget } = useDroppable({
    id: "trash-can",
  });

  return (
    <div
      ref={ref}
      className={cn(
        "absolute bottom-12 left-1/2 z-50 flex h-25 w-85 -translate-x-1/2",
        "flex-col items-center justify-center rounded-lg border-5 transition duration-200",
        isDropTarget
          ? "scale-120 border-red-500 bg-red-500 text-[#FFF4DE]"
          : "border-red-500 text-red-500",
      )}
    >
      <FaTrashCan className="mt-1.5 h-16 w-16" />
    </div>
  );
}
