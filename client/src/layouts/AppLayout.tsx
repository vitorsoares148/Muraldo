import { Outlet } from "react-router-dom";
import SideBar from "../components/app/SideBar";

export default function AppLayout() {
  return (
    <div className="flex min-h-screen">
      <SideBar />

      <main className="flex min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  );
}
