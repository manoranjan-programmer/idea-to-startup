import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Homepage from "./pages/Homepage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import IdeaSubmission from "./pages/IdeaSubmission";
import Feasibility from "./pages/Feasibility"; // <-- Updated
import SelectionPage from "./pages/SelectionPage";
import UploadDocument from "./pages/UploadDocument";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/select-idea" element={<SelectionPage />} />
        <Route path="/idea-text" element={<IdeaSubmission />} />
        <Route path="/idea-document" element={<UploadDocument />} />

        {/* ✅ AI Feasibility Result Page */}
        <Route
          path="/feasibility-result"
          element={<Feasibility />}
        />
      </Routes>
    </Router>
  );
};

export default App;
