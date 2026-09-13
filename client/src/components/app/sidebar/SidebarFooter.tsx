import { BiDoorOpen } from "react-icons/bi";

interface SidebarFooterProps {
  username?: string;
  onLogout: () => void;
}

export default function SidebarFooter({
  username,
  onLogout,
}: SidebarFooterProps) {
  return (
    <div className="z-1 mt-auto flex h-18 w-74 items-center justify-between border-t-5 border-[#13110e] bg-[#28251e] p-3">
      <div className="font-shadows truncate text-2xl font-bold text-[#FFF4DE]">
        {username}
      </div>

      <button onClick={onLogout}>
        <BiDoorOpen className="cursor-pointer rounded-xl text-[40px] text-[#FFF4DE] transition-colors duration-200 hover:bg-red-500 hover:text-[#28251e]" />
      </button>
    </div>
  );
}
