import { useNavigate } from "react-router-dom";

import type { Project } from "../../../types/projects";

interface ProjectListProps {
  projects: Project[] | null;
  projectId: number;
  onClose: () => void;
}

export default function ProjectList({
  projects,
  projectId,
  onClose,
}: ProjectListProps) {
  const navigate = useNavigate();

  if (!projects) {
    return (
      <div className="mt-5 text-center text-lg font-bold text-[#FFF4DE]/50">
        Nenhum projeto encontrado...
      </div>
    );
  }

  return (
    <>
      {projects.map((project) => (
        <button
          key={project.id}
          onClick={() => {
            if (projectId !== project.id) {
              onClose();
              navigate(`/project/${project.id}`);
            }
          }}
          className={
            projectId === project.id
              ? "mt-3 w-[95%] truncate rounded-xl border-4 border-[#FFF4DE] bg-[#FFF4DE] p-1 text-2xl font-bold text-[#28251e] transition-colors duration-200"
              : "mt-3 w-[95%] cursor-pointer truncate rounded-xl border-4 border-[#FFF4DE] p-1 text-2xl font-bold text-[#FFF4DE] transition-colors duration-200 hover:bg-[#FFF4DE] hover:text-[#28251e]"
          }
        >
          {project.name}
        </button>
      ))}
    </>
  );
}
