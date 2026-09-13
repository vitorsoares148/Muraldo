import { Navigate, Outlet, useLocation } from "react-router-dom";

import Loading from "../components/generic/Loading";
import { useAuth } from "../contexts/AuthContext";
import { useUser } from "../contexts/UserContext";

export default function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  const { loadingPage } = useUser();
  const location = useLocation();

  if (loadingPage) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
