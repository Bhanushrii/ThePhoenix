import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { SignedIn, SignedOut, UserButton, SignInButton, useAuth, useUser } from "@clerk/clerk-react";
import { useEffect } from "react";
import axios from "axios";
import LandingPage from "./components/LandingPage";
import Dashboard from "./components/Dashboard";

// Protect routes so only signed-in users can access them
function ProtectedRoute({ children }) {
  const { isSignedIn } = useAuth();
  return isSignedIn ? children : <Navigate to="/" />;
}

function App() {
  const { user } = useUser(); // Clerk user data

  useEffect(() => {
    const createUser = async () => {
      if (!user) return; // Ensure user is available

      const userPayload = {
        userId: user.id,
        email: user.emailAddresses?.[0]?.emailAddress || "No Email",
        name: user.fullName || "No Name",
        profileImageUrl: user.profileImageUrl || "",
      };

      console.log("📩 Sending user data to backend:", userPayload);

      try {
        const response = await axios.post("http://localhost:5000/create-user", userPayload);
        console.log("✅ User successfully stored:", response.data);
      } catch (err) {
        console.error("❌ Error creating user:", err.response ? err.response.data : err.message);
      }
    };

    createUser();
  }, [user]); // Runs as soon as the user logs in

  return (
    <Router>
      {/* ✅ Navbar (Only One "BlueAI" Title) */}
      <nav className="p-6 bg-gray-900 text-white flex justify-between items-center">
        

       
      </nav>

      {/* ✅ App Routes */}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard/*" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
