import User from "../models/User.js";
import Product from "../models/Product.js";
import { firebaseAuth } from "../config/firebase.js";

export async function getStats(req, res, next) {
  try {
    const [totalUsers, totalProducts, activeProducts, soldProducts] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Product.countDocuments({ status: "active", isAdminDisabled: { $ne: true } }),
      Product.countDocuments({ status: "sold" })
    ]);

    // Simple login stats: users logged in today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const loginsToday = await User.countDocuments({ lastLogin: { $gte: startOfToday } });

    // Dynamic category counts
    const [ipeCount, neetCount, eapcetCount, jeeCount] = await Promise.all([
      Product.countDocuments({ category: "ipe" }),
      Product.countDocuments({ category: "neet" }),
      Product.countDocuments({ category: "eapcet" }),
      Product.countDocuments({ category: "jee" })
    ]);

    // Dynamic 7-day logins traffic list
    const traffic7Days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      
      const startOfDay = new Date(d);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(d);
      endOfDay.setHours(23, 59, 59, 999);
      
      const count = await User.countDocuments({
        lastLogin: { $gte: startOfDay, $lte: endOfDay }
      });
      
      const label = d.toLocaleDateString("en-US", { weekday: "short" });
      traffic7Days.push({ label, logins: count });
    }

    // Dynamic 30-day logins traffic list (grouped into 4 weeks)
    const traffic30Days = [];
    const weekLabels = ["Week 1", "Week 2", "Week 3", "Week 4"];
    for (let w = 0; w < 4; w++) {
      const startDayOffset = 30 - w * 7;
      const endDayOffset = 30 - (w + 1) * 7;
      
      const startOfRange = new Date();
      startOfRange.setDate(now.getDate() - startDayOffset);
      startOfRange.setHours(0, 0, 0, 0);
      
      const endOfRange = new Date();
      endOfRange.setDate(now.getDate() - endDayOffset);
      endOfRange.setHours(23, 59, 59, 999);
      
      const count = await User.countDocuments({
        lastLogin: { $gte: startOfRange, $lte: endOfRange }
      });
      
      traffic30Days.push({ label: weekLabels[w], logins: count });
    }

    res.json({
      data: {
        totalUsers,
        totalProducts,
        activeProducts,
        soldProducts,
        loginsToday,
        distribution: {
          ipe: ipeCount,
          neet: neetCount,
          eapcet: eapcetCount,
          jee: jeeCount
        },
        traffic7Days,
        traffic30Days
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function resetTraffic(req, res, next) {
  try {
    // Reset all users' lastLogin to a historical date far in the past to clear current traffic
    await User.updateMany({}, { $set: { lastLogin: new Date(0) } });
    res.json({
      success: true,
      message: "Traffic statistics successfully reset."
    });
  } catch (error) {
    next(error);
  }
}

export async function getAllUsers(req, res, next) {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ data: users });
  } catch (error) {
    next(error);
  }
}

export async function toggleUserStatus(req, res, next) {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isActive = !user.isActive;
    await user.save();

    res.json({ data: user });
  } catch (error) {
    next(error);
  }
}

export async function toggleAdminRole(req, res, next) {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Prevent self-demotion to avoid lockout
    if (user.firebaseUid === req.firebaseUser.uid) {
      return res.status(400).json({ message: "You cannot revoke your own admin privileges." });
    }

    user.role = user.role === "admin" ? "user" : "admin";
    await user.save();

    res.json({ data: user });
  } catch (error) {
    next(error);
  }
}

export async function getAllProducts(req, res, next) {
  try {
    const products = await Product.find()
      .populate("sellerId", "name email")
      .sort({ createdAt: -1 });
    res.json({ data: products });
  } catch (error) {
    next(error);
  }
}

export async function toggleProductStatus(req, res, next) {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    product.isAdminDisabled = !product.isAdminDisabled;
    await product.save();

    res.json({ data: product });
  } catch (error) {
    next(error);
  }
}

export async function deleteUserAccount(req, res, next) {
  try {
    const { id } = req.params;

    // Find the user first to get their Firebase UID
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent self-deletion
    if (user.firebaseUid === req.firebaseUser.uid) {
      return res.status(400).json({ message: "You cannot delete your own admin account." });
    }

    // 1. Delete user from Firebase Auth
    if (firebaseAuth) {
      try {
        await firebaseAuth.deleteUser(user.firebaseUid);
        console.log(`Successfully deleted user ${user.email} from Firebase Auth.`);
      } catch (firebaseError) {
        if (firebaseError.code === "auth/user-not-found") {
          console.log(`User ${user.email} was not found in Firebase Auth; proceeding with MongoDB cleanup.`);
        } else {
          console.error(`Firebase Auth deletion failed for UID ${user.firebaseUid}:`, firebaseError);
          return res.status(500).json({
            message: `Failed to delete user credentials from Firebase: ${firebaseError.message || firebaseError}`
          });
        }
      }
    } else {
      console.warn("Firebase Auth Admin SDK is not initialized; skipping Firebase deletion.");
    }

    // 2. Delete the user's products/listings
    const deletedProductsResult = await Product.deleteMany({ sellerId: id });
    console.log(`Deleted ${deletedProductsResult.deletedCount} products associated with user ${id}.`);

    // 3. Delete the user document from MongoDB
    await User.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "User account, associated listings, and auth credentials deleted successfully."
    });
  } catch (error) {
    next(error);
  }
}
