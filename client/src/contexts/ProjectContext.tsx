import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

import {
  getProjectPage as getProjectPageService,
  getProjects as getProjectsService,
} from "../services/projects.service";
import type { Project, ProjectPage } from "../types/projects";

interface ProjectContextType {
  projectPage: ProjectPage | null;
  projects: Project[] | null;

  setProjectPage: React.Dispatch<React.SetStateAction<ProjectPage | null>>;

  getProjects: () => Promise<void>;
  getProjectPage: (id: number) => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projectPage, setProjectPage] = useState<ProjectPage | null>(null);
  const [projects, setProjects] = useState<Project[] | null>(null);

  const getProjectPage = useCallback(async (id: number): Promise<void> => {
    const result = await getProjectPageService(id);

    if (result.message === "SUCCESS") {
      setProjectPage(result.project);
    }
  }, []);

  const getProjects = useCallback(async (): Promise<void> => {
    try {
      const result = await getProjectsService();

      if (result.message !== "SUCCESS") {
        return;
      }

      setProjects(result.projects);
    } catch (error) {
      console.error("Get projects error:", error);
    }
  }, []);

  return (
    <ProjectContext.Provider
      value={{
        projects,
        projectPage,
        setProjectPage,
        getProjectPage,
        getProjects,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

// ======================================================
// HOOK
// ======================================================

export function useProject() {
  const context = useContext(ProjectContext);

  if (!context) {
    throw new Error("useProject must be used inside a ProjectProvider");
  }

  return context;
}
