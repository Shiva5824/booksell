import mongoose from "mongoose";
import Product from "../models/Product.js";
import { formatValidationError } from "../utils/validation.util.js";

/**
 * List all products with optional filters
 */
export async function listProducts(req, res) {
  try {
    const { sort = "newest", category, condition, college, minPrice, maxPrice, search } = req.query;

    let query = {};

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    // Category filter
    if (category && typeof category === "string" && category.trim() !== "") {
      query.category = category;
    }

    // Condition filter
    if (condition && typeof condition === "string" && condition.trim() !== "") {
      query.condition = condition;
    }

    // College filter
    if (college && typeof college === "string" && college.trim() !== "") {
      query.college = college;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseInt(minPrice);
      if (maxPrice) query.price.$lte = parseInt(maxPrice);
    }

    // Sorting
    let sortObj = {};
    switch (sort) {
      case "price_asc":
        sortObj = { price: 1 };
        break;
      case "price_desc":
        sortObj = { price: -1 };
        break;
      case "newest":
      default:
        sortObj = { createdAt: -1 };
    }

    const products = await Product.find(query)
      .sort(sortObj)
      .populate("sellerId", "name email avatar college phone firebaseUid")
      .lean();

    res.json({
      success: true,
      data: products,
      count: products.length,
    });
  } catch (error) {
    console.error("Error listing products:", error);
    res.status(500).json({
      success: false,
      message: "Failed to list products",
      error: error.message,
    });
  }
}

/**
 * Get a single product by ID
 */
export async function getProduct(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findById(id).populate(
      "sellerId",
      "name email avatar college phone firebaseUid"
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Error getting product:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get product",
      error: error.message,
    });
  }
}

/**
 * Create a new product
 */
export async function createProduct(req, res) {
  try {
    const { title, description, price, category, condition, college, images } = req.body;
    const sellerId = req.user._id;

    const product = new Product({
      title,
      description,
      price,
      category,
      condition,
      college,
      images,
      sellerId,
      status: "active",
    });

    await product.save();
    await product.populate("sellerId", "name email avatar college phone firebaseUid");

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    console.error("Error creating product:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: formatValidationError(error),
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create product",
      error: error.message,
    });
  }
}

/**
 * Update a product
 */
export async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const { title, description, price, category, condition, college, images, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check if user is the owner of the product
    if (product.sellerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to update this product",
      });
    }

    // Update fields
    if (title !== undefined) product.title = title;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = price;
    if (category !== undefined) product.category = category;
    if (condition !== undefined) product.condition = condition;
    if (college !== undefined) product.college = college;
    if (images !== undefined) product.images = images;
    if (status !== undefined) product.status = status;

    await product.save();
    await product.populate("sellerId", "name email avatar college phone firebaseUid");

    res.json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    console.error("Error updating product:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: formatValidationError(error),
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update product",
      error: error.message,
    });
  }
}

/**
 * Delete a product
 */
export async function deleteProduct(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check if user is the owner of the product
    if (product.sellerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to delete this product",
      });
    }

    await Product.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete product",
      error: error.message,
    });
  }
}
