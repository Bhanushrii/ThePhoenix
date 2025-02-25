// ConnectWallet.jsx
import React, { useState } from "react";
import { ethers } from "ethers";
import ecoCoinABI from "./EcoCoinABI.json"; // Make sure this file exists

const ConnectWallet = ({ onWalletConnected }) => {
  const [walletAddress, setWalletAddress] = useState("");
  const [ecoCoinBalance, setEcoCoinBalance] = useState(null);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        // Request account access if needed
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        const address = accounts[0];
        setWalletAddress(address);
        onWalletConnected(address); // Inform parent component

        // Create a provider and contract instance using MetaMask's provider
       const provider = new ethers.BrowserProvider(window.ethereum);

        const ecoCoinContract = new ethers.Contract(
          import.meta.env.VITE_ECOCOIN_CONTRACT_ADDRESS,
          ecoCoinABI,
          provider
        );

        // Get the balance (assuming EcoCoin has 18 decimals)
        const balance = await ecoCoinContract.balanceOf(address);
setEcoCoinBalance(ethers.formatEther(balance));

      } catch (err) {
        console.error("Error connecting wallet:", err);
      }
    } else {
      alert("MetaMask is not installed. Please install MetaMask and try again.");
    }
  };

  return (
    <div style={{ margin: "1rem", textAlign: "center" }}>
      <button
        onClick={connectWallet}
        style={{
          padding: "10px 20px",
          fontSize: "16px",
          borderRadius: "8px",
          border: "none",
          background: "#0c1635",
          color: "white",
          cursor: "pointer",
        }}
      >
        Connect Wallet
      </button>
      {walletAddress && (
        <div style={{ marginTop: "1rem" }}>
          <p>
            <strong>Wallet:</strong> {walletAddress}
          </p>
          <p>
            <strong>EcoCoin Balance:</strong> {ecoCoinBalance}
          </p>
        </div>
      )}
    </div>
  );
};

export default ConnectWallet;
