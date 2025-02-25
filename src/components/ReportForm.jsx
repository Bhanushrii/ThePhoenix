// ReportForm.jsx
import { useState } from "react";
import axios from "axios";

const modalStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  backgroundColor: "rgba(0, 0, 0, 0.7)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

const modalContentStyle = {
  background: "#fff",
  padding: "2rem",
  borderRadius: "8px",
  textAlign: "center",
};

const inputStyle = {
  margin: "0.5rem 0",
  padding: "8px",
  width: "80%",
};

export default function ReportForm({ detectionType, detectionResult, onClose }) {
  const [name, setName] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post("http://localhost:5000/api/report", {
        name,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        type: detectionType, // e.g., "oil", "coral", "plastic"
        detectionResult,     // Pass any detection result data you want to store
      });
      alert("Report submitted successfully!");
      onClose();
    } catch (error) {
      console.error("Error submitting report:", error);
      alert("There was an error submitting your report. Please try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={modalStyle}>
      <div style={modalContentStyle}>
        <h3>Submit Report</h3>
        <form onSubmit={handleSubmit}>
          <input
            style={inputStyle}
            type="text"
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            style={inputStyle}
            type="text"
            placeholder="Latitude"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            required
          />
          <input
            style={inputStyle}
            type="text"
            placeholder="Longitude"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            required
          />
          <button type="submit" disabled={submitting} style={{ margin: "0.5rem" }}>
            {submitting ? "Submitting..." : "Submit Report"}
          </button>
          <button type="button" onClick={onClose} style={{ margin: "0.5rem" }}>
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}
