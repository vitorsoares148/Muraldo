import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import Box from "../components/generic/Box";
import LoadingComponent from "../components/generic/LoadingComponent";
import DeleteProjectPage from "../components/project/DeleteProjectPage";
import MemberList from "../components/project/MemberList";
import ProjectInfo from "../components/project/ProjectInfo";

import { useProject } from "../contexts/ProjectContext";

import { useCheckOwner } from "../utils/getPermission";
import { cn } from "../utils/cn";

export default function Project() {
  const { projectId } = useParams();
  const projectIdNumber = Number(projectId);

  const { getProjectPage } = useProject();
  const navigate = useNavigate();
  const isOwner = useCheckOwner();

  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(false);

  const handleProjectPage = useCallback(async () => {
    try {
      await getProjectPage(projectIdNumber);
      setLoading(false);
    } catch (error) {
      console.error("Get project page error:", error);
      navigate("/home");
    }
  }, [getProjectPage, navigate, projectIdNumber]);

  useEffect(() => {
    handleProjectPage();
  }, [handleProjectPage]);

  return (
    <div className="flex min-h-screen w-full min-w-0 items-center justify-center">
      <Box className="h-172 w-[90%] max-w-300 p-13">
        {loading ? (
          <LoadingComponent />
        ) : confirm ? (
          <DeleteProjectPage
            projectIdNumber={projectIdNumber}
            isOwner={isOwner}
            setLoading={setLoading}
            setConfirm={setConfirm}
          />
        ) : (
          <div className="flex h-full rotate-1 justify-between">
            <ProjectInfo
              projectIdNumber={projectIdNumber}
              isOwner={isOwner}
              handleProjectPage={handleProjectPage}
            />

            <MemberList
              projectIdNumber={projectIdNumber}
              isOwner={isOwner}
              handleProjectPage={handleProjectPage}
            />

            <button
              onClick={() => setConfirm(true)}
              className={cn(
                "absolute -right-5 bottom-0 cursor-pointer rounded-xl",
                "p-2 px-10",
                "border-red-500 text-2xl font-bold",
                "border-5 text-red-500 hover:bg-red-500 hover:text-[#FFF4DE]",
                "transition-all duration-200",
              )}
            >
              {isOwner ? "Deletar projeto" : "Sair do projeto"}
            </button>
          </div>
        )}
      </Box>
    </div>
  );
}
