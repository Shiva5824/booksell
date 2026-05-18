import mongoose from "mongoose";
import User from "../models/User.js";
import Product from "../models/Product.js";

/**
 * Get user profile by ID
 */
export async function getUser(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const user = await User.findById(id).select("-firebaseUid");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Error getting user:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user",
      error: error.message,
    });
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(req, res) {
  try {
    const { name, avatar, phone, college } = req.body;
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User session not found in database. Please log out and sign in again to sync your profile.",
      });
    }

    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update fields
    if (name !== undefined && name.trim()) {
      user.name = name.trim();
    }
    if (avatar !== undefined) {
      user.avatar = avatar;
    }
    if (phone !== undefined) {
      user.phone = phone;
    }
    if (college !== undefined) {
      user.college = college;
    }

    await user.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: user,
    });
  } catch (error) {
    console.error("Error updating profile:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: Object.keys(error.errors).reduce((acc, key) => {
          acc[key] = error.errors[key].message;
          return acc;
        }, {}),
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message,
    });
  }
}

/**
 * Get user's products
 */
export async function getUserProducts(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const products = await Product.find({ sellerId: id })
      .populate("sellerId", "name email avatar college phone firebaseUid")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: products,
      count: products.length,
    });
  } catch (error) {
    console.error("Error getting user products:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user products",
      error: error.message,
    });
  }
}

/**
 * Check if a phone number already exists in the database
 */
export async function checkPhoneExists(req, res) {
  try {
    const { phone } = req.query;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    const cleanPhone = phone.trim();

    // Query for any existing user with this phone number
    const query = { phone: cleanPhone };
    
    // Exclude the current user if they already have a registered profile
    if (req.user && req.user._id) {
      query._id = { $ne: req.user._id };
    }

    const existingUser = await User.findOne(query);

    res.json({
      success: true,
      exists: !!existingUser,
    });
  } catch (error) {
    console.error("Error checking phone number:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check phone number",
      error: error.message,
    });
  }
}
