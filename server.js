// server.js
import dotenv from "dotenv";
dotenv.config();
import express from "express";
import mongoose from "mongoose";
import { ClerkExpressWithAuth } from "@clerk/clerk-sdk-node";
import cors from "cors";
import { spawn } from "child_process"; // For spawning Python script
import { ethers } from "ethers";
import ecoCoinABI from "./EcoCoinABI.json" assert { type: "json" };

// MongoDB Models
import User from "./models/User.js";
import CleanupEvent from "./models/CleanupEvent.js";
import Fundraiser from "./models/Fundraiser.js";
import CitizenScienceReport from "./models/CitizenScienceReport.js";

// Create a provider for Sepolia
const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);

// Create a signer using your deployer's private key
const signer = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);

// Create an instance of the EcoCoin contract
const ecoCoinContract = new ethers.Contract(
  process.env.ECOCOIN_CONTRACT_ADDRESS,
  ecoCoinABI,
  signer
);

// Marketplace Routes
import marketplaceRoutes from "./routes/marketplace.js";

const app = express();

// -----------------------
// CORS Configuration
// -----------------------
const allowedOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        return callback(new Error("Not allowed by CORS"), false);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

// -----------------------
// Other Middleware
// -----------------------
app.use(express.json());
app.use(ClerkExpressWithAuth());

// Connect to MongoDB Atlas
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch((err) => console.log("❌ MongoDB Connection Error:", err));

/* ===========================================================
   Award EcoCoins Helper Function
   (Awards the given amount to a wallet address)
=========================================================== */
const awardEcoCoins = async (walletAddress, amount) => {
  try {
    const tx = await ecoCoinContract.awardEcoCoin(
      walletAddress,
      ethers.parseUnits(amount.toString(), 18)
    );
    await tx.wait();
    console.log(`✅ Awarded ${amount} EcoCoins to ${walletAddress}`);
  } catch (error) {
    console.error("❌ Error awarding EcoCoins:", error);
  }
};

/* ===========================================================
   User Routes
=========================================================== */
app.post("/create-user", async (req, res) => {
  try {
    console.log("📩 Received user data:", req.body);
    const { userId, email, name, profileImageUrl } = req.body;

    if (!userId || !email || !name) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    let user = await User.findOneAndUpdate(
      { userId },
      { email, name, profilePicture: profileImageUrl },
      { new: true, upsert: true }
    );

    console.log("✅ User stored in MongoDB:", user);
    res.status(200).json(user);
  } catch (error) {
    console.error("❌ Error saving user:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/get-user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findOne({ userId });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      userId: user.userId,
      email: user.email,
      name: user.name,
      profilePicture: user.profilePicture,
    });
  } catch (error) {
    console.error("❌ Error fetching user:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/get-purchases/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findOne({ userId }).lean();
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(200).json(user.purchasedItems || []);
  } catch (error) {
    console.error("Error getting purchases:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ------------------------------------------------------------
// 1) Save user wallet address to DB
// ------------------------------------------------------------
app.post("/set-wallet-address", async (req, res) => {
  try {
    const { userId, walletAddress } = req.body;
    if (!userId || !walletAddress) {
      return res.status(400).json({ error: "Missing userId or walletAddress" });
    }

    const user = await User.findOneAndUpdate(
      { userId },
      { walletAddress },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    console.log(`✅ Wallet address ${walletAddress} set for user ${userId}`);
    res.json({ message: "Wallet address updated", user });
  } catch (error) {
    console.error("❌ Error setting wallet address:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ------------------------------------------------------------
// 2) Create fundraiser & award EcoCoins (Award 5 EcoCoins)
// ------------------------------------------------------------
app.post("/create-fundraiser", async (req, res) => {
  try {
    console.log("📩 Incoming Fundraiser Data:", req.body);
    const { title, description, goal, createdBy, createdByName } = req.body;
    if (!title || !description || !goal || !createdBy || !createdByName) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newFundraiser = new Fundraiser({
      title,
      description,
      goal: Number(goal),
      createdBy,
      createdByName,
      raised: 0,
      donations: [],
    });

    await newFundraiser.save();
    console.log("✅ Fundraiser Successfully Stored in DB:", newFundraiser);

    // Award 5 EcoCoins to fundraiser organizer if wallet exists
    const user = await User.findOne({ userId: createdBy });
    if (user && user.walletAddress) {
      await awardEcoCoins(user.walletAddress, 5);
    }

    res.status(201).json({
      _id: newFundraiser._id,
      title: newFundraiser.title,
      description: newFundraiser.description,
      goal: newFundraiser.goal,
      raised: newFundraiser.raised,
      createdByName: newFundraiser.createdByName,
      donations: newFundraiser.donations,
    });
  } catch (error) {
    console.error("❌ Error Creating Fundraiser:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ------------------------------------------------------------
// 3) Get user's EcoCoin balance from contract
// ------------------------------------------------------------
app.get("/eco-balance/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ error: "User not found" });
    if (!user.walletAddress) {
      return res.status(400).json({ error: "User has no walletAddress set" });
    }

    const balanceBN = await ecoCoinContract.balanceOf(user.walletAddress);
    const balance = ethers.formatUnits(balanceBN, 1);
    console.log(`Balance for ${user.walletAddress}: ${balance} EcoCoins`);
    res.json({ balance });
  } catch (error) {
    console.error("❌ Error fetching eco-balance:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/* ===========================================================
   Cleanup Event Routes
=========================================================== */
app.post("/create-cleanup", async (req, res) => {
  try {
    const { title, location, date, createdBy } = req.body;
    if (!title || !location || !date || !createdBy) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const user = await User.findOne({ userId: createdBy });
    const createdByName = user ? user.name : "Unknown User";

    const newEvent = new CleanupEvent({
      title,
      location,
      date,
      createdBy,
      createdByName,
      participants: [],
    });

    await newEvent.save();
    console.log("🎉 Cleanup Event Created:", newEvent);

    // Award 5 EcoCoins to cleanup event organizer if wallet exists
    if (user && user.walletAddress) {
      await awardEcoCoins(user.walletAddress, 5);
    }

    res.status(201).json(newEvent);
  } catch (error) {
    console.error("❌ Error creating cleanup event:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/get-cleanups", async (req, res) => {
  try {
    console.log("📩 Fetching all cleanup events...");
    const events = await CleanupEvent.find().lean();
    if (!events || events.length === 0) {
      console.log("⚠️ No cleanup events found.");
      return res.status(404).json({ error: "No cleanup events found" });
    }

    const populatedEvents = await Promise.all(
      events.map(async (event) => {
        const creator = await User.findOne({ userId: event.createdBy }).lean();
        const creatorName = creator ? creator.name : "Unknown";

        const reportsWithNames = await Promise.all(
          event.reports.map(async (report) => {
            const reporter = await User.findOne({ userId: report.userId }).lean();
            return {
              userId: report.userId,
              userName: reporter ? reporter.name : "Unknown",
              reportText: report.reportText,
              trashCollectedKg: report.trashCollectedKg,
              imageUrl: report.imageUrl,
              createdAt: report.createdAt,
            };
          })
        );

        return {
          ...event,
          createdByName: creatorName,
          participantCount: event.participants.length,
          reports: reportsWithNames,
        };
      })
    );

    console.log("✅ Cleanup events fetched successfully.");
    res.status(200).json(populatedEvents);
  } catch (error) {
    console.error("❌ Error fetching cleanup events:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/join-cleanup/:eventId", async (req, res) => {
  try {
    const { userId } = req.body;
    const { eventId } = req.params;
    console.log(`📩 Join request for event ${eventId} from user ${userId}`);

    if (!userId) {
      console.error("❌ Missing userId in request body");
      return res.status(400).json({ error: "User ID is required" });
    }

    const event = await CleanupEvent.findById(eventId);
    if (!event) {
      console.error(`❌ Event with ID ${eventId} not found`);
      return res.status(404).json({ error: "Event not found" });
    }

    if (event.participants.some((p) => p.userId === userId)) {
      console.log("⚠️ User already joined this event");
      return res.status(400).json({ error: "User already joined" });
    }

    const user = await User.findOne({ userId });
    if (!user) {
      console.error(`❌ User with ID ${userId} not found`);
      return res.status(404).json({ error: "User not found" });
    }

    event.participants.push({ userId, name: user.name });
    await event.save();
    console.log(`✅ User ${userId} (${user.name}) joined event ${eventId}`);
    res.status(200).json({ message: "Successfully joined event", event });
  } catch (error) {
    console.error("❌ Error joining cleanup event:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

app.post("/submit-report/:eventId", async (req, res) => {
  try {
    const { userId, reportText, trashCollectedKg, imageUrl } = req.body;
    const { eventId } = req.params;
    console.log(`📩 Report for event ${eventId} from user ${userId}`);

    if (!userId || !reportText || !trashCollectedKg) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const event = await CleanupEvent.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const newReport = {
      userId,
      name: user.name,
      reportText,
      trashCollectedKg,
      imageUrl: imageUrl || "",
      createdAt: new Date(),
    };

    event.reports.push(newReport);
    await event.save();
    console.log(`📢 Report added by ${user.name} for event ${eventId}`);
    res.status(200).json({ message: "Report submitted successfully", event });
  } catch (error) {
    console.error("❌ Error submitting report:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

app.delete("/delete-cleanup/:eventId", async (req, res) => {
  try {
    const { userId } = req.body;
    const { eventId } = req.params;
    console.log(`🗑️ Delete request for event ${eventId} by user ${userId}`);

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const event = await CleanupEvent.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    if (event.createdBy !== userId) {
      return res
        .status(403)
        .json({ error: "Unauthorized: Only the creator can delete this event" });
    }

    await CleanupEvent.findByIdAndDelete(eventId);
    console.log(`🗑️ Event ${eventId} deleted successfully`);
    res.status(200).json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting event:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

/* ===========================================================
   Fundraiser Routes (Duplicate removed, using the one above)
=========================================================== */
app.get("/get-fundraisers", async (req, res) => {
  try {
    console.log("📢 Fetching Fundraisers from MongoDB...");
    const fundraisers = await Fundraiser.find().lean();

    if (!fundraisers || fundraisers.length === 0) {
      console.log("⚠️ No fundraisers found in DB.");
      return res.status(200).json([]);
    }

    const fundraisersWithProgress = fundraisers.map((fundraiser) => ({
      ...fundraiser,
      progress: Math.min(
        100,
        Math.round((fundraiser.raised / fundraiser.goal) * 100)
      ),
    }));

    console.log("✅ Fundraisers Retrieved from DB:", fundraisersWithProgress);
    res.status(200).json(fundraisersWithProgress);
  } catch (error) {
    console.error("❌ Error Fetching Fundraisers:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.delete("/delete-fundraiser/:fundraiserId", async (req, res) => {
  try {
    const { userId } = req.body;
    const { fundraiserId } = req.params;
    console.log(`🗑️ Delete request for fundraiser ${fundraiserId} by user ${userId}`);

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const fundraiser = await Fundraiser.findById(fundraiserId);
    if (!fundraiser) {
      return res.status(404).json({ error: "Fundraiser not found" });
    }

    if (fundraiser.createdBy !== userId) {
      return res
        .status(403)
        .json({ error: "Unauthorized: Only the creator can delete this fundraiser" });
    }

    await Fundraiser.findByIdAndDelete(fundraiserId);
    console.log(`🗑️ Fundraiser ${fundraiserId} deleted successfully`);
    res.status(200).json({ message: "Fundraiser deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting fundraiser:", error);
    res
      .status(500)
      .json({ error: "Server error", details: error.message });
  }
});

app.post("/donate/:fundraiserId", async (req, res) => {
  const { fundraiserId } = req.params;
  const { userId, donorType, name, amount } = req.body;

  if (!userId || !donorType || !amount || amount <= 0) {
    return res.status(400).json({ error: "Invalid donation details" });
  }
  if (donorType !== "individual" && donorType !== "company") {
    return res
      .status(400)
      .json({ error: "Donor type must be 'individual' or 'company'" });
  }
  if (donorType === "company" && !name) {
    return res
      .status(400)
      .json({ error: "Company name is required for company donations" });
  }

  try {
    const fundraiser = await Fundraiser.findById(fundraiserId);
    if (!fundraiser) {
      return res.status(404).json({ error: "Fundraiser not found" });
    }

    const donationRecord = {
      userId,
      donorType,
      name,
      amount,
      donatedAt: new Date(),
    };

    fundraiser.donations.push(donationRecord);
    fundraiser.raised += amount;
    await fundraiser.save();

    console.log(
      `✅ ${donationRecord.name} (${donationRecord.donorType}) donated $${amount} to ${fundraiser.title}`
    );
    res
      .status(200)
      .json({ message: "Donation successful", fundraiser });
  } catch (error) {
    console.error("❌ Error processing donation:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/* ===========================================================
   Leaderboard Endpoint
=========================================================== */
app.get("/leaderboard", async (req, res) => {
  try {
    const mostDonated = await Fundraiser.aggregate([
      { $unwind: "$donations" },
      {
        $group: {
          _id: "$donations.name",
          totalDonated: { $sum: "$donations.amount" },
        },
      },
      { $sort: { totalDonated: -1 } },
    ]);

    const mostRaised = await Fundraiser.aggregate([
      {
        $group: {
          _id: { createdBy: "$createdBy", createdByName: "$createdByName" },
          totalRaised: { $sum: "$raised" },
        },
      },
      { $sort: { totalRaised: -1 } },
    ]);

    res.status(200).json({ mostDonated, mostRaised });
  } catch (error) {
    console.error("❌ Error generating leaderboard:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/* ===========================================================
   Marketplace Routes
=========================================================== */
app.use("/api/marketplace", marketplaceRoutes);

/* ===========================================================
   Scrape GoFundMe Route
=========================================================== */
app.get("/scrape-gofundme", async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: "Missing query parameter" });
    }

    const pythonProcess = spawn("python", ["gofundme_scraper.py", query]);

    let pythonData = "";
    pythonProcess.stdout.on("data", (data) => {
      pythonData += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      console.error("Python STDERR:", data.toString());
    });

    pythonProcess.on("close", (code) => {
      try {
        const parsed = JSON.parse(pythonData);
        return res.json(parsed);
      } catch (err) {
        console.error("Error parsing JSON from Python:", err);
        return res.status(500).json({
          error: "Error parsing JSON from Python script.",
          details: err.toString(),
        });
      }
    });
  } catch (err) {
    console.error("Error in /scrape-gofundme route:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ===========================================================
   Citizen Science Report Endpoints
=========================================================== */
app.post("/citizen-science-report", async (req, res) => {
  try {
    const { reportName, lat, lng } = req.body;
    if (!reportName || lat === undefined || lng === undefined) {
      return res
        .status(400)
        .json({ error: "Missing required fields: reportName, lat, lng" });
    }
    const newReport = new CitizenScienceReport({ reportName, lat, lng });
    await newReport.save();
    console.log("Citizen Science Report saved:", newReport);
    res.status(201).json(newReport);
  } catch (error) {
    console.error("Error saving citizen science report:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

app.get("/citizen-science-reports", async (req, res) => {
  try {
    const reports = await CitizenScienceReport.find().lean();
    res.status(200).json(reports);
  } catch (error) {
    console.error("Error fetching citizen science reports:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

/* ===========================================================
   Start the Server
=========================================================== */
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
