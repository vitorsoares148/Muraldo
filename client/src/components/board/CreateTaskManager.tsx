import { useEffect, useRef, useState } from "react";
import { FaPlus } from "react-icons/fa6";
import { IoMdArrowRoundForward } from "react-icons/io";

import { createTask } from "../../services/tasks.service";

import { type PriorityLevel } from "../../constants/priorities";
import { useProject } from "../../contexts/ProjectContext";
import type { Column } from "../../types/projects";
import { cn } from "../../utils/cn";

import ColumnDropdown from "./create_task/ColumnDropdown";
import InputDate from "./create_task/InputDate";
import PriorityDropdown from "./create_task/PriorityDropdown";
import ResponsibleDropdown from "./create_task/ResponsibleDropdown";

import InputInfo from "../login/InputInfo";

const ERROR_TASK = {
  NONE: 0,
  REQUIRED: 1,
  INVALID: 2,
};

export default function CreateTaskManager({
  columns,
  setLoading,
  handleBoard,
  loading,
}: {
  columns: Column[];
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  handleBoard: () => Promise<void>;
  loading: boolean;
}) {
  const [active, setActive] = useState(false);
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [descError, setDescError] = useState(ERROR_TASK.NONE);
  const [dateError, setDateError] = useState(ERROR_TASK.NONE);

  const [selectedPriority, setPriority] = useState<PriorityLevel>("none");
  const [selectedResponsible, setResponsible] = useState("Não possui");
  const [selectedColumn, setColumn] = useState(columns[0]?.name);

  const taskRef = useRef<HTMLDivElement>(null);

  const { projectPage } = useProject();

  function getResponsibleId(): number | undefined {
    if (selectedResponsible === "Não possui") {
      return;
    }

    if (projectPage?.owner.username === selectedResponsible) {
      return projectPage.owner.id;
    }

    return projectPage?.members.find(
      (member) => member.username === selectedResponsible,
    )?.id;
  }

  const members = [
    "Não possui",
    projectPage?.owner.username ?? "",
    ...(projectPage?.members ?? [])
      .slice()
      .sort((a, b) => a.username.localeCompare(b.username))
      .map((member) => member.username),
  ];

  function validateDescription() {
    if (description.trim().length === 0) {
      setDescError(ERROR_TASK.REQUIRED);
      return false;
    }

    return true;
  }

  function validateDate() {
    const match = date.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

    if (!match) {
      return false;
    }

    const [, dayString, monthString, yearString] = match;

    const day = Number(dayString);
    const month = Number(monthString);
    const year = Number(yearString);

    if (month < 1 || month > 12 || day < 1) {
      setDateError(ERROR_TASK.INVALID);
      return false;
    }

    const daysInMonth = new Date(year, month, 0).getDate();

    if (day > daysInMonth) {
      setDateError(ERROR_TASK.INVALID);
      return false;
    }

    const inputDate = new Date(year, month - 1, day);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (inputDate <= today) {
      setDateError(ERROR_TASK.INVALID);
      return false;
    }

    return true;
  }

  async function handleCreateTask() {
    if (!validateDescription() || (date.length > 0 && !validateDate())) {
      return;
    }

    const columnId = columns.find(
      (column) => column.name === selectedColumn,
    )?.id;

    if (!columnId) {
      return;
    }

    try {
      setLoading(true);

      const dueDate =
        date.length > 0 ? date.split("/").reverse().join("-") : null;

      const result = await createTask(
        columnId,
        description,
        selectedPriority,
        dueDate,
        getResponsibleId() ?? null,
      );

      if (result.message !== "SUCCESS") {
        setDescError(ERROR_TASK.REQUIRED);
        return;
      }

      await handleBoard();
      setActive(false);
    } catch (error) {
      console.error("Create task error:", error);
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!selectedColumn && columns.length > 0) {
      setColumn(columns[0].name);
    }
  }, [columns, selectedColumn]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (taskRef.current && !taskRef.current.contains(event.target as Node)) {
        setActive(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setDescription("");
    setResponsible("Não possui");
    setPriority("none");
    setColumn(columns[0]?.name);
    setDescError(ERROR_TASK.NONE);
    setDateError(ERROR_TASK.NONE);
    setDate("");
  }, [active]);

  return (
    <div className="absolute bottom-12 left-4 z-10 w-full max-w-160">
      <button
        onClick={() => setActive(true)}
        className={cn(
          "group absolute bottom-0 flex h-18 w-18 cursor-pointer items-center justify-center rounded-xl",
          "border-5 border-green-500 transition-colors duration-200 hover:bg-green-500",
          active || (loading && "invisible"),
          columns.length === 0 && "invisible",
        )}
      >
        <FaPlus className="text-5xl text-green-500 transition-colors duration-200 group-hover:text-[#FFF4DE]" />
      </button>

      <div
        ref={taskRef}
        className={cn(
          "invisible absolute bottom-0 left-0 flex w-[95%] sm:h-60 sm:w-full",
          "min-w-0 justify-center rounded-sm border-5 border-black/25",
          "bg-[#FFF4DE] p-7",
          active && !loading && "visible",
        )}
      >
        <div className="flex w-full min-w-0 flex-col items-center gap-3">
          <div className="flex w-full min-w-0">
            <InputInfo
              value={description}
              onChange={setDescription}
              onErrorReset={() => setDescError(ERROR_TASK.NONE)}
              placeholder="Descrição"
              className="h-13.5 w-full min-w-0 rounded-r-none border-r-0"
              type="text"
              error={descError !== ERROR_TASK.NONE}
              maxLength={200}
            />

            <button className="shrink-0">
              <IoMdArrowRoundForward
                onClick={handleCreateTask}
                className={cn(
                  "h-13.5 w-13.5 cursor-pointer rounded-r-xl border-5 border-black",
                  "text-3xl text-black transition-colors duration-200",
                  "hover:bg-black hover:text-[#FFF4DE]",
                  descError !== ERROR_TASK.NONE &&
                    "border-red-500 text-red-500 hover:bg-red-500",
                )}
              />
            </button>
          </div>

          <div className="w-full min-w-0 justify-around gap-3 sm:flex">
            <div className="mb-3 flex min-w-0 flex-1 flex-col gap-3 sm:mb-0">
              <div className="flex min-w-0 items-center justify-start gap-1 sm:justify-between">
                <div className="font-shadows truncate text-xl font-bold">
                  Prioridade:
                </div>

                <PriorityDropdown
                  selectedPriority={selectedPriority}
                  setPriority={setPriority}
                />
              </div>

              <div className="flex min-w-0 items-center justify-start gap-1 sm:justify-between">
                <div className="font-shadows truncate text-xl font-bold">
                  Coluna:
                </div>

                <ColumnDropdown
                  selectedColumn={selectedColumn}
                  setColumn={setColumn}
                  columns={columns}
                />
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <div className="flex min-w-0 items-center justify-start gap-1 sm:justify-between">
                <div className="font-shadows truncate text-xl font-bold">
                  Responsável:
                </div>

                <ResponsibleDropdown
                  selectedResponsible={selectedResponsible}
                  setResponsible={setResponsible}
                  members={members}
                />
              </div>

              <div className="flex min-w-0 items-center justify-start gap-1 sm:justify-between">
                <div className="font-shadows truncate text-xl font-bold">
                  Prazo:
                </div>

                <InputDate
                  value={date}
                  placeholder="DD/MM/YYYY"
                  type="text"
                  date
                  className="h-13.5 max-w-42 min-w-0"
                  error={dateError !== ERROR_TASK.NONE}
                  onChange={setDate}
                  onErrorReset={() => setDateError(ERROR_TASK.NONE)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
