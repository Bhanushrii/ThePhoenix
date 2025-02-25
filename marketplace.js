// routes/marketplace.js
import { Router } from "express";
import multer from "multer";
import MarketplaceItem from "../models/MarketplaceItem.js";
import User from "../models/User.js"; // So we can update buyer's purchased items

const router = Router();

// In-memory Multer storage (for storing images directly in Mongo)
const storage = multer.memoryStorage();
const upload = multer({ storage });

/**
 * GET /api/marketplace
 * Fetch all UNSOLD marketplace items
 */
router.get("/", async (req, res) => {
  try {
    // Only return items that are not sold
    const items = await MarketplaceItem.find({ sold: false })
      .sort({ createdAt: -1 })
      .lean();
    res.json(items);
  } catch (err) {
    console.error("Error fetching marketplace items:", err);
    res.status(500).json({ error: "Failed to load marketplace items." });
  }
});

/**
 * GET /api/marketplace/:itemId
 * Fetch a single item by ID
 */
router.get("/:itemId", async (req, res) => {
  try {
    const { itemId } = req.params;
    const item = await MarketplaceItem.findById(itemId).lean();
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }
    res.json(item);
  } catch (error) {
    console.error("Error fetching item:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * GET /api/marketplace/:itemId/image
 * Return the raw image data for an item
 */
router.get("/:itemId/image", async (req, res) => {
  try {
    const { itemId } = req.params;
    const item = await MarketplaceItem.findById(itemId);
    if (!item || !item.imageData) {
      return res.status(404).send("No image found for this item.");
    }

    // Return raw image data with correct MIME type
    res.set("Content-Type", item.imageContentType || "image/png");
    res.send(item.imageData);
  } catch (error) {
    console.error("Error retrieving image:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * POST /api/marketplace
 * Create (sell) a new marketplace item (with optional image)
 */
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { name, description, price, sellerId } = req.body;
    if (!name || !description || !price) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newItemData = {
      name,
      description,
      price: Number(price),
      sellerId: sellerId || "",
    };

    if (req.file) {
      newItemData.imageData = req.file.buffer;
      newItemData.imageContentType = req.file.mimetype;
    }

    const newItem = await MarketplaceItem.create(newItemData);
    res.status(201).json({
      message: "Item created successfully",
      item: newItem,
    });
  } catch (error) {
    console.error("Error creating listing:", error);
    res.status(500).json({ error: "Failed to create item." });
  }
});

/**
 * POST /api/marketplace/purchase
 * Buy an item: mark it sold, remove from marketplace listing,
 * and add minimal item data (no image) to the buyer's purchasedItems.
 */
router.post("/purchase", async (req, res) => {
  try {
    const { itemId, buyerId } = req.body;
    if (!itemId || !buyerId) {
      return res.status(400).json({ error: "itemId and buyerId are required" });
    }

    const item = await MarketplaceItem.findById(itemId);
    if (!item) {
      return res.status(404).json({ error: "Item not found." });
    }

    if (item.sold) {
      return res.status(400).json({ error: "Item is already sold." });
    }

    // Mark item as sold in the DB
    item.sold = true;
    item.boughtBy = buyerId;
    await item.save();

    // Now add a record of the purchase to the buyer's "purchasedItems"
    const buyer = await User.findOne({ userId: buyerId });
    if (!buyer) {
      return res.status(404).json({ error: "Buyer not found." });
    }

    buyer.purchasedItems.push({
      itemId: item._id.toString(),
      name: item.name,
      description: item.description,
      price: item.price,
      purchasedAt: new Date(),
    });
    await buyer.save();

    res.json({ message: "Purchase successful", item });
  } catch (err) {
    console.error("Purchase failed:", err);
    res.status(500).json({ error: "Purchase failed. Please try again." });
  }
});

/**
 * DELETE /api/marketplace/:itemId
 * Delete an item if you're the seller and it's not sold.
 */
router.delete("/:itemId", async (req, res) => {
  try {
    const { itemId } = req.params;
    const { userId } = req.body; // The ID of the user requesting deletion

    if (!userId) {
      return res.status(400).json({ error: "Missing userId in request body" });
    }

    const item = await MarketplaceItem.findById(itemId);
    if (!item) {
      return res.status(404).json({ error: "Item not found." });
    }

    // Only the seller can delete
    if (item.sellerId !== userId) {
      return res
        .status(403)
        .json({ error: "Forbidden: only the seller can delete this item." });
    }

    // If the item is sold, forbid deletion
    if (item.sold) {
      return res
        .status(400)
        .json({ error: "Cannot delete: item has already been sold." });
    }

    await MarketplaceItem.findByIdAndDelete(itemId);
    res.json({ message: `Item ${itemId} deleted successfully.` });
  } catch (err) {
    console.error("Error deleting item:", err);
    res.status(500).json({ error: "Failed to delete item." });
  }
});

export default router;
