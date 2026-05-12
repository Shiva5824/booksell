import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firebaseUid: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    college: { type: String, default: "", trim: true, index: true },
    avatar: { type: String, default: "" },
    phone: { type: String, default: "" }
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
