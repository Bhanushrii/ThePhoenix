import { useState, useEffect } from "react";
import axios from "axios";
import "./index5.css"; // Make sure to import the CSS

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState({
    mostDonated: [],
    mostRaised: []
  });

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await axios.get("http://localhost:5000/leaderboard");
      console.log("Leaderboard data:", response.data);
      setLeaderboard(response.data);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      alert("Error fetching leaderboard data. Please try again later.");
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Leaderboard</h1>
      <div className="leaderboard-wrapper">
        {/* Most Donated Table */}
        <div className="table-container">
          <h2 className="table-title">Most Donated</h2>
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th className="table-header">Rank</th>
                <th className="table-header">Donor</th>
                <th className="table-header">Total Donated ($)</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.mostDonated.map((item, index) => (
                <tr key={item._id} className="table-row">
                  <td className="table-cell">{index + 1}</td>
                  <td className="table-cell">{item._id}</td>
                  <td className="table-cell">{item.totalDonated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Most Raised Table */}
        <div className="table-container">
          <h2 className="table-title">Most Raised</h2>
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th className="table-header">Rank</th>
                <th className="table-header">Creator</th>
                <th className="table-header">Total Raised ($)</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.mostRaised.map((item, index) => (
                <tr key={item._id.createdBy} className="table-row">
                  <td className="table-cell">{index + 1}</td>
                  <td className="table-cell">{item._id.createdByName}</td>
                  <td className="table-cell">{item.totalRaised}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
