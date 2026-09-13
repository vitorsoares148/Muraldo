import { useNavigate } from "react-router-dom";
import { deleteProject, leaveProject } from "../../services/projects.service";
import { cn } from "../../utils/cn";

export default function DeleteProjectPage({
  projectIdNumber,
  isOwner,
  setLoading,
  setConfirm,
}: {
  projectIdNumber: number;
  isOwner: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setConfirm: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const navigate = useNavigate();

  async function handleConfirm() {
    try {
      setLoading(true);

      const result = isOwner ? await deleteProject(projectIdNumber) : await leaveProject(projectIdNumber);

      if (result.message !== "SUCCESS") {
        setLoading(false);
        return;
      }

      navigate("/home");
    } catch (error) {
      console.error(`${isOwner ? "Delete" : "Leave"} project error:`, error);
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full rotate-1 flex-col items-center justify-center">
      <div className="mb-6 text-center text-3xl font-bold text-red-500">
        <div className="mt-7.5 mb-15">
          {isOwner ? "Deseja deletar o projeto?" : "Deseja sair do projeto?"}
        </div>

        <div className="flex justify-center gap-3">
          <button
            onClick={handleConfirm}
            className={cn(
              "cursor-pointer rounded-xl",
              "p-2 px-10",
              "border-red-500 text-2xl font-bold",
              "border-5 text-red-500 hover:bg-red-500 hover:text-[#FFF4DE]",
              "transition-all duration-200",
            )}
          >
            Confirmar
          </button>

          <button
            onClick={() => setConfirm(false)}
            className={cn(
              "cursor-pointer rounded-xl",
              "p-2 px-10",
              "text-2xl font-bold",
              "border-5 border-black text-black hover:bg-black hover:text-[#FFF4DE]",
              "transition-all duration-200",
            )}
          >
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
}
