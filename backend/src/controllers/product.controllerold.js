import Product from "../models/Product.js";

export async function listProducts(req, res, next) {
  try {
    const { q, college, category, min, max, sort = "newest", limit = 20, skip = 0 } = req.validated.query;
    const query = {};

    if (q) query.$text = { $search: q };
    if (college) query.college = new RegExp(college, "i");
    if (category) query.category = category;
    if (min !== undefined || max !== undefined) {
      query.price = {};
      if (min !== undefined) query.price.$gte = min;
      if (max !== undefined) query.price.$lte = max;
    }

    const sortMap = {
      newest: { createdAt: -1 },
      price_asc: { price: 1 },
      price_desc: { price: -1 }
    };

    const products = await Product.find(query)
      .populate("sellerId", "name email college avatar phone")
      .sort(sortMap[sort])
      .skip(skip)
      .limit(limit);

    res.json({ data: products });
  } catch (error) {
    next(error);
  }
}

export async function getProduct(req, res, next) {
  try {
    const productId = req.validated.params.id;
    console.log("Fetching product with ID:", productId);
    const product = await Product.findById(productId).populate("sellerId", "name email college avatar phone");
    console.log("Product found:", !!product);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json({ data: product });
  } catch (error) {
    next(error);
  }
}

export async function createProduct(req, res, next) {
  try {
    console.log("Create product request received");
    console.log("Firebase user:", req.firebaseUser?.uid);
    console.log("Database user:", req.user?._id);

    if (!req.user) {
      console.warn("User not found in database for Firebase UID:", req.firebaseUser?.uid);
      return res.status(403).json({ message: "Complete your profile before posting" });
    }
    const product = await Product.create({ ...req.validated.body, sellerId: req.user._id });
    console.log("Product created:", product._id);
    res.status(201).json({ data: product });
  } catch (error) {
    next(error);
  }
}

export async function updateProduct(req, res, next) {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.validated.params.id, sellerId: req.user?._id },
      req.validated.body,
      { new: true }
    );
    if (!product) return res.status(404).json({ message: "Listing not found or not owned by you" });
    res.json({ data: product });
  } catch (error) {
    next(error);
  }
}

export async function deleteProduct(req, res, next) {
  try {
    const product = await Product.findOneAndDelete({ _id: req.validated.params.id, sellerId: req.user?._id });
    if (!product) return res.status(404).json({ message: "Listing not found or not owned by you" });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
