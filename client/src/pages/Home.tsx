import { useEffect, useState } from "react";

import { useProject } from "../contexts/ProjectContext";

import Box from "../components/generic/Box";
import LoadingComponent from "../components/generic/LoadingComponent";
import CreateProjectCard from "../components/home/CreateProjectCard";
import CreateProjectPage from "../components/home/CreateProjectPage";
import ProjectCard from "../components/home/ProjectCard";

import { cn } from "../utils/cn";

export default function Home() {
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const { getProjects, projects, setProjectPage } = useProject();

  useEffect(() => {
    const handleGetProjects = async () => {
      if (creating) {
        return;
      }

      setProjectPage(null);
      await getProjects();
      setLoading(false);
    };

    handleGetProjects();
  }, [creating, getProjects, setProjectPage]);

  return (
    <div className="flex min-h-screen w-full min-w-0 items-center justify-center">
      <Box className="h-172 w-[90%] max-w-300">
        {loading ? (
          <LoadingComponent />
        ) : creating ? (
          <CreateProjectPage
            setCreating={setCreating}
            setLoading={setLoading}
          />
        ) : (
          <div className="h-155 w-full rotate-1">
            <div className="mb-8 text-center text-5xl font-bold">Projetos</div>
            <ul
              className={cn(
                "projects-container grid max-h-130 w-full min-w-0",
                "grid-cols-1 gap-8 overflow-y-auto pr-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3",
              )}
            >
              {projects?.map((project) => (
                <li key={project.id}>
                  <ProjectCard project={project} />
                </li>
              ))}

              <li key="create">
                <CreateProjectCard setCreating={setCreating} />
              </li>
            </ul>
          </div>
        )}
      </Box>
    </div>
  );
}
