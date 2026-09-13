import { useProject } from "../contexts/ProjectContext";
import { useUser } from "../contexts/UserContext";

export const useCheckOwner = () => {
  const { user } = useUser();
  const { projectPage } = useProject();

  return projectPage?.owner?.id === user?.id;
};

export const useCheckPermission = () => {
  const { user } = useUser();
  const { projectPage } = useProject();

  const member = projectPage?.members?.find((member) => member.id === user?.id);

  return member?.role === "admin" || projectPage?.owner?.id === user?.id;
};
