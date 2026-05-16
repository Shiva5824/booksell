import User from "../models/User.js";
import Product from "../models/Product.js";

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

    res.json({
      data: {
        totalUsers,
        totalProducts,
        activeProducts,
        soldProducts,
        loginsToday
      }
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
