import { Navigate, Outlet } from "react-router-dom";

import Loading from "../components/generic/Loading";
import { useAuth } from "../contexts/AuthContext";
import { useUser } from "../contexts/UserContext";


export default function PublicRoute() {
  const { isAuthenticated } = useAuth();
  const { loadingPage } = useUser();

  if (loadingPage) {
    return <Loading />;
  }

  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
}
