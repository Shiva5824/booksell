import mongoose from "mongoose";

const SiteMediaSchema = new mongoose.Schema({
  imageUrl: { type: String, required: true },
  title: { type: String, default: "" },
  description: { type: String, default: "" },
  order: { type: Number, default: 1, min: 1, max: 10 },
  uploadedBy: { type: String, default: "admin" },
  uploadedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Ensure only 10 items max
SiteMediaSchema.pre("save", async function (next) {
  if (this.isNew) {
    const count = await mongoose.model("SiteMedia").countDocuments();
    if (count >= 10) {
      throw new Error("Maximum 10 carousel images allowed");
    }
  }
  next();
});

const SiteMedia = mongoose.models.SiteMedia || mongoose.model("SiteMedia", SiteMediaSchema);
export default SiteMedia;
