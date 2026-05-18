import mongoose from "mongoose";

const SiteSettingSchema = new mongoose.Schema({
  supportEmail: { type: String, default: "" },
  whatsappNumber: { type: String, default: "" }, // stored without country code
}, { timestamps: true });

const SiteSetting = mongoose.models.SiteSetting || mongoose.model("SiteSetting", SiteSettingSchema);
export default SiteSetting;
