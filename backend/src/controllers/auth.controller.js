import User from "../models/User.js";

export async function login(req, res, next) {
  try {
    const firebaseUid = req.firebaseUser.uid;
    const payload = req.validated.body || {};

    console.log("Login endpoint called for Firebase UID:", firebaseUid);
    console.log("Payload:", payload);

    const updateData = { lastLogin: new Date() };
    if (payload.name) updateData.name = payload.name;
    if (payload.avatar) updateData.avatar = payload.avatar;
    if (payload.college) updateData.college = payload.college;

    const user = await User.findOneAndUpdate(
      { firebaseUid },
      {
        $setOnInsert: {
          firebaseUid,
          email: req.firebaseUser.email || "",
          name: payload.name || req.firebaseUser.displayName || "User",
          avatar: payload.avatar || "",
          college: payload.college || ""
        },
        $set: updateData
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
