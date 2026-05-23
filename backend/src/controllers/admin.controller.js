import User from "../models/User.js";
import Product from "../models/Product.js";
import { firebaseAuth } from "../config/firebase.js";
import { findUsersByEmail, normalizeEmail } from "../utils/accountMerge.util.js";

function firstFilled(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (value) return value;
  }
  return "";
}

function pickAdminDisplayUser(users, currentFirebaseUid) {
  return [...users].sort((a, b) => {
    if (a.firebaseUid === currentFirebaseUid) return -1;
    if (b.firebaseUid === currentFirebaseUid) return 1;

    if (a.role !== b.role) return a.role === "admin" ? -1 : 1;
    if (a.isActive !== b.isActive) return a.isActive === false ? 1 : -1;

    const aLogin = a.lastLogin ? new Date(a.lastLogin).getTime() : 0;
    const bLogin = b.lastLogin ? new Date(b.lastLogin).getTime() : 0;
    if (aLogin !== bLogin) return bLogin - aLogin;

    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  })[0];
}

function collapseUsersForAdmin(users, currentFirebaseUid) {
  const grouped = new Map();

  users.forEach((user) => {
    const email = normalizeEmail(user.email);
    const key = email || user._id.toString();
    const group = grouped.get(key) || [];
    group.push(user);
    grouped.set(key, group);
  });

  return [...grouped.values()]
    .map((group) => {
      const selected = pickAdminDisplayUser(group, currentFirebaseUid);
      const allFirebaseUids = [
        ...new Set(group.flatMap((user) => [user.firebaseUid, ...(user.linkedFirebaseUids || [])]).filter(Boolean))
      ];

      return {
        ...selected.toObject(),
        firebaseUid: allFirebaseUids.includes(currentFirebaseUid) ? currentFirebaseUid : selected.firebaseUid,
        linkedFirebaseUids: allFirebaseUids,
        name: firstFilled(selected.name, ...group.map((user) => user.name), "User"),
        email: normalizeEmail(selected.email) || firstFilled(...group.map((user) => user.email)),
        avatar: firstFilled(selected.avatar, ...group.map((user) => user.avatar)),
        phone: firstFilled(selected.phone, ...group.map((user) => user.phone)),
        college: firstFilled(selected.college, ...group.map((user) => user.college)),
        role: group.some((user) => user.role === "admin") ? "admin" : "user",
        isActive: group.some((user) => user.isActive !== false),
        lastLogin: group
          .map((user) => user.lastLogin)
          .filter(Boolean)
          .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] || selected.lastLogin,
        duplicateCount: group.length,
      };
    })
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
}

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
    res.json({ data: collapseUsersForAdmin(users, req.firebaseUser.uid) });
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

    const usersToDelete = user.email
      ? await findUsersByEmail(user.email)
      : [user];
    const deleteIds = usersToDelete.map((account) => account._id);
    const firebaseUids = [
      ...new Set(
        usersToDelete
          .flatMap((account) => [account.firebaseUid, ...(account.linkedFirebaseUids || [])])
          .filter(Boolean)
      )
    ];

    if (usersToDelete.some((account) => account.firebaseUid === req.firebaseUser.uid)) {
      return res.status(400).json({ message: "You cannot delete your own admin account." });
    }

    // 1. Delete every Firebase Auth identity attached to this email/account
    if (firebaseAuth) {
      for (const firebaseUid of firebaseUids) {
        try {
          await firebaseAuth.deleteUser(firebaseUid);
          console.log(`Successfully deleted Firebase Auth user ${firebaseUid} for ${user.email}.`);
        } catch (firebaseError) {
          if (firebaseError.code === "auth/user-not-found") {
            console.log(`Firebase Auth user ${firebaseUid} was already gone; proceeding with MongoDB cleanup.`);
          } else {
            console.error(`Firebase Auth deletion failed for UID ${firebaseUid}:`, firebaseError);
            return res.status(500).json({
              message: `Failed to delete user credentials from Firebase: ${firebaseError.message || firebaseError}`
            });
          }
        }
      }
    } else {
      console.warn("Firebase Auth Admin SDK is not initialized; skipping Firebase deletion.");
    }

    // 2. Delete the user's products/listings across duplicate Mongo accounts
    const deletedProductsResult = await Product.deleteMany({ sellerId: { $in: deleteIds } });
    console.log(`Deleted ${deletedProductsResult.deletedCount} products associated with user account group ${deleteIds.join(", ")}.`);

    // 3. Delete all MongoDB user documents for this identity
    await User.deleteMany({ _id: { $in: deleteIds } });

    res.json({
      success: true,
      message: "User account, duplicate profile records, associated listings, and auth credentials deleted successfully."
    });
  } catch (error) {
    next(error);
  }
}
