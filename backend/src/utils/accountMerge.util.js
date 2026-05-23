import User from "../models/User.js";
import Product from "../models/Product.js";

export function normalizeEmail(email) {
  return (email || "").trim().toLowerCase();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function compactString(value) {
  return typeof value === "string" ? value.trim() : value;
}

function firstFilled(...values) {
  for (const value of values) {
    const compacted = compactString(value);
    if (compacted) return compacted;
  }
  return "";
}

function newestDate(...values) {
  return values
    .filter(Boolean)
    .map((value) => new Date(value))
    .filter((value) => !Number.isNaN(value.getTime()))
    .sort((a, b) => b.getTime() - a.getTime())[0];
}

function uniqueObjectIds(values) {
  const seen = new Set();
  const unique = [];

  values.filter(Boolean).forEach((value) => {
    const key = value.toString();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(value);
    }
  });

  return unique;
}

function uniqueStrings(values) {
  return [...new Set(values.filter(Boolean).map((value) => value.toString()))];
}

function uniqueLocations(users) {
  const seen = new Set();
  const locations = [];

  users.forEach((user) => {
    (user.locations || []).forEach((location) => {
      const key = [
        normalizeEmail(location.address || ""),
        location.latitude,
        location.longitude,
      ].join("|");

      if (!seen.has(key)) {
        seen.add(key);
        locations.push(location.toObject ? location.toObject() : location);
      }
    });
  });

  const defaultIndex = locations.findIndex((location) => location.isDefault);
  if (defaultIndex >= 0) {
    locations.forEach((location, index) => {
      location.isDefault = index === defaultIndex;
    });
  }

  return locations;
}

function pickCanonicalUser(users, preferredFirebaseUid) {
  return [...users].sort((a, b) => {
    if (preferredFirebaseUid) {
      if (a.firebaseUid === preferredFirebaseUid) return -1;
      if (b.firebaseUid === preferredFirebaseUid) return 1;
    }

    if (a.role !== b.role) {
      return a.role === "admin" ? -1 : 1;
    }

    if (a.isActive !== b.isActive) {
      return a.isActive === false ? 1 : -1;
    }

    const aLogin = a.lastLogin ? new Date(a.lastLogin).getTime() : 0;
    const bLogin = b.lastLogin ? new Date(b.lastLogin).getTime() : 0;
    if (aLogin !== bLogin) return bLogin - aLogin;

    const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bCreated - aCreated;
  })[0];
}

export async function findUsersByEmail(email) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return [];

  return User.find({
    email: { $regex: new RegExp(`^\\s*${escapeRegExp(normalizedEmail)}\\s*$`, "i") },
  });
}

export async function mergeUsersForEmail(email, options = {}) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return null;

  const users = await findUsersByEmail(normalizedEmail);
  if (users.length === 0) return null;

  const canonical = pickCanonicalUser(users, options.preferredFirebaseUid);
  const originalCanonicalFirebaseUid = canonical.firebaseUid;
  const duplicates = users.filter((user) => !user._id.equals(canonical._id));
  const orderedUsers = [canonical, ...duplicates];

  canonical.email = normalizedEmail;
  const shouldUsePreferredUid = options.adoptPreferredFirebaseUid
    || users.some((user) => user.firebaseUid === options.preferredFirebaseUid);

  if (options.preferredFirebaseUid && shouldUsePreferredUid) {
    canonical.firebaseUid = options.preferredFirebaseUid;
  }

  const profileUpdates = options.profileUpdates || {};
  canonical.name = firstFilled(profileUpdates.name, canonical.name, ...duplicates.map((user) => user.name), "User");
  canonical.avatar = firstFilled(profileUpdates.avatar, canonical.avatar, ...duplicates.map((user) => user.avatar));
  canonical.phone = firstFilled(profileUpdates.phone, canonical.phone, ...duplicates.map((user) => user.phone));
  canonical.college = firstFilled(profileUpdates.college, canonical.college, ...duplicates.map((user) => user.college));
  canonical.role = orderedUsers.some((user) => user.role === "admin") ? "admin" : "user";
  canonical.isActive = orderedUsers.every((user) => user.isActive !== false);
  canonical.lastLogin = newestDate(profileUpdates.lastLogin, canonical.lastLogin, ...duplicates.map((user) => user.lastLogin)) || new Date();
  canonical.favorites = uniqueObjectIds(orderedUsers.flatMap((user) => user.favorites || []));
  canonical.linkedFirebaseUids = uniqueStrings(
    orderedUsers.flatMap((user) => [user.firebaseUid, ...(user.linkedFirebaseUids || [])])
      .concat(originalCanonicalFirebaseUid, options.preferredFirebaseUid)
  );
  canonical.locations = uniqueLocations(orderedUsers);

  if (duplicates.length > 0) {
    const duplicateIds = duplicates.map((user) => user._id);
    await Product.updateMany(
      { sellerId: { $in: duplicateIds } },
      { $set: { sellerId: canonical._id } }
    );
  }

  try {
    await canonical.save();
  } catch (error) {
    if (error.name === "VersionError") {
      console.warn(`[mergeUsersForEmail] Version conflict for ${canonical._id}, re-fetching and retrying save...`);
      const freshCanonical = await User.findById(canonical._id);
      if (freshCanonical) {
        freshCanonical.email = canonical.email;
        freshCanonical.firebaseUid = canonical.firebaseUid;
        freshCanonical.name = canonical.name;
        freshCanonical.avatar = canonical.avatar;
        freshCanonical.phone = canonical.phone;
        freshCanonical.college = canonical.college;
        freshCanonical.role = canonical.role;
        freshCanonical.isActive = canonical.isActive;
        freshCanonical.lastLogin = canonical.lastLogin;
        freshCanonical.favorites = canonical.favorites;
        freshCanonical.linkedFirebaseUids = canonical.linkedFirebaseUids;
        freshCanonical.locations = canonical.locations;

        await freshCanonical.save();
        canonical = freshCanonical;
      } else {
        throw error;
      }
    } else {
      throw error;
    }
  }

  if (duplicates.length > 0) {
    await User.deleteMany({ _id: { $in: duplicates.map((user) => user._id) } });
  }

  return canonical;
}

export async function mergeDuplicateUsersByEmail(options = {}) {
  const users = await User.find({ email: { $exists: true, $ne: "" } });
  const grouped = new Map();

  users.forEach((user) => {
    const normalizedEmail = normalizeEmail(user.email);
    if (!normalizedEmail) return;

    const group = grouped.get(normalizedEmail) || [];
    group.push(user);
    grouped.set(normalizedEmail, group);
  });

  for (const [email, group] of grouped.entries()) {
    if (group.length > 1) {
      await mergeUsersForEmail(email, options);
    }
  }
}
