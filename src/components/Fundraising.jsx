// Fundraising.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import { useUser } from "@clerk/clerk-react";
import "./index4.css";

export default function Fundraising() {
  // Tab state: either "local" or "gofundme"
  const [activeTab, setActiveTab] = useState("local");

  // Clerk user info
  const { user } = useUser();

  // -------------------------------
  // 1) Local Fundraiser State/Logic
  // -------------------------------
  const [fundraisers, setFundraisers] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [goal, setGoal] = useState("");

  // For handling donation input per fundraiser
  const [donationAmounts, setDonationAmounts] = useState({});
  const [donationFormOpen, setDonationFormOpen] = useState({});
  const [donorTypes, setDonorTypes] = useState({});
  const [companyNames, setCompanyNames] = useState({});

  useEffect(() => {
    // Fetch local fundraisers on mount
    fetchFundraisers();
  }, []);

  const fetchFundraisers = async () => {
    try {
      const response = await axios.get("http://localhost:5000/get-fundraisers");
      console.log("📢 Fundraisers Received from API:", response.data);

      if (!Array.isArray(response.data)) {
        console.error("❌ API response is not an array:", response.data);
        return;
      }
      setFundraisers(response.data);
    } catch (error) {
      console.error("❌ Error fetching fundraisers:", error);
      alert("Error fetching fundraisers. Please try again later.");
    }
  };

  const createFundraiser = async () => {
    if (!title || !description || !goal) {
      alert("Please fill in all fields!");
      return;
    }

    try {
      const response = await axios.post("http://localhost:5000/create-fundraiser", {
        title,
        description,
        goal: Number(goal),
        createdBy: user.id,
        createdByName: user.fullName,
      });

      alert("🎉 Fundraiser created successfully! You've earned 5 EcoCoins!");
      setFundraisers((prev) => [...prev, response.data]);
      setTitle("");
      setDescription("");
      setGoal("");
    } catch (error) {
      console.error("❌ Error creating fundraiser:", error);
      alert("Error creating fundraiser. Please try again later.");
    }
  };

  const deleteFundraiser = async (fundraiserId) => {
    try {
      await axios.delete(`http://localhost:5000/delete-fundraiser/${fundraiserId}`, {
        data: { userId: user.id },
      });
      setFundraisers((prev) => prev.filter((f) => f._id !== fundraiserId));
      alert("Fundraiser deleted successfully.");
    } catch (error) {
      console.error("❌ Error deleting fundraiser:", error);
      alert("Error deleting fundraiser.");
    }
  };

  const donateToFundraiser = async (fundraiserId) => {
    const amount = donationAmounts[fundraiserId];
    const donorType = donorTypes[fundraiserId] || "individual";
    const donationName =
      donorType === "company" ? companyNames[fundraiserId] : user.fullName;

    if (!amount || amount <= 0) {
      alert("Please enter a valid donation amount!");
      return;
    }
    if (donorType === "company" && !donationName) {
      alert("Please enter your company name.");
      return;
    }

    try {
      const response = await axios.post(
        `http://localhost:5000/donate/${fundraiserId}`,
        {
          userId: user.id,
          donorType,
          name: donationName,
          amount: Number(amount),
        }
      );
      // Update the specific fundraiser with the new donation
      setFundraisers((prev) =>
        prev.map((f) =>
          f._id === fundraiserId ? response.data.fundraiser : f
        )
      );
      alert("Donation successful!");

      // Clear donation inputs and close form
      setDonationAmounts((prev) => ({ ...prev, [fundraiserId]: "" }));
      setCompanyNames((prev) => ({ ...prev, [fundraiserId]: "" }));
      setDonationFormOpen((prev) => ({ ...prev, [fundraiserId]: false }));
      setDonorTypes((prev) => ({ ...prev, [fundraiserId]: "individual" }));
    } catch (error) {
      console.error("❌ Error processing donation:", error);
      alert("Error processing donation. Please try again later.");
    }
  };

  // "Local Fundraising" UI
  const renderLocalFundraising = () => (
    <>
      {/* Create Fundraiser Form */}
      <div className="create-event-form">
        <h2 className="form-title">Start a Fundraiser</h2>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="dark-blue-input"
        />
        <textarea
          placeholder="Describe your fundraiser..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="dark-blue-input"
        ></textarea>
        <input
          type="number"
          placeholder="Goal Amount"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          className="dark-blue-input"
        />
        <button className="create-form-btn" onClick={createFundraiser}>
          Start Fundraiser
        </button>
      </div>

      {/* Fundraiser List */}
      {fundraisers.length === 0 ? (
        <p className="no-fundraisers">No fundraisers available.</p>
      ) : (
        fundraisers.map((fundraiser) => (
          <div key={fundraiser._id} className="event-card">
            <div className="event-header">
              <h2>{fundraiser.title}</h2>
              {fundraiser.createdBy === user.id && (
                <button
                  className="delete-button"
                  onClick={() => deleteFundraiser(fundraiser._id)}
                >
                  Delete
                </button>
              )}
            </div>
            {fundraiser.description && (
              <p className="event-description">{fundraiser.description}</p>
            )}
            {fundraiser.goal !== undefined && (
              <p>
                <strong>Goal:</strong> ${fundraiser.goal}
              </p>
            )}
            {fundraiser.raised !== undefined && (
              <p>
                <strong>Raised:</strong> ${fundraiser.raised}
              </p>
            )}
            {fundraiser.createdByName && (
              <p>
                <strong>Created By:</strong> {fundraiser.createdByName}
              </p>
            )}

            {/* Progress Bar */}
            {fundraiser.progress !== undefined && (
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${fundraiser.progress}%` }}
                ></div>
              </div>
            )}

            {/* Donation Section */}
            <div className="donation-section">
              {!donationFormOpen[fundraiser._id] ? (
                <button
                  className="donate-button"
                  onClick={() =>
                    setDonationFormOpen((prev) => ({
                      ...prev,
                      [fundraiser._id]: true,
                    }))
                  }
                >
                  Donate
                </button>
              ) : (
                <div className="donation-form">
                  {/* Donor Type Selection */}
                  <div className="donor-type">
                    <label>
                      <input
                        type="radio"
                        name={`donorType-${fundraiser._id}`}
                        value="individual"
                        checked={
                          (donorTypes[fundraiser._id] || "individual") ===
                          "individual"
                        }
                        onChange={() =>
                          setDonorTypes((prev) => ({
                            ...prev,
                            [fundraiser._id]: "individual",
                          }))
                        }
                      />
                      Individual
                    </label>
                    <label>
                      <input
                        type="radio"
                        name={`donorType-${fundraiser._id}`}
                        value="company"
                        checked={donorTypes[fundraiser._id] === "company"}
                        onChange={() =>
                          setDonorTypes((prev) => ({
                            ...prev,
                            [fundraiser._id]: "company",
                          }))
                        }
                      />
                      Company
                    </label>
                  </div>
                  {donorTypes[fundraiser._id] === "company" && (
                    <input
                      type="text"
                      placeholder="Enter company name"
                      value={companyNames[fundraiser._id] || ""}
                      onChange={(e) =>
                        setCompanyNames((prev) => ({
                          ...prev,
                          [fundraiser._id]: e.target.value,
                        }))
                      }
                      className="dark-blue-input"
                    />
                  )}
                  <input
                    type="number"
                    placeholder="Enter donation amount"
                    value={donationAmounts[fundraiser._id] || ""}
                    onChange={(e) =>
                      setDonationAmounts((prev) => ({
                        ...prev,
                        [fundraiser._id]: e.target.value,
                      }))
                    }
                    className="dark-blue-input"
                  />
                  <div className="donation-buttons">
                    <button
                      className="confirm-donation"
                      onClick={() => donateToFundraiser(fundraiser._id)}
                    >
                      Confirm Donation
                    </button>
                    <button
                      className="cancel-donation"
                      onClick={() =>
                        setDonationFormOpen((prev) => ({
                          ...prev,
                          [fundraiser._id]: false,
                        }))
                      }
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Donation Details */}
              {fundraiser.donations &&
                fundraiser.donations.length > 0 && (
                  <div className="donations-list">
                    <h3>Donations:</h3>
                    <ul>
                      {fundraiser.donations.map((donation, idx) => (
                        <li key={idx}>
                          {donation.donorType === "company"
                            ? `${donation.name} (Company)`
                            : donation.name}{" "}
                          donated ${donation.amount}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>
          </div>
        ))
      )}
    </>
  );

  // -------------------------------
  // 2) GoFundMe Search & Display
  // -------------------------------
  const [searchQuery, setSearchQuery] = useState("");
  const [goFundMeResults, setGoFundMeResults] = useState([]);
  const [loadingScrape, setLoadingScrape] = useState(false);
  const [scrapeError, setScrapeError] = useState(null);

  // Handler to search via /scrape-gofundme
  const handleScrapeGoFundMe = async () => {
    if (!searchQuery) {
      alert("Please enter a search query!");
      return;
    }

    setLoadingScrape(true);
    setScrapeError(null);
    setGoFundMeResults([]);

    try {
      // Make sure your server is running on localhost:5000
      const response = await axios.get("http://localhost:5000/scrape-gofundme", {
        params: { query: searchQuery },
      });
      setGoFundMeResults(response.data);
    } catch (err) {
      console.error("Error scraping GoFundMe:", err);
      setScrapeError("Failed to scrape campaigns. Please try again.");
    } finally {
      setLoadingScrape(false);
    }
  };

  // "GoFundMe" UI
  const renderGoFundMe = () => (
    <div className="gofundme-container">
      <h2 className="form-title">Search GoFundMe Campaigns</h2>

      {/* Search Bar */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="e.g. marine conservation"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="dark-blue-input"
        />
        <button onClick={handleScrapeGoFundMe} className="create-form-btn">
          Search
        </button>
      </div>

      {loadingScrape && <p className="loading-message">Scraping data...</p>}
      {scrapeError && <p className="error-message">{scrapeError}</p>}

      {/* Display Results */}
      {goFundMeResults && goFundMeResults.length > 0 ? (
        goFundMeResults.map((campaign, idx) => (
          <div key={idx} className="campaign-card">
            <h3 className="campaign-title">
              {campaign.Name || "Untitled Campaign"}
            </h3>
            {campaign["Summarized Description"] && (
              <p className="campaign-description">
                {campaign["Summarized Description"]}
              </p>
            )}
            <p>
              <strong>Goal Amount:</strong>{" "}
              {campaign["Goal Amount"] !== undefined
                ? campaign["Goal Amount"]
                : "N/A"}
            </p>
            <p>
              <strong>Balance:</strong>{" "}
              {campaign.Balance !== undefined ? campaign.Balance : "N/A"}
            </p>
            {campaign.URL && (
              <p>
                <strong>URL:</strong>{" "}
                <a
                  href={campaign.URL}
                  target="_blank"
                  rel="noreferrer"
                  className="campaign-link"
                >
                  {campaign.URL}
                </a>
              </p>
            )}
          </div>
        ))
      ) : (
        !loadingScrape && <p className="no-results">No campaigns found.</p>
      )}
    </div>
  );

  // -------------------------------
  // 3) Main Component Return
  // -------------------------------
  return (
    <div className="page-container">
      <h1 className="page-title">Fundraising</h1>

      {/* Tab Navigation */}
      <div className="tab-container">
        <button
          className={`tab-button ${activeTab === "local" ? "active" : ""}`}
          onClick={() => setActiveTab("local")}
        >
          Local Fundraisers
        </button>
        <button
          className={`tab-button ${activeTab === "gofundme" ? "active" : ""}`}
          onClick={() => setActiveTab("gofundme")}
        >
          GoFundMe
        </button>
      </div>

      {/* Conditionally Render Tabs */}
      {activeTab === "local" ? renderLocalFundraising() : renderGoFundMe()}
    </div>
  );
}
