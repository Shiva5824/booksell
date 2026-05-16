import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, index: "text" },
    price: { type: Number, required: true, min: 0 },
    condition: { type: String, enum: ["new", "good", "used"], required: true },
    category: { type: String, enum: ["ipe", "eapcet", "jee", "neet"], required: true, index: true },
    images: {
      type: [String],
      validate: {
        validator: (value) => value.length > 0 && value.length <= 6,
        message: "A listing needs 1 to 6 images."
      }
    },
    description: { type: String, required: true, trim: true },
    college: { type: String, required: true, trim: true, index: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: { type: String, enum: ["active", "sold"], default: "active", index: true },
    isAdminDisabled: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

productSchema.index({ title: "text", description: "text" });

export default mongoose.model("Product", productSchema);
