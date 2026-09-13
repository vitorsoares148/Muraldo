import { useDroppable } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import { pointerIntersection } from "@dnd-kit/collision";
import { CollisionPriority } from "@dnd-kit/abstract";
import type { ReactNode } from "react";

import { cn } from "../../../utils/cn";

interface ColumnProps {
  id: number;
  index: number;
  title: string;
  children: ReactNode;
}

export function ColumnComponent({ id, index, title, children }: ColumnProps) {
  const { ref, handleRef, isDragging } = useSortable({
    id: `column-drag-${id}`,
    index,
    data: {
      type: "column",
      columnId: id,
    },
  });

  const { ref: dropRef } = useDroppable({
    id: `column-drop-${id}`,
    data: {
      type: "column",
      columnId: id,
    },
    collisionDetector: pointerIntersection,
    collisionPriority: CollisionPriority.Low,
  });

  return (
    <div
      ref={ref}
      className={cn(
        "mx-2.25 mr-3.5 flex min-h-204.5 w-87 shrink-0 flex-col items-center rounded-4xl p-4 pt-7 transition-colors duration-200 has-[.target-child:hover]:bg-black/15",
        isDragging && "bg-black/15",
      )}
    >
      <div
        ref={handleRef}
        className={cn(
          "target-child font-shadows mb-7 max-w-85 shrink-0 cursor-pointer items-center select-none",
          "truncate rounded-sm border-5 border-black/15 bg-[#FFF4DE] p-1 px-4 text-center",
          "text-3xl font-bold text-black transition duration-200",
          "hover:-translate-y-6 hover:scale-110",
          "hover:shadow-[14px_14px_0px_-1px_rgba(0,0,0,0.25)]",
          isDragging &&
            "-translate-y-6 scale-110 shadow-[14px_14px_0px_-1px_rgba(0,0,0,0.25)]",
        )}
      >
        {title}
      </div>

      <div
        ref={dropRef}
        className="flex min-w-90 flex-1 flex-col items-center gap-10 p-4 select-none"
      >
        {children}
      </div>
    </div>
  );
}
