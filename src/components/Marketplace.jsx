// Marketplace.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";

function Marketplace({ userData }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    price: "",
  });
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    fetchMarketplaceItems();
  }, []);

  // Fetch all items
  const fetchMarketplaceItems = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:5000/api/marketplace");
      setItems(response.data);
    } catch (err) {
      console.error("Error fetching marketplace items:", err);
      setError("Failed to load marketplace items.");
    } finally {
      setLoading(false);
    }
  };

  const toggleCreateForm = () => {
    setShowCreateForm(!showCreateForm);
  };

  const handleInputChange = (e) => {
    setNewItem((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  // Create a new listing
  const handleCreateListing = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("name", newItem.name);
      formData.append("description", newItem.description);
      formData.append("price", newItem.price);

      // If user is logged in, store sellerId
      if (userData?.userId) {
        formData.append("sellerId", userData.userId);
      }

      if (imageFile) {
        formData.append("image", imageFile);
      }

      await axios.post("http://localhost:5000/api/marketplace", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Item created!");
      setNewItem({ name: "", description: "", price: "" });
      setImageFile(null);
      setShowCreateForm(false);
      fetchMarketplaceItems();
    } catch (err) {
      console.error("Error creating listing:", err);
      alert("Error creating listing. See console for details.");
    }
  };

  // Purchase item
  const handlePurchase = async (itemId) => {
    if (!userData?.userId) {
      alert("Please log in to purchase.");
      return;
    }
    try {
      await axios.post("http://localhost:5000/api/marketplace/purchase", {
        itemId,
        buyerId: userData.userId,
      });
      alert("Purchase successful!");
      fetchMarketplaceItems();
    } catch (err) {
      console.error("Purchase failed:", err);
      alert("Purchase failed.");
    }
  };

  // Delete item
  const handleDelete = async (itemId) => {
    if (!userData?.userId) {
      alert("You must be logged in to delete an item.");
      return;
    }
    try {
      await axios.delete(`http://localhost:5000/api/marketplace/${itemId}`, {
        data: { userId: userData.userId },
      });
      alert("Item deleted successfully!");
      fetchMarketplaceItems();
    } catch (err) {
      console.error("Error deleting item:", err);
      alert("Could not delete item. See console for details.");
    }
  };

  if (loading) {
    return (
      <div style={{ color: "white", textAlign: "center" }}>
        <h2>Loading Marketplace...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ color: "white", textAlign: "center" }}>
        <h2>{error}</h2>
      </div>
    );
  }

  return (
    <div style={{ color: "white", padding: "2rem" }}>
      <h1>Marketplace</h1>

      <button
        onClick={toggleCreateForm}
        style={{
          padding: "8px 18px",
          fontSize: "14px",
          textAlign: "center",
          borderRadius: "8px",
          border: "2px solid #5978F3",
          background: "#0c1635",
          color: "white",
          cursor: "pointer",
          marginBottom: "1rem",
        }}
      >
        {showCreateForm ? "Cancel" : "Sell an Item"}
      </button>

      {showCreateForm && (
        <form
          onSubmit={handleCreateListing}
          style={{
            border: "1px solid #ccc",
            padding: "1rem",
            marginBottom: "1.5rem",
            borderRadius: "8px",
          }}
        >
          <h3>Create New Item</h3>
          <div style={{ marginBottom: "0.5rem" }}>
            <label>Name: </label>
            <input
              name="name"
              value={newItem.name}
              onChange={handleInputChange}
              required
            />
          </div>
          <div style={{ marginBottom: "0.5rem" }}>
            <label>Description: </label>
            <input
              name="description"
              value={newItem.description}
              onChange={handleInputChange}
              required
            />
          </div>
          <div style={{ marginBottom: "0.5rem" }}>
            <label>Price: </label>
            <input
              name="price"
              type="number"
              value={newItem.price}
              onChange={handleInputChange}
              required
            />
          </div>
          <div style={{ marginBottom: "0.5rem" }}>
            <label>Image (optional): </label>
            <input type="file" accept="image/*" onChange={handleFileChange} />
          </div>
          <button
            type="submit"
            style={{
              padding: "8px 18px",
              fontSize: "14px",
              textAlign: "center",
              borderRadius: "8px",
              border: "2px solid #5978F3",
              background: "#0c1635",
              color: "white",
              cursor: "pointer",
            }}
          >
            Create
          </button>
        </form>
      )}

      {items.length === 0 ? (
        <p>No items yet.</p>
      ) : (
        items.map((item) => (
          <div
            key={item._id}
            style={{
              marginBottom: "1.5rem",
              border: "1px solid #ccc",
              padding: "1rem",
              borderRadius: "8px",
            }}
          >
            <h2>{item.name}</h2>
            <p>{item.description}</p>
            <p>
              <strong>Price:</strong> {item.price}
            </p>

            {/* If there's imageData, show the image: */}
            {item.imageData && (
              <img
                src={`http://localhost:5000/api/marketplace/${item._id}/image`}
                alt={item.name}
                style={{
                  maxWidth: "200px",
                  display: "block",
                  margin: "1rem 0",
                }}
              />
            )}

            {item.sold ? (
              <p style={{ color: "lightgreen" }}>
                <strong>Sold</strong>{" "}
                {item.boughtBy && `to ${item.boughtBy}`}
              </p>
            ) : (
              <>
                <button
                  onClick={() => handlePurchase(item._id)}
                  style={{
                    padding: "8px 18px",
                    fontSize: "14px",
                    textAlign: "center",
                    borderRadius: "8px",
                    border: "2px solid #5978F3",
                    background: "#0c1635",
                    color: "white",
                    cursor: "pointer",
                    marginRight: "1rem",
                  }}
                >
                  Buy
                </button>
                {userData?.userId === item.sellerId && (
                  <button
                    onClick={() => handleDelete(item._id)}
                    style={{
                      padding: "8px 18px",
                      fontSize: "14px",
                      textAlign: "center",
                      borderRadius: "8px",
                      border: "2px solid #f36464",
                      background: "#c00",
                      color: "white",
                      cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>
                )}
              </>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default Marketplace;
