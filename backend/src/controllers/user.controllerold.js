import Product from "../models/Product.js";
import User from "../models/User.js";

export async function getUser(req, res, next) {
  try {
    const user = await User.findById(req.params.id).select("-firebaseUid");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ data: user });
  } catch (error) {
    next(error);
  }
}

export async function getUserProducts(req, res, next) {
  try {
    const products = await Product.find({ sellerId: req.params.id }).sort({ createdAt: -1 });
    res.json({ data: products });
  } catch (error) {
    next(error);
  }
}
