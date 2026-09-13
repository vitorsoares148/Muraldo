import { useNavigate } from "react-router-dom";

import { cn } from "../../../utils/cn";

interface SideBarNavigationProps {
  projectId: string | undefined;
  boardId: string | undefined;
  onClose: () => void;
}

export default function SideBarNavigation({
  projectId,
  boardId,
  onClose,
}: SideBarNavigationProps) {
  const navigate = useNavigate();

  return (
    <div className="w-[95%]">
      <button
        onClick={() => {
          onClose();
          navigate("/home");
        }}
        className={cn(
          "mt-3 w-full truncate rounded-xl border-4 border-[#FFF4DE]",
          "cursor-pointer p-1 text-2xl font-bold text-[#FFF4DE]",
          "transition-colors duration-200",
          "hover:bg-[#FFF4DE] hover:text-[#28251e]",
        )}
      >
        Voltar
      </button>

      <button
        onClick={() => {
          onClose();
          navigate(`/project/${projectId}`);
        }}
        className={cn(
          !boardId
            ? "border-[#FFF4DE] bg-[#FFF4DE] text-[#28251e]"
            : "cursor-pointer border-[#FFF4DE] text-[#FFF4DE] hover:bg-[#FFF4DE] hover:text-[#28251e]",
          "mt-3 w-full truncate rounded-xl border-4",
          "p-1 text-2xl font-bold",
          "transition-colors duration-200",
        )}
      >
        Informações
      </button>
    </div>
  );
}
