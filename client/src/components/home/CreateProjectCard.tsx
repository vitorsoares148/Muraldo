import { FaDiagramProject } from "react-icons/fa6";

type CreateProjectCardProps = {
  setCreating: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function CreateProjectCard({
  setCreating,
}: CreateProjectCardProps) {
  return (
    <button
      className="group flex h-130 w-full max-w-90 cursor-pointer items-center justify-center rounded-xl border-5 border-dashed border-black/25 transition-all duration-200 hover:border-black"
      onClick={() => setCreating(true)}
    >
      <div className="flex flex-col items-center">
        <FaDiagramProject className="h-30 w-30 text-black/25 transition-all duration-200 group-hover:text-black" />

        <div className="text-center text-2xl font-bold text-black/25 transition-all duration-200 group-hover:text-black">
          Criar novo projeto
        </div>
      </div>
    </button>
  );
}
