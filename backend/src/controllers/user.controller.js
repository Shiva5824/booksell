import mongoose from "mongoose";
import User from "../models/User.js";
import Product from "../models/Product.js";

/**
 * Get user profile by ID
 */
export async function getUser(req, res) {
  try {
    const { id } = req.params;

    let user;
    if (mongoose.Types.ObjectId.isValid(id)) {
      user = await User.findById(id).select("-firebaseUid");
    } else {
      // If not a valid ObjectId, try finding by firebaseUid
      user = await User.findOne({ firebaseUid: id }).select("-firebaseUid");
    }

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

/**
 * Add a location to user's saved locations
 */
export async function addLocation(req, res) {
  try {
    const { address, latitude, longitude, label, isDefault } = req.body;

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!address || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: "Address, latitude, and longitude are required",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const newLocation = {
      label: label || "My Location",
      address: address.trim(),
      latitude,
      longitude,
      isDefault: isDefault || false,
    };

    if (newLocation.isDefault) {
      user.locations.forEach(loc => loc.isDefault = false);
    }

    user.locations.push(newLocation);
    await user.save();

    res.json({
      success: true,
      message: "Location added successfully",
      data: user,
    });
  } catch (error) {
    console.error("Error adding location:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add location",
      error: error.message,
    });
  }
}

/**
 * Update a user's location
 */
export async function updateLocation(req, res) {
  try {
    const { locationId } = req.params;
    const { address, latitude, longitude, label, isDefault } = req.body;

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const location = user.locations.id(locationId);
    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Location not found",
      });
    }

    if (address !== undefined) location.address = address.trim();
    if (latitude !== undefined) location.latitude = latitude;
    if (longitude !== undefined) location.longitude = longitude;
    if (label !== undefined) location.label = label;
    if (isDefault !== undefined) {
      if (isDefault) {
        user.locations.forEach(loc => loc.isDefault = false);
      }
      location.isDefault = isDefault;
    }

    await user.save();

    res.json({
      success: true,
      message: "Location updated successfully",
      data: user,
    });
  } catch (error) {
    console.error("Error updating location:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update location",
      error: error.message,
    });
  }
}

/**
 * Delete a user's location
 */
export async function deleteLocation(req, res) {
  try {
    const { locationId } = req.params;

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const location = user.locations.id(locationId);
    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Location not found",
      });
    }

    location.deleteOne();
    await user.save();

    res.json({
      success: true,
      message: "Location deleted successfully",
      data: user,
    });
  } catch (error) {
    console.error("Error deleting location:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete location",
      error: error.message,
    });
  }
}

/**
 * Toggle a product in/out of the user's favorites
 */
export async function toggleFavorite(req, res) {
  try {
    const { productId } = req.params;

    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const productObjId = new mongoose.Types.ObjectId(productId);
    const alreadyFaved = user.favorites.some((id) => id.equals(productObjId));

    if (alreadyFaved) {
      user.favorites = user.favorites.filter((id) => !id.equals(productObjId));
    } else {
      user.favorites.push(productObjId);
    }

    await user.save();

    res.json({
      success: true,
      favorited: !alreadyFaved,
      favorites: user.favorites,
    });
  } catch (error) {
    console.error("Error toggling favorite:", error);
    res.status(500).json({ success: false, message: "Failed to toggle favorite", error: error.message });
  }
}

/**
 * Get the current user's favorited products (populated)
 */
export async function getFavorites(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await User.findById(req.user._id)
      .populate({
        path: "favorites",
        populate: { path: "sellerId", select: "name email avatar college phone" },
      });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Filter out any null references (deleted products)
    const validFavorites = user.favorites.filter(Boolean);

    res.json({
      success: true,
      data: validFavorites,
      count: validFavorites.length,
    });
  } catch (error) {
    console.error("Error fetching favorites:", error);
    res.status(500).json({ success: false, message: "Failed to fetch favorites", error: error.message });
  }
}

