import { useNavigate } from "react-router-dom";

import { deleteBoard } from "../../services/board.service";
import { useCheckPermission } from "../../utils/getPermission";
import { cn } from "../../utils/cn";

export default function DeleteBoardPage({
  confirm,
  projectId,
  boardIdNumber,
  setConfirm,
  setLoading,
}: {
  confirm: boolean;
  projectId: string | undefined;
  boardIdNumber: number;
  setConfirm: React.Dispatch<React.SetStateAction<boolean>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const navigate = useNavigate();
  const hasPermission = useCheckPermission();

  async function handleDeleteBoard() {
    try {
      setConfirm(false);
      setLoading(true);

      const result = await deleteBoard(boardIdNumber);

      if (result.message !== "SUCCESS") {
        return;
      }

      navigate(`/project/${projectId}`);
    } catch (error) {
      console.error("Delete board error:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={cn(
        "invisible absolute flex h-full w-full flex-col items-center justify-center pb-15",
        confirm && "visible",
      )}
    >
      <div className="relative -rotate-1 rounded-sm border-5 border-black/25 bg-[#FFF4DE] p-10 text-center text-3xl font-bold text-red-500">
        <div className="absolute -top-7 left-1/2 h-12 w-18 -translate-x-1/2 rotate-2 border-5 border-black/12 bg-[#e3d77d]/80" />

        <div className="mt-2 mb-10 rotate-1">Deseja deletar o quadro?</div>

        <div className="flex rotate-1 justify-center gap-3">
          <button
            onClick={() => hasPermission && handleDeleteBoard()}
            className={cn(
              "cursor-pointer rounded-xl",
              "border-5 border-red-500 p-2 px-10",
              "text-2xl font-bold text-red-500",
              "hover:bg-red-500 hover:text-[#FFF4DE]",
              "transition-colors duration-200",
            )}
          >
            Confirmar
          </button>

          <button
            onClick={() => setConfirm(false)}
            className={cn(
              "cursor-pointer rounded-xl",
              "border-5 border-black p-2 px-10",
              "text-2xl font-bold text-black",
              "hover:bg-black hover:text-[#FFF4DE]",
              "transition-colors duration-200",
            )}
          >
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
}
