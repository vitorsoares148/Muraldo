import { useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { IoMenuOutline } from "react-icons/io5";

import { useAuth } from "../../contexts/AuthContext";
import { useProject } from "../../contexts/ProjectContext";
import { useUser } from "../../contexts/UserContext";
import { useCheckPermission } from "../../utils/getPermission";
import { cn } from "../../utils/cn";

import SidebarList from "./sidebar/SideBarList";
import ProjectList from "./sidebar/ProjectList";
import BoardList from "./sidebar/BoardList";
import CreateBoard from "./sidebar/CreateBoard";
import SideBarNavigation from "./sidebar/SideBarNavigation";
import SidebarFooter from "./sidebar/SidebarFooter";

export default function SideBar() {
  const [isOpen, setIsOpen] = useState(false);

  const { logout } = useAuth();
  const hasPermission = useCheckPermission();

  const { projectId, boardId } = useParams();
  const projectIdNumber = Number(projectId);
  const boardIdNumber = Number(boardId);

  const { user } = useUser();
  const { projectPage, projects } = useProject();
  const location = useLocation();

  const isHome = location.pathname === "/home";

  return (
    <div
      className={cn(
        "fixed z-3 flex h-screen min-h-screen shrink-0 flex-col items-center border-r-5 border-[#13110e]",
        "font-shadows w-75 bg-[#28251e] lg:relative",
        isOpen ? "visible" : "invisible lg:visible",
      )}
    >
      {/* Botão expandir */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "group visible absolute z-10 flex h-18 w-18 lg:invisible",
          "cursor-pointer items-center justify-center rounded-lg border-5",
          "border-[#13110e] bg-[#28251e] transition-colors duration-200 hover:bg-[#FFF4DE]",
          isOpen ? "top-0 -right-18 rounded-l-none" : "top-1 left-1",
        )}
      >
        <IoMenuOutline className="text-6xl text-[#FFF4DE] transition-colors duration-200 group-hover:text-[#28251e]" />
      </button>

      {/* Navegação */}
      {!isHome && (
        <SideBarNavigation
          projectId={projectId}
          boardId={boardId}
          onClose={() => setIsOpen(false)}
        />
      )}

      <div className="relative mt-3 flex w-[95%] flex-col items-center border-b-4 p-2 text-center text-3xl font-bold text-[#FFF4DE]">
        {isHome ? "Projetos" : "Quadros"}
      </div>

      {/* Lista de projetos/quadros */}
      <SidebarList>
        {isHome ? (
          <ProjectList
            projects={projects}
            projectId={projectIdNumber}
            onClose={() => setIsOpen(false)}
          />
        ) : (
          <BoardList
            boards={projectPage?.boards ?? []}
            projectId={projectIdNumber}
            boardId={boardIdNumber}
            hasPermission={hasPermission}
            onClose={() => setIsOpen(false)}
          />
        )}

        {/* Quadro Input */}
        {!isHome && hasPermission && (
          <CreateBoard projectIdNumber={projectIdNumber} />
        )}
      </SidebarList>

      {isOpen && (
        <button
          onClick={() => setIsOpen(false)}
          className={cn(
            "fixed left-75 z-5 h-screen w-screen bg-black/60 lg:invisible lg:h-0 lg:w-0",
          )}
        />
      )}

      {/* Usuário e logout */}
      <SidebarFooter username={user?.username} onLogout={logout} />
    </div>
  );
}
