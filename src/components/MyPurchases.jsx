// MyPurchases.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

function MyPurchases({ userData }) {
  const [myPurchases, setMyPurchases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Only fetch if we have user data
    if (!userData?.userId) return;
    fetchPurchases();
  }, [userData]);

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      // Call our new backend endpoint
      const response = await axios.get(`http://localhost:5000/get-purchases/${userData.userId}`);
      setMyPurchases(response.data);
    } catch (err) {
      console.error("Error fetching purchases:", err);
      setError("Failed to load your purchased items.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p style={{ color: "white" }}>Loading your purchases...</p>;
  }

  if (error) {
    return <p style={{ color: "white" }}>{error}</p>;
  }

  return (
    <div style={{ color: "white" }}>
      <h2>My Purchases</h2>
      {myPurchases.length === 0 ? (
        <p>You haven&apos;t purchased anything yet.</p>
      ) : (
        myPurchases.map((purchase) => (
          <div
            key={purchase.itemId}
            style={{
              border: "1px solid #ccc",
              padding: "1rem",
              marginBottom: "1rem",
              borderRadius: "8px",
            }}
          >
            <h3>{purchase.name}</h3>
            <p>{purchase.description}</p>
            <p>Price: {purchase.price}</p>
            <p>
              Purchased At:{" "}
              {purchase.purchasedAt
                ? new Date(purchase.purchasedAt).toLocaleString()
                : "Unknown"}
            </p>
          </div>
        ))
      )}
    </div>
  );
}

export default MyPurchases;
