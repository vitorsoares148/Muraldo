import { DragDropProvider } from "@dnd-kit/react";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/react";
import { isSortable } from "@dnd-kit/react/sortable";
import { move } from "@dnd-kit/helpers";
import { useState } from "react";

import { ColumnComponent } from "./dnd/ColumnComponent";
import TaskComponent from "./dnd/TaskComponent";
import TrashCan from "./dnd/TrashCan";

import {
  deleteColumn,
  updateColumnsPosition,
} from "../../services/columns.service";
import { deleteTask, updateTasksPosition } from "../../services/tasks.service";

import type { Column, Task } from "../../types/projects";

import { useCheckPermission } from "../../utils/getPermission";

type DragData =
  | {
      type: "task";
      taskId: number;
      columnId: number;
    }
  | {
      type: "column";
      columnId: number;
    };

export default function BoardDnD({
  columns,
  setColumns,
  setLoading,
  setSelectedTask,
  handleBoard,
}: {
  columns: Column[];
  setColumns: React.Dispatch<React.SetStateAction<Column[]>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedTask: React.Dispatch<React.SetStateAction<Task | undefined>>;
  handleBoard: () => Promise<void>;
}) {
  const [dragging, setDragging] = useState(false);
  const [draggingType, setDraggingType] = useState("");

  const hasPermission = useCheckPermission();

  function getIndex(id: number) {
    return columns.findIndex((column) => column.id === id);
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { source, target } = event.operation;

    console.log(source?.data);
    console.log(target?.data);

    setDragging(false);
    setDraggingType("");

    if (event.canceled || source === null) return;

    const sourceData = source.data as DragData;

    if (sourceData.type === "column") {
      await handleColumn(event);
    } else if (sourceData.type === "task") {
      await handleTask(event);
    }
  };

  async function handleColumn(event: DragEndEvent) {
    const { source, target } = event.operation;

    const sourceData = source?.data as Extract<DragData, { type: "column" }>;

    const columnId = sourceData.columnId;

    if (target?.id === "trash-can") {
      setColumns((prevColumns) =>
        prevColumns.filter((column) => column.id !== columnId),
      );

      await handleDeleteColumn(columnId);
      return;
    }

    if (isSortable(source)) {
      const fromIndex = source.initialIndex;
      const toIndex = source.index;

      if (fromIndex === toIndex) return;

      setColumns((prev) => move(prev, event));

      const movedColumn = columns[fromIndex];

      try {
        await updateColumnsPosition(movedColumn.id, toIndex);
      } catch (error) {
        console.error("Update column position error:", error);
      }
    }
  }

  function getTaskDestination(
    columns: Column[],
    target: DragData | undefined,
  ): { columnId: number; position: number } | null {
    if (target?.type === "task") {
      const targetTaskId = target.taskId;

      for (const column of columns) {
        const targetTask = column.tasks.find(
          (task) => task.id === targetTaskId,
        );

        if (targetTask) {
          return {
            columnId: column.id,
            position: targetTask.position,
          };
        }
      }

      return null;
    }

    if (target?.type === "column") {
      const columnId = target.columnId;
      const destinationColumn = columns.find(
        (column) => column.id === columnId,
      );

      if (!destinationColumn) {
        return null;
      }

      return {
        columnId,
        position: destinationColumn.tasks.length,
      };
    }

    return null;
  }

  function findTask(columns: Column[], taskId: number): Task | undefined {
    for (const column of columns) {
      const task = column.tasks.find((task) => task.id === taskId);

      if (task) {
        return task;
      }
    }

    return undefined;
  }

  function moveTask(
    columns: Column[],
    task: Task,
    columnId: number,
    position: number,
  ): Column[] {
    const columnsWithoutTask = columns.map((column) => ({
      ...column,
      tasks: column.tasks.filter((item) => item.id !== task.id),
    }));

    const updatedColumns = columnsWithoutTask.map((column) => {
      if (column.id !== columnId) {
        return column;
      }

      const newTask: Task = {
        ...task,
        column_id: columnId,
      };

      const tasks = [...column.tasks];
      const newPosition = Math.min(position, tasks.length);

      tasks.splice(newPosition, 0, newTask);

      return {
        ...column,
        tasks,
      };
    });

    return updatedColumns.map((column) => ({
      ...column,
      tasks: column.tasks.map((task, index) => ({
        ...task,
        position: index,
      })),
    }));
  }

  async function handleTask(event: DragEndEvent) {
    const { source, target } = event.operation;

    const sourceData = source?.data as Extract<DragData, { type: "task" }>;

    const taskId = sourceData.taskId;

    if (!taskId) {
      return;
    }

    if (target?.id === "trash-can") {
      setColumns((prevColumns) =>
        prevColumns.map((column) =>
          column.id === source?.data.columnId
            ? {
                ...column,
                tasks: column.tasks.filter((task) => task.id !== taskId),
              }
            : column,
        ),
      );

      await handleDeleteTask(taskId);
      return;
    }

    const destination = getTaskDestination(
      columns,
      target?.data as DragData | undefined,
    );

    if (!destination) {
      return;
    }

    const draggedTask = findTask(columns, taskId);

    if (!draggedTask) {
      return;
    }

    setColumns((prevColumns) =>
      moveTask(
        prevColumns,
        draggedTask,
        destination.columnId,
        destination.position,
      ),
    );

    try {
      await updateTasksPosition(
        taskId,
        destination.columnId,
        destination.position,
      );
    } catch (error) {
      console.error("Update task position error:", error);
      await handleBoard();
    }
  }

  async function handleDeleteColumn(columnId: number) {
    try {
      setLoading(true);
      const result = await deleteColumn(columnId);

      if (result.message !== "SUCCESS") {
        setLoading(false);
        return;
      }

      await handleBoard();
    } catch (error) {
      console.error("Delete column error:", error);
      setLoading(false);
    }
  }

  async function handleDeleteTask(taskId: number) {
    try {
      setLoading(true);
      const result = await deleteTask(taskId);

      if (result.message !== "SUCCESS") {
        setLoading(false);
        return;
      }

      await handleBoard();
    } catch (error) {
      console.error("Delete task error:", error);
      setLoading(false);
    }
  }

  const trashcanShow = () =>
    dragging && (hasPermission || draggingType === "task");
  return (
    <DragDropProvider
      onDragEnd={handleDragEnd}
      onDragStart={(event: DragStartEvent) => {
        setDragging(true);
        const { source } = event.operation;
        setDraggingType(source?.data.type);
      }}
    >
      <div className="relative h-fit w-max">
        {/* Separadores */}
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            backgroundImage: `repeating-linear-gradient(
                      to right, 
                      transparent 0px, 
                      transparent 365px, 
                      rgba(0, 0, 0, 0.75) 365px, 
                      rgba(0, 0, 0, 0.75) 371px
                      )`,
            backgroundSize: "371px 100%",
          }}
        />

        {/* Colunas */}
        <div className="relative z-1 flex h-full w-max flex-nowrap">
          {columns.map((column) => (
            <ColumnComponent
              key={column.id}
              id={column.id}
              index={getIndex(column.id)}
              title={column.name}
            >
              {/* Tarefas */}
              {column.tasks.map((task) => (
                <TaskComponent
                  key={task.id}
                  id={task.id}
                  columnId={column.id}
                  task={task}
                  setSelectedTask={setSelectedTask}
                />
              ))}
            </ColumnComponent>
          ))}
        </div>
      </div>

      {/* Lixeira */}
      {trashcanShow() && <TrashCan />}
    </DragDropProvider>
  );
}
