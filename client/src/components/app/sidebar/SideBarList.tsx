import type { ReactNode } from "react";

interface SidebarListProps {
  children: ReactNode;
}

export default function SidebarList({ children }: SidebarListProps) {
  return (
    <div className="projects-container flex w-full flex-col items-center overflow-y-auto">
      {children}
    </div>
  );
}
