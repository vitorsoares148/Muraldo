import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import LoadingComponent from "../components/generic/LoadingComponent";
import BoardDnD from "../components/board/BoardDnD";
import CommentComponent from "../components/board/CommentComponent";
import CreateColumn from "../components/board/CreateColumn";
import CreateTaskManager from "../components/board/CreateTaskManager";
import DeleteBoardPage from "../components/board/DeleteBoardPage";

import { useProject } from "../contexts/ProjectContext";

import { getColumns } from "../services/columns.service";
import { getTasks } from "../services/tasks.service";

import type { Column, Task } from "../types/projects";

import { useHorizontalDragScroll } from "../hooks/useHorizontalDragScroll";
import { cn } from "../utils/cn";
import { useCheckPermission } from "../utils/getPermission";

export default function Board() {
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [columns, setColumns] = useState<Column[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task>();

  const { projectId, boardId } = useParams();
  const projectIdNumber = Number(projectId);
  const boardIdNumber = Number(boardId);

  const navigate = useNavigate();
  const { projectPage, getProjectPage } = useProject();
  const hasPermission = useCheckPermission();

  const scrollRef = useRef<HTMLDivElement>(null);

  const { handleMouseDown, handleMouseLeaveOrUp, handleMouseMove } =
    useHorizontalDragScroll(scrollRef);

  const boardName = projectPage?.boards.find(
    (board) => board.id === boardIdNumber,
  )?.name;

  const handleBoard = useCallback(async () => {
    try {
      await getProjectPage(projectIdNumber);

      const result = await getColumns(boardIdNumber);

      if (result.message !== "SUCCESS") {
        setLoading(false);
        return;
      }

      const columnsWithTasks = await Promise.all(
        result.columns.map(async (column: Column) => {
          const taskResult = await getTasks(Number(column.id));
          return {
            ...column,
            tasks: taskResult.message === "SUCCESS" ? taskResult.tasks : [],
          };
        }),
      );

      setColumns(columnsWithTasks);

      setLoading(false);
    } catch (error) {
      console.error("Get board error:", error);
      navigate("/home");
    }
  }, [getProjectPage, navigate, projectIdNumber, boardIdNumber]);

  useEffect(() => {
    setConfirm(false);
    setLoading(true);
    handleBoard();
  }, [handleBoard]);

  return (
    <div className="relative flex h-screen w-full min-w-0 items-center justify-center">
      <div className="relative z-1 flex h-[98%] min-h-0 w-[94.2%] flex-col items-center justify-start overflow-hidden rounded-3xl border-5 border-black/25 bg-[#705d4e] p-4">
        <div
          className={cn(
            "mb-5 flex w-full items-center justify-between gap-3",
            confirm && "invisible",
          )}
        >
          <CreateTaskManager
            columns={columns}
            setLoading={setLoading}
            handleBoard={handleBoard}
            loading={loading}
          />
          <div className="font-shadows line-clamp-2 max-h-24 min-w-0 rounded-sm border-5 border-black/25 bg-[#FFF4DE] p-2 px-8 text-start text-3xl font-bold wrap-break-word text-black select-none">
            {boardName}
          </div>

          {selectedTask && (
            <CommentComponent task={selectedTask} setTask={setSelectedTask} />
          )}

          {hasPermission && (
            <button
              onClick={() => setConfirm(true)}
              className={cn(
                "top-4.5 right-4.5 min-w-66 cursor-pointer overflow-hidden rounded-xl text-center",
                "p-2 px-10",
                "border-red-500 text-2xl font-bold",
                "border-5 text-red-500 hover:bg-red-500 hover:text-[#FFF4DE]",
                "transition-colors duration-200",
              )}
            >
              <div>Deletar Quadro</div>
            </button>
          )}
        </div>

        <DeleteBoardPage
          confirm={confirm}
          projectId={projectId}
          boardIdNumber={boardIdNumber}
          setConfirm={setConfirm}
          setLoading={setLoading}
        />

        <LoadingComponent
          className={cn("absolute pb-20", loading ? "visible" : "invisible")}
        />

        <div
          ref={scrollRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeaveOrUp}
          onMouseUp={handleMouseLeaveOrUp}
          onMouseMove={handleMouseMove}
          className={cn(
            "projects-container flex min-h-0 w-full min-w-0 flex-1 overflow-x-auto pb-3",
            (confirm || loading) && "invisible",
          )}
        >
          <BoardDnD
            columns={columns}
            setColumns={setColumns}
            setLoading={setLoading}
            setSelectedTask={setSelectedTask}
            handleBoard={handleBoard}
          />

          <CreateColumn
            boardIdNumber={boardIdNumber}
            setLoading={setLoading}
            handleBoard={handleBoard}
          />
        </div>
      </div>
    </div>
  );
}
