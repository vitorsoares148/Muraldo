import { useNavigate } from "react-router-dom";

import type { ProjectPage } from "../../../types/projects";

interface BoardListProps {
  boards: ProjectPage["boards"];
  boardId: number;
  projectId: number;
  hasPermission: boolean;
  onClose: () => void;
}

export default function BoardList({
  boards,
  boardId,
  projectId,
  hasPermission,
  onClose,
}: BoardListProps) {
  const navigate = useNavigate();

  if (boards.length === 0) {
    if (!hasPermission) {
      return (
        <div className="mt-5 text-center text-lg font-bold text-[#FFF4DE]/50">
          Nenhum quadro encontrado...
        </div>
      );
    }

    return null;
  }

  return (
    <>
      {boards.map((board) => (
        <button
          key={board.id}
          onClick={() => {
            if (boardId !== board.id) {
              onClose();
              navigate(`/project/${projectId}/board/${board.id}`);
            }
          }}
          className={
            boardId === board.id
              ? "mt-3 w-[95%] shrink-0 truncate rounded-xl border-4 border-[#FFF4DE] bg-[#FFF4DE] p-1 text-2xl font-bold text-[#28251e] transition-colors duration-200"
              : "mt-3 w-[95%] shrink-0 cursor-pointer truncate rounded-xl border-4 border-[#FFF4DE] p-1 text-2xl font-bold text-[#FFF4DE] transition-colors duration-200 hover:bg-[#FFF4DE] hover:text-[#28251e]"
          }
        >
          {board.name}
        </button>
      ))}
    </>
  );
}
