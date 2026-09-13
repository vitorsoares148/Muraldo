import { useNavigate } from "react-router-dom";
import { MdLeaderboard } from "react-icons/md";
import { FaCrown } from "react-icons/fa";
import { cn } from "../../utils/cn";
import { useUser } from "../../contexts/UserContext";
import type { Project } from "../../types/projects";

export default function ProjectCard({ project }: { project: Project }) {
  const navigate = useNavigate();
  const { user } = useUser();

  return (
    <div className="group relative flex h-130 w-full max-w-90 justify-center overflow-hidden rounded-sm border-5 border-black p-5">
      <div className="flex w-full flex-col items-center">
        {project.owner_id === user?.id && (
          <FaCrown className="absolute top-5 right-5 h-10 w-10 text-yellow-400" />
        )}

        <MdLeaderboard className="z-2 mb-8 h-30 w-30 shrink-0 rounded-sm border-5 bg-[#FFF4DE] text-black" />

        <div className="projects-container mb-8 line-clamp-2 max-h-18 w-full text-center text-3xl font-bold wrap-break-word">
          {project.name}
        </div>

        <div className="line-clamp-5 w-full rounded-sm border-5 p-2 text-lg wrap-break-word">
          <div>{project.description}</div>
        </div>

        <button
          className={cn(
            "absolute bottom-5 cursor-pointer rounded-xl",
            "p-2 px-10",
            "text-2xl font-bold",
            "border-5 hover:border-black hover:bg-black hover:text-[#FFF4DE]",
            "transition-all duration-200",
          )}
          onClick={() => navigate(`/project/${project.id}`)}
        >
          Entrar
        </button>
      </div>
    </div>
  );
}
