import React from "react";
import { useNavigate } from "react-router-dom";
import "./SelectionPage.css";

const SelectionPage = () => {
  const navigate = useNavigate();

  return (
    <div className="selection-container">
      <div className="selection-card">
        <h1 className="selection-title">Choose How to Submit Your Idea</h1>

        <p className="selection-subtitle">
          Select the method you prefer to share your startup idea for analysis.
        </p>

        <div className="selection-options">
          <button
            className="selection-button primary"
            onClick={() => navigate("/idea-text")}
          >
            💡 Idea by Text
            <span>Type your idea manually</span>
          </button>

          <button
            className="selection-button secondary"
            onClick={() => navigate("/idea-document")}
          >
            📄 Idea by Document
            <span>Upload a TXT document</span>
          </button>
        </div>

        <div className="selection-footer">
          You can change this later if needed.
        </div>
      </div>
    </div>
  );
};

export default SelectionPage;
