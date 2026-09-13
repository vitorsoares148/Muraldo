import { useEffect, useRef, useState } from "react";
import { IoMdArrowRoundForward } from "react-icons/io";
import { MdLeaderboard } from "react-icons/md";
import { RiPencilFill } from "react-icons/ri";

import LoadingComponent from "../generic/LoadingComponent";
import InputInfo from "../login/InputInfo";

import { useProject } from "../../contexts/ProjectContext";
import { useUser } from "../../contexts/UserContext";

import { updateProject } from "../../services/projects.service";

import { cn } from "../../utils/cn";

type ProjectInfoProps = {
  isOwner: boolean;
  projectIdNumber: number;
  handleProjectPage: () => Promise<void>;
};

export default function ProjectInfo({
  isOwner,
  projectIdNumber,
  handleProjectPage,
}: ProjectInfoProps) {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const [nameInput, setName] = useState("");
  const [descriptionInput, setDescription] = useState("");

  const [nameError, setNameError] = useState(false);
  const [descError, setDescError] = useState(false);

  const { user } = useUser();
  const { projectPage } = useProject();

  const projectInfoRef = useRef<HTMLDivElement>(null);

  const isAdmin = projectPage?.members?.some(
    (member) => member.id === user?.id && member.role === "admin",
  );

  useEffect(() => {
    const handleClickOutsideProjectInfo = (event: MouseEvent) => {
      if (
        projectInfoRef.current &&
        !projectInfoRef.current.contains(event.target as Node)
      ) {
        setEditing(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutsideProjectInfo);

    return () => {
      document.removeEventListener("mousedown", handleClickOutsideProjectInfo);
    };
  }, []);

  function validateProject() {
    if (nameInput?.trim().length === 0) {
      setNameError(true);
      return false;
    }

    if (descriptionInput?.trim().length === 0) {
      setDescError(true);
      return false;
    }

    return true;
  }

  async function handleUpdateProject() {
    if (!validateProject()) {
      return;
    }

    if (
      nameInput === projectPage?.name &&
      descriptionInput === projectPage?.description
    ) {
      setEditing(false);
      return;
    }

    try {
      setLoading(true);

      const result = await updateProject(
        projectIdNumber,
        nameInput,
        descriptionInput,
      );

      if (result.message !== "SUCCESS") {
        return;
      }

      await handleProjectPage();

      setEditing(false);
    } catch (error) {
      console.error("Update project error:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div ref={projectInfoRef} className="w-fit max-w-120 min-w-0 flex-1">
      {loading ? (
        <LoadingComponent />
      ) : (
        <div>
          <div className="relative w-fit">
            <MdLeaderboard className="mb-6 h-40 w-40 rounded-sm border-5 text-black" />

            {(isOwner || isAdmin) && (
              <button
                className="absolute top-2 -right-12"
                onClick={() => {
                  setName(projectPage?.name ?? "");
                  setDescription(projectPage?.description ?? "");
                  setEditing((prev) => !prev);
                }}
              >
                <RiPencilFill
                  className={cn(
                    "cursor-pointer rounded-xl p-1 text-4xl transition-all duration-200",
                    "hover:bg-black hover:text-[#FFF4DE]",
                    editing && "bg-black text-[#FFF4DE]",
                  )}
                />
              </button>
            )}
          </div>

          {editing ? (
            <div>
              <div>
                <InputInfo
                  value={nameInput}
                  onChange={setName}
                  onErrorReset={() => setNameError(false)}
                  placeholder="Nome"
                  className="mb-3 w-full max-w-80 min-w-0"
                  type={"text"}
                  error={nameError}
                />

                {nameError && (
                  <div className="mt-1 text-center font-semibold text-red-500">
                    Campo Obrigatório.
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div className="relative">
                  <InputInfo
                    value={descriptionInput}
                    onChange={setDescription}
                    onErrorReset={() => setDescError(false)}
                    placeholder="Descrição"
                    className="mb-3 w-full max-w-80 min-w-0"
                    type={"text"}
                    maxLength={200}
                    error={descError}
                  />

                  {descError && (
                    <div className="mt-1 text-center font-semibold text-red-500">
                      Campo Obrigatório.
                    </div>
                  )}

                  <div className="absolute top-3.5 -right-24 w-22 text-start text-xl font-bold">
                    {descriptionInput?.length ?? "0"}/200
                  </div>
                </div>
              </div>

              <button onClick={handleUpdateProject}>
                <IoMdArrowRoundForward
                  className={cn(
                    "h-12 w-12 shrink-0 cursor-pointer rounded-xl border-5 border-black",
                    "text-3xl text-black transition-all duration-200",
                    "hover:bg-black hover:text-[#FFF4DE]",
                  )}
                />
              </button>
            </div>
          ) : (
            <div>
              <div className="projects-container relative mb-6 max-h-20 w-full gap-2 overflow-y-auto p-1 text-start text-3xl font-bold wrap-break-word">
                {projectPage?.name}
              </div>

              <div className="projects-container mb-6 max-h-64 w-full overflow-y-auto text-start text-2xl wrap-break-word">
                {projectPage?.description}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
