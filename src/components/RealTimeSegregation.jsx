import { useEffect, useRef } from "react";

export default function RealTimeSegregation() {
  const videoRef = useRef(null);

  useEffect(() => {
    // Start the real-time YOLO model by calling your Flask API
    fetch("http://localhost:5001/run-yolo") // Ensure Flask is running on this port
      .then((response) => response.json())
      .then((data) => console.log(data))
      .catch((error) => console.error("Error starting YOLO model:", error));

    // Optional: Set up a video element if the YOLO model streams output
  }, []);

  return (
    <div style={{ textAlign: "center", padding: "2rem" }}>
      <h1>Real-Time Segregation</h1>
      <p>Running YOLO Model for Real-Time Fishing Activity Monitoring...</p>
      {/* If your YOLO model sends video frames, display them here */}
      <video ref={videoRef} width="640" height="480" autoPlay></video>
    </div>
  );
}
