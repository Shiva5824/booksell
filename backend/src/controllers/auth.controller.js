import User from "../models/User.js";
import { mergeUsersForEmail, normalizeEmail } from "../utils/accountMerge.util.js";

function buildSyncData(firebaseUser, payload = {}) {
  const name = payload.name
    || firebaseUser.name
    || firebaseUser.displayName
    || "User";

  const data = {
    lastLogin: new Date(),
    name,
  };

  if (payload.avatar !== undefined) {
    data.avatar = payload.avatar;
  } else if (firebaseUser.picture) {
    data.avatar = firebaseUser.picture;
  }

  if (payload.college !== undefined) {
    data.college = payload.college;
  }

  if (payload.phone !== undefined) {
    data.phone = payload.phone;
  } else if (firebaseUser.phone_number) {
    data.phone = firebaseUser.phone_number;
  }

  return data;
}

async function syncFirebaseUser(firebaseUser, payload = {}) {
  const firebaseUid = firebaseUser.uid;
  const email = normalizeEmail(firebaseUser.email || payload.email || "");
  const updateData = buildSyncData(firebaseUser, payload);

  let user = await User.findOne({
    $or: [
      { firebaseUid },
      { linkedFirebaseUids: firebaseUid },
    ],
  });

  if (!user && email) {
    const users = await User.find({
      email: { $regex: new RegExp(`^\\s*${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "i") },
    });
    if (users.length > 0) {
      user = users[0];
    }
  }

  if (!user) {
    user = new User({
      firebaseUid,
      linkedFirebaseUids: [firebaseUid],
      email,
      name: updateData.name,
      avatar: updateData.avatar || "",
      phone: updateData.phone || "",
      college: updateData.college || "",
      lastLogin: updateData.lastLogin,
    });
  } else {
    user.firebaseUid = firebaseUid;
    user.linkedFirebaseUids = [...new Set([...(user.linkedFirebaseUids || []), firebaseUid])];
    if (email) user.email = email;
    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined) user[key] = value;
    });
  }

  try {
    await user.save();
  } catch (error) {
    if (error.name === "VersionError") {
      console.warn(`[syncFirebaseUser] Version conflict for user ${user._id}, re-fetching and retrying save...`);
      const freshUser = await User.findById(user._id);
      if (freshUser) {
        freshUser.firebaseUid = firebaseUid;
        freshUser.linkedFirebaseUids = [...new Set([...(freshUser.linkedFirebaseUids || []), firebaseUid])];
        if (email) freshUser.email = email;
        Object.entries(updateData).forEach(([key, value]) => {
          if (value !== undefined) freshUser[key] = value;
        });
        await freshUser.save();
        user = freshUser;
      } else {
        throw error;
      }
    } else if (error.code === 11000) {
      console.warn(`[syncFirebaseUser] Duplicate key error (11000) for firebaseUid ${firebaseUid}, re-fetching user...`);
      const freshUser = await User.findOne({
        $or: [
          { firebaseUid },
          { linkedFirebaseUids: firebaseUid },
        ],
      });
      if (freshUser) {
        user = freshUser;
      } else {
        throw error;
      }
    } else {
      throw error;
    }
  }

  if (email) {
    try {
      user = await mergeUsersForEmail(email, {
        preferredFirebaseUid: firebaseUid,
        adoptPreferredFirebaseUid: true,
        profileUpdates: updateData,
      });
    } catch (mergeError) {
      console.warn("[syncFirebaseUser] Non-fatal merge error occurred during duplicate sync:", mergeError.message || mergeError);
    }
  }

  return user;
}

export async function login(req, res, next) {
  try {
    const payload = req.validated.body || {};

    console.log("Login endpoint called for Firebase UID:", req.firebaseUser.uid);
    console.log("Payload:", payload);

    const user = await syncFirebaseUser(req.firebaseUser, payload);

    if (user.isActive === false) {
      return res.status(403).json({ message: "Your account has been disabled by an administrator." });
    }

    console.log("User after sync:", user);
    res.json({ data: user });
  } catch (error) {
    console.error("Login error:", error);
    next(error);
  }
}

export async function me(req, res, next) {
  try {
    let user = req.user;

    if (!user) {
      user = await syncFirebaseUser(req.firebaseUser);
    }

    if (user?.isActive === false) {
      return res.status(403).json({ message: "Your account has been disabled by an administrator." });
    }

    res.json({ data: user });
  } catch (error) {
    next(error);
  }
}
