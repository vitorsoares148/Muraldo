import { Navigate, Route, Routes } from "react-router-dom";

import BackgroundGrid from "./components/app/BackgroundGrid";

import AppLayout from "./layouts/AppLayout";

import Board from "./pages/Board";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Project from "./pages/Project";

import ProtectedRoute from "./routes/ProtectedRoute";
import PublicRoute from "./routes/PublicRoute";

function App() {
  return (
    <div className="min-h-screen bg-[#F1DAB6]">
      <BackgroundGrid />

      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/home" element={<Home />} />
            <Route path="/project/:projectId" element={<Project />} />
            <Route
              path="/project/:projectId/board/:boardId"
              element={<Board />}
            />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </div>
  );
}

export default App;
