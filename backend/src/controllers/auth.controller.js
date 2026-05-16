import User from "../models/User.js";

export async function login(req, res, next) {
  try {
    const firebaseUid = req.firebaseUser.uid;
    const payload = req.validated.body;

    console.log("Login endpoint called for Firebase UID:", firebaseUid);
    console.log("Payload:", payload);

    const user = await User.findOneAndUpdate(
      { firebaseUid },
      {
        $setOnInsert: {
          firebaseUid,
          email: req.firebaseUser.email || ""
        },
        $set: {
          name: payload.name || req.firebaseUser.displayName || "User",
          avatar: payload.avatar || "",
          college: payload.college || "",
          lastLogin: new Date()
        }
      },
      { upsert: true, new: true }
    );

    console.log("User after sync:", user);
    res.json({ data: user });
  } catch (error) {
    console.error("Login error:", error);
    next(error);
  }
}

export async function me(req, res) {
  res.json({ data: req.user });
}
