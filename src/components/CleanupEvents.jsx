import { useEffect, useState } from "react";
import axios from "axios";
import { useUser } from "@clerk/clerk-react";
import "./index3.css"; // Make sure to import the CSS

export default function CleanupEvents() {
  const { user } = useUser();
  const [events, setEvents] = useState([]);
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await axios.get("http://localhost:5000/get-cleanups");
      setEvents(response.data);
    } catch (error) {
      console.error("❌ Error fetching cleanup events:", error);
    }
  };

  const createEvent = async () => {
    if (!title || !location || !date) {
      alert("Please fill all fields!");
      return;
    }
    try {
      await axios.post("http://localhost:5000/create-cleanup", {
        title,
        location,
        date,
        createdBy: user.id,
      });
      alert("Cleanup event created!");
      setTitle("");
      setLocation("");
      setDate("");
      fetchEvents();
    } catch (error) {
      console.error("❌ Error creating event:", error);
    }
  };

  const joinEvent = async (eventId) => {
    if (!user || !user.id || !user.fullName) {
      alert("You must be logged in to join an event.");
      return;
    }
    try {
      console.log(`📩 Sending join request for event ${eventId} from user ${user.id}`);
      const response = await axios.post(`http://localhost:5000/join-cleanup/${eventId}`, {
        userId: user.id,
        name: user.fullName,
      });
      alert(response.data.message || "Joined cleanup event successfully!");
      fetchEvents();
    } catch (error) {
      console.error("❌ Error joining event:", error.response?.data || error.message);
      alert(error.response?.data?.error || "Error joining event.");
    }
  };

  const submitReport = async (eventId) => {
    if (!user || !user.id || !user.fullName) {
      alert("You must be logged in to submit a report.");
      return;
    }
    const reportText = prompt("Describe your cleanup progress:");
    const trashCollectedKg = prompt("How much trash was collected? (kg)");
    if (!reportText || !trashCollectedKg) {
      alert("Report cannot be empty!");
      return;
    }
    try {
      console.log(`📩 Submitting report for event ${eventId} by user ${user.id}`);
      const response = await axios.post(`http://localhost:5000/submit-report/${eventId}`, {
        userId: user.id,
        userName: user.fullName,
        reportText,
        trashCollectedKg,
        imageUrl: "",
      });
      alert(response.data.message || "Report submitted successfully!");
      fetchEvents();
    } catch (error) {
      console.error("❌ Error submitting report:", error.response?.data || error.message);
      alert(error.response?.data?.error || "Error submitting report.");
    }
  };

  const deleteEvent = async (eventId) => {
    if (!user || !user.id) {
      alert("You must be logged in to delete an event.");
      return;
    }
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this event? This action cannot be undone."
    );
    if (!confirmDelete) return;
    try {
      console.log(`🗑️ Deleting event ${eventId}...`);
      const response = await axios.delete(`http://localhost:5000/delete-cleanup/${eventId}`, {
        data: { userId: user.id },
      });
      alert(response.data.message || "Event deleted successfully!");
      setEvents((prev) => prev.filter((ev) => ev._id !== eventId));
    } catch (error) {
      console.error("❌ Error deleting event:", error.response?.data || error.message);
      alert(error.response?.data?.error || "Error deleting event.");
    }
  };

  return (
    <div className="cleanup-page">
      <h1>Cleanup Events</h1>

      {/* Create Event Form */}
      <div className="create-event-form">
        <h2>Start a Cleanup Event</h2>

        <label>Title:</label>
        <input
          type="text"
          placeholder="Event Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="dark-blue-input"
        />

        <label>Location:</label>
        <input
          type="text"
          placeholder="Cleanup Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="dark-blue-input"
        />

        <label>Date:</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="dark-blue-input"
        />

        <button onClick={createEvent} className="create-btn">
          Create Event
        </button>
      </div>

      {/* Cards Container */}
      <div className="cleanup-container">
        {events.length === 0 ? (
          <p style={{ textAlign: "center" }}>No cleanup events available.</p>
        ) : (
          events.map((event) => (
            <div key={event._id} className="event-card">
              <h2>{event.title}</h2>
              <p>
                <strong>Location:</strong> {event.location} |{" "}
                <strong>Date:</strong> {new Date(event.date).toLocaleDateString()}
              </p>
              <p>
                <strong>Created By:</strong> {event.createdByName}
              </p>
              <p>
                <strong>Participants:</strong> {event.participantCount}
              </p>

              {/* Action buttons */}
              <div className="card-buttons">
                {event.createdBy === user?.id && (
                  <button
                    className="card-btn delete-button"
                    onClick={() => deleteEvent(event._id)}
                  >
                    🗑️ Delete Event
                  </button>
                )}

                {event.participants.some((p) => p.userId === user?.id) ? (
                  <button
                    className="card-btn submit-button"
                    onClick={() => submitReport(event._id)}
                  >
                    Submit Report
                  </button>
                ) : (
                  <button
                    className="card-btn join-button"
                    onClick={() => joinEvent(event._id)}
                  >
                    Join Event
                  </button>
                )}
              </div>

              {/* Reports Section */}
              <h3 className="reports-title">Reports:</h3>
              {event.reports.length === 0 ? (
                <p>No reports yet.</p>
              ) : (
                event.reports.map((report, index) => (
                  <div key={index} className="report-item">
                    <p>
                      <strong>User:</strong> {report.userName}
                    </p>
                    <p>
                      <strong>Report:</strong> {report.reportText}
                    </p>
                    <p>
                      <strong>Trash Collected:</strong> {report.trashCollectedKg} kg
                    </p>
                  </div>
                ))
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
