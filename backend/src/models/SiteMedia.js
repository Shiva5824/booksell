import mongoose from "mongoose";

const SiteMediaSchema = new mongoose.Schema({
  imageUrl: { type: String, required: true },
  title: { type: String, default: "" },
  description: { type: String, default: "" },
  // Which carousel slot this image belongs to.
  // "hero" = top-of-homepage hero carousel (existing behavior, default).
  // "cta"  = "Save More on College Essentials" CTA banner image.
  section: {
    type: String,
    enum: ["hero", "cta"],
    default: "hero",
    index: true,
  },
  order: { type: Number, default: 1, min: 1, max: 10 },
  uploadedBy: { type: String, default: "admin" },
  uploadedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Ensure only 10 items max **per section**.
SiteMediaSchema.pre("save", async function (next) {
  if (this.isNew) {
    const count = await mongoose.model("SiteMedia").countDocuments({ section: this.section || "hero" });
    if (count >= 10) {
      throw new Error("Maximum 10 carousel images allowed per section");
    }
  }
  next();
});

const SiteMedia = mongoose.models.SiteMedia || mongoose.model("SiteMedia", SiteMediaSchema);
export default SiteMedia;
