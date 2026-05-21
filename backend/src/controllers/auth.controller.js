import User from "../models/User.js";

export async function login(req, res, next) {
  try {
    const firebaseUid = req.firebaseUser.uid;
    const payload = req.validated.body || {};

    console.log("Login endpoint called for Firebase UID:", firebaseUid);
    console.log("Payload:", payload);

    const updateData = { lastLogin: new Date() };
    if (payload.name) updateData.name = payload.name;
    else if (req.firebaseUser.displayName) updateData.name = req.firebaseUser.displayName;
    else updateData.name = "User";

    const setOnInsertData = {
      firebaseUid,
      email: req.firebaseUser.email || ""
    };

    if (payload.avatar) {
      updateData.avatar = payload.avatar;
    } else {
      setOnInsertData.avatar = "";
    }

    if (payload.college) {
      updateData.college = payload.college;
    } else {
      setOnInsertData.college = "";
    }

    const user = await User.findOneAndUpdate(
      { firebaseUid },
      {
        $setOnInsert: setOnInsertData,
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
