import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Homepage from "./pages/Homepage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import IdeaSubmission from "./pages/IdeaSubmission";
import Feasibility from "./pages/Feasibility";
import SelectionPage from "./pages/SelectionPage";
import UploadDocument from "./pages/UploadDocument";

const App = () => {
  return (
    <Router>
      <Routes>
        {/* ================= PUBLIC ROUTES ================= */}
        <Route path="/" element={<Homepage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* ================= AUTHENTICATED FLOW ================= */}
        <Route path="/select-idea" element={<SelectionPage />} />
        <Route path="/idea-text" element={<IdeaSubmission />} />
        <Route path="/idea-document" element={<UploadDocument />} />
        <Route
          path="/feasibility-result"
          element={<Feasibility />}
        />

        {/* ================= CATCH-ALL (VERY IMPORTANT) ================= */}
        {/* Prevents Render / Google OAuth "Not Found" */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
