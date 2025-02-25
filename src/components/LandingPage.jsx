import { useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { SignInButton } from "@clerk/clerk-react";

export default function LandingPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      navigate("/dashboard");
    }
  }, [isLoaded, isSignedIn, navigate]);

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        background: "url('/image.jpg') center/cover no-repeat",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(10px)",
        boxShadow: "inset 0 0 50px rgba(0, 255, 0, 0.2)",
      }}
    >
      <style>
        {`
        .navbar {
          position: absolute;
          top: 0;
          width: 100%;
          background: rgba(0, 0, 0, 0.6);
          padding: 15px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: white;
          font-size: 1.5rem;
          padding-left: 20px;
          padding-right: 20px;
        }

        .glow-button {
          position: relative;
          display: inline-block;
        }

        .glow-button button {
          color: white;
          background: rgba(0, 102, 0, 0.4);
          padding: 1rem 3rem;
          border-radius: 5rem;
          border: 3px solid rgba(51, 255, 51, 0.6);
          font-size: 1.2rem;
          letter-spacing: 0.075em;
          transition: background 0.3s, box-shadow 0.3s;
          position: relative;
          z-index: 2;
          backdrop-filter: blur(5px);
        }

        .glow-button button:hover {
          cursor: pointer;
          background: rgba(0, 153, 0, 0.6);
          box-shadow: 0 0 30px rgba(51, 255, 51, 0.8);
        }

        .card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          padding: 20px;
          border-radius: 15px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 4px 10px rgba(0, 255, 0, 0.3);
          margin: 20px;
          width: 300px;
          text-align: center;
          color: white;
        }
        `}
      </style>

      <div className="navbar">WasteWise</div>

      <div style={{ position: "absolute", top: "20px", right: "20px" }}>
        <SignInButton mode="modal" redirectUrl="/dashboard">
          <div className="glow-button">
            <button>Sign In</button>
          </div>
        </SignInButton>
      </div>

      <div style={{ textAlign: "center", color: "white", marginTop: "60px" }}>
        <h1>Welcome to WasteWise</h1>
        <p>Empowering a sustainable future through smart waste management.</p>
      </div>

      <div style={{ display: "flex", gap: "20px", marginTop: "50px" }}>
        <div className="card">
          <h2>Recycling Tips</h2>
          <p>Learn how to recycle effectively and reduce waste.</p>
        </div>
        <div className="card">
          <h2>Community Initiatives</h2>
          <p>Join local efforts to keep our environment clean.</p>
        </div>
        <div className="card">
          <h2>Track Your Impact</h2>
          <p>Monitor your waste management and contribution to sustainability.</p>
        </div>
      </div>
    </div>
  );
}
