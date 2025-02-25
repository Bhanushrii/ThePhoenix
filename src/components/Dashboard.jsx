// Dashboard.jsx
import { useEffect, useState } from "react";
import { useUser, UserButton } from "@clerk/clerk-react";
import { Link, Routes, Route } from "react-router-dom";
import axios from "axios";
import CleanupEvents from "./CleanupEvents";
import Fundraising from "./Fundraising";
import Leaderboard from "./Leaderboard";
import LiveTracking from "./LiveTracking";
import LiveCoral from "./LiveCoral";
import Marketplace from "./Marketplace";
import MyPurchases from "./MyPurchases"; // import at the top
import ConnectWallet from "./ConnectWallet"; // New wallet connection component

// React Leaflet Imports
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default icon issues for Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

export default function Dashboard() {
  const { user } = useUser();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // New state for EcoCoin balance
  const [ecoBalance, setEcoBalance] = useState("");

  // Upload States
  const [showOilSpillUpload, setShowOilSpillUpload] = useState(false);
  const [oilSpillType, setOilSpillType] = useState(""); // "image" or "video"
  const [oilSpillFile, setOilSpillFile] = useState(null);
  const [oilSpillResult, setOilSpillResult] = useState(null);

  const [showCoralUpload, setShowCoralUpload] = useState(false);
  const [coralType, setCoralType] = useState(""); // "image" or "video"
  const [coralFile, setCoralFile] = useState(null);
  const [coralResult, setCoralResult] = useState(null);

  const [showPlasticUpload, setShowPlasticUpload] = useState(false);
  const [plasticType, setPlasticType] = useState(""); // "image" or "video"
  const [plasticFile, setPlasticFile] = useState(null);
  const [plasticResult, setPlasticResult] = useState(null);

  // Citizen Science Report Form State
  const [reportName, setReportName] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [reportSubmitted, setReportSubmitted] = useState(false);

  // NEW: State for toggling the map and storing report data from MongoDB
  const [showMap, setShowMap] = useState(false);
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);

  // Fetch user info from backend
  useEffect(() => {
    const fetchUser = async () => {
      if (!user) return;
      try {
        const response = await axios.get(
          `http://localhost:5000/get-user/${user.id}`,
          { withCredentials: true }
        );
        setUserData(response.data);
      } catch (err) {
        console.error(
          "Error fetching user data:",
          err.response ? err.response.data : err.message
        );
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [user]);

  // When userData is available and walletAddress is set, fetch EcoCoin balance
  useEffect(() => {
    const fetchEcoBalance = async () => {
      if (userData?.userId && userData?.walletAddress) {
        try {
          const res = await axios.get(
            `http://localhost:5000/eco-balance/${userData.userId}`
          );
          setEcoBalance(res.data.balance);
        } catch (error) {
          console.error("Error fetching eco-balance:", error);
        }
      }
    };
    fetchEcoBalance();
  }, [userData]);

  // When showMap is true, fetch the citizen science reports from your backend.
  useEffect(() => {
    if (showMap) {
      setLoadingReports(true);
      axios
        .get("http://localhost:5000/citizen-science-reports")
        .then((response) => {
          setReports(response.data);
          console.log("Fetched reports:", response.data); // Debug: Log the data
        })
        .catch((error) => {
          console.error("Error fetching reports:", error);
        })
        .finally(() => setLoadingReports(false));
    }
  }, [showMap]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100vw",
          height: "100vh",
          backgroundColor: "#111",
          color: "#fff",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>Loading...</h1>
      </div>
    );
  }

  // Styles
  const containerStyle = {
    minHeight: "100vh",
    backgroundImage: 'url("/image.jpg")',
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundAttachment: "fixed",
    color: "white",
  };

  const navContainerStyle = {
    width: "100%",
    height: "70px",
    backgroundColor: "#2b2b2b",
    padding: "1rem",
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center",
    flexWrap: "wrap",
    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.82)",
  };

  const navLinksStyle = {
    display: "flex",
    gap: "1rem",
  };

  const navButtonStyle = {
    padding: "8px 18px",
    fontSize: "14px",
    width: "160px",
    textAlign: "center",
    borderRadius: "8px",
    border: "2px solidrgb(28, 125, 46)",
    background: "#0c1637",
    color: "white",
    cursor: "pointer",
    transition: "all 0.3s ease-in-out",
    textDecoration: "none",
  };

  const onMouseEnterLink = (e) => {
    e.currentTarget.style.background = "#008000";
    e.currentTarget.style.boxShadow = "0 0 30px 5px rgba(23, 113, 32, 0.8)";
  };

  const onMouseLeaveLink = (e) => {
    e.currentTarget.style.background = "#0c1635";
    e.currentTarget.style.boxShadow = "none";
  };

  const profileButtonStyle = { marginLeft: "7rem" };
  const fullscreenSectionStyle = { padding: "3rem 1rem", textAlign: "center" };
  const citizenButtonStyle = {
    padding: "8px 18px",
    fontSize: "14px",
    width: "200px",
    textAlign: "center",
    borderRadius: "8px",
    border: "2px solid #5978F3",
    background: "#0c1635",
    color: "white",
    cursor: "pointer",
    transition: "all 0.3s ease-in-out",
    textDecoration: "none",
    margin: "0.5rem",
  };

  // Handler for file input changes
  const handleFileChange = (setter) => (e) => {
    setter(e.target.files[0]);
  };

  // General upload function for citizen science files
  const uploadFile = async (endpoint, file, type, setResult) => {
    if (!file) {
      alert("Please select a file first.");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);
    try {
      const response = await axios.post(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(response.data);
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Error uploading file. Please try again later.");
    }
  };

  const uploadOilSpillFile = () =>
    uploadFile(
      "http://192.168.0.102:5000/detect/oil_spill/",
      oilSpillFile,
      oilSpillType,
      setOilSpillResult
    );
  const uploadCoralFile = () =>
    uploadFile(
      "http://192.168.0.102:5000/detect/coral/",
      coralFile,
      coralType,
      setCoralResult
    );
  const uploadPlasticFile = () =>
    uploadFile(
      "http://192.168.0.102:5000/detect/plastic/",
      plasticFile,
      plasticType,
      setPlasticResult
    );

  // Submit the citizen science report form
  const submitReport = async () => {
    try {
      await axios.post("http://localhost:5000/citizen-science-report", {
        reportName,
        lat: Number(lat),
        lng: Number(lng),
      });
      setReportSubmitted(true);
      alert("Report submitted!");
    } catch (err) {
      console.error("Error submitting report:", err);
      alert("Error submitting report. Please try again.");
    }
  };

  // Wallet connection handler – update userData when wallet is connected
  const handleWalletConnected = async (walletAddress) => {
    console.log("Wallet connected:", walletAddress);
    // Update local state
    setUserData((prev) => ({ ...prev, walletAddress }));
    
    // Also, update the DB by calling the API
    try {
      await axios.post("http://localhost:5000/set-wallet-address", {
        userId: userData.userId,
        walletAddress,
      });
    } catch (error) {
      console.error("Error updating wallet address in DB:", error);
    }
  };
  

  return (
    <div className="dashboard-container" style={containerStyle}>
      {/* Navbar */}
      <nav style={navContainerStyle}>
        <div style={navLinksStyle}>
          <Link to="/dashboard" style={navButtonStyle} onMouseEnter={onMouseEnterLink} onMouseLeave={onMouseLeaveLink}>
            Dashboard Home
          </Link>
          <Link to="/dashboard/cleanup-events" style={navButtonStyle} onMouseEnter={onMouseEnterLink} onMouseLeave={onMouseLeaveLink}>
            Help Clean 🌊
          </Link>
          <Link to="/dashboard/fundraising" style={navButtonStyle} onMouseEnter={onMouseEnterLink} onMouseLeave={onMouseLeaveLink}>
            Fundraising 💰
          </Link>
          <Link to="/dashboard/leaderboard" style={navButtonStyle} onMouseEnter={onMouseEnterLink} onMouseLeave={onMouseLeaveLink}>
            Leaderboard 🏆
          </Link>
          <Link to="/dashboard/livetracking" style={navButtonStyle} onMouseEnter={onMouseEnterLink} onMouseLeave={onMouseLeaveLink}>
            Crowd Source
          </Link>
          <Link to="/dashboard/livecoral" style={navButtonStyle} onMouseEnter={onMouseEnterLink} onMouseLeave={onMouseLeaveLink}>
            Trash to Treasure
          </Link>
          <Link to="/dashboard/fishing-activity" style={navButtonStyle} onMouseEnter={onMouseEnterLink} onMouseLeave={onMouseLeaveLink}>
             Real Time Segregation
          </Link>
          <Link to="/dashboard/citizen-science" style={navButtonStyle} onMouseEnter={onMouseEnterLink} onMouseLeave={onMouseLeaveLink}>
            Citizen Science
          </Link>
          <Link to="/dashboard/marketplace" style={navButtonStyle} onMouseEnter={onMouseEnterLink} onMouseLeave={onMouseLeaveLink}>
            Marketplace 🛒
          </Link>
          <Link to="/dashboard/my-purchases" style={navButtonStyle} onMouseEnter={onMouseEnterLink} onMouseLeave={onMouseLeaveLink}>
            My Purchases
          </Link>
        </div>
        <div style={profileButtonStyle}>
          <UserButton />
        </div>
      </nav>

      {/* If userData exists but no walletAddress, show ConnectWallet */}
      {userData && !userData.walletAddress && (
        <div style={{ padding: "1rem", textAlign: "center" }}>
          <ConnectWallet userId={userData.userId} onWalletConnected={handleWalletConnected} />
        </div>
      )}

      {/* If wallet is connected, display EcoCoin balance */}
      {userData?.walletAddress && (
        <div style={{ padding: "1rem", textAlign: "center" }}>
          <h3>EcoCoin Balance: {ecoBalance || "0"}</h3>
        </div>
      )}

      {/* Page Routes */}
      <Routes>
        <Route
          path="/"
          element={
            <div style={fullscreenSectionStyle}>
              <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "1rem" }}>
                Welcome, {userData ? userData.name : "User"}!
              </h1>
              <center>
                <p style={{ fontSize: "2.125rem" }}>
                 
                </p>
              </center>
            </div>
          }
        />
        <Route path="cleanup-events" element={<CleanupEvents />} />
        <Route path="fundraising" element={<Fundraising />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="livetracking" element={<LiveTracking />} />
        <Route path="livecoral" element={<LiveCoral />} />
        <Route path="my-purchases" element={<MyPurchases userData={userData} />} />
        {/* Marketplace Route – pass userData as a prop if needed */}
        <Route path="marketplace" element={<Marketplace userData={userData} />} />
        {/* Citizen Science Route */}
        <Route
          path="citizen-science"
          element={
            <div style={fullscreenSectionStyle}>
              <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "1rem" }}>
                Citizen Science
              </h1>
              {/* Insert your Citizen Science upload components here */}
            </div>
          }
        />
      </Routes>
    </div>
  );
}
