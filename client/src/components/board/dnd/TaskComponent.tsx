import { useState, type CSSProperties } from "react";
import { FaComment } from "react-icons/fa";
import { GrFormCheckmark } from "react-icons/gr";
import { useDraggable, useDroppable } from "@dnd-kit/react";
import { closestCenter } from "@dnd-kit/collision";
import { CollisionPriority } from "@dnd-kit/abstract";

import { finishTask } from "../../../services/tasks.service";

import { useUser } from "../../../contexts/UserContext";

import {
  priorityConfig,
  type PriorityLevel,
} from "../../../constants/priorities";
import type { Task } from "../../../types/projects";

import { cn } from "../../../utils/cn";
import { formatDate } from "../../../utils/formatDate";

interface TaskProps {
  id: number;
  columnId: number;
  task: Task;
  setSelectedTask: React.Dispatch<React.SetStateAction<Task | undefined>>;
}

const textColorMap: Record<string, string> = {
  "bg-gray-400": "text-gray-400",
  "bg-purple-500": "text-purple-500",
  "bg-blue-500": "text-blue-500",
  "bg-green-500": "text-green-500",
  "bg-yellow-500": "text-yellow-500",
  "bg-red-500": "text-red-500",
};

export default function TaskComponent({
  id,
  columnId,
  task,
  setSelectedTask,
}: TaskProps) {
  const { user } = useUser();
  const [randomRotation] = useState(() => Math.floor(Math.random() * 3) - 1);
  const [finished, setFinished] = useState(task.finished);
  const [finishDate, setFinishDate] = useState(task.finish_date);
  const [read, setRead] = useState(
    user?.id ? task.read_by.includes(user.id) : false,
  );

  const config =
    priorityConfig[task.priority as PriorityLevel] ?? priorityConfig.none;

  function isDeadlineApproaching() {
    if (!task.due_date) {
      return false;
    }

    const targetDate = new Date(task.due_date);
    const currentDate = new Date();

    const difference = targetDate.getTime() - currentDate.getTime();
    const fiveDays = 5 * 24 * 60 * 60 * 1000;

    return difference >= 0 && difference <= fiveDays;
  }

  const { ref: draggableRef, isDragging } = useDraggable({
    id: `task-drag-${id}`,
    data: {
      type: "task",
      taskId: id,
      columnId,
    },
  });

  const { ref: droppableRef } = useDroppable({
    id: `task-drop-${id}`,
    data: {
      type: "task",
      taskId: id,
      columnId,
    },
    collisionDetector: closestCenter,
    collisionPriority: CollisionPriority.High,
  });

  async function handleFinishTask() {
    setFinishDate(new Date().toISOString());
    setFinished(true);

    try {
      const result = await finishTask(task.id);

      if (result !== "SUCCESS") {
        return;
      }
    } catch (error) {
      console.error("Finish task error:", error);
    }
  }

  return (
    <div ref={droppableRef} className="relative z-10 w-82">
      <div
        ref={draggableRef}
        style={
          {
            "--rotation": `${randomRotation}deg`,
            backgroundColor: config.pageColor,
          } as CSSProperties
        }
        className={cn(
          "group font-shadows relative h-fit min-h-48 w-82 rounded-sm select-none",
          "border-5 border-black/25 p-2 pb-12.5 text-black",
          "shadow-[0px_0px_0px_0px_rgba(0,0,0,0.5)] inset-shadow-amber-600",
          "rotate-(--rotation)",
          "duration-200 not-hover:transition",
          "hover:-translate-y-6 hover:scale-110 hover:rotate-0",
          "hover:shadow-[14px_14px_0px_-1px_rgba(0,0,0,0.25)]",
          "origin-top",
          isDragging &&
            "scale-110 rotate-0 shadow-[14px_14px_0px_-1px_rgba(0,0,0,0.25)] duration-200",
        )}
      >
        <div
          className={cn(
            "absolute -top-6 left-1/2 h-12 w-12 -translate-x-1/2",
            "rounded-full border-5 border-black/25",
            config.pinColor,
          )}
        />

        <button
          onClick={() => {
            setRead(true);
            setSelectedTask(task);
          }}
          className={cn(
            "absolute right-2 text-neutral-600/50 transition duration-200 hover:animate-none hover:text-black",
            !read &&
              task.read_by.length !== 0 &&
              `animate-pulse ${textColorMap[config.pinColor]} hover:${textColorMap[config.pinColor]}`,
          )}
        >
          <FaComment className="h-8 w-8 cursor-pointer" />
        </button>

        <button
          onClick={handleFinishTask}
          style={{ "--dynamic-bg": config.pageColor } as CSSProperties}
          className={cn(
            "invisible absolute right-1 bottom-1 z-2 flex h-12 w-20 items-center justify-center rounded-lg border-5 border-green-500 text-green-500",
            "cursor-pointer bg-(--dynamic-bg) transition duration-200 hover:bg-green-500 hover:text-[#FFF4DE]",
            !finished && "group-hover:visible",
          )}
        >
          <GrFormCheckmark className="h-15 w-15" />
        </button>

        <div
          className={cn(
            "font-shadows absolute right-2 bottom-2 text-2xl font-bold",
            finished
              ? "text-green-500"
              : isDeadlineApproaching() && "text-red-500",
          )}
        >
          {finished
            ? finishDate && formatDate(finishDate)
            : task.due_date && formatDate(task.due_date)}
        </div>

        <div className="font-shadows absolute bottom-2 max-w-54 truncate text-2xl font-bold text-black">
          {task.assigned_username}
        </div>

        <div className="projects-container mt-10 mb-1.5 h-full max-h-50 overflow-y-auto text-2xl leading-relaxed font-bold wrap-break-word">
          {task.description}
        </div>
      </div>
    </div>
  );
}
